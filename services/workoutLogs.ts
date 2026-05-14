import { and, desc, eq, gte, lt } from "drizzle-orm";
import { db } from "@/db";
import { workoutLogs } from "@/db/schema";

export async function logWorkout(
  userId: number,
  opts?: { routineId?: number; dayId?: number; note?: string }
) {
  const [log] = await db
    .insert(workoutLogs)
    .values({ userId, ...opts })
    .returning();
  return log;
}

export async function getTodayLog(userId: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [log] = await db
    .select()
    .from(workoutLogs)
    .where(
      and(
        eq(workoutLogs.userId, userId),
        gte(workoutLogs.completedAt, today),
        lt(workoutLogs.completedAt, tomorrow)
      )
    )
    .limit(1);

  return log ?? null;
}

export async function getWorkoutStats(userId: number) {
  const all = await db
    .select({ completedAt: workoutLogs.completedAt })
    .from(workoutLogs)
    .where(eq(workoutLogs.userId, userId))
    .orderBy(desc(workoutLogs.completedAt));

  const totalWorkouts = all.length;

  const uniqueDays = [
    ...new Set(
      all.map((l) => {
        const d = new Date(l.completedAt);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      })
    ),
  ];

  // Streak: count consecutive days back from today
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 0; i < 365; i++) {
    const check = new Date(today);
    check.setDate(today.getDate() - i);
    const dateStr = `${check.getFullYear()}-${String(check.getMonth() + 1).padStart(2, "0")}-${String(check.getDate()).padStart(2, "0")}`;
    if (uniqueDays.includes(dateStr)) {
      streak++;
    } else {
      break;
    }
  }

  // Active weeks using ISO week approximation
  const weekSet = new Set(
    all.map((l) => {
      const d = new Date(l.completedAt);
      const startOfYear = new Date(d.getFullYear(), 0, 1);
      const weekNum = Math.ceil(
        ((d.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
      );
      return `${d.getFullYear()}-W${weekNum}`;
    })
  );

  // Last 7 days activity flags
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    return uniqueDays.includes(dateStr);
  });

  return {
    totalWorkouts,
    streak,
    activeWeeks: weekSet.size,
    last7Days,
  };
}
