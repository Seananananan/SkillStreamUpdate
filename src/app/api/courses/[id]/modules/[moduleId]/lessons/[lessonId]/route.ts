import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  deleteLesson,
  getCourseById,
  listLessonsByModule,
  listModulesByCourse,
  moveLesson,
  updateLesson,
} from "@/lib/db";
import {
  isLessonContentType,
  parseDurationMinutes,
  validateContentRef,
} from "@/lib/lessonContent";
import type { Lesson } from "@/lib/types";

type RouteContext = {
  params: Promise<{ id: string; moduleId: string; lessonId: string }>;
};

async function requireOwnedLesson(
  courseId: string,
  moduleId: string,
  lessonId: string,
  instructorId: string,
) {
  const course = await getCourseById(courseId);
  if (!course || course.instructorId !== instructorId) return null;

  const modules = await listModulesByCourse(courseId);
  if (!modules.some((courseModule) => courseModule.id === moduleId)) {
    return null;
  }

  const lessons = await listLessonsByModule(moduleId);
  return lessons.find((lesson) => lesson.id === lessonId) ?? null;
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, moduleId, lessonId } = await context.params;
  const existing = await requireOwnedLesson(id, moduleId, lessonId, session.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    title?: string;
    contentType?: unknown;
    contentRef?: unknown;
    durationMinutes?: unknown;
    direction?: "up" | "down";
  };

  if (body.direction === "up" || body.direction === "down") {
    const lessons = await moveLesson(moduleId, lessonId, body.direction);
    return NextResponse.json(lessons);
  }

  const updates: Partial<
    Pick<Lesson, "title" | "contentType" | "contentRef" | "durationMinutes">
  > = {};

  if (body.title !== undefined) {
    if (!body.title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    updates.title = body.title.trim();
  }

  if (body.contentType !== undefined) {
    if (!isLessonContentType(body.contentType)) {
      return NextResponse.json({ error: "Unknown lesson type." }, { status: 400 });
    }
    updates.contentType = body.contentType;
  }

  if (body.durationMinutes !== undefined) {
    const duration = parseDurationMinutes(body.durationMinutes);
    if (!duration.ok) {
      return NextResponse.json({ error: duration.error }, { status: 400 });
    }
    updates.durationMinutes = duration.value;
  }

  if (body.contentRef !== undefined) {
    if (typeof body.contentRef !== "string") {
      return NextResponse.json({ error: "Content is invalid." }, { status: 400 });
    }
    updates.contentRef = body.contentRef.trim();
  }

  const nextType = updates.contentType ?? existing.contentType;
  const nextRef =
    updates.contentRef !== undefined ? updates.contentRef : existing.contentRef;
  const contentError = validateContentRef(nextType, nextRef);
  if (contentError) {
    return NextResponse.json({ error: contentError }, { status: 400 });
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const lesson = await updateLesson(lessonId, updates);
  return NextResponse.json(lesson);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, moduleId, lessonId } = await context.params;
  const existing = await requireOwnedLesson(id, moduleId, lessonId, session.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteLesson(moduleId, lessonId);
  return NextResponse.json({ ok: true });
}
