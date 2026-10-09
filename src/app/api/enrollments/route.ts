import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { enrollStudent, listEnrollmentsWithCourses } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const enrollments = await listEnrollmentsWithCourses(session.id);
  return NextResponse.json(enrollments);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "student") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as { courseId?: string };
  if (!body.courseId) {
    return NextResponse.json({ error: "Course is required." }, { status: 400 });
  }

  const result = await enrollStudent(session.id, body.courseId);

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error, enrollment: result.enrollment },
      { status: result.status },
    );
  }

  return NextResponse.json(
    { enrollment: result.enrollment, lmsAccount: result.lmsAccount },
    { status: 201 },
  );
}
