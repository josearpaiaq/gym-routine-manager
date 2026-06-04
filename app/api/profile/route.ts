import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession, clearSessionCookie } from "@/lib/auth";
import { deleteUser } from "@/services/users";
import { verifyOtp } from "@/services/otp";

const deleteSchema = z.object({
  code: z.string().length(6),
});

export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 422 });
  }

  const valid = await verifyOtp(session.email, parsed.data.code);
  if (!valid) {
    return NextResponse.json({ error: "Código inválido o expirado" }, { status: 401 });
  }

  await deleteUser(session.userId);
  await clearSessionCookie();

  return NextResponse.json({ ok: true });
}
