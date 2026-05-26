import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getUserByUsernameOrEmail } from "@/services/users";
import { setSessionCookie } from "@/lib/auth";

const schema = z.object({
  identifier: z.string().min(1), // username or email
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 422 });
  }

  const { identifier, password } = parsed.data;

  const user = await getUserByUsernameOrEmail(identifier);
  if (!user) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Email no verificado. Revisa tu bandeja de entrada." },
      { status: 403 }
    );
  }

  if (!user.isEnabled) {
    return NextResponse.json(
      { error: "Tu cuenta ha sido desactivada. Contacta al administrador." },
      { status: 403 }
    );
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  await setSessionCookie({
    userId: user.id,
    email: user.email,
    username: user.username,
    isAdmin: user.isAdmin,
  });

  return NextResponse.json({ ok: true });
}
