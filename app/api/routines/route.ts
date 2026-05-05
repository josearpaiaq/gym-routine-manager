import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { listRoutinesByUser, createRoutine } from "@/lib/db";

const daySchema = z.object({
  day_number: z.number().int().min(1).max(7),
  name: z.string().min(1).max(100),
  target_muscles: z.array(z.string()).min(1),
});

const createSchema = z
  .object({
    name: z.string().min(1).max(100),
    days: z.array(daySchema).min(1).max(7),
  })
  .refine(
    (data) => new Set(data.days.map((d) => d.day_number)).size === data.days.length,
    { message: "No se pueden repetir días de la semana en la misma rutina" }
  );

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const routines = await listRoutinesByUser(session.userId);
  return NextResponse.json(routines);
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const routine = await createRoutine(session.userId, parsed.data);
  return NextResponse.json(routine, { status: 201 });
}
