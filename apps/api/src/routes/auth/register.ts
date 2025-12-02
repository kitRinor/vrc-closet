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
import { profiles } from '@/db/schema/profiles';
import { MAX_USER_DISPLAY_NAME_LENGTH, MIN_USER_DISPLAY_NAME_LENGTH, USER_HANDLE_REGEX, USER_PASSWORD_REGEX } from '@/const';
import { getDummyUserAvatarUrl } from '@/lib/dummyImg';


const register = new Hono<AppEnv>()
.post(
  '/',
  zValidator('json', z.object({
    handle: z.string().regex(USER_HANDLE_REGEX).toLowerCase(),
    email: z.email(),
    password: z.string().regex(USER_PASSWORD_REGEX),
    displayName: z.string().min(MIN_USER_DISPLAY_NAME_LENGTH).max(MAX_USER_DISPLAY_NAME_LENGTH).optional(),
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

    // 3. Save user to DB, with authentication info
    const [newUser] = await db.insert(users).values({
      email,
      password: passwordHash, // Note: Ensure the column name matches your schema (password vs passwordHash)
    }).returning();
    // 4. Save user profile to DB with profile info
     const [newProfile] = await db.insert(profiles).values({
      userId: newUser.id,
      handle,
      displayName,
      avatarUrl: getDummyUserAvatarUrl(newUser.id),
    }).returning();

    // 5. Generate JWT and set HttpOnly Cookie
    const token = await signToken(newUser.id);
    setCookie(c, 'auth_token', token, cookieOptions);

    const authUser: AuthUser = {
      id: newProfile.userId,
      displayName: newProfile.displayName,
      handle: newProfile.handle,
      avatarUrl: newProfile.avatarUrl,
    };

    return c.json({ success: true, user: authUser });
  }
);
export default register;