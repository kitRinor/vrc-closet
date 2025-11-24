import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { and, eq } from 'drizzle-orm';
import { db } from '../db';
import { hashPassword, verifyPassword, signToken } from '../lib/auth';
import { requireAuth } from '../middleware/auth';
import { BlankEnv } from 'hono/types';
import { users } from '../db/schema/users';

type AuthUser = {
  id: string;
  displayName: string | null;
  handle: string;
  avatarUrl: string | null;
}

const RegisterSchema = z.object({
  handle: z.string().min(3).max(15).regex(/^[a-z0-9_-]+$/).toLowerCase(),
  email: z.email(),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

const LoginSchema = z.object({
  email: z.email(),
  password: z.string(),
});

const isSecure = process.env.WEB_ORIGIN_URL?.startsWith('https://');

// トークンをHttpOnly Cookieに設定する定数
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isSecure, // HTTPSでのみ secure=true
  sameSite: isSecure ? 'None' as const : 'Lax' as const,
  // path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

const app = new Hono()

// POST /auth/register (新規登録)
.post('/register', zValidator('json', RegisterSchema), async (c) => {
  const { email, password, displayName, handle } = c.req.valid('json');

  // 1. check existing user
  const existingUser = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (existingUser) {
    return c.json({ error: 'User with this email already exists' }, 409); // Conflict
  }

  // 2. hash password
  const passwordHash = await hashPassword(password);

  // 3. save user to DB
  const [newUser] = await db.insert(users).values({
    email,
    password: passwordHash,
    displayName,
    handle,
  }).returning();

  // 4. generate JWT and set set cookie
  const token = await signToken(newUser.id);
  setCookie(c, 'auth_token', token, COOKIE_OPTIONS);

  const authUser: AuthUser = {
    id: newUser.id,
    displayName: newUser.displayName,
    handle: newUser.handle,
    avatarUrl: newUser.avatarUrl,
  };

  return c.json({ success: true, user: authUser });
})


// POST /auth/login (ログイン)
.post('/login', zValidator('json', LoginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  // 1. find user by email
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  if (!user) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // 2. verify password
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  // 3. regenerate JWT token and set HttpOnly Cookie
  const token = await signToken(user.id);
  setCookie(c, 'auth_token', token, COOKIE_OPTIONS);

  const authUser: AuthUser = {
    id: user.id,
    displayName: user.displayName,
    handle: user.handle,
    avatarUrl: user.avatarUrl,
  };
  return c.json(authUser, 200);
})

// 💡 GET /auth/me (セッション確認)
.get('/me', requireAuth, async (c) => {
  const userId = c.get('userId');
  
  // DBから最新のユーザー情報を取得
  const user = await db.query.users.findFirst({ 
    where: eq(users.id, userId),
    columns: { password: false, email: false } // セキュリティのためハッシュは返さない
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const authUser: AuthUser = {
    id: user.id,
    displayName: user.displayName,
    handle: user.handle,
    avatarUrl: user.avatarUrl,
  };

  return c.json(authUser, 200);
})

// POST /auth/logout (ログアウト)
.post('/logout', (c) => {
  // HttpOnly Cookieを削除することでログアウトする
  deleteCookie(c, 'auth_token');
  return c.json({ success: true }, 200);
});


export default app;