import { zValidator } from '@hono/zod-validator';
import { setCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { verifyPassword, signToken } from '@/lib/auth';
import { users } from '@/db/schema/users';
import { AuthUser, cookieOptions } from '.';
import z from 'zod';
import { Hono } from 'hono';
import { AppEnv } from '@/type';


const login = new Hono<AppEnv>()
.post(
  '/',
  zValidator('json', z.object({
    email: z.email(),
    password: z.string().min(8),
  })),
  async (c) => {
    const { email, password } = c.req.valid('json');

    // 1. Find user by email
    const user = await db.query.users.findFirst({ 
      where: eq(users.email, email) 
    });

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // 2. Verify password
    // Note: Ensure 'user.password' matches your schema column name (might be passwordHash)
    const isValid = await verifyPassword(password, user.password);
    
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // 3. Regenerate JWT token and set HttpOnly Cookie
    const token = await signToken(user.id);
    setCookie(c, 'auth_token', token, cookieOptions);

    const authUser: AuthUser = {
      id: user.id,
      displayName: user.displayName,
      handle: user.handle,
      avatarUrl: user.avatarUrl,
    };

    return c.json(authUser, 200);
  }
);
export default login;