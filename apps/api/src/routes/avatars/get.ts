import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { avatars } from '@/db/schema/avatars';

const factory = createFactory();

const paramValidator = zValidator('param', z.object({
  id: z.string().uuid("ID must be a valid UUID"),
}));

export const getAvatar = factory.createHandlers(
  paramValidator,
  async (c) => {
    try {
      const { id } = c.req.valid('param');
      const avatar = await db.select().from(avatars).where(eq(avatars.id, id)).limit(1);

      if (avatar.length === 0) {
        return c.json({ error: 'Avatar not found' }, 404);
      }

      return c.json(avatar[0], 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch avatar' }, 500);
    }
  }
);