import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listRoutinesByUser } from "@/lib/db";
import Navbar from "@/components/Navbar";

export default async function RoutinesPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/routines");

  const routines = listRoutinesByUser(session.userId);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <Navbar />

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Mis rutinas</h1>
            <p className="text-gray-400 text-sm mt-1">{routines.length} creadas</p>
          </div>
          <Link
            href="/routines/new"
            className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500 transition-colors"
          >
            + Nueva
          </Link>
        </div>

        {routines.length === 0 ? (
          <div className="rounded-2xl bg-gray-900 border border-gray-800 p-12 text-center">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-gray-400">Aún no tienes rutinas.</p>
            <Link
              href="/routines/new"
              className="mt-4 inline-block text-indigo-400 hover:text-indigo-300 text-sm transition-colors"
            >
              Crear tu primera rutina →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => (
              <Link
                key={routine.id}
                href={`/routines/${routine.id}`}
                className="block rounded-2xl bg-gray-900 border border-gray-800 px-5 py-4 hover:border-indigo-700 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                      {routine.name}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {routine.days.length} día{routine.days.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-gray-600 group-hover:text-indigo-400 transition-colors">→</span>
                </div>
                {routine.days.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {routine.days.slice(0, 5).map((day) => (
                      <span
                        key={day.id}
                        className="rounded-lg bg-gray-800 px-2.5 py-1 text-xs text-gray-400"
                      >
                        {day.name}
                      </span>
                    ))}
                    {routine.days.length > 5 && (
                      <span className="rounded-lg bg-gray-800 px-2.5 py-1 text-xs text-gray-500">
                        +{routine.days.length - 5} más
                      </span>
                    )}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
