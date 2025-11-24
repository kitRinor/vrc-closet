
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

const get = new Hono<AppEnv>()
  .get(
    '/:id',
    paramValidator,
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const result = await db.select().from(_template_).where(eq(_template_.id, id)).limit(1);

      if (result.length === 0) {
        return c.json({ error: 'not found' }, 404);
      }

      return c.json(result[0], 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);
export default get;