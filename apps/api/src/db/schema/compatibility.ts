import { pgTable, text, timestamp, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';
import { avatars } from './avatars';
import { items } from './items';
import { users } from './users';

// アバターとアイテムのN対Nの対応，非対応を管理する中間テーブル
export const compatibility = pgTable('compatibility', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  avatarId: uuid('avatar_id').references(() => avatars.id, { onDelete: 'cascade' }).notNull(),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  status: text('status', { enum: ['official', 'modified', 'unsupported'] }).default('unsupported').notNull(),
  note: text('note'),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.avatarId, t.itemId] }),
}));

export type Compatibility = typeof compatibility.$inferSelect;
export type NewCompatibility = typeof compatibility.$inferInsert;