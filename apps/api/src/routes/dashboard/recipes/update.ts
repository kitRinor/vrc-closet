
import { AppEnv } from '@/type';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/db';
import { RecipeRes } from '.';
import { NewRecipeAsset, NewRecipeStep, recipeAssets, recipes, recipeStateEnum, recipeSteps } from '@/db/schema/recipes';
import { id } from 'zod/locales';

const paramValidator = zValidator('param', z.object({
  id: z.uuid(),
}));

const jsonValidator = zValidator('json', z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  state: z.enum(recipeStateEnum.enumValues).optional(),
  imageUrl: z.string().optional(),
  baseAssetId: z.uuid().nullable(),
  //
  steps: z.array(z.object({
    id: z.uuid().optional(),
    stepNumber: z.number().min(0),
    name: z.string().min(1),
    description: z.string(),
    imageUrl: z.string().optional(),
  })),
  assets: z.array(z.object({
    id: z.uuid().optional(),
    assetId: z.uuid(),
    note: z.string().optional(),
    configuration: z.record(z.string(), z.any()).optional(),
  })),
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

        const result = await db.update(recipes)
          .set({
            ...body
          })
          .where(and(
            eq(recipes.id, id),
            eq(recipes.userId, userId) // require ownership
          ))
          .returning();

        if (result.length === 0) {
          return c.json({ error: 'not found' }, 404);
        }

        // get existing steps and assets
        const recipeId = result[0].id;
        const rSteps: RecipeRes['steps'] = []; // new steps
        const rAssets: RecipeRes['assets'] = []; // new assets
        if (body.steps) {
          const mods: {
            create: NewRecipeStep[];
            update: NewRecipeStep[];
            delete: string[]; // IDs to delete
          }  = { create: [], update: [], delete: [] };
          const existing = await db.select().from(recipeSteps).where(eq(recipeSteps.recipeId, recipeId));
          const existingMap = new Map(existing.map((s) => [s.id, s]));
          for (const step of body.steps) {
            if ('id' in step && step.id && existingMap.has(step.id)) {
              mods.update.push({ ...step, recipeId: recipeId });
              existingMap.delete(step.id);
            } else {
              mods.create.push({ ...step, recipeId: recipeId });
            }
          }
          mods.delete = Array.from(existingMap.keys());
          // apply changes
          if (mods.create.length > 0) {
            const created = await db.insert(recipeSteps).values(mods.create).returning();
            rSteps.push(...created);
          }
          if (mods.delete.length > 0) {
            const deleted = await db.delete(recipeSteps).where(inArray(recipeSteps.id, mods.delete)).returning();
          }
          if (mods.update.length > 0) {
            const updated = await Promise.all(mods.update.map(async (step) => 
              (await db.update(recipeSteps).set(step).where(eq(recipeSteps.id, step.id!)).returning())[0]
            ));
            rSteps.push(...updated);
          }
        }
        if (body.assets) {
          const mods: {
            create: NewRecipeAsset[];
            update: NewRecipeAsset[];
            delete: string[]; // IDs to delete
          }  = { create: [], update: [], delete: [] };
          const existing = await db.select().from(recipeAssets).where(eq(recipeAssets.recipeId, recipeId));
          const existingMap = new Map(existing.map((s) => [s.id, s]));
          for (const asset of body.assets) {
            if ('id' in asset && asset.id && existingMap.has(asset.id)) {
              mods.update.push({ ...asset, recipeId: recipeId });
              existingMap.delete(asset.id);
            } else {
              mods.create.push({ ...asset, recipeId: recipeId });
            }
          }
          mods.delete = Array.from(existingMap.keys());
          // apply changes
          if (mods.create.length > 0) {
            const created = await db.insert(recipeAssets).values(mods.create).returning();
            rAssets.push(...created.map(c => ({...c, asset: null})));
          }
          if (mods.delete.length > 0) {
            const deleted = await db.delete(recipeAssets).where(inArray(recipeAssets.id, mods.delete)).returning();
          }
          if (mods.update.length > 0) {
            const updated = await Promise.all(mods.update.map(async (asset) => 
              (await db.update(recipeAssets).set(asset).where(eq(recipeAssets.id, asset.id!)).returning())[0]
            ));
            rAssets.push(...updated.map(u => ({...u, asset: null})));
          }
        }
        return c.json<RecipeRes>({
          ...result[0], 
          baseAsset: null,
          steps: rSteps, 
          assets: rAssets
        }, 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to update' }, 500);
      }
    }
  );
export default update;