import { pgTable, serial, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const itemCategoryEnum = pgEnum('item_category', ['cloth', 'hair', 'accessory', 'texture', 'prop', 'gimmick', 'other']);

// アイテム(衣装，髪形，ギミック)情報を管理するテーブル
export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  name: text('name').notNull(),
  
  category: itemCategoryEnum('category').default('cloth').notNull(),
  
  storeUrl: text('store_url'),
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;