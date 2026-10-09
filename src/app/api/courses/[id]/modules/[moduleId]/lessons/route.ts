import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  createLesson,
  getCourseById,
  listLessonsByModule,
  listModulesByCourse,
} from "@/lib/db";
import {
  isLessonContentType,
  parseDurationMinutes,
  validateContentRef,
} from "@/lib/lessonContent";

type RouteContext = { params: Promise<{ id: string; moduleId: string }> };

async function verifyModuleOwnership(
  courseId: string,
  moduleId: string,
  instructorId: string,
) {
  const course = await getCourseById(courseId);
  if (!course || course.instructorId !== instructorId) return false;

  const modules = await listModulesByCourse(courseId);
  return modules.some((module) => module.id === moduleId);
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, moduleId } = await context.params;

  if (session.role === "instructor") {
    const allowed = await verifyModuleOwnership(id, moduleId, session.id);
    if (!allowed) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  const lessons = await listLessonsByModule(moduleId);
  return NextResponse.json(lessons);
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, moduleId } = await context.params;
  const allowed = await verifyModuleOwnership(id, moduleId, session.id);
  if (!allowed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    title?: string;
    contentType?: unknown;
    contentRef?: unknown;
    durationMinutes?: unknown;
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const contentType = body.contentType ?? "text";
  if (!isLessonContentType(contentType)) {
    return NextResponse.json({ error: "Unknown lesson type." }, { status: 400 });
  }

  const duration = parseDurationMinutes(body.durationMinutes);
  if (!duration.ok) {
    return NextResponse.json({ error: duration.error }, { status: 400 });
  }

  const contentRef =
    typeof body.contentRef === "string" ? body.contentRef.trim() : "";
  const contentError = validateContentRef(contentType, contentRef);
  if (contentError) {
    return NextResponse.json({ error: contentError }, { status: 400 });
  }

  const existing = await listLessonsByModule(moduleId);
  const lesson = await createLesson({
    moduleId,
    title: body.title.trim(),
    sequenceOrder: existing.length + 1,
    contentType,
    contentRef,
    durationMinutes: duration.value,
  });

  return NextResponse.json(lesson, { status: 201 });
}
