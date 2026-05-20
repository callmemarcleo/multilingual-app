import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { setProgress, resetProgressForLanguage } from "@/lib/wordProgress";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { wordId, languageId, status } = await req.json();
  if (![0, 1, 2].includes(status))
    return NextResponse.json({ error: "Bad status" }, { status: 400 });

  const newStatus = await setProgress(
    session.user.id,
    languageId,
    wordId,
    status
  );
  return NextResponse.json({ ok: true, status: newStatus });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  const { languageId } = await req.json();
  await resetProgressForLanguage(session.user.id, languageId);
  return NextResponse.json({ ok: true });
}
