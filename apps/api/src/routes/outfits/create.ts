import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { TEMP_USER_ID } from '@/const';
import { db } from '@/db';
import { outfits } from '@/db/schema/outfits';

const factory = createFactory();

const jsonValidator = zValidator('json', z.object({
  userId: z.uuid("User ID must be a valid UUID"),
  name: z.string().min(1, "Name is required"),
  avatarId: z.uuid("Avatar ID must be a valid UUID"),
}));

export const createAvatar = factory.createHandlers(
  jsonValidator,
  async (c) => {
    try {
      const body = c.req.valid('json');

      const result = await db.insert(outfits).values({
        ...body,
      }).returning();

      return c.json(result[0], 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to create' }, 500);
    }
  }
);