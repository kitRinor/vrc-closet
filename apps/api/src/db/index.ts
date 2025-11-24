import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';


import * as relations from './schema/_relations';
import { avatars } from './schema/avatars';
import { users } from './schema/users';
import { items } from './schema/items';
import { compatibility } from './schema/compatibility';
import { outfits } from './schema/outfits';

// スキーマの定義
export const schema = {
  ...relations,
  avatars,
  users,
  items,
  compatibility,
  outfits,
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString);

// 型注釈をつけて db をエクスポート
export const db: PostgresJsDatabase<typeof schema> = drizzle(client, { schema });
