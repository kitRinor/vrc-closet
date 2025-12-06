
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { assets } from '@/db/schema/assets';
import { AssetRes } from '.';


const paramValidator = zValidator('param', z.object({
  id: z.uuid("ID must be a valid UUID"),
}));

const get = new Hono<AppEnv>()
  .get(
    '/:id',
    paramValidator,
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { id } = c.req.valid('param');
        const item = await db.select().from(assets).where(and(
          eq(assets.id, id),
          eq(assets.userId, userId),
        )).limit(1);

      if (item.length === 0) {
        return c.json({ error: 'not found' }, 404);
      }

      return c.json<AssetRes>(item[0], 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);
export default get;