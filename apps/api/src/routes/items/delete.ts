
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { items } from '@/db/schema/items';


const paramValidator = zValidator('param', z.object({
  id: z.string().uuid(),
}));

const del = new Hono<AppEnv>()
  .delete(
    '/:id',
    paramValidator,
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const result = await db.delete(items).where(eq(items.id, id)).returning();

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