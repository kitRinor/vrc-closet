
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { assetCategoryEnum, assets } from '@/db/schema/assets';
import { AssetRes } from '.';
import { genSrcKeyFromUrl } from '@/lib/sourceKeyUtil';
import { and, eq } from 'drizzle-orm';

const jsonValidator = zValidator('json', z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable(),
  category: z.enum(assetCategoryEnum.enumValues),
  storeUrl: z.url().or(z.string().startsWith("/")).or(z.literal("")).nullable(),
  imageUrl: z.url().or(z.string().startsWith("/")).or(z.literal("")).nullable(),
}));

const create = new Hono<AppEnv>()
  .post(
    '/',
    jsonValidator,
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const body = c.req.valid('json');

        // Generate a unique source key and check for duplicates
        const sourceKey = genSrcKeyFromUrl(body.storeUrl);
        if (sourceKey) {
          const existing = await db.select().from(assets)
            .where(and(
              eq(assets.userId,userId),
              eq(assets.sourceKey, sourceKey)
            )).limit(1);
          if (existing.length > 0) {
            return c.json({ error: 'Item with the same source already exists' }, 409);
          }
        }

        const result = await db.insert(assets).values({
          name: body.name,
          userId: userId,
          storeUrl: body.storeUrl,
          description: body.description,
          category: body.category,
          imageUrl: body.imageUrl,
          sourceKey: sourceKey,
        }).returning();

        return c.json<AssetRes>(result[0], 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to create' }, 500);
      }
    }
  );
export default create;