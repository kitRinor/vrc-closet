import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { requireAuth } from '@/middleware/auth';
import { users } from '@/db/schema/users';
import { USER_PASSWORD_REGEX } from '@/const';
import { AppEnv } from '@/type';

const updatePassword = new Hono<AppEnv>()
  .use(requireAuth)
  .put(
    '/',
    zValidator('json', z.object({
      currentPassword: z.string(),
      newPassword: z.string().regex(USER_PASSWORD_REGEX),
    })),
    async (c) => {
      const userId = c.get('userId')!;
      const { currentPassword, newPassword } = c.req.valid('json');

      // 現在のパスワードを取得して検証
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || !(await verifyPassword(currentPassword, user.password))) {
        return c.json({ error: 'Incorrect current password' }, 401);
      }

      // 新しいパスワードで更新
      const newHash = await hashPassword(newPassword);
      await db.update(users)
        .set({ password: newHash })
        .where(eq(users.id, userId));

      return c.json({ success: true });
    }
  );
export default updatePassword;