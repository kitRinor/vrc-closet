import { pgTable, serial, text, timestamp, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';
import { assets } from './assets';
import { users } from './users';
import { boolean } from 'zod';
import { pgEnum } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { uniqueIndex } from 'drizzle-orm/pg-core';
import { jsonb } from 'drizzle-orm/pg-core';

// 1-outfit : 1-avatar,n-items

export const recipeStateEnum = pgEnum('recipe_state', ['private', 'public', 'unlisted']);

// 改変レシピ本体
export const recipes = pgTable('recipes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'), // レシピ説明
  imageUrl: text('image_url'), // レシピサムネイル画像URL
  state: recipeStateEnum('state').default('private').notNull(),
  baseAssetId: uuid('base_asset_id').references(() => assets.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdateFn(() => new Date()),
}, (t) => [
  index('recipes_user_idx').on(t.userId),
  index('recipes_base_asset_idx').on(t.baseAssetId),
]);

// レシピの各工程
export const recipeSteps = pgTable('recipe_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }).notNull(),
  stepNumber: integer('step_number').notNull(), // 手順番号
  name: text('name').notNull(), // 手順名
  description: text('description').notNull(), // 手順内容
  imageUrl: text('image_url'), // 手順画像URL
}, (t) => [
  index('recipe_steps_idx').on(t.recipeId, t.stepNumber), //not unique
]);

// レシピの材料アセット
export const recipeAssets = pgTable('recipe_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  recipeId: uuid('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }).notNull(),
  assetId: uuid('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
  note: text('note'), // 材料に関するメモ
  configuration: jsonb('configuration'), // 材料アセットの設定情報（例：色、サイズ、位置など）
},(t) => [
  index('recipe_assets_asset_idx').on(t.assetId), // for reverse lookup (asstet -> recipes)
]);

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;

export type RecipeStep = typeof recipeSteps.$inferSelect;
export type NewRecipeStep = typeof recipeSteps.$inferInsert;

export type RecipeAsset = typeof recipeAssets.$inferSelect;
export type NewRecipeAsset = typeof recipeAssets.$inferInsert;
