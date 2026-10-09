import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { completeLesson } from "@/lib/db";

type RouteContext = { params: Promise<{ courseId: string; lessonId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { courseId, lessonId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    status?: string;
    choiceIndex?: number;
  };

  if (body.status !== "completed") {
    return NextResponse.json(
      { error: "Only completing a lesson is supported." },
      { status: 400 },
    );
  }

  const result = await completeLesson(
    session.id,
    courseId,
    lessonId,
    body.choiceIndex,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    progress: result.progress,
    enrollment: result.enrollment,
    summary: result.summary,
    nextLesson: result.nextLesson,
    certificate: result.certificate,
    justCertified: result.justCertified,
  });
}
