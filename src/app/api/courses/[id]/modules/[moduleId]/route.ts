import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  deleteModule,
  getCourseById,
  listModulesByCourse,
  moveModule,
  updateModule,
} from "@/lib/db";

type RouteContext = { params: Promise<{ id: string; moduleId: string }> };

async function requireOwnedModule(
  courseId: string,
  moduleId: string,
  instructorId: string,
) {
  const course = await getCourseById(courseId);
  if (!course || course.instructorId !== instructorId) return null;

  const modules = await listModulesByCourse(courseId);
  return modules.find((courseModule) => courseModule.id === moduleId) ?? null;
}

export async function PUT(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, moduleId } = await context.params;
  const existing = await requireOwnedModule(id, moduleId, session.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await request.json()) as {
    title?: string;
    direction?: "up" | "down";
  };

  if (body.direction === "up" || body.direction === "down") {
    const modules = await moveModule(id, moduleId, body.direction);
    return NextResponse.json(modules);
  }

  if (body.title !== undefined) {
    if (!body.title.trim()) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    const courseModule = await updateModule(moduleId, {
      title: body.title.trim(),
    });
    return NextResponse.json(courseModule);
  }

  return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, moduleId } = await context.params;
  const existing = await requireOwnedModule(id, moduleId, session.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await deleteModule(id, moduleId);
  return NextResponse.json({ ok: true });
}
