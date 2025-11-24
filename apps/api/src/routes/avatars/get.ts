import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { eq } from 'drizzle-orm';
import { Avatar, avatars } from '@/db/schema/avatars';
import { AppEnv } from '@/type';
import { Hono } from 'hono';

const paramValidator = zValidator('param', z.object({
  id: z.string().uuid("ID must be a valid UUID"),
}));

const get = new Hono<AppEnv>()
  .get(
    '/',
    paramValidator,
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const result = await db.select().from(avatars).where(eq(avatars.id, id)).limit(1);

        if (result.length === 0) {
          return c.json({ error: 'Avatar not found' }, 404);
        }

        return c.json(result[0], 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch avatar' }, 500);
      }
    }
  );
export default get;