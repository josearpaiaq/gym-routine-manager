import { NextRequest, NextResponse } from "next/server";
import { listMachinesPaged } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const data = await listMachinesPaged(page, 10);
  return NextResponse.json(data);
}
