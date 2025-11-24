import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { outfits } from '@/db/schema/outfits';

const paramValidator = zValidator('param', z.object({
  id: z.uuid(),
}));

const jsonValidator = zValidator('json', z.object({
  name: z.string().min(1, "Name is required"),
  avatarId: z.uuid("Avatar ID must be a valid UUID"),
}).partial());

const update = new Hono<AppEnv>()
  .put(
    '/:id',
    paramValidator,
    jsonValidator,
    async (c) => {
      try {
        const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      const result = await db.update(outfits)
        .set({
          ...body
        })
        .where(eq(outfits.id, id))
        .returning();

      if (result.length === 0) {
        return c.json({ error: 'not found' }, 404);
      }

      return c.json(result[0], 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to update' }, 500);
    }
  }
);
export default update;