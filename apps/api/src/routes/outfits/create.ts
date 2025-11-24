import { Hono } from 'hono';
import { AppEnv } from '@/type';

import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { outfits } from '@/db/schema/outfits';

const jsonValidator = zValidator('json', z.object({
  userId: z.uuid("User ID must be a valid UUID"),
  name: z.string().min(1, "Name is required"),
  avatarId: z.uuid("Avatar ID must be a valid UUID"),
}));

const create = new Hono<AppEnv>()
  .post(
    '/',
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
export default create;