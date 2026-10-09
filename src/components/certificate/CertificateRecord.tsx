import type { CertificateVerificationStatus } from "@/lib/types";
import { formatIssuedDate } from "@/lib/certificates";

export function CertificateRecord({
  studentName,
  courseTitle,
  issuedAt,
  referenceNumber,
  status,
}: {
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  referenceNumber: string;
  status: CertificateVerificationStatus;
}) {
  const revoked = status === "revoked";

  return (
    <article className="card overflow-hidden">
      <div
        className={`h-1 ${revoked ? "bg-line-strong" : "bg-brand"}`}
        aria-hidden="true"
      />
      <div className="px-6 py-10 text-center sm:px-12 sm:py-12">
        <p className="text-sm font-semibold text-brand">Skillstream Academy</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] sm:text-[1.75rem]">
          Certificate of completion
        </h2>
        <p className="mt-8 text-sm text-muted">This certifies that</p>
        <p className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.03em] sm:text-3xl">
          {studentName}
        </p>
        <p className="mt-6 text-sm text-muted">has completed</p>
        <p className="mx-auto mt-2 max-w-xl text-lg font-medium leading-snug">
          {courseTitle}
        </p>
      </div>
      <dl className="grid gap-4 border-t border-line bg-subtle px-6 py-5 sm:grid-cols-3 sm:px-12">
        <div className="text-center sm:text-left">
          <dt className="text-xs font-semibold text-muted">Issued</dt>
          <dd className="mt-1 text-sm tabular-nums">
            {formatIssuedDate(issuedAt)}
          </dd>
        </div>
        <div className="text-center">
          <dt className="text-xs font-semibold text-muted">Status</dt>
          <dd
            className={`mt-1 text-sm font-semibold ${
              revoked ? "text-danger" : "text-success"
            }`}
          >
            {revoked ? "Revoked" : "Valid"}
          </dd>
        </div>
        <div className="text-center sm:text-right">
          <dt className="text-xs font-semibold text-muted">Reference</dt>
          <dd className="mt-1 font-mono text-sm tracking-wide">
            {referenceNumber}
          </dd>
        </div>
      </dl>
    </article>
  );
}
