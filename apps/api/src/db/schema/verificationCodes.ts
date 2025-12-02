import { pgTable, text, timestamp, uuid, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users';

// Define verification types
export const verificationTypeEnum = pgEnum('verification_type', [
  'email_change', // For updating email addresses
  'password_reset', // For resetting passwords
  'email_verification' // For verifying email addresses
]);

export const verificationCodes = pgTable('verification_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  type: verificationTypeEnum('type').notNull(),

  // Target identifier (e.g., new email address)
  target: text('target').notNull(),
  
  code: text('code').notNull(),
  
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});