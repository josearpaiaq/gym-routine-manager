import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

export interface MachineRow {
  id: number;
  canonical_name: string;
  normalized_name: string;
  muscle_groups: string; // JSON array
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

export interface AnalysisResult {
  machineName: string;
  muscleGroups: string[];
  exercises: Array<{ name: string; targetMuscles: string; execution: string[] }>;
}

const DB_DIR = path.join(process.cwd(), "db");
const DB_PATH = path.join(DB_DIR, "gym.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS machines (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      canonical_name TEXT    NOT NULL,
      normalized_name TEXT   NOT NULL UNIQUE,
      muscle_groups  TEXT    NOT NULL DEFAULT '[]',
      created_at     TEXT    NOT NULL DEFAULT (datetime('now'))
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
      name       TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS routine_machines (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      routine_id INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      machine_id INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
      sets       INTEGER,
      reps       TEXT,
      notes      TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);
  return _db;
}

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

export function saveMachine(normalizedName: string, result: AnalysisResult): void {
  const db = getDb();

  const insert = db.transaction(() => {
    const existing = db
      .prepare<[string], { id: number }>("SELECT id FROM machines WHERE normalized_name = ?")
      .get(normalizedName);

    let machineId: number;

    if (existing) {
      db.prepare(
        "UPDATE machines SET canonical_name = ?, muscle_groups = ? WHERE id = ?"
      ).run(result.machineName, JSON.stringify(result.muscleGroups), existing.id);
      db.prepare("DELETE FROM exercises WHERE machine_id = ?").run(existing.id);
      machineId = existing.id;
    } else {
      const info = db
        .prepare(
          "INSERT INTO machines (canonical_name, normalized_name, muscle_groups) VALUES (?, ?, ?)"
        )
        .run(result.machineName, normalizedName, JSON.stringify(result.muscleGroups));
      machineId = info.lastInsertRowid as number;
    }

    const insertEx = db.prepare(
      "INSERT INTO exercises (machine_id, name, target_muscles, execution, sort_order) VALUES (?, ?, ?, ?, ?)"
    );
    for (let i = 0; i < result.exercises.length; i++) {
      const ex = result.exercises[i];
      insertEx.run(machineId, ex.name, ex.targetMuscles, JSON.stringify(ex.execution), i);
    }
  });

  insert();
}
