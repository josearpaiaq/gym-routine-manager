import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { machines, routineDays, routineMachines, routines } from "@/db/schema";

export interface RoutineWithDays {
  id: number;
  name: string;
  is_active: boolean;
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

export async function listRoutinesByUser(userId: number): Promise<RoutineWithDays[]> {
  const rs = await db
    .select()
    .from(routines)
    .where(eq(routines.userId, userId))
    .orderBy(desc(routines.isActive), desc(routines.createdAt));

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
        is_active: r.isActive,
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
    is_active: routine.isActive,
    created_at: routine.createdAt.toISOString(),
    days: days.map((d) => ({
      id: d.id,
      day_number: d.dayNumber,
      name: d.name,
      target_muscles: d.targetMuscles,
    })),
  };
}

export async function createRoutine(
  userId: number,
  input: UpsertRoutineInput
): Promise<RoutineWithDays> {
  let routineId = 0;
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select({ id: routines.id })
      .from(routines)
      .where(and(eq(routines.userId, userId), eq(routines.isActive, true)));

    const [r] = await tx
      .insert(routines)
      .values({ userId, name: input.name, isActive: !existing })
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

export async function setActiveRoutine(routineId: number, userId: number): Promise<boolean> {
  const [existing] = await db
    .select({ id: routines.id })
    .from(routines)
    .where(and(eq(routines.id, routineId), eq(routines.userId, userId)));
  if (!existing) return false;

  await db.transaction(async (tx) => {
    await tx.update(routines).set({ isActive: false }).where(eq(routines.userId, userId));
    await tx.update(routines).set({ isActive: true }).where(eq(routines.id, routineId));
  });
  return true;
}

export async function getActiveRoutine(userId: number): Promise<RoutineWithDays | null> {
  const [routine] = await db
    .select()
    .from(routines)
    .where(and(eq(routines.userId, userId), eq(routines.isActive, true)));
  if (!routine) return null;

  const days = await db
    .select()
    .from(routineDays)
    .where(eq(routineDays.routineId, routine.id))
    .orderBy(asc(routineDays.dayNumber));

  return {
    id: routine.id,
    name: routine.name,
    is_active: true,
    created_at: routine.createdAt.toISOString(),
    days: days.map((d) => ({
      id: d.id,
      day_number: d.dayNumber,
      name: d.name,
      target_muscles: d.targetMuscles,
    })),
  };
}

export interface AssignedMachine {
  id: number;
  machineId: number;
  name: string;
  sets: number | null;
  reps: string | null;
  weightKg: string | null;
  restSeconds: number | null;
  notes: string | null;
  sortOrder: number;
}

export interface UpsertDayMachineInput {
  sets?: number | null;
  reps?: string | null;
  weightKg?: string | null;
  restSeconds?: number | null;
  notes?: string | null;
}

async function verifyDayOwnership(dayId: number, userId: number): Promise<boolean> {
  const [row] = await db
    .select({ id: routineDays.id })
    .from(routineDays)
    .innerJoin(routines, eq(routineDays.routineId, routines.id))
    .where(and(eq(routineDays.id, dayId), eq(routines.userId, userId)));
  return !!row;
}

export async function getDayMachines(dayId: number, userId: number): Promise<AssignedMachine[]> {
  const owned = await verifyDayOwnership(dayId, userId);
  if (!owned) return [];

  return db
    .select({
      id: routineMachines.id,
      machineId: routineMachines.machineId,
      name: machines.canonicalName,
      sets: routineMachines.sets,
      reps: routineMachines.reps,
      weightKg: routineMachines.weightKg,
      restSeconds: routineMachines.restSeconds,
      notes: routineMachines.notes,
      sortOrder: routineMachines.sortOrder,
    })
    .from(routineMachines)
    .innerJoin(machines, eq(routineMachines.machineId, machines.id))
    .where(eq(routineMachines.dayId, dayId))
    .orderBy(asc(routineMachines.sortOrder));
}

export async function upsertDayMachine(
  dayId: number,
  machineId: number,
  userId: number,
  params: UpsertDayMachineInput
): Promise<AssignedMachine | null> {
  const owned = await verifyDayOwnership(dayId, userId);
  if (!owned) return null;

  const [row] = await db
    .insert(routineMachines)
    .values({
      dayId,
      machineId,
      sets: params.sets ?? null,
      reps: params.reps ?? null,
      weightKg: params.weightKg ?? null,
      restSeconds: params.restSeconds ?? null,
      notes: params.notes ?? null,
      sortOrder: 0,
    })
    .onConflictDoUpdate({
      target: [routineMachines.dayId, routineMachines.machineId],
      set: {
        sets: sql`excluded.sets`,
        reps: sql`excluded.reps`,
        weightKg: sql`excluded.weight_kg`,
        restSeconds: sql`excluded.rest_seconds`,
        notes: sql`excluded.notes`,
      },
    })
    .returning();

  const [machine] = await db
    .select({ name: machines.canonicalName })
    .from(machines)
    .where(eq(machines.id, machineId));

  return {
    id: row.id,
    machineId: row.machineId,
    name: machine?.name ?? "",
    sets: row.sets,
    reps: row.reps,
    weightKg: row.weightKg,
    restSeconds: row.restSeconds,
    notes: row.notes,
    sortOrder: row.sortOrder,
  };
}

export async function removeDayMachine(
  dayId: number,
  machineId: number,
  userId: number
): Promise<boolean> {
  const owned = await verifyDayOwnership(dayId, userId);
  if (!owned) return false;

  const result = await db
    .delete(routineMachines)
    .where(and(eq(routineMachines.dayId, dayId), eq(routineMachines.machineId, machineId)))
    .returning({ id: routineMachines.id });

  return result.length > 0;
}
