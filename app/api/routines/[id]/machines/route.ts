import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getRoutineByIdForUser, getMachinesByMuscles } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const routine = getRoutineByIdForUser(parseInt(id, 10), session.userId);
  if (!routine) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  // Collect all unique muscles across all days
  const allMuscles = [...new Set(routine.days.flatMap((d) => d.target_muscles))];
  const machines = getMachinesByMuscles(allMuscles);

  // Group machines by which day muscles they match
  const result = routine.days.map((day) => ({
    day_id: day.id,
    day_number: day.day_number,
    day_name: day.name,
    target_muscles: day.target_muscles,
    machines: machines.filter((m) =>
      m.muscle_groups.some((g) =>
        day.target_muscles.map((t) => t.toLowerCase()).includes(g.toLowerCase())
      )
    ),
  }));

  return NextResponse.json(result);
}
