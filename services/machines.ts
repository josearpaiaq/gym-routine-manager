import { and, asc, count, eq } from "drizzle-orm";
import { db } from "@/db";
import { exercises, machines } from "@/db/schema";

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
  machines: Array<{
    id: number;
    canonical_name: string;
    muscle_groups: string[];
    image_path: string | null;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

export async function getMachineByNormalizedName(
  normalizedName: string
): Promise<AnalysisResult | null> {
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
    db.select().from(machines).orderBy(asc(machines.canonicalName)).limit(perPage).offset(offset),
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
): Promise<
  Array<{ id: number; canonical_name: string; muscle_groups: string[]; image_path: string | null }>
> {
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
