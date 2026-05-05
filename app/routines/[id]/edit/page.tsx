import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getRoutineByIdForUser } from "@/lib/db";
import EditRoutineForm from "./EditRoutineForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRoutinePage({ params }: PageProps) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;
  const routine = await getRoutineByIdForUser(parseInt(id, 10), session.userId);
  if (!routine) notFound();

  return <EditRoutineForm routine={routine} />;
}
