import { zValidator } from '@hono/zod-validator';
import { AppEnv } from '@/type';
import { Hono } from 'hono';
import { baseQueryForGetList } from '@/lib/validator';
import { generateCondition } from '@/lib/queryUtils/filter';
import { generateSorting } from '@/lib/queryUtils/sort';
import { db } from '@/db';
import { PubRecipeRes } from '.';
import { recipeAssets, recipes, recipeSteps } from '@/db/schema/recipes';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { profiles } from '@/db/schema/profiles';
import { assets } from '@/db/schema/assets';

const list = new Hono<AppEnv>()
  .get(
    '/',
    zValidator('query', baseQueryForGetList(recipes, {
      sortKeys: ['id', 'createdAt'],
      filterKeys: ['id', 'createdAt'],
    })),
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { limit, offset, sort, order, filter } = c.req.valid('query');
        
        const result = await db.select().from(recipes)
          .where(and(
            generateCondition(recipes, filter, userId),
            eq(recipes.state, 'public')
          ))
          .innerJoin(profiles, eq(recipes.userId, profiles.userId))
          .leftJoin(assets, eq(recipes.baseAssetId, assets.id))
          .orderBy(generateSorting(recipes, order, sort))
          .limit(limit)
          .offset(offset);


        // return without steps and assets for list view
        return c.json<PubRecipeRes[]>(result.map(({ recipes: r, profiles: p, assets: ba }) => ({
          ...r,
          user: {
            id: p.userId,
            handle: p.handle,
            displayName: p.displayName,
            avatarUrl: p.avatarUrl,
          },
          baseAsset: ba,
          steps: [],
          assets: [],
        })), 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch' }, 500);
      }
    }
  );
export default list;