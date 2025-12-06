import { pgTable, text, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').$onUpdateFn(() => new Date()),
}, (t) => [
  index('users_email_index').on(t.email),
]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
