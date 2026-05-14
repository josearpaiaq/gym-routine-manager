"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Props {
  dayId: number;
  routineId: number;
}

export default function LogWorkoutButton({ dayId, routineId }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLog() {
    setLoading(true);
    await fetch("/api/workouts/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dayId, routineId }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button size="sm" onClick={handleLog} disabled={loading}>
      {loading ? "..." : "Completar"}
    </Button>
  );
}
