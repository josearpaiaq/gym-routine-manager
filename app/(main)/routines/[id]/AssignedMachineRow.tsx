"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AssignedMachine } from "@/services/routines";

interface Props {
  machine: AssignedMachine;
  routineId: number;
  dayId: number;
  onUpdate: (updated: AssignedMachine) => void;
  onRemove: (machineId: number) => void;
}

function formatSummary(m: AssignedMachine): string {
  const parts: string[] = [];
  if (m.sets && m.reps) parts.push(`${m.sets}×${m.reps}`);
  else if (m.sets) parts.push(`${m.sets} series`);
  else if (m.reps) parts.push(m.reps);
  if (m.weightKg) parts.push(`${m.weightKg} kg`);
  if (m.restSeconds) parts.push(`${m.restSeconds}s descanso`);
  return parts.join(" · ");
}

export default function AssignedMachineRow({ machine, routineId, dayId, onUpdate, onRemove }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [form, setForm] = useState({
    sets: machine.sets?.toString() ?? "",
    reps: machine.reps ?? "",
    weightKg: machine.weightKg ?? "",
    restSeconds: machine.restSeconds?.toString() ?? "",
    notes: machine.notes ?? "",
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    const res = await fetch(`/api/routines/${routineId}/days/${dayId}/machines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        machineId: machine.machineId,
        sets: form.sets ? parseInt(form.sets, 10) : null,
        reps: form.reps || null,
        weightKg: form.weightKg || null,
        restSeconds: form.restSeconds ? parseInt(form.restSeconds, 10) : null,
        notes: form.notes || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const updated: AssignedMachine = await res.json();
      onUpdate(updated);
      setEditing(false);
    }
  }

  async function handleRemove() {
    setRemoving(true);
    const res = await fetch(`/api/routines/${routineId}/days/${dayId}/machines`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ machineId: machine.machineId }),
    });
    setRemoving(false);
    if (res.ok) onRemove(machine.machineId);
  }

  const summary = formatSummary(machine);

  return (
    <div className="rounded-xl bg-gray-800 border border-gray-700 px-4 py-3">
      {!editing ? (
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-white">{machine.name}</p>
            {summary && <p className="text-xs text-gray-400 mt-0.5">{summary}</p>}
            {machine.notes && <p className="text-xs text-gray-500 mt-0.5 italic">{machine.notes}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="ghost" className="text-xs h-7 px-2" onClick={() => setEditing(true)}>
              Editar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-xs h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-950"
              onClick={handleRemove}
              disabled={removing}
            >
              {removing ? "..." : "Eliminar"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-medium text-white">{machine.name}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">Series</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={form.sets}
                onChange={(e) => setField("sets", e.target.value)}
                placeholder="3"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Reps</Label>
              <Input
                type="text"
                value={form.reps}
                onChange={(e) => setField("reps", e.target.value)}
                placeholder="8-12"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Peso (kg)</Label>
              <Input
                type="number"
                min={0}
                step={0.5}
                value={form.weightKg}
                onChange={(e) => setField("weightKg", e.target.value)}
                placeholder="60"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Descanso (s)</Label>
              <Input
                type="number"
                min={0}
                max={3600}
                value={form.restSeconds}
                onChange={(e) => setField("restSeconds", e.target.value)}
                placeholder="90"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas</Label>
            <Input
              type="text"
              value={form.notes}
              onChange={(e) => setField("notes", e.target.value)}
              placeholder="Indicaciones adicionales..."
              className="h-8 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
