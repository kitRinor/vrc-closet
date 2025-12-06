import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {config} from 'dotenv';
config();

import * as relations from './schema/_relations';
import { users } from './schema/users';
import { assets } from './schema/assets';
import { profiles } from './schema/profiles';
import { verificationCodes } from './schema/verificationCodes';
import { recipeAssets, recipes, recipeSteps } from './schema/recipes';

// スキーマの定義
export const schema = {
  ...relations,
  users,
  profiles,
  verificationCodes,
  assets,
  recipes,
  recipeSteps,
  recipeAssets,
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString);

// 型注釈をつけて db をエクスポート
export const db: PostgresJsDatabase<typeof schema> = drizzle(client, { schema });
