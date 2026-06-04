import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getUserByEmail } from "@/services/users";
import { createOtp, generateCode } from "@/services/otp";
import { sendLoginOtpEmail } from "@/lib/email";

const schema = z.object({
  email: z.email(),
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
    return NextResponse.json({ error: "Email inválido" }, { status: 422 });
  }

  const { email } = parsed.data;
  const user = await getUserByEmail(email);

  if (user && user.emailVerified && user.isEnabled) {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await createOtp(email, code, expiresAt);
    await sendLoginOtpEmail(email, code);
  }

  return NextResponse.json({ ok: true });
}
