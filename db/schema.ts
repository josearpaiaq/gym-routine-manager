import { boolean, integer, jsonb, numeric, pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  analyzerEnabled: boolean("analyzer_enabled").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  isEnabled: boolean("is_enabled").notNull().default(true),
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
  isGymMachine: boolean("is_gym_machine").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
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
  isActive: boolean("is_active").notNull().default(false),
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

export const routineMachines = pgTable(
  "routine_machines",
  {
    id: serial("id").primaryKey(),
    dayId: integer("day_id")
      .notNull()
      .references(() => routineDays.id, { onDelete: "cascade" }),
    machineId: integer("machine_id")
      .notNull()
      .references(() => machines.id, { onDelete: "cascade" }),
    sets: integer("sets"),
    reps: text("reps"),
    weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
    restSeconds: integer("rest_seconds"),
    notes: text("notes"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.dayId, t.machineId)]
);

export const workoutLogs = pgTable("workout_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  routineId: integer("routine_id").references(() => routines.id, { onDelete: "set null" }),
  dayId: integer("day_id").references(() => routineDays.id, { onDelete: "set null" }),
  completedAt: timestamp("completed_at").notNull().defaultNow(),
  note: text("note"),
});

export type User = typeof users.$inferSelect;
export type OtpCode = typeof otpCodes.$inferSelect;
export type Machine = typeof machines.$inferSelect;
export type Exercise = typeof exercises.$inferSelect;
export type Routine = typeof routines.$inferSelect;
export type RoutineDay = typeof routineDays.$inferSelect;
export type RoutineMachine = typeof routineMachines.$inferSelect;
export type WorkoutLog = typeof workoutLogs.$inferSelect;
