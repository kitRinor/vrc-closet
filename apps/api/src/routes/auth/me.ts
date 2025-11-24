import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { requireAuth } from '@/middleware/auth';
import { users } from '@/db/schema/users';
import { AuthUser } from '.';
import { Hono } from 'hono';
import { AppEnv } from '@/type';


const me = new Hono<AppEnv>()
.get(
  '/',
  requireAuth,
  async (c) => {
    const userId = c.get('userId');
    if (!userId) {
      return c.json({ error: 'Unauthorized' }, 401);
    }
    
    // Fetch latest user info from DB
    const user = await db.query.users.findFirst({ 
      where: eq(users.id, userId),
      columns: { 
        password: false, // Exclude sensitive data
        email: false 
      } 
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
  }
);
export default me;