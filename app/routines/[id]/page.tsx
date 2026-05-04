import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getRoutineByIdForUser, getMachinesByMuscles, WEEKDAY_LABELS } from "@/lib/db";
import Navbar from "@/components/Navbar";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RoutineDetailPage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login?from=/routines");

  const { id } = await params;
  const routine = getRoutineByIdForUser(parseInt(id, 10), session.userId);
  if (!routine) notFound();

  const daysWithMachines = routine.days.map((day) => ({
    ...day,
    machines: getMachinesByMuscles(day.target_muscles),
  }));

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <Link href="/routines" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              ← Mis rutinas
            </Link>
            <h1 className="mt-2 text-3xl font-bold">{routine.name}</h1>
            <p className="text-gray-400 text-sm mt-1">
              {routine.days.length} día{routine.days.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link
              href={`/routines/${routine.id}/edit`}
              className="rounded-xl bg-gray-800 px-4 py-2.5 text-sm font-medium hover:bg-gray-700 transition-colors"
            >
              Editar
            </Link>
            <DeleteButton routineId={routine.id} />
          </div>
        </div>

        <div className="space-y-6">
          {daysWithMachines.map((day) => (
            <div key={day.id} className="rounded-2xl bg-gray-900 border border-gray-800 overflow-hidden">
              {/* Day header */}
              <div className="px-5 py-4 border-b border-gray-800">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold">
                    {WEEKDAY_LABELS[day.day_number]?.slice(0, 2) ?? day.day_number}
                  </span>
                  <div>
                    <p className="text-xs text-indigo-400 font-medium leading-none">
                      {WEEKDAY_LABELS[day.day_number]}
                    </p>
                    <h2 className="font-semibold leading-tight">{day.name}</h2>
                  </div>
                </div>
                {day.target_muscles.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 pl-10">
                    {day.target_muscles.map((m) => (
                      <span
                        key={m}
                        className="rounded-full bg-indigo-900/50 border border-indigo-800 px-2.5 py-0.5 text-xs text-indigo-300"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Machines for this day */}
              <div className="px-5 py-4">
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
                  Máquinas disponibles
                </p>
                {day.machines.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    No hay máquinas registradas para estos músculos.{" "}
                    <Link href="/analyze" className="text-indigo-400 hover:text-indigo-300">
                      Analizar una →
                    </Link>
                  </p>
                ) : (
                  <div className="space-y-2">
                    {day.machines.map((m) => (
                      <Link
                        key={m.id}
                        href={`/machines/${m.id}?muscles=${day.target_muscles.join(",")}`}
                        className="flex items-center justify-between rounded-xl bg-gray-800 px-4 py-2.5 border border-transparent hover:border-indigo-700 hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-sm font-medium text-white">{m.canonical_name}</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {m.muscle_groups
                            .filter((g) =>
                              day.target_muscles.map((t) => t.toLowerCase()).includes(g.toLowerCase())
                            )
                            .map((g) => (
                              <span
                                key={g}
                                className="rounded-full bg-indigo-900/40 border border-indigo-800 px-2 py-0.5 text-xs text-indigo-400"
                              >
                                {g}
                              </span>
                            ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function DeleteButton({ routineId }: { routineId: number }) {
  return (
    <form
      action={async () => {
        "use server";
        const { getSession } = await import("@/lib/auth");
        const { deleteRoutine } = await import("@/lib/db");
        const { redirect } = await import("next/navigation");
        const session = await getSession();
        if (!session) { redirect("/login"); }
        else { deleteRoutine(routineId, session.userId); redirect("/routines"); }
      }}
    >
      <button
        type="submit"
        className="rounded-xl bg-red-900/40 border border-red-800 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-900/70 transition-colors"
      >
        Eliminar
      </button>
    </form>
  );
}
