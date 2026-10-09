import { NextResponse } from "next/server";
import { buildCertificatePdf } from "@/lib/certificatePdf";
import { getPublicCertificate } from "@/lib/db";

type RouteContext = { params: Promise<{ reference: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { reference } = await context.params;
  const record = await getPublicCertificate(decodeURIComponent(reference));
  if (!record) {
    return NextResponse.json({ error: "Certificate not found." }, { status: 404 });
  }

  const referenceNumber = record.certificate.referenceNumber;
  const verifyUrl = `${new URL(request.url).origin}/verify/${referenceNumber}`;
  const bytes = await buildCertificatePdf({
    studentName: record.studentName,
    courseTitle: record.courseTitle,
    issuedAt: record.issuedAt,
    referenceNumber,
    status: record.certificate.verificationStatus,
    verifyUrl,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${referenceNumber}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
