import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { setActiveRoutine } from "@/services/routines";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const routineId = parseInt(id, 10);
  if (!Number.isFinite(routineId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const ok = await setActiveRoutine(routineId, session.userId);
  if (!ok) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
