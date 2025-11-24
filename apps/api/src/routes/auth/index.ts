import { Hono } from 'hono';
import { AppEnv } from '@/type';

import register from './register';
import login from './login';
import me from './me';
import logout from './logout';

export type AuthUser = {
  id: string;
  displayName: string | null;
  handle: string;
  avatarUrl: string | null;
}

export const isSecure = process.env.WEB_ORIGIN_URL?.startsWith('https://');

// トークンをHttpOnly Cookieに設定する定数
export const cookieOptions = {
  httpOnly: true,
  secure: isSecure, // HTTPSでのみ secure=true
  sameSite: isSecure ? 'None' as const : 'Lax' as const,
  // path: '/',
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

const app = new Hono<AppEnv>()
  .route('/', login)
  .route('/register', register)
  .route('/login', login)
  .route('/me', me)
  .route('/logout', logout);

export default app;