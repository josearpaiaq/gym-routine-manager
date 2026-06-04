import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getUserById, updateUserById } from "@/services/users";

const schema = z.object({
  isEnabled: z.boolean().optional(),
  analyzerEnabled: z.boolean().optional(),
  isAdmin: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 422 });

  if (userId === session.userId && parsed.data.isEnabled === false) {
    return NextResponse.json({ error: "No puedes desactivarte a ti mismo" }, { status: 400 });
  }

  if (parsed.data.isAdmin !== undefined) {
    const target = await getUserById(userId);
    if (target?.isAdmin) {
      return NextResponse.json({ error: "No puedes modificar el rol de otro admin" }, { status: 403 });
    }
  }

  await updateUserById(userId, parsed.data);
  return NextResponse.json({ ok: true });
}
