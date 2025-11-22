import { pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users'; 

// アバター情報を管理するテーブル
export const avatars = pgTable('avatars', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  storeUrl: text('store_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type Avatar = typeof avatars.$inferSelect;
export type NewAvatar = typeof avatars.$inferInsert;