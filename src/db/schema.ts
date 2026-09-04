import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const webinars = pgTable('webinars', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  title: text('title').notNull(),
  description: text('description'),
  scheduledAt: text('scheduled_at'),
  status: text('status').default('scheduled').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  webinars: many(webinars),
}));

export const webinarsRelations = relations(webinars, ({ one }) => ({
  author: one(users, {
    fields: [webinars.userId],
    references: [users.id],
  }),
}));
