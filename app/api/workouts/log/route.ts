import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { logWorkout } from "@/services/workoutLogs";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  const log = await logWorkout(session.userId, {
    routineId: typeof body.routineId === "number" ? body.routineId : undefined,
    dayId: typeof body.dayId === "number" ? body.dayId : undefined,
    note: typeof body.note === "string" ? body.note : undefined,
  });

  return NextResponse.json(log, { status: 201 });
}
