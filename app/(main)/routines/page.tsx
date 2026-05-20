import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ChevronRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { listRoutinesByUser } from "@/services/routines";
import { WEEKDAY_LABELS } from "@/constants/weekdays";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ActivateButton from "./ActivateButton";

export default async function RoutinesPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/routines");

  const routines = await listRoutinesByUser(session.userId);

  return (
    <main className="min-h-screen bg-gray-950 text-white">
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
            <div className="flex justify-center mb-3">
              <CalendarDays size={32} className="text-gray-600" />
            </div>
            <p className="text-gray-400">Aún no tienes rutinas.</p>
            <Button asChild variant="link" className="mt-4 text-sm">
              <Link href="/routines/new" className="inline-flex items-center gap-1">
                Crear tu primera rutina
                <ChevronRight size={14} />
              </Link>
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => (
              <Card
                key={routine.id}
                className={`px-5 py-4 transition-colors ${
                  routine.is_active
                    ? "border-indigo-700 bg-indigo-950/10"
                    : "hover:border-indigo-700"
                }`}
              >
                <div className="flex items-start gap-4">
                  <Link href={`/routines/${routine.id}`} className="group flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                        {routine.name}
                      </h2>
                      {routine.is_active && (
                        <Badge className="text-xs bg-indigo-600 text-white border-0">
                          Activa
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {routine.days.length} día{routine.days.length !== 1 ? "s" : ""}
                    </p>
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
                  </Link>
                  <div className="flex items-center gap-2 shrink-0 pt-0.5">
                    {!routine.is_active && <ActivateButton routineId={routine.id} />}
                    <Link
                      href={`/routines/${routine.id}`}
                      className="text-gray-600 hover:text-indigo-400 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
