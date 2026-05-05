import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { routineDays, routines } from "@/db/schema";

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
