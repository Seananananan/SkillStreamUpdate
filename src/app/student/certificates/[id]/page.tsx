import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CertificateRecord } from "@/components/certificate/CertificateRecord";
import { CopyReferenceButton } from "@/components/certificate/CopyReferenceButton";
import { requireRole } from "@/lib/auth";
import { getStudentCertificate } from "@/lib/db";
import { studentNav } from "@/lib/nav";

type PageProps = { params: Promise<{ id: string }> };

export default async function StudentCertificateDetailPage({
  params,
}: PageProps) {
  const session = await requireRole(["student"]);
  const { id } = await params;
  const record = await getStudentCertificate(session.id, id);

  if (!record) {
    notFound();
  }

  const { certificate, course } = record;
  const studentName = `${session.firstName} ${session.lastName}`;

  return (
    <AppShell
      user={session}
      title="Certificate"
      subtitle={
        certificate.verificationStatus === "revoked"
          ? "This credential was revoked. Public lookup still finds the reference."
          : "Share the reference number. Anyone can confirm this credential without signing in."
      }
      nav={studentNav}
      actions={
        <Link href="/student/certificates" className="btn btn-secondary">
          <ArrowLeft aria-hidden="true" size={16} />
          All certificates
        </Link>
      }
    >
      <div className="mx-auto max-w-3xl">
        {certificate.verificationStatus === "revoked" ? (
          <p
            role="alert"
            className="mb-6 rounded-lg bg-danger-soft px-3 py-2 text-center text-sm text-danger"
          >
            This certificate was revoked. The public page still finds the
            reference and shows it as revoked.
          </p>
        ) : null}

        <CertificateRecord
          studentName={studentName}
          courseTitle={course.title}
          issuedAt={certificate.issuedAt}
          referenceNumber={certificate.referenceNumber}
          status={certificate.verificationStatus}
        />

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <CopyReferenceButton referenceNumber={certificate.referenceNumber} />
          <a href={certificate.fileUrl} className="btn btn-primary">
            Download PDF
          </a>
          <Link
            href={`/verify/${certificate.referenceNumber}`}
            className="btn btn-secondary"
          >
            Open public verification
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
