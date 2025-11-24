import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { compatibility } from '@/db/schema/compatibility';
import { AppEnv } from '@/type';

const ParamSchema = z.object({
  avatarId: z.string().uuid(),
  itemId: z.string().uuid(),
});

const JsonSchema = z.object({
  status: z.enum(['official', 'modified', 'unsupported']),
});

const update = new Hono<AppEnv>()
  .put(
    '/:avatarId/:itemId',
    zValidator('param', ParamSchema),
    zValidator('json', JsonSchema),
    async (c) => {
      try {
        const { avatarId, itemId } = c.req.valid('param');
        const { status } = c.req.valid('json');
        const userId = c.get('userId');

        if (!userId) {
          return c.json({ error: 'Unauthorized' }, 401);
        }

        const updatedCount = await db.update(compatibility)
          .set({ status, updatedAt: new Date() })
          .where(and(
            eq(compatibility.userId, userId),
            eq(compatibility.avatarId, avatarId),
            eq(compatibility.itemId, itemId)
          ))
          .returning()
          .then(res => res.length);

        if (updatedCount === 0) {
          return c.json({ error: 'Compatibility record not found' }, 404);
        }

        return c.json({ success: true }, 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to update compatibility' }, 500);
      }
    }
  );

export default update;