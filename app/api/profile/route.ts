import { NextResponse } from "next/server";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { deleteUser } from "@/services/users";

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  await deleteUser(session.userId);
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
