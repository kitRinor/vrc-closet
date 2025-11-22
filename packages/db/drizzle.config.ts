import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// モノレポのルートにある .env を読み込む
dotenv.config({ path: '../../.env' });

export default {
  schema: './src/schema',
  
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;