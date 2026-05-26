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

function isoWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  // Shift to Thursday of the ISO week (week starts Monday)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const year = d.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const week = Math.ceil(((d.getTime() - startOfYear.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
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

  // Streak: consecutive weeks (ISO) with at least one workout, going back from current week
  const weekSet = new Set(all.map((l) => isoWeekKey(new Date(l.completedAt))));
  let streak = 0;
  const cursor = new Date();
  for (let i = 0; i < 104; i++) {
    const key = isoWeekKey(cursor);
    if (weekSet.has(key)) {
      streak++;
      cursor.setDate(cursor.getDate() - 7);
    } else {
      break;
    }
  }

  // Last 7 days activity flags
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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
