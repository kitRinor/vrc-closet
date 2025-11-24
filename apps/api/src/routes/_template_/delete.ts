
import { AppEnv } from '@/type';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { _template_ } from '@/db/schema/_template_';

const paramValidator = zValidator('param', z.object({
  id: z.uuid("ID must be a valid UUID"),
}));

const del = new Hono<AppEnv>()
  .delete(
    '/:id',
    paramValidator,
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const result = await db.delete(_template_).where(eq(_template_.id, id)).returning();

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