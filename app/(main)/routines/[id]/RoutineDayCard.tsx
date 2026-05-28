"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ChevronUp, Plus } from "lucide-react";
import { WEEKDAY_LABELS } from "@/constants/weekdays";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import AssignedMachineRow from "./AssignedMachineRow";
import type { AssignedMachine } from "@/services/routines";

interface AvailableMachine {
  id: number;
  canonical_name: string;
  muscle_groups: string[];
  image_path: string | null;
}

interface Day {
  id: number;
  day_number: number;
  name: string;
  target_muscles: string[];
}

interface Props {
  day: Day;
  initialAssigned: AssignedMachine[];
  availableMachines: AvailableMachine[];
  routineId: number;
}

export default function RoutineDayCard({
  day,
  initialAssigned,
  availableMachines,
  routineId,
}: Props) {
  const [assigned, setAssigned] = useState<AssignedMachine[]>(initialAssigned);
  const [adding, setAdding] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);

  const assignedIds = new Set(assigned.map((a) => a.machineId));
  const unassigned = availableMachines.filter((m) => !assignedIds.has(m.id));

  function handleUpdate(updated: AssignedMachine) {
    setAssigned((prev) => prev.map((a) => (a.machineId === updated.machineId ? updated : a)));
  }

  function handleRemove(machineId: number) {
    setAssigned((prev) => prev.filter((a) => a.machineId !== machineId));
  }

  async function handleAdd(machine: AvailableMachine) {
    setAddingId(machine.id);
    const res = await fetch(`/api/routines/${routineId}/days/${day.id}/machines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId: machine.id }),
    });
    setAddingId(null);
    if (res.ok) {
      const created: AssignedMachine = await res.json();
      setAssigned((prev) => [...prev, created]);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
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
              <Badge key={m}>{m}</Badge>
            ))}
          </div>
        )}
      </div>

      <CardContent className="pt-4 space-y-4">
        {assigned.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-widest text-text-muted font-semibold">
              Ejercicios asignados
            </p>
            {assigned.map((m) => (
              <AssignedMachineRow
                key={m.machineId}
                machine={m}
                routineId={routineId}
                dayId={day.id}
                onUpdate={handleUpdate}
                onRemove={handleRemove}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No hay ejercicios asignados a este día.</p>
        )}

        {unassigned.length > 0 && (
          <div>
            <span
              className="flex gap-1 items-center text-sm font-semibold text-text-muted hover:text-text hover:bg-none transition-colors hover:cursor-pointer"
              onClick={() => setAdding((v) => !v)}
            >
              {adding ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {adding ? "Cerrar" : "Agregar máquina"}
            </span>

            {adding && (
              <div className="mt-2 space-y-1.5">
                {unassigned.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-xl bg-card-hover/60 border border-border px-3 py-2"
                  >
                    <div>
                      <span className="text-sm text-text">{m.canonical_name}</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {m.muscle_groups
                          .filter((g) =>
                            day.target_muscles.map((t) => t.toLowerCase()).includes(g.toLowerCase())
                          )
                          .map((g) => (
                            <Badge
                              key={g}
                              className="bg-indigo-100 border-indigo-200 text-indigo-700 dark:bg-indigo-900/40 dark:border-indigo-800 dark:text-indigo-400 text-xs"
                            >
                              {g}
                            </Badge>
                          ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0 h-7 px-2 gap-1 text-indigo-400 hover:text-indigo-300"
                      onClick={() => handleAdd(m)}
                      disabled={addingId === m.id}
                    >
                      <Plus size={14} />
                      {addingId === m.id ? "..." : "Agregar"}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {unassigned.length === 0 && assigned.length === 0 && (
          <p className="text-sm text-text-muted">
            No hay máquinas registradas para estos músculos.{" "}
            <Button asChild variant="link" className="text-sm p-0 h-auto">
              <Link href="/analyze" className="inline-flex items-center gap-1">
                Analizar una
                <ChevronRight size={13} />
              </Link>
            </Button>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
