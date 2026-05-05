import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail } from "@/services/users";
import { createOtp } from "@/services/otp";
import { sendOtpEmail } from "@/lib/email";

const schema = z.object({ email: z.email() });

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
    return NextResponse.json({ error: "Email inválido" }, { status: 422 });
  }

  const { email } = parsed.data;

  const user = await getUserByEmail(email);
  if (!user || user.emailVerified) {
    // Don't reveal if email exists
    return NextResponse.json({ ok: true });
  }

  const code = generateOtp();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await createOtp(email, code, expiresAt);

  try {
    await sendOtpEmail(email, code);
  } catch (err) {
    console.error("[resend-otp] email send failed:", err);
    return NextResponse.json({ error: "No se pudo enviar el email" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
