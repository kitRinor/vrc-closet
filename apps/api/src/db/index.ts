import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import {config} from 'dotenv';
config();

import * as relations from './schema/_relations';
import { avatars } from './schema/avatars';
import { users } from './schema/users';
import { items } from './schema/items';
import { compatibility } from './schema/compatibility';
import { outfitItems, outfits } from './schema/outfits';
import { profiles } from './schema/profiles';
import { verificationCodes } from './schema/verificationCodes';

// スキーマの定義
export const schema = {
  ...relations,
  users,
  profiles,
  verificationCodes,
  avatars,
  items,
  compatibility,
  outfits,
  outfitItems,
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString);

// 型注釈をつけて db をエクスポート
export const db: PostgresJsDatabase<typeof schema> = drizzle(client, { schema });
