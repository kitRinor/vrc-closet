
import { AppEnv } from '@/type';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { and, asc, eq } from 'drizzle-orm';
import { RecipeRes } from '.';
import { recipeAssets, recipes, recipeSteps } from '@/db/schema/recipes';



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
        const result = await db.select().from(recipes).where(and(
          eq(recipes.id, id),
          eq(recipes.userId, userId) // require ownership
        )).limit(1);
      if (result.length === 0) {
        return c.json({ error: 'not found' }, 404);
      }
      // get steps and assets
      const recipeId = result[0].id;
      const steps = await db.query.recipeSteps.findMany({
        where: eq(recipeSteps.recipeId, recipeId),
        orderBy: asc(recipeSteps.stepNumber),
      });
      const assets =  await db.query.recipeAssets.findMany({
        where: eq(recipeAssets.recipeId, recipeId),
      });

      return c.json<RecipeRes>({
        ...result[0],
        steps: steps,
        assets: assets,
      }, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);
export default get;