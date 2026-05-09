import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getRoutineByIdForUser, getDayMachines } from "@/services/routines";
import { getMachinesByMuscles } from "@/services/machines";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import DeleteButton from "./DeleteButton";
import RoutineDayCard from "./RoutineDayCard";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoutineDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login?from=/routines");

  const { id } = await params;
  const routineId = parseInt(id, 10);
  const routine = await getRoutineByIdForUser(routineId, session.userId);
  if (!routine) notFound();

  const daysData = await Promise.all(
    routine.days.map(async (day) => ({
      day,
      assigned: await getDayMachines(day.id, session.userId),
      available: await getMachinesByMuscles(day.target_muscles),
    }))
  );

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link href="/routines" className="text-sm font-semibold text-gray-500 hover:text-gray-300 transition-colors mb-1 inline-block">
              ← Mis rutinas
            </Link>
            <h1 className="text-3xl font-bold">{routine.name}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {routine.days.length} día{routine.days.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button asChild variant="secondary" size="default" className="rounded-md">
              <Link href={`/routines/${routine.id}/edit`}>Editar</Link>
            </Button>
            <DeleteButton routineId={routine.id} />
          </div>
        </div>

        <div className="space-y-6">
          {daysData.map(({ day, assigned, available }) => (
            <RoutineDayCard
              key={day.id}
              day={day}
              initialAssigned={assigned}
              availableMachines={available}
              routineId={routineId}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
