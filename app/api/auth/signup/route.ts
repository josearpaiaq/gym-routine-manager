import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createUser, getUserByEmail } from "@/services/users";
import { createOtp } from "@/services/otp";
import { sendOtpEmail } from "@/lib/email";

const schema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.email(),
  password: z.string().min(8),
});

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 422 });
  }

  const { username, email, password } = parsed.data;

  const existing = await getUserByEmail(email);
  if (existing?.emailVerified) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese email" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  if (!existing) {
    try {
      await createUser(username, email, passwordHash);
    } catch {
      return NextResponse.json({ error: "El nombre de usuario ya está en uso" }, { status: 409 });
    }
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min
  await createOtp(email, code, expiresAt);

  try {
    await sendOtpEmail(email, code);
  } catch (err) {
    console.error("[signup] email send failed:", err);
    return NextResponse.json(
      { error: "No se pudo enviar el email de verificación" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
