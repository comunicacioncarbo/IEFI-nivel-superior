import {
  date,
  integer,
  pgTable,
  time,
  varchar,
  text,
} from "drizzle-orm/pg-core";

export const plans = pgTable("plans", {
  id: integer("id").generatedAlwaysAsIdentity().primaryKey(),

  code: varchar("code", {
    length: 10,
  }).notNull().unique(),

  name: varchar("name", {
    length: 100,
  }).notNull(),
});

export const evaluations = pgTable("evaluations", {
  id: varchar("id", {
    length: 100,
  }).primaryKey(),

  planId: integer("plan_id")
    .notNull()
    .references(() => plans.id),

  year: integer("year").notNull(),

  section: varchar("section", {
    length: 1,
  }).notNull(),

  time: time("time"),

  date: date("date").notNull(),

  subject: text("subject").notNull(),

  teacher: text("teacher"),

  notes: text("notes"),
});