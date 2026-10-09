import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createCourse, listCourses } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as "draft" | "published" | "archived" | null;

  if (session.role === "instructor") {
    const courses = await listCourses({
      instructorId: session.id,
      status: status ?? undefined,
    });
    return NextResponse.json(courses);
  }

  if (session.role === "admin") {
    const courses = await listCourses({ status: status ?? undefined });
    return NextResponse.json(courses);
  }

  if (session.role === "student") {
    const courses = await listCourses({ status: "published" });
    return NextResponse.json(courses);
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    title?: string;
    description?: string;
    status?: "draft" | "published";
  };

  if (!body.title?.trim()) {
    return NextResponse.json({ error: "Title is required." }, { status: 400 });
  }

  if (body.status === "published") {
    return NextResponse.json(
      { error: "An admin publishes a course after review." },
      { status: 400 },
    );
  }

  const course = await createCourse({
    instructorId: session.id,
    title: body.title.trim(),
    description: body.description?.trim() ?? "",
    status: "draft",
  });

  return NextResponse.json(course, { status: 201 });
}
