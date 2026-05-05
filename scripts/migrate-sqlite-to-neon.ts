import { config } from "dotenv";
config({ path: ".env.local" });

// Imports above don't create any DB connection — only import declarations.
// neon() and drizzle() are called below, AFTER dotenv has populated process.env.
import Database from "better-sqlite3";
import path from "path";
import { sql } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../db/schema";
import {
  exercises,
  machines,
  otpCodes,
  routineDays,
  routineMachines,
  routines,
  users,
} from "../db/schema";

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle({ client: sqlClient, schema });

const sqlite = new Database(path.join(process.cwd(), "db", "gym.db"));

const sqliteUsers = sqlite.prepare("SELECT * FROM users").all() as any[];
const sqliteOtps = sqlite.prepare("SELECT * FROM otp_codes").all() as any[];
const sqliteMachines = sqlite.prepare("SELECT * FROM machines").all() as any[];
const sqliteExercises = sqlite.prepare("SELECT * FROM exercises").all() as any[];
const sqliteRoutines = sqlite.prepare("SELECT * FROM routines").all() as any[];
const sqliteDays = sqlite.prepare("SELECT * FROM routine_days").all() as any[];
const sqliteRMs = sqlite.prepare("SELECT * FROM routine_machines").all() as any[];

async function run() {
  console.log("Migrating users...");
  if (sqliteUsers.length) {
    await db
      .insert(users)
      .values(
        sqliteUsers.map((r) => ({
          id: r.id,
          username: r.username,
          email: r.email,
          passwordHash: r.password_hash,
          emailVerified: Boolean(r.email_verified),
          analyzerEnabled: Boolean(r.analyzer_enabled),
          createdAt: new Date(r.created_at),
        }))
      )
      .onConflictDoNothing();
  }

  console.log("Migrating otp_codes...");
  if (sqliteOtps.length) {
    await db
      .insert(otpCodes)
      .values(
        sqliteOtps.map((r) => ({
          id: r.id,
          email: r.email,
          code: r.code,
          expiresAt: new Date(r.expires_at),
          used: Boolean(r.used),
          createdAt: new Date(r.created_at),
        }))
      )
      .onConflictDoNothing();
  }

  console.log("Migrating machines...");
  if (sqliteMachines.length) {
    await db
      .insert(machines)
      .values(
        sqliteMachines.map((r) => ({
          id: r.id,
          canonicalName: r.canonical_name,
          normalizedName: r.normalized_name,
          muscleGroups: JSON.parse(r.muscle_groups) as string[],
          imagePath: r.image_path ?? null,
          createdAt: new Date(r.created_at),
        }))
      )
      .onConflictDoNothing();
  }

  console.log("Migrating exercises...");
  if (sqliteExercises.length) {
    await db
      .insert(exercises)
      .values(
        sqliteExercises.map((r) => ({
          id: r.id,
          machineId: r.machine_id,
          name: r.name,
          targetMuscles: r.target_muscles,
          execution: JSON.parse(r.execution) as string[],
          sortOrder: r.sort_order,
        }))
      )
      .onConflictDoNothing();
  }

  console.log("Migrating routines...");
  if (sqliteRoutines.length) {
    await db
      .insert(routines)
      .values(
        sqliteRoutines.map((r) => ({
          id: r.id,
          userId: r.user_id,
          name: r.name,
          createdAt: new Date(r.created_at),
        }))
      )
      .onConflictDoNothing();
  }

  console.log("Migrating routine_days...");
  if (sqliteDays.length) {
    await db
      .insert(routineDays)
      .values(
        sqliteDays.map((r) => ({
          id: r.id,
          routineId: r.routine_id,
          dayNumber: r.day_number,
          name: r.name,
          targetMuscles: JSON.parse(r.target_muscles) as string[],
          sortOrder: r.sort_order,
        }))
      )
      .onConflictDoNothing();
  }

  console.log("Migrating routine_machines...");
  if (sqliteRMs.length) {
    await db
      .insert(routineMachines)
      .values(
        sqliteRMs.map((r) => ({
          id: r.id,
          routineId: r.routine_id,
          machineId: r.machine_id,
          sets: r.sets ?? null,
          reps: r.reps ?? null,
          notes: r.notes ?? null,
          sortOrder: r.sort_order,
        }))
      )
      .onConflictDoNothing();
  }

  console.log("Resetting sequences...");
  const seqs = [
    { seq: "users_id_seq", table: "users" },
    { seq: "otp_codes_id_seq", table: "otp_codes" },
    { seq: "machines_id_seq", table: "machines" },
    { seq: "exercises_id_seq", table: "exercises" },
    { seq: "routines_id_seq", table: "routines" },
    { seq: "routine_days_id_seq", table: "routine_days" },
    { seq: "routine_machines_id_seq", table: "routine_machines" },
  ];
  for (const { seq, table } of seqs) {
    await db.execute(
      sql.raw(`SELECT setval('${seq}', COALESCE((SELECT MAX(id) FROM "${table}"), 1))`)
    );
  }

  console.log("\nDone ✓");
  console.log(`  users:            ${sqliteUsers.length}`);
  console.log(`  otp_codes:        ${sqliteOtps.length}`);
  console.log(`  machines:         ${sqliteMachines.length}`);
  console.log(`  exercises:        ${sqliteExercises.length}`);
  console.log(`  routines:         ${sqliteRoutines.length}`);
  console.log(`  routine_days:     ${sqliteDays.length}`);
  console.log(`  routine_machines: ${sqliteRMs.length}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
