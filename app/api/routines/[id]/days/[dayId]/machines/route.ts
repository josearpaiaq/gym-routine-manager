import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getDayMachines, upsertDayMachine, removeDayMachine } from "@/services/routines";

type Params = Promise<{ id: string; dayId: string }>;

const upsertSchema = z.object({
  machineId: z.number().int().positive(),
  sets: z.number().int().min(1).max(100).nullable().optional(),
  reps: z.string().max(20).nullable().optional(),
  weightKg: z.string().nullable().optional(),
  restSeconds: z.number().int().min(0).max(3600).nullable().optional(),
  notes: z.string().max(500).nullable().optional(),
});

const deleteSchema = z.object({
  machineId: z.number().int().positive(),
});

export async function GET(request: NextRequest, { params }: { params: Params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { dayId } = await params;
  const machines = await getDayMachines(parseInt(dayId, 10), session.userId);
  return NextResponse.json(machines);
}

export async function POST(request: NextRequest, { params }: { params: Params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const { dayId } = await params;
  const result = await upsertDayMachine(
    parseInt(dayId, 10),
    parsed.data.machineId,
    session.userId,
    {
      sets: parsed.data.sets,
      reps: parsed.data.reps,
      weightKg: parsed.data.weightKg,
      restSeconds: parsed.data.restSeconds,
      notes: parsed.data.notes,
    }
  );

  if (!result) return NextResponse.json({ error: "No autorizado o día no encontrado" }, { status: 403 });
  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest, { params }: { params: Params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const { dayId } = await params;
  const ok = await removeDayMachine(parseInt(dayId, 10), parsed.data.machineId, session.userId);
  if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
