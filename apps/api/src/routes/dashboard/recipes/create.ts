import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { base64, z } from 'zod';
import { db } from '@/db';
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { RecipeRes } from '.';
import { recipeAssets, recipes, recipeStateEnum, recipeSteps } from '@/db/schema/recipes';

const jsonValidator = zValidator('json', z.object({
  userId: z.uuid("User ID must be a valid UUID"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  state: z.enum(recipeStateEnum.enumValues).optional(),
  imageUrl: z.string().optional(),
  baseAssetId: z.uuid().optional(),
  //
  steps: z.array(z.object({
    stepNumber: z.number().min(0),
    name: z.string().min(1),
    description: z.string(),
    imageUrl: z.string().optional(),
  })).optional(),
  assets: z.array(z.object({
    assetId: z.uuid(),
    note: z.string().optional(),
    configuration: z.record(z.string(), z.any()).optional(),
  })).optional(),
}));

const create = new Hono<AppEnv>()
.post(
  '/',
  jsonValidator,
  async (c) => {
    try {
      const userId = c.get('userId')!;
      const body = c.req.valid('json');

      const result = await db.insert(recipes).values({
        userId: userId, // ensure the userId is set from the authenticated user
        name: body.name,
        description: body.description,
        imageUrl: body.imageUrl,
        baseAssetId: body.baseAssetId,
      }).returning();
      
      // insert new recipeStep records
      const recipeId = result[0].id;
      const assets = (body.assets && body.assets.length > 0) ? 
        await db.insert(recipeAssets).values(
          body.assets.map((asset) => ({
            recipeId: recipeId,
            assetId: asset.assetId,
            note: asset.note,
            configuration: asset.configuration,
          }))
        ).returning() : [];
      const steps = (body.steps && body.steps.length > 0) ? 
        await db.insert(recipeSteps).values(
          body.steps.map((step) => ({
            recipeId: recipeId,
            stepNumber: step.stepNumber,
            name: step.name,
            description: step.description,
            imageUrl: step.imageUrl,
          }))
        ).returning() : [];


      return c.json<RecipeRes>({
        ...result[0],
        steps: steps,
        assets: assets,
      }, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to create' }, 500);
    }
  }
);

export default create;