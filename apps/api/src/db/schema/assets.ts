import { pgTable, serial, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { uniqueIndex } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';
import { desc } from 'drizzle-orm';

export const assetCategoryEnum = pgEnum('item_category', ['avatar', 'cloth', 'hair', 'accessory', 'texture', 'prop', 'gimmick', 'other']);

// アセット(アバター, 衣装，髪形，ギミック)情報を管理するテーブル
export const assets = pgTable('assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  category: assetCategoryEnum('category').default('other').notNull(),
  storeUrl: text('store_url'),
  sourceKey: text('source_key'), // <store>:<assetID> 例: booth:1234567
  imageUrl: text('image_url'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdateFn(() => new Date()),
}, (t) => [
  index('assets_user_idx').on(t.userId),
  index('assets_category_idx').on(t.category),
  uniqueIndex('assets_user_source_unique').on(t.userId, t.sourceKey),
]);

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
