import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createDraftCourseFromOutline } from "@/lib/db";
import { draftCourseFromPdfText, textFromPdf } from "@/lib/pdfCourse";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PDF_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "instructor") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a PDF first." }, { status: 400 });
  }

  const name = file.name.toLowerCase();
  if (!name.endsWith(".pdf") && file.type !== "application/pdf") {
    return NextResponse.json({ error: "Choose a PDF file." }, { status: 400 });
  }
  if (file.size > MAX_PDF_BYTES) {
    return NextResponse.json({ error: "Use a PDF under 8 MB." }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let source = "";
  try {
    source = await textFromPdf(bytes);
  } catch {
    return NextResponse.json(
      { error: "That PDF could not be read. Use a PDF with selectable text." },
      { status: 400 },
    );
  }

  if (source.length < 40) {
    return NextResponse.json(
      { error: "This PDF has no readable text. Use a PDF with selectable text, not a scan." },
      { status: 400 },
    );
  }

  const drafted = await draftCourseFromPdfText(source);
  if (!drafted.ok) {
    return NextResponse.json({ error: drafted.error }, { status: 502 });
  }

  const course = await createDraftCourseFromOutline(session.id, drafted.outline);
  return NextResponse.json({ id: course.id }, { status: 201 });
}
