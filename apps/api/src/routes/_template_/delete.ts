import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { _template_ } from '@/db/schema/_template_';

const factory = createFactory();

const paramValidator = zValidator('param', z.object({
  id: z.uuid("ID must be a valid UUID"),
}));

export const deleteAvatar = factory.createHandlers(
  paramValidator,
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const deletedCount = await db.delete(_template_).where(eq(_template_.id, id)).returning().then(res => res.length);

      if (deletedCount === 0) {
        return c.json({ error: 'not found' }, 404);
      }

      return c.json({ success: true }, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to delete' }, 500);
    }
  }
);