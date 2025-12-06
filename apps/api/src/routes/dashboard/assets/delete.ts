
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { assets } from '@/db/schema/assets';


const paramValidator = zValidator('param', z.object({
  id: z.string().uuid(),
}));

const del = new Hono<AppEnv>()
  .delete(
    '/:id',
    paramValidator,
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { id } = c.req.valid('param');
        const result = await db.delete(assets).where(and(
          eq(assets.id, id),
          eq(assets.userId, userId),
        )).returning();

        if (result.length === 0) {
          return c.json({ error: 'not found' }, 404);
        }

        return c.json({ success: true }, 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to delete' }, 500);
      }
    }
  );
export default del;