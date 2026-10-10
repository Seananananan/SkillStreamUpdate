import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  completeLesson,
  retryQuizAttempt,
  timeoutQuizAttempt,
} from "@/lib/db";

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
    choiceIndexes?: unknown;
    attemptId?: unknown;
  };

  const choiceIndexes = Array.isArray(body.choiceIndexes)
    ? body.choiceIndexes.map((choice) =>
        typeof choice === "number" && Number.isInteger(choice) ? choice : null,
      )
    : undefined;

  if (body.status === "retry") {
    const result = await retryQuizAttempt(session.id, courseId, lessonId);
    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          attempt: "attempt" in result ? result.attempt : undefined,
        },
        { status: result.status },
      );
    }
    return NextResponse.json({ attempt: result.attempt });
  }

  if (body.status === "timed_out") {
    if (typeof body.attemptId !== "string") {
      return NextResponse.json(
        { error: "Quiz attempt is required." },
        { status: 400 },
      );
    }
    const result = await timeoutQuizAttempt(
      session.id,
      courseId,
      lessonId,
      body.attemptId,
      choiceIndexes,
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ attempt: result.attempt });
  }

  if (body.status !== "completed") {
    return NextResponse.json(
      { error: "Unsupported lesson action." },
      { status: 400 },
    );
  }

  const result = await completeLesson(
    session.id,
    courseId,
    lessonId,
    choiceIndexes?.every((choice): choice is number => choice != null)
      ? choiceIndexes
      : undefined,
  );
  if (!result.ok) {
    return NextResponse.json(
      {
        error: result.error,
        attempt: "attempt" in result ? result.attempt : undefined,
        canRetry: "canRetry" in result ? result.canRetry : false,
      },
      { status: result.status },
    );
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
