import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createOtp, generateCode } from "@/services/otp";
import { sendDeleteAccountOtpEmail } from "@/lib/email";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await createOtp(session.email, code, expiresAt);
  await sendDeleteAccountOtpEmail(session.email, code);

  return NextResponse.json({ ok: true });
}
