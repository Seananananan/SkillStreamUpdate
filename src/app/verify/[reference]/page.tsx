import Link from "next/link";
import { PublicShell } from "@/components/landing/PublicShell";
import { CertificateRecord } from "@/components/certificate/CertificateRecord";
import { VerifyForm } from "@/components/certificate/VerifyForm";
import { getPublicCertificate } from "@/lib/db";
import { normalizeReference } from "@/lib/certificates";

type PageProps = { params: Promise<{ reference: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { reference } = await params;
  const record = await getPublicCertificate(decodeURIComponent(reference));
  if (!record) {
    return { title: "Certificate not found" };
  }
  return { title: `Certificate ${record.certificate.referenceNumber}` };
}

export default async function VerifyCertificatePage({ params }: PageProps) {
  const { reference } = await params;
  const lookup = normalizeReference(decodeURIComponent(reference));
  const record = await getPublicCertificate(lookup);

  return (
    <PublicShell active="verify">
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-10 sm:px-7"
      >
        {record ? (
          <>
            <h1 className="page-title text-center">
              {record.certificate.verificationStatus === "revoked"
                ? "This certificate was revoked"
                : "Certificate verified"}
            </h1>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-6 text-muted">
              Issued by Skillstream Academy. The reference on this page is the
              record. The PDF is a copy of it.
            </p>
            <div className="mt-8">
              <CertificateRecord
                studentName={record.studentName}
                courseTitle={record.courseTitle}
                issuedAt={record.issuedAt}
                referenceNumber={record.certificate.referenceNumber}
                status={record.certificate.verificationStatus}
              />
            </div>
            <p className="mt-6 text-center">
              <a href={record.certificate.fileUrl} className="btn btn-primary">
                Download PDF
              </a>
            </p>
          </>
        ) : (
          <>
            <h1 className="page-title text-center">No matching certificate</h1>
            <p className="mx-auto mt-2 max-w-xl text-center text-sm leading-6 text-muted">
              Nothing in the registry matches that reference. Check the
              characters and try again.
            </p>
          </>
        )}

        <div className="mx-auto mt-10 w-full max-w-[28rem]">
          <p className="section-title">Check another</p>
          <div className="mt-3">
            <VerifyForm
              defaultValue={lookup}
              error={
                record
                  ? undefined
                  : "No certificate matches that reference."
              }
            />
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/" className="font-semibold text-brand hover:text-brand-strong">
            Back to home
          </Link>
        </p>
      </main>
    </PublicShell>
  );
}
