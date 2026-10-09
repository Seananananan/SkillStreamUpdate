import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import {
  decideCourseReview,
  submitCourseForReview,
  withdrawCourseReview,
} from "@/lib/db";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    feedback?: string;
  };

  if (session.role === "instructor") {
    const result =
      body.action === "submit"
        ? await submitCourseForReview(session.id, id)
        : body.action === "withdraw"
          ? await withdrawCourseReview(session.id, id)
          : null;
    if (!result) {
      return NextResponse.json({ error: "Unsupported review action." }, { status: 400 });
    }
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ course: result.course });
  }

  if (session.role === "admin") {
    if (body.action !== "approve" && body.action !== "return") {
      return NextResponse.json({ error: "Unsupported review action." }, { status: 400 });
    }
    const result = await decideCourseReview(id, body.action, body.feedback);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ course: result.course });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
