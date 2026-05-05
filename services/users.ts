import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

export type { User };

export async function createUser(
  username: string,
  email: string,
  passwordHash: string
): Promise<User> {
  const [user] = await db.insert(users).values({ username, email, passwordHash }).returning();
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user ?? null;
}

export async function getUserById(id: number): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function getUserByUsernameOrEmail(identifier: string): Promise<User | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.username, identifier)))
    .limit(1);
  return user ?? null;
}

export async function markEmailVerified(email: string): Promise<void> {
  await db.update(users).set({ emailVerified: true }).where(eq(users.email, email));
}

export async function updatePasswordHash(email: string, newHash: string): Promise<void> {
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.email, email));
}

export async function deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}
