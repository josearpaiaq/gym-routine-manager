import { and, asc, count, desc, eq, or } from "drizzle-orm";
import { db } from "@/db";
import {
  exercises,
  machines,
  otpCodes,
  routineDays,
  routines,
  users,
  type User,
} from "@/db/schema";

export { WEEKDAY_LABELS, WEEKDAYS } from "./weekdays";

// ─── Re-export types ──────────────────────────────────────────────────────────

export type { User };

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

export interface MachinePage {
  machines: Array<{ id: number; canonical_name: string; muscle_groups: string[]; image_path: string | null }>;
  total: number;
  page: number;
  totalPages: number;
}

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

export interface UpsertRoutineInput {
  name: string;
  days: Array<{ day_number: number; name: string; target_muscles: string[] }>;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUser(username: string, email: string, passwordHash: string): Promise<User> {
  const [user] = await db.insert(users).values({ username, email, passwordHash }).returning();
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
}

export async function getUserById(id: number): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function getUserByUsernameOrEmail(identifier: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.username, identifier)))
    .limit(1);
  return user ?? null;
}

export async function markEmailVerified(email: string): Promise<void> {
  await db.update(users).set({ emailVerified: true }).where(eq(users.email, email));
}

// ─── OTP ──────────────────────────────────────────────────────────────────────

export async function createOtp(email: string, code: string, expiresAt: Date): Promise<void> {
  await db
    .update(otpCodes)
    .set({ used: true })
    .where(and(eq(otpCodes.email, email), eq(otpCodes.used, false)));
  await db.insert(otpCodes).values({ email, code, expiresAt });
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, email), eq(otpCodes.code, code), eq(otpCodes.used, false)))
    .orderBy(desc(otpCodes.id))
    .limit(1);
  if (!row) return false;
  if (row.expiresAt < new Date()) return false;
  await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, row.id));
  return true;
}

// ─── Machines ─────────────────────────────────────────────────────────────────

export async function getMachineByNormalizedName(normalizedName: string): Promise<AnalysisResult | null> {
  const [machine] = await db
    .select()
    .from(machines)
    .where(eq(machines.normalizedName, normalizedName));
  if (!machine) return null;

  const exs = await db
    .select()
    .from(exercises)
    .where(eq(exercises.machineId, machine.id))
    .orderBy(asc(exercises.sortOrder));

  return {
    machineName: machine.canonicalName,
    muscleGroups: machine.muscleGroups,
    exercises: exs.map((ex) => ({
      name: ex.name,
      targetMuscles: ex.targetMuscles,
      execution: ex.execution,
    })),
  };
}

export async function getMachineById(id: number): Promise<MachineDetail | null> {
  const [machine] = await db.select().from(machines).where(eq(machines.id, id));
  if (!machine) return null;

  const exs = await db
    .select()
    .from(exercises)
    .where(eq(exercises.machineId, id))
    .orderBy(asc(exercises.sortOrder));

  return {
    id: machine.id,
    canonical_name: machine.canonicalName,
    normalized_name: machine.normalizedName,
    muscle_groups: machine.muscleGroups,
    image_path: machine.imagePath ?? null,
    exercises: exs.map((ex) => ({
      id: ex.id,
      name: ex.name,
      target_muscles: ex.targetMuscles,
      execution: ex.execution,
      sort_order: ex.sortOrder,
    })),
  };
}

export async function saveMachine(
  normalizedName: string,
  result: AnalysisResult,
  imagePath?: string
): Promise<void> {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: machines.id })
      .from(machines)
      .where(eq(machines.normalizedName, normalizedName));

    let machineId: number;
    if (existing) {
      await tx
        .update(machines)
        .set({
          canonicalName: result.machineName,
          muscleGroups: result.muscleGroups,
          ...(imagePath ? { imagePath } : {}),
        })
        .where(eq(machines.id, existing.id));
      await tx.delete(exercises).where(eq(exercises.machineId, existing.id));
      machineId = existing.id;
    } else {
      const [inserted] = await tx
        .insert(machines)
        .values({
          canonicalName: result.machineName,
          normalizedName,
          muscleGroups: result.muscleGroups,
          imagePath: imagePath ?? null,
        })
        .returning({ id: machines.id });
      machineId = inserted.id;
    }

    if (result.exercises.length > 0) {
      await tx.insert(exercises).values(
        result.exercises.map((ex, i) => ({
          machineId,
          name: ex.name,
          targetMuscles: ex.targetMuscles,
          execution: ex.execution,
          sortOrder: i,
        }))
      );
    }
  });
}

export async function listMachinesPaged(page: number, perPage = 10): Promise<MachinePage> {
  const offset = (page - 1) * perPage;
  const [rows, totals] = await Promise.all([
    db
      .select()
      .from(machines)
      .orderBy(asc(machines.canonicalName))
      .limit(perPage)
      .offset(offset),
    db.select({ total: count() }).from(machines),
  ]);

  const total = totals[0]?.total ?? 0;
  return {
    machines: rows.map((m) => ({
      id: m.id,
      canonical_name: m.canonicalName,
      muscle_groups: m.muscleGroups,
      image_path: m.imagePath ?? null,
    })),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

export async function getMachinesByMuscles(
  muscles: string[]
): Promise<Array<{ id: number; canonical_name: string; muscle_groups: string[]; image_path: string | null }>> {
  if (!muscles.length) return [];
  const all = await db.select().from(machines).orderBy(asc(machines.canonicalName));
  const musclesLower = muscles.map((m) => m.toLowerCase());
  return all
    .filter((m) => m.muscleGroups.some((g) => musclesLower.includes(g.toLowerCase())))
    .map((m) => ({
      id: m.id,
      canonical_name: m.canonicalName,
      muscle_groups: m.muscleGroups,
      image_path: m.imagePath ?? null,
    }));
}

// ─── Routines ─────────────────────────────────────────────────────────────────

export async function listRoutinesByUser(userId: number): Promise<RoutineWithDays[]> {
  const rs = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(desc(routines.createdAt));

  return Promise.all(
    rs.map(async (r) => {
      const days = await db
        .select()
        .from(routineDays)
        .where(eq(routineDays.routineId, r.id))
        .orderBy(asc(routineDays.dayNumber));
      return {
        id: r.id,
        name: r.name,
        created_at: r.createdAt.toISOString(),
        days: days.map((d) => ({
          id: d.id,
          day_number: d.dayNumber,
          name: d.name,
          target_muscles: d.targetMuscles,
        })),
      };
    })
  );
}

export async function getRoutineByIdForUser(
  routineId: number,
  userId: number
): Promise<RoutineWithDays | null> {
  const [routine] = await db
    .select()
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)));
  if (!routine) return null;

  const days = await db
    .select()
    .from(routineDays)
    .where(eq(routineDays.routineId, routineId))
    .orderBy(asc(routineDays.dayNumber));

  return {
    id: routine.id,
    name: routine.name,
    created_at: routine.createdAt.toISOString(),
    days: days.map((d) => ({
      id: d.id,
      day_number: d.dayNumber,
      name: d.name,
      target_muscles: d.targetMuscles,
    })),
  };
}

export async function createRoutine(userId: number, input: UpsertRoutineInput): Promise<RoutineWithDays> {
  let routineId = 0;
  await db.transaction(async (tx) => {
    const [r] = await tx
      .insert(routines)
      .values({ userId, name: input.name })
      .returning({ id: routines.id });
    routineId = r.id;
    if (input.days.length > 0) {
      await tx.insert(routineDays).values(
        input.days.map((d, i) => ({
          routineId,
          dayNumber: d.day_number,
          name: d.name,
          targetMuscles: d.target_muscles,
          sortOrder: i,
        }))
      );
    }
  });
  return (await getRoutineByIdForUser(routineId, userId))!;
}

export async function updateRoutine(
  routineId: number,
  userId: number,
  input: UpsertRoutineInput
): Promise<boolean> {
  const [existing] = await db
    .select({ id: routines.id })
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)));
  if (!existing) return false;

  await db.transaction(async (tx) => {
    await tx.update(routines).set({ name: input.name }).where(eq(routines.id, routineId));
    await tx.delete(routineDays).where(eq(routineDays.routineId, routineId));
    if (input.days.length > 0) {
      await tx.insert(routineDays).values(
        input.days.map((d, i) => ({
          routineId,
          dayNumber: d.day_number,
          name: d.name,
          targetMuscles: d.target_muscles,
          sortOrder: i,
        }))
      );
    }
  });
  return true;
}

export async function deleteRoutine(routineId: number, userId: number): Promise<boolean> {
  const result = await db
    .delete(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)))
    .returning({ id: routines.id });
  return result.length > 0;
}
