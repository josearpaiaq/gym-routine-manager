import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

// ─── Constants ────────────────────────────────────────────────────────────────

export { WEEKDAY_LABELS, WEEKDAYS } from "./weekdays";

// ─── Row types ────────────────────────────────────────────────────────────────

export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  email_verified: number; // 0 | 1
  analyzer_enabled: number; // 0 | 1
  created_at: string;
}

export interface OtpRow {
  id: number;
  email: string;
  code: string;
  expires_at: string;
  used: number; // 0 | 1
  created_at: string;
}

export interface MachineRow {
  id: number;
  canonical_name: string;
  normalized_name: string;
  muscle_groups: string; // JSON array
  image_path: string | null;
  created_at: string;
}

export interface ExerciseRow {
  id: number;
  machine_id: number;
  name: string;
  target_muscles: string;
  execution: string; // JSON array
  sort_order: number;
}

export interface RoutineRow {
  id: number;
  user_id: number;
  name: string;
  created_at: string;
}

export interface RoutineDayRow {
  id: number;
  routine_id: number;
  day_number: number;
  name: string;
  target_muscles: string; // JSON array
  sort_order: number;
}

export interface AnalysisResult {
  machineName: string;
  muscleGroups: string[];
  exercises: Array<{ name: string; targetMuscles: string; execution: string[] }>;
}

export interface MachineDetail {
  id: number;
  canonical_name: string;
  normalized_name: string;
  muscle_groups: string[];
  image_path: string | null;
  exercises: Array<{
    id: number;
    name: string;
    target_muscles: string;
    execution: string[];
    sort_order: number;
  }>;
}

// ─── DB init ──────────────────────────────────────────────────────────────────

const DB_DIR = path.join(process.cwd(), "db");
const DB_PATH = path.join(DB_DIR, "gym.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      username       TEXT    NOT NULL UNIQUE,
      email          TEXT    NOT NULL UNIQUE,
      password_hash  TEXT    NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS otp_codes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      email      TEXT    NOT NULL,
      code       TEXT    NOT NULL,
      expires_at TEXT    NOT NULL,
      used       INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS machines (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      canonical_name  TEXT    NOT NULL,
      normalized_name TEXT    NOT NULL UNIQUE,
      muscle_groups   TEXT    NOT NULL DEFAULT '[]',
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      machine_id     INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
      name           TEXT    NOT NULL,
      target_muscles TEXT    NOT NULL DEFAULT '',
      execution      TEXT    NOT NULL DEFAULT '[]',
      sort_order     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS routines (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name       TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS routine_days (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id     INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      day_number     INTEGER NOT NULL,
      name           TEXT    NOT NULL,
      target_muscles TEXT    NOT NULL DEFAULT '[]',
      sort_order     INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS routine_machines (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id     INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      machine_id     INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
      sets           INTEGER,
      reps           TEXT,
      notes          TEXT,
      sort_order     INTEGER NOT NULL DEFAULT 0
    );
  `);

  // Migrate: add user_id to routines if missing (for existing DBs)
  const routineCols = (_db.pragma("table_info(routines)") as Array<{ name: string }>).map((c) => c.name);
  if (!routineCols.includes("user_id")) {
    _db.exec(`ALTER TABLE routines ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE`);
  }

  // Migrate: add analyzer_enabled to users if missing
  const userCols = (_db.pragma("table_info(users)") as Array<{ name: string }>).map((c) => c.name);
  if (!userCols.includes("analyzer_enabled")) {
    _db.exec("ALTER TABLE users ADD COLUMN analyzer_enabled INTEGER NOT NULL DEFAULT 0");
  }

  // Migrate: add image_path to machines if missing
  const machineCols = (_db.pragma("table_info(machines)") as Array<{ name: string }>).map((c) => c.name);
  if (!machineCols.includes("image_path")) {
    _db.exec("ALTER TABLE machines ADD COLUMN image_path TEXT");
  }

  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export function createUser(username: string, email: string, passwordHash: string): UserRow {
  const db = getDb();
  const info = db
    .prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)")
    .run(username, email, passwordHash);
  return db
    .prepare<[number], UserRow>("SELECT * FROM users WHERE id = ?")
    .get(info.lastInsertRowid as number)!;
}

export function getUserByEmail(email: string): UserRow | null {
  return getDb().prepare<[string], UserRow>("SELECT * FROM users WHERE email = ?").get(email) ?? null;
}

export function getUserById(id: number): UserRow | null {
  return getDb().prepare<[number], UserRow>("SELECT * FROM users WHERE id = ?").get(id) ?? null;
}

export function getUserByUsernameOrEmail(identifier: string): UserRow | null {
  return (
    getDb()
      .prepare<[string, string], UserRow>("SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1")
      .get(identifier, identifier) ?? null
  );
}

export function markEmailVerified(email: string): void {
  getDb().prepare("UPDATE users SET email_verified = 1 WHERE email = ?").run(email);
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export function createOtp(email: string, code: string, expiresAt: Date): void {
  const db = getDb();
  db.prepare("UPDATE otp_codes SET used = 1 WHERE email = ? AND used = 0").run(email);
  db.prepare("INSERT INTO otp_codes (email, code, expires_at) VALUES (?, ?, ?)").run(
    email,
    code,
    expiresAt.toISOString()
  );
}

export function verifyOtp(email: string, code: string): boolean {
  const db = getDb();
  const row = db
    .prepare<[string, string], OtpRow>(
      "SELECT * FROM otp_codes WHERE email = ? AND code = ? AND used = 0 ORDER BY id DESC LIMIT 1"
    )
    .get(email, code);
  if (!row) return false;
  if (new Date(row.expires_at) < new Date()) return false;
  db.prepare("UPDATE otp_codes SET used = 1 WHERE id = ?").run(row.id);
  return true;
}

// ─── Machines ─────────────────────────────────────────────────────────────────

export function getMachineByNormalizedName(normalizedName: string): AnalysisResult | null {
  const db = getDb();
  const machine = db
    .prepare<[string], MachineRow>("SELECT * FROM machines WHERE normalized_name = ?")
    .get(normalizedName);
  if (!machine) return null;

  const exercises = db
    .prepare<[number], ExerciseRow>(
      "SELECT * FROM exercises WHERE machine_id = ? ORDER BY sort_order ASC"
    )
    .all(machine.id);

  return {
    machineName: machine.canonical_name,
    muscleGroups: JSON.parse(machine.muscle_groups) as string[],
    exercises: exercises.map((ex) => ({
      name: ex.name,
      targetMuscles: ex.target_muscles,
      execution: JSON.parse(ex.execution) as string[],
    })),
  };
}

export function getMachineById(id: number): MachineDetail | null {
  const db = getDb();
  const machine = db.prepare<[number], MachineRow>("SELECT * FROM machines WHERE id = ?").get(id);
  if (!machine) return null;

  const exercises = db
    .prepare<[number], ExerciseRow>(
      "SELECT * FROM exercises WHERE machine_id = ? ORDER BY sort_order ASC"
    )
    .all(machine.id);

  return {
    id: machine.id,
    canonical_name: machine.canonical_name,
    normalized_name: machine.normalized_name,
    muscle_groups: JSON.parse(machine.muscle_groups) as string[],
    image_path: machine.image_path ?? null,
    exercises: exercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      target_muscles: ex.target_muscles,
      execution: JSON.parse(ex.execution) as string[],
      sort_order: ex.sort_order,
    })),
  };
}

export function saveMachine(normalizedName: string, result: AnalysisResult, imagePath?: string): void {
  const db = getDb();
  db.transaction(() => {
    const existing = db
      .prepare<[string], { id: number }>("SELECT id FROM machines WHERE normalized_name = ?")
      .get(normalizedName);

    let machineId: number;
    if (existing) {
      if (imagePath) {
        db.prepare("UPDATE machines SET canonical_name = ?, muscle_groups = ?, image_path = ? WHERE id = ?").run(
          result.machineName, JSON.stringify(result.muscleGroups), imagePath, existing.id
        );
      } else {
        db.prepare("UPDATE machines SET canonical_name = ?, muscle_groups = ? WHERE id = ?").run(
          result.machineName, JSON.stringify(result.muscleGroups), existing.id
        );
      }
      db.prepare("DELETE FROM exercises WHERE machine_id = ?").run(existing.id);
      machineId = existing.id;
    } else {
      const info = db
        .prepare("INSERT INTO machines (canonical_name, normalized_name, muscle_groups, image_path) VALUES (?, ?, ?, ?)")
        .run(result.machineName, normalizedName, JSON.stringify(result.muscleGroups), imagePath ?? null);
      machineId = info.lastInsertRowid as number;
    }

    const insertEx = db.prepare(
      "INSERT INTO exercises (machine_id, name, target_muscles, execution, sort_order) VALUES (?, ?, ?, ?, ?)"
    );
    result.exercises.forEach((ex, i) => {
      insertEx.run(machineId, ex.name, ex.targetMuscles, JSON.stringify(ex.execution), i);
    });
  })();
}

export interface MachinePage {
  machines: Array<{ id: number; canonical_name: string; muscle_groups: string[]; image_path: string | null }>;
  total: number;
  page: number;
  totalPages: number;
}

export function listMachinesPaged(page: number, perPage = 10): MachinePage {
  const db = getDb();
  const offset = (page - 1) * perPage;
  const rows = db
    .prepare<[number, number], MachineRow>("SELECT * FROM machines ORDER BY canonical_name ASC LIMIT ? OFFSET ?")
    .all(perPage, offset);
  const { total } = db
    .prepare<[], { total: number }>("SELECT COUNT(*) as total FROM machines")
    .get()!;
  return {
    machines: rows.map((r) => ({
      id: r.id,
      canonical_name: r.canonical_name,
      muscle_groups: JSON.parse(r.muscle_groups) as string[],
      image_path: r.image_path ?? null,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export function getMachinesByMuscles(
  muscles: string[]
): Array<{ id: number; canonical_name: string; muscle_groups: string[]; image_path: string | null }> {
  if (!muscles.length) return [];
  const db = getDb();
  const all = db.prepare<[], MachineRow>("SELECT * FROM machines ORDER BY canonical_name ASC").all();
  const musclesLower = muscles.map((m) => m.toLowerCase());
  return all
    .filter((m) => {
      const groups: string[] = JSON.parse(m.muscle_groups);
      return groups.some((g) => musclesLower.includes(g.toLowerCase()));
    })
    .map((m) => ({
      id: m.id,
      canonical_name: m.canonical_name,
      muscle_groups: JSON.parse(m.muscle_groups) as string[],
      image_path: m.image_path ?? null,
    }));
}

// ─── Routines ─────────────────────────────────────────────────────────────────

export interface RoutineWithDays {
  id: number;
  name: string;
  created_at: string;
  days: Array<{
    id: number;
    day_number: number;
    name: string;
    target_muscles: string[];
  }>;
}

export function listRoutinesByUser(userId: number): RoutineWithDays[] {
  const db = getDb();
  const routines = db
    .prepare<[number], RoutineRow>("SELECT * FROM routines WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId);

  return routines.map((r) => {
    const days = db
      .prepare<[number], RoutineDayRow>(
        "SELECT * FROM routine_days WHERE routine_id = ? ORDER BY day_number ASC"
      )
      .all(r.id);
    return {
      id: r.id,
      name: r.name,
      created_at: r.created_at,
      days: days.map((d) => ({
        id: d.id,
        day_number: d.day_number,
        name: d.name,
        target_muscles: JSON.parse(d.target_muscles) as string[],
      })),
    };
  });
}

export function getRoutineByIdForUser(routineId: number, userId: number): RoutineWithDays | null {
  const db = getDb();
  const routine = db
    .prepare<[number, number], RoutineRow>("SELECT * FROM routines WHERE id = ? AND user_id = ?")
    .get(routineId, userId);
  if (!routine) return null;

  const days = db
    .prepare<[number], RoutineDayRow>(
      "SELECT * FROM routine_days WHERE routine_id = ? ORDER BY day_number ASC"
    )
    .all(routine.id);

  return {
    id: routine.id,
    name: routine.name,
    created_at: routine.created_at,
    days: days.map((d) => ({
      id: d.id,
      day_number: d.day_number,
      name: d.name,
      target_muscles: JSON.parse(d.target_muscles) as string[],
    })),
  };
}

export interface UpsertRoutineInput {
  name: string;
  days: Array<{ day_number: number; name: string; target_muscles: string[] }>;
}

export function createRoutine(userId: number, input: UpsertRoutineInput): RoutineWithDays {
  const db = getDb();
  let routineId = 0;

  db.transaction(() => {
    const info = db
      .prepare("INSERT INTO routines (user_id, name) VALUES (?, ?)")
      .run(userId, input.name);
    routineId = info.lastInsertRowid as number;

    const insertDay = db.prepare(
      "INSERT INTO routine_days (routine_id, day_number, name, target_muscles, sort_order) VALUES (?, ?, ?, ?, ?)"
    );
    input.days.forEach((d, i) => {
      insertDay.run(routineId, d.day_number, d.name, JSON.stringify(d.target_muscles), i);
    });
  })();

  return getRoutineByIdForUser(routineId, userId)!;
}

export function updateRoutine(routineId: number, userId: number, input: UpsertRoutineInput): boolean {
  const db = getDb();
  const existing = db
    .prepare<[number, number], { id: number }>("SELECT id FROM routines WHERE id = ? AND user_id = ?")
    .get(routineId, userId);
  if (!existing) return false;

  db.transaction(() => {
    db.prepare("UPDATE routines SET name = ? WHERE id = ?").run(input.name, routineId);
    db.prepare("DELETE FROM routine_days WHERE routine_id = ?").run(routineId);
    const insertDay = db.prepare(
      "INSERT INTO routine_days (routine_id, day_number, name, target_muscles, sort_order) VALUES (?, ?, ?, ?, ?)"
    );
    input.days.forEach((d, i) => {
      insertDay.run(routineId, d.day_number, d.name, JSON.stringify(d.target_muscles), i);
    });
  })();

  return true;
}

export function deleteRoutine(routineId: number, userId: number): boolean {
  const db = getDb();
  const info = db
    .prepare("DELETE FROM routines WHERE id = ? AND user_id = ?")
    .run(routineId, userId);
  return info.changes > 0;
}
