import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifyOtp } from "@/services/otp";
import { setResetCookie } from "@/lib/auth";

const schema = z.object({
  email: z.email(),
  code: z.string().length(6),
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

  const { email, code } = parsed.data;

  const valid = await verifyOtp(email, code);
  if (!valid) {
    return NextResponse.json({ error: "Código inválido o expirado" }, { status: 401 });
  }

  await setResetCookie(email);

  return NextResponse.json({ ok: true });
}
