import { boolean, integer, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  analyzerEnabled: boolean("analyzer_enabled").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  canonicalName: text("canonical_name").notNull(),
  normalizedName: text("normalized_name").notNull().unique(),
  muscleGroups: jsonb("muscle_groups").notNull().$type<string[]>(),
  imagePath: text("image_path"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exercises = pgTable("exercises", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id")
    .notNull()
    .references(() => machines.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetMuscles: text("target_muscles").notNull().default(""),
  execution: jsonb("execution").notNull().$type<string[]>(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const routines = pgTable("routines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const routineDays = pgTable("routine_days", {
  id: serial("id").primaryKey(),
  routineId: integer("routine_id")
    .notNull()
    .references(() => routines.id, { onDelete: "cascade" }),
  dayNumber: integer("day_number").notNull(),
  name: text("name").notNull(),
  targetMuscles: jsonb("target_muscles").notNull().$type<string[]>(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const routineMachines = pgTable("routine_machines", {
  id: serial("id").primaryKey(),
  routineId: integer("routine_id")
    .notNull()
    .references(() => routines.id, { onDelete: "cascade" }),
  machineId: integer("machine_id")
    .notNull()
    .references(() => machines.id, { onDelete: "cascade" }),
  sets: integer("sets"),
  reps: text("reps"),
  notes: text("notes"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export type User = typeof users.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;
export type Machine = typeof machines.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type RoutineDay = typeof routineDays.$inferSelect;
