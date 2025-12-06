
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { assetCategoryEnum, assets } from '@/db/schema/assets';
import { AssetRes } from '.';
import { genSrcKeyFromUrl } from '@/lib/sourceKeyUtil';


const paramValidator = zValidator('param', z.object({
  id: z.uuid(),
}));

const jsonValidator = zValidator('json', z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable(),
  category: z.enum(assetCategoryEnum.enumValues),
  storeUrl: z.url().or(z.string().startsWith("/")).or(z.literal("")).nullable(),
  imageUrl: z.url().or(z.string().startsWith("/")).or(z.literal("")).nullable(),
}).partial());

const update = new Hono<AppEnv>()
  .put(
    '/:id', 
    paramValidator,
    jsonValidator,
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');

        // Check for duplicate sourceKey if storeUrl is being updated
        const sourceKey = body.storeUrl !== undefined ? genSrcKeyFromUrl(body.storeUrl) : null;
        if (sourceKey) {
          const existing = await db.select().from(assets)
            .where(and(
              ne(assets.id, id),
              eq(assets.userId,userId),
              eq(assets.sourceKey, sourceKey)
            )).limit(1);
          if (existing.length > 0) {
            return c.json({ error: 'Item with the same source already exists' }, 409);
          }
        }

        const result = await db.update(assets)
          .set({
            name: body.name,
            storeUrl: body.storeUrl,
            description: body.description,
            category: body.category,
            imageUrl: body.imageUrl,
            sourceKey: sourceKey,
          })
          .where(and(
            eq(assets.id, id),
            eq(assets.userId, userId),
          ))
          .returning();

        if (result.length === 0) {
          return c.json({ error: 'not found' }, 404);
        }

        return c.json<AssetRes>(result[0], 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to update' }, 500);
      }
    }
  );
export default update;