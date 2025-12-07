
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { profiles } from '@/db/schema/profiles';
import { PubProfileRes } from '.';


const paramValidator = zValidator('param', z.object({
  handle: z.string(),
}));

const get = new Hono<AppEnv>()
  .get(
    '/:handle',
    paramValidator,
    async (c) => {
      try {
        const { handle } = c.req.valid('param');
        const profile = await db.select().from(profiles).where(and(
          eq(profiles.handle, handle),
        )).limit(1);

      if (profile.length === 0) {
        return c.json({ error: 'not found' }, 404);
      }

      return c.json<PubProfileRes>(profile[0], 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);
export default get;