import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  Dumbbell,
  Flame,
  Moon,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getWorkoutStats, getTodayLog } from "@/services/workoutLogs";
import { listRoutinesByUser, getActiveRoutine } from "@/services/routines";
import { WEEKDAY_LABELS } from "@/constants/weekdays";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import LogWorkoutButton from "./LogWorkoutButton";

const SHORT_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/login?from=/dashboard");

  const [stats, todayLog, activeRoutine, routines] = await Promise.all([
    getWorkoutStats(session.userId),
    getTodayLog(session.userId),
    getActiveRoutine(session.userId),
    listRoutinesByUser(session.userId),
  ]);

  // day_number uses 1=Monday…7=Sunday; JS getDay() uses 0=Sunday…6=Saturday
  const jsDay = new Date().getDay();
  const todayDayNum = jsDay === 0 ? 7 : jsDay;

  const todayDays = activeRoutine
    ? activeRoutine.days
        .filter((d) => d.day_number === todayDayNum)
        .map((d) => ({ ...d, routineName: activeRoutine.name, routineId: activeRoutine.id }))
    : [];

  const today = new Date();

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Hola, {session.username}
          </h1>
          <p className="text-gray-400 text-sm mt-1 capitalize">
            {today.toLocaleDateString("es", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <StatCard
            label="Racha"
            value={`${stats.streak}s`}
            icon={
              stats.streak >= 3 ? (
                <Flame size={22} className="text-orange-400" />
              ) : (
                <Moon size={22} className="text-gray-500" />
              )
            }
            highlight={stats.streak >= 3}
          />
          <StatCard
            label="Entrenos"
            value={String(stats.totalWorkouts)}
            icon={<Dumbbell size={22} className="text-indigo-400" />}
          />
          <StatCard
            label="Semanas"
            value={String(stats.activeWeeks)}
            icon={<CalendarDays size={22} className="text-indigo-400" />}
          />
        </div>

        {/* Last 7 days */}
        <Card className="p-5">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
            Últimos 7 días
          </p>
          <div className="flex justify-between gap-1">
            {stats.last7Days.map((active, i) => {
              const d = new Date(today);
              d.setDate(today.getDate() - (6 - i));
              const isToday = i === 6;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center ring-1 ${
                      active
                        ? "bg-indigo-600 text-white ring-indigo-500"
                        : isToday
                          ? "bg-gray-800 text-gray-400 ring-indigo-800"
                          : "bg-gray-800/50 text-gray-700 ring-transparent"
                    }`}
                  >
                    {active && <Check size={14} strokeWidth={3} />}
                  </div>
                  <span className={`text-xs ${isToday ? "text-indigo-400 font-medium" : "text-gray-600"}`}>
                    {SHORT_DAYS[d.getDay()]}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Today */}
        <div>
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-3">
            Hoy — {WEEKDAY_LABELS[todayDayNum]}
          </p>

          {todayLog ? (
            <Card className="p-5 border-indigo-800/50 bg-indigo-950/20">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={28} className="text-indigo-400 shrink-0" />
                <div>
                  <p className="font-medium">Entrenamiento completado</p>
                  <p className="text-sm text-gray-400">¡Excelente trabajo hoy!</p>
                </div>
              </div>
            </Card>
          ) : todayDays.length > 0 ? (
            <div className="space-y-3">
              {todayDays.map((day) => (
                <Card key={day.id} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs text-indigo-400 font-medium mb-0.5">
                        {day.routineName}
                      </p>
                      <h3 className="font-semibold">{day.name}</h3>
                      {day.target_muscles.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {day.target_muscles.map((m) => (
                            <Badge key={m} variant="secondary" className="text-xs">
                              {m}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button asChild variant="secondary" size="sm">
                        <Link href={`/routines/${day.routineId}`}>Ver</Link>
                      </Button>
                      <LogWorkoutButton dayId={day.id} routineId={day.routineId} />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-5">
              {!activeRoutine ? (
                <>
                  <p className="text-sm text-gray-500">No tienes ninguna rutina activa.</p>
                  <Button asChild variant="link" className="p-0 h-auto mt-2 text-sm">
                    <Link href="/routines" className="inline-flex items-center gap-1">
                      {routines.length === 0 ? "Crear tu primera rutina" : "Activar una rutina"}
                      <ChevronRight size={14} />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500">No tienes rutina programada para hoy.</p>
                  <Button asChild variant="link" className="p-0 h-auto mt-2 text-sm">
                    <Link href={`/routines/${activeRoutine.id}`} className="inline-flex items-center gap-1">
                      Ver rutina activa
                      <ChevronRight size={14} />
                    </Link>
                  </Button>
                </>
              )}
            </Card>
          )}
        </div>

        {/* Routines summary */}
        {routines.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
                Mis rutinas
              </p>
              <Link
                href="/routines"
                className="inline-flex items-center gap-0.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Ver todas
                <ChevronRight size={13} />
              </Link>
            </div>
            <div className="space-y-2">
              {routines.slice(0, 3).map((r) => (
                <Link key={r.id} href={`/routines/${r.id}`} className="group block">
                  <Card className={`px-4 py-3 hover:border-indigo-700 transition-colors ${r.is_active ? "border-indigo-700 bg-indigo-950/10" : ""}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium group-hover:text-indigo-300 transition-colors">
                            {r.name}
                          </p>
                          {r.is_active && (
                            <Badge className="text-xs bg-indigo-600 text-white border-0">
                              Activa
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {r.days.length} día{r.days.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-600 group-hover:text-indigo-400 transition-colors" />
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card
      className={`p-4 sm:p-5 text-center ${highlight ? "border-indigo-700 bg-indigo-950/20" : ""}`}
    >
      <CardContent className="p-0">
        <div className="flex justify-center">{icon}</div>
        <p className={`text-2xl font-bold mt-1 ${highlight ? "text-indigo-300" : "text-white"}`}>
          {value}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </CardContent>
    </Card>
  );
}
