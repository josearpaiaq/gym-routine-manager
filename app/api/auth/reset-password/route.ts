import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getResetEmail, clearResetCookie } from "@/lib/auth";
import { updatePasswordHash } from "@/services/users";

const schema = z.object({
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  const email = await getResetEmail();
  if (!email) {
    return NextResponse.json({ error: "Token de restablecimiento inválido o expirado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 422 });
  }

  const hash = await bcrypt.hash(parsed.data.password, 12);
  await updatePasswordHash(email, hash);
  await clearResetCookie();

  return NextResponse.json({ ok: true });
}
