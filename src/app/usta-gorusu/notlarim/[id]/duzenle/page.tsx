import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ExpertNoteEditForm } from "./ExpertNoteEditForm";

export const metadata = { title: "Notu Düzenle — fikape", robots: { index: false } };

export default async function ExpertNoteEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/giris");

  const { id } = await params;
  const noteId = parseInt(id);
  if (isNaN(noteId)) notFound();

  const userId = parseInt(session.user.id);
  const note = await prisma.expertNote.findUnique({
    where: { id: noteId },
    select: {
      title: true, body: true, structured: true, status: true,
      profile: { select: { userId: true } },
    },
  });
  if (!note) notFound();
  if (note.profile.userId !== userId) notFound();
  if (note.status === "HIDDEN") notFound();

  return (
    <ExpertNoteEditForm
      noteId={noteId}
      wasPublished={note.status === "PUBLISHED"}
      initialTitle={note.title}
      initialBody={note.body}
      initialStructured={(note.structured ?? {}) as Record<string, string>}
    />
  );
}
