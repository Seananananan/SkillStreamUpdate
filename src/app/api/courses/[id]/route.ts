import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  deleteCourse,
  getCourseById,
  getCourseWithContent,
  getEnrollmentByStudentAndCourse,
  updateCourse,
} from "@/lib/db";
import type { CourseStatus } from "@/lib/types";

type RouteContext = { params: Promise<{ id: string }> };

async function canAccessCourse(
  courseId: string,
  role: string,
  userId: string,
) {
  const course = await getCourseById(courseId);
  if (!course) return { allowed: false as const, course: null };

  if (role === "admin") return { allowed: true as const, course };
  if (role === "instructor" && course.instructorId === userId) {
    return { allowed: true as const, course };
  }
  if (role === "student") {
    if (course.status === "published") {
      return { allowed: true as const, course };
    }
    const enrollment = await getEnrollmentByStudentAndCourse(userId, courseId);
    if (enrollment) {
      return { allowed: true as const, course };
    }
  }

  return { allowed: false as const, course };
}

function isCourseStatus(value: unknown): value is CourseStatus {
  return value === "draft" || value === "published" || value === "archived";
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const access = await canAccessCourse(id, session.role, session.id);
  if (!access.allowed || !access.course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const withContent = await getCourseWithContent(id);
  return NextResponse.json(withContent);
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const access = await canAccessCourse(id, session.role, session.id);
  if (!access.allowed || !access.course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    status?: CourseStatus;
  };

  const updates: Parameters<typeof updateCourse>[1] = {};

  if (body.title !== undefined) {
    if (!body.title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    updates.title = body.title.trim();
  }
  if (body.description !== undefined) {
    updates.description = body.description.trim();
  }
  if (body.status !== undefined) {
    if (!isCourseStatus(body.status)) {
      return NextResponse.json({ error: "Invalid course status." }, { status: 400 });
    }
    if (body.status === "published") {
      return NextResponse.json(
        { error: "An admin publishes a course after review." },
        { status: 403 },
      );
    }
    updates.status = body.status;
    if (body.status === "draft" || body.status === "archived") {
      updates.reviewStatus = "none";
      updates.reviewFeedback = null;
      updates.submittedAt = null;
    }
  }

  const course = await updateCourse(id, updates);

  return NextResponse.json(course);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const access = await canAccessCourse(id, session.role, session.id);
  if (!access.allowed || !access.course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const result = await deleteCourse(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
