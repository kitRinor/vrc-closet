import { pgTable, text, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core';
import { users } from './users';

// 1-user- 1-profile relationship
export const profiles = pgTable('profiles', {
  userId: uuid('userId').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  handle: text('handle').unique().notNull(),
  displayName: text('display_name'), 
  avatarUrl: text('avatar_url'), 
  bio: text('bio'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdateFn(() => new Date()),
}, (t) => [
  index('profiles_handle_index').on(t.handle),
]);

export type UserProfile = typeof profiles.$inferSelect;
export type NewUserProfile = typeof profiles.$inferInsert;
