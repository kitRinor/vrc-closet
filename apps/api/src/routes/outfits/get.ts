import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { outfits } from '@/db/schema/outfits';

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
        const outfit = await db.select().from(outfits).where(eq(outfits.id, id)).limit(1);

      if (outfit.length === 0) {
        return c.json({ error: 'not found' }, 404);
      }

      return c.json(outfit[0], 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);
export default get;