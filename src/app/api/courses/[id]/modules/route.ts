import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createModule, getCourseById, listModulesByCourse } from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const course = await getCourseById(id);
  if (!course) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    session.role === "instructor" &&
    course.instructorId !== session.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const modules = await listModulesByCourse(id);
  return NextResponse.json(modules);
}

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const course = await getCourseById(id);
  if (!course || course.instructorId !== session.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as { title?: string };
  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  const existing = await listModulesByCourse(id);
  const courseModule = await createModule({
    courseId: id,
    title: body.title.trim(),
    sequenceOrder: existing.length + 1,
  });

  return NextResponse.json(courseModule, { status: 201 });
}
