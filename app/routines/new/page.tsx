"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MUSCLE_GROUPS } from "@/lib/muscles";
import { WEEKDAY_LABELS, WEEKDAYS } from "@/lib/weekdays";

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
    if (!name.trim()) { setError("Ingresa un nombre para la rutina"); return; }
    if (days.length === 0) { setError("Agrega al menos un día a la rutina"); return; }
    if (days.some((d) => !d.name.trim())) { setError("Todos los días necesitan un nombre"); return; }
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
          <Link href="/routines" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Mis rutinas
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Nueva rutina</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Routine name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Nombre de la rutina
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-gray-900 border border-gray-700 px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="Ej: Rutina Push/Pull 5 días"
            />
          </div>

          {/* Days */}
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-300 uppercase tracking-widest mb-3">
                Días ({days.length}/7)
              </h2>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((wd) => {
                  const isAdded = addedDayNumbers.has(wd.number);
                  return (
                    <button
                      key={wd.number}
                      type="button"
                      disabled={isAdded}
                      onClick={() => addDay(wd.number)}
                      className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
                        isAdded
                          ? "bg-gray-800 border-gray-700 text-gray-600 opacity-40 cursor-not-allowed"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-white"
                      }`}
                    >
                      {wd.short}
                    </button>
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
                  <div key={day.day_number} className="rounded-2xl bg-gray-900 border border-gray-800 p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold">
                        {WEEKDAY_LABELS[day.day_number]?.slice(0, 2)}
                      </span>
                      <input
                        type="text"
                        value={day.name}
                        onChange={(e) => updateDay(i, { name: e.target.value })}
                        className="flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                        placeholder="Nombre del día"
                      />
                      <button
                        type="button"
                        onClick={() => removeDay(i)}
                        className="text-gray-600 hover:text-red-400 transition-colors text-sm"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-2">Músculos a trabajar</p>
                      <div className="flex flex-wrap gap-2">
                        {MUSCLE_GROUPS.map((muscle) => {
                          const selected = day.target_muscles.includes(muscle);
                          return (
                            <button
                              key={muscle}
                              type="button"
                              onClick={() => toggleMuscle(i, muscle)}
                              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                                selected
                                  ? "bg-indigo-600 border-indigo-500 text-white"
                                  : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500"
                              }`}
                            >
                              {muscle}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {error && (
            <div className="rounded-xl bg-red-900/40 border border-red-700 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            Crear rutina
          </button>
        </form>
      </div>
    </main>
  );
}
