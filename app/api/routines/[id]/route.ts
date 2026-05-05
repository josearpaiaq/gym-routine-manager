import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getRoutineByIdForUser, updateRoutine, deleteRoutine } from "@/services/routines";

const daySchema = z.object({
  day_number: z.number().int().min(1).max(7),
  name: z.string().min(1).max(100),
  target_muscles: z.array(z.string()).min(1),
});

const updateSchema = z
  .object({
    name: z.string().min(1).max(100),
    days: z.array(daySchema).min(1).max(7),
  })
  .refine(
    (data) => new Set(data.days.map((d) => d.day_number)).size === data.days.length,
    { message: "No se pueden repetir días de la semana en la misma rutina" }
  );

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const routine = await getRoutineByIdForUser(parseInt(id, 10), session.userId);
  if (!routine) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(routine);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const { id } = await params;
  const ok = await updateRoutine(parseInt(id, 10), session.userId, parsed.data);
  if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const ok = await deleteRoutine(parseInt(id, 10), session.userId);
  if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
