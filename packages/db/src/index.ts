import { drizzle } from 'drizzle-orm/postgres-js';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { config } from 'dotenv';
config();

// フォルダを指定すると、自動的にさっき作った schema/index.ts が読み込まれます
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const client = postgres(connectionString);

// 型注釈をつけて db をエクスポート
export const db: PostgresJsDatabase<typeof schema> = drizzle(client, { schema });

// スキーマ定義もそのまま外に公開（API側で使うため）
export * from './schema';