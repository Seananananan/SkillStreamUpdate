import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { askCourseQuestion } from "@/lib/db";

type RouteContext = { params: Promise<{ courseId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { courseId } = await context.params;
  const body = (await request.json()) as { content?: string };
  const result = await askCourseQuestion(
    session.id,
    courseId,
    body.content ?? "",
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
