import { relations } from 'drizzle-orm';
import { users } from './users';
import { assets } from './assets';
import { profiles } from './profiles';
import { recipeAssets, recipes, recipeSteps } from './recipes';


// テーブル間のリレーション設定

// users table relations 
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }), // 1-user : 1-profile
  assets: many(assets), // 1-user : n-assets
  recipes: many(recipes), // 1-user : n-recipes
}));
// profiles table relations
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));

// assets table relations
export const assetsRelations = relations(assets, ({ one, many }) => ({
  user: one(users, { fields: [assets.userId], references: [users.id] }),
  recipeAssets: many(recipeAssets), // 1-asset : n-recipeAssets
  recipesAsBaseAsset: many(recipes), // 1-asset : n-recipes as baseAsset
}));

// recipes table relations
export const recipesRelations = relations(recipes, ({ one, many }) => ({
  user: one(users, { fields: [recipes.userId], references: [users.id] }),
  recipeSteps: many(recipeSteps), // 1-recipe : n-steps
  recipeAssets: many(recipeAssets), // 1-recipe : n-assets
  assetsAsBase: one(assets, { fields: [recipes.baseAssetId], references: [assets.id]  }), // recipe's base asset
}));
// recipeSteps table relations
export const recipeStepsRelations = relations(recipeSteps, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeSteps.recipeId], references: [recipes.id] }),
}));
// recipeAssets table relations
export const recipeAssetsRelations = relations(recipeAssets, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeAssets.recipeId], references: [recipes.id] }),
  asset: one(assets, { fields: [recipeAssets.assetId], references: [assets.id] }),
})); 
