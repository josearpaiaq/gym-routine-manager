"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MUSCLE_GROUPS } from "@/constants/muscles";
import { WEEKDAY_LABELS, WEEKDAYS } from "@/constants/weekdays";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DayInput {
  day_number: number;
  name: string;
  target_muscles: string[];
}

export default function NewRoutinePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [days, setDays] = useState<DayInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function addDay(dayNumber: number) {
    setDays((prev) => [
      ...prev,
      { day_number: dayNumber, name: WEEKDAY_LABELS[dayNumber], target_muscles: [] },
    ]);
  }

  function removeDay(i: number) {
    setDays((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateDay(i: number, patch: Partial<DayInput>) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...patch } : d)));
  }

  function toggleMuscle(dayIdx: number, muscle: string) {
    setDays((prev) =>
      prev.map((d, i) => {
        if (i !== dayIdx) return d;
        const has = d.target_muscles.includes(muscle);
        return {
          ...d,
          target_muscles: has
            ? d.target_muscles.filter((m) => m !== muscle)
            : [...d.target_muscles, muscle],
        };
      })
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Ingresa un nombre para la rutina");
      return;
    }
    if (days.length === 0) {
      setError("Agrega al menos un día a la rutina");
      return;
    }
    if (days.some((d) => !d.name.trim())) {
      setError("Todos los días necesitan un nombre");
      return;
    }
    if (days.some((d) => d.target_muscles.length === 0)) {
      setError("Cada día debe tener al menos un músculo seleccionado");
      return;
    }

    setError(null);
    setLoading(true);

    const res = await fetch("/api/routines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), days }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error al crear la rutina");
      return;
    }

    router.push(`/routines/${data.id}`);
  }

  const addedDayNumbers = new Set(days.map((d) => d.day_number));

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-6">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-300 px-0"
          >
            <Link href="/routines" className="inline-flex items-center gap-1">
              <ArrowLeft size={14} />
              Mis rutinas
            </Link>
          </Button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Nueva rutina</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <Label>Nombre de la rutina</Label>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Rutina Push/Pull 5 días"
            />
          </div>

          {/* Days */}
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-300 uppercase tracking-widest mb-3">
                Días ({days.length}/7)
              </p>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((wd) => {
                  const isAdded = addedDayNumbers.has(wd.number);
                  return (
                    <Button
                      key={wd.number}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isAdded}
                      onClick={() => addDay(wd.number)}
                      className={isAdded ? "opacity-40" : ""}
                    >
                      {wd.short}
                    </Button>
                  );
                })}
              </div>
            </div>

            {days
              .slice()
              .sort((a, b) => a.day_number - b.day_number)
              .map((day) => {
                const i = days.findIndex((d) => d.day_number === day.day_number);
                return (
                  <Card key={day.day_number}>
                    <CardContent className="pt-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold">
                          {WEEKDAY_LABELS[day.day_number]?.slice(0, 2)}
                        </span>
                        <Input
                          value={day.name}
                          onChange={(e) => updateDay(i, { name: e.target.value })}
                          className="flex-1"
                          placeholder="Nombre del día"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDay(i)}
                          className="text-gray-600 hover:text-red-400"
                        >
                          Eliminar
                        </Button>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500 mb-2">Músculos a trabajar</p>
                        <div className="flex flex-wrap gap-2">
                          {MUSCLE_GROUPS.map((muscle) => {
                            const selected = day.target_muscles.includes(muscle);
                            return (
                              <Button
                                key={muscle}
                                type="button"
                                size="sm"
                                variant={selected ? "default" : "outline"}
                                onClick={() => toggleMuscle(i, muscle)}
                                className="rounded-full text-xs h-auto py-1"
                              >
                                {muscle}
                              </Button>
                            );
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" disabled={loading} className="w-full" size="lg">
            {loading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Crear rutina
          </Button>
        </form>
      </div>
    </main>
  );
}
