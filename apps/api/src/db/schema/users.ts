import { pgTable, text, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  handle: text('handle').unique().notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  isPublic: boolean('is_public').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  handleIndex: index('users_handle_index').on(t.handle),
  emailIndex: index('users_email_index').on(t.email),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;