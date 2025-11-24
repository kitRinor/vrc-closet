import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { items } from '@/db/schema/items';

const factory = createFactory();

const paramValidator = zValidator('param', z.object({
  id: z.string().uuid(),
}));

const jsonValidator = zValidator('json', z.object({
  name: z.string().min(1, "Name is required"),
  storeUrl: z.string().url().optional().or(z.literal("")),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
}).partial());

export const updateAvatar = factory.createHandlers(
  paramValidator,
  jsonValidator,
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const body = c.req.valid('json');

      const result = await db.update(items)
        .set({
          name: body.name,
          storeUrl: body.storeUrl || null,
          thumbnailUrl: body.thumbnailUrl || null,
        })
        .where(eq(items.id, id))
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