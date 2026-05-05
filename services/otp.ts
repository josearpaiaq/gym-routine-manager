import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";

export async function createOtp(email: string, code: string, expiresAt: Date): Promise<void> {
  await db
    .update(otpCodes)
    .set({ used: true })
    .where(and(eq(otpCodes.email, email), eq(otpCodes.used, false)));
  await db.insert(otpCodes).values({ email, code, expiresAt });
}

export async function verifyOtp(email: string, code: string): Promise<boolean> {
  const [row] = await db
    .select()
    .from(otpCodes)
    .where(and(eq(otpCodes.email, email), eq(otpCodes.code, code), eq(otpCodes.used, false)))
    .orderBy(desc(otpCodes.id))
    .limit(1);
  if (!row) return false;
  if (row.expiresAt < new Date()) return false;
  await db.update(otpCodes).set({ used: true }).where(eq(otpCodes.id, row.id));
  return true;
}
