import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listRoutinesByUser, WEEKDAY_LABELS } from "@/lib/db";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
          <Button asChild>
            <Link href="/routines/new">+ Nueva</Link>
          </Button>
        </div>

        {routines.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-2xl mb-2">📅</p>
            <p className="text-gray-400">Aún no tienes rutinas.</p>
            <Button asChild variant="link" className="mt-4 text-sm">
              <Link href="/routines/new">Crear tu primera rutina →</Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => (
              <Link key={routine.id} href={`/routines/${routine.id}`} className="group block">
                <Card className="px-5 py-4 hover:border-indigo-700 transition-colors">
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
                        <Badge key={day.id} variant="secondary">
                          {WEEKDAY_LABELS[day.day_number] ?? `Día ${day.day_number}`}
                          {day.name !== WEEKDAY_LABELS[day.day_number] && (
                            <span className="text-gray-600 ml-1">· {day.name}</span>
                          )}
                        </Badge>
                      ))}
                      {routine.days.length > 5 && (
                        <Badge variant="secondary">+{routine.days.length - 5} más</Badge>
                      )}
                    </div>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
