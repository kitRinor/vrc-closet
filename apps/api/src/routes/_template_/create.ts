import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { TEMP_USER_ID } from '@/const';
import { db } from '@/db';
import { _template_ } from '@/db/schema/_template_';

const factory = createFactory();

const jsonValidator = zValidator('json', z.object({
  userId: z.uuid("User ID must be a valid UUID"),
  // Add other necessary fields here
}));

export const createAvatar = factory.createHandlers(
  jsonValidator,
  async (c) => {
    try {
      const body = c.req.valid('json');

      const result = await db.insert(_template_).values({
        ...body,
      }).returning();

      return c.json(result[0], 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to create' }, 500);
    }
  }
);