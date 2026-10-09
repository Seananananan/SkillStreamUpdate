import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { revokeCertificate } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string; enrollmentId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, enrollmentId } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    verificationStatus?: string;
  };

  if (body.verificationStatus !== "revoked") {
    return NextResponse.json(
      { error: "Only revoking a certificate is supported." },
      { status: 400 },
    );
  }

  const result = await revokeCertificate(session.id, id, enrollmentId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ certificate: result.certificate });
}
