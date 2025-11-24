import { zValidator } from '@hono/zod-validator';
import { setCookie } from 'hono/cookie';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { hashPassword, signToken } from '@/lib/auth';
import { users } from '@/db/schema/users';
import { AuthUser, cookieOptions } from '.';
import z from 'zod';
import { Hono } from 'hono';
import { AppEnv } from '@/type';


const register = new Hono<AppEnv>()
.post(
  '/',
  zValidator('json', z.object({
    handle: z.string().min(3).max(15).regex(/^[a-z0-9_-]+$/).toLowerCase(),
    email: z.email(),
    password: z.string().min(6),
    displayName: z.string().optional(),
  })),
  async (c) => {
    const { email, password, displayName, handle } = c.req.valid('json');

    // 1. Check if user already exists
    const existingUser = await db.query.users.findFirst({ 
      where: eq(users.email, email) 
    });
    
    if (existingUser) {
      return c.json({ error: 'User with this email already exists' }, 409);
    }

    // 2. Hash password
    const passwordHash = await hashPassword(password);

    // 3. Save user to DB
    const [newUser] = await db.insert(users).values({
      email,
      password: passwordHash, // Note: Ensure the column name matches your schema (password vs passwordHash)
      displayName,
      handle,
    }).returning();

    // 4. Generate JWT and set HttpOnly Cookie
    const token = await signToken(newUser.id);
    setCookie(c, 'auth_token', token, cookieOptions);

    const authUser: AuthUser = {
      id: newUser.id,
      displayName: newUser.displayName,
      handle: newUser.handle,
      avatarUrl: newUser.avatarUrl,
    };

    return c.json({ success: true, user: authUser });
  }
);
export default register;