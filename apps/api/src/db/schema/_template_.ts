import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users'; 

// テンプレート
export const _template_ = pgTable('avatars', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),

  // Add your columns here

});

export type _Template_ = typeof _template_.$inferSelect;
export type _NewTemplate_ = typeof _template_.$inferInsert;



