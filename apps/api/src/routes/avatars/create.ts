import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { TEMP_USER_ID } from '@/const';
import { db } from '@/db';
import { avatars } from '@/db/schema/avatars';

const factory = createFactory();

const jsonValidator = zValidator('json', z.object({
  name: z.string().min(1, "Name is required"),
  storeUrl: z.string().url().optional().or(z.literal("")),
  thumbnailUrl: z.string().url().optional().or(z.literal("")),
}));

export const createAvatar = factory.createHandlers(
  jsonValidator,
  async (c) => {
    try {
      const body = c.req.valid('json');

      const result = await db.insert(avatars).values({
        name: body.name,
        userId: TEMP_USER_ID,
        storeUrl: body.storeUrl || null,
        thumbnailUrl: body.thumbnailUrl || null,
      }).returning();

      return c.json(result[0], 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to create avatar' }, 500);
    }
  }
);