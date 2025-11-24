import { deleteCookie } from 'hono/cookie';
import { AppEnv } from '@/type';
import { Hono } from 'hono';

const logout = new Hono<AppEnv>()
  .put(
    '/',
    async (c) => {
      // Remove HttpOnly Cookie
      deleteCookie(c, 'auth_token');
      return c.json({ success: true }, 200);
    }
  );
export default logout;