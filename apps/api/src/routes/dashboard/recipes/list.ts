import { zValidator } from '@hono/zod-validator';
import { AppEnv } from '@/type';
import { Hono } from 'hono';
import { baseQueryForGetList } from '@/lib/validator';
import { generateCondition } from '@/lib/queryUtils/filter';
import { generateSorting } from '@/lib/queryUtils/sort';
import { db } from '@/db';
import { RecipeRes } from '.';
import { recipeAssets, recipes, recipeSteps } from '@/db/schema/recipes';
import { asc, inArray } from 'drizzle-orm';

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
          .where(generateCondition(recipes, filter, userId))
          .orderBy(generateSorting(recipes, order, sort))
          .limit(limit)
          .offset(offset);


        // return without steps and assets for list view
        return c.json<RecipeRes[]>(result.map(r => ({
          ...r,
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