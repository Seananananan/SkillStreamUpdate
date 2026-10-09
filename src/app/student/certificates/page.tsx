import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CourseCover } from "@/components/dashboard/CourseCover";
import { requireRole } from "@/lib/auth";
import { formatIssuedDate } from "@/lib/certificates";
import { listCertificatesForStudent } from "@/lib/db";
import { studentNav } from "@/lib/nav";

export default async function StudentCertificatesPage() {
  const session = await requireRole(["student"]);
  const records = await listCertificatesForStudent(session.id);

  return (
    <AppShell
      user={session}
      title="Certificates"
      subtitle="Credentials issued when you finish a course. Share a valid reference so others can verify it."
      nav={studentNav}
    >
      {records.length === 0 ? (
        <div className="card px-5 py-10">
          <p className="text-sm font-medium">No certificates yet</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Complete every lesson in a course to issue a certificate. It appears
            here as soon as the last lesson is marked complete.
          </p>
          <Link href="/student/learning" className="btn btn-primary mt-4">
            Go to my courses
          </Link>
        </div>
      ) : (
        <section aria-labelledby="certs-title" className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 id="certs-title" className="section-title">
              {records.length} certificate{records.length === 1 ? "" : "s"}
            </h2>
          </div>
          <ul className="divide-y divide-line">
            {records.map(({ certificate, course }) => (
              <li
                key={certificate.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
              >
                <CourseCover title={course.title} status={course.status} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{course.title}</p>
                  <p className="mt-0.5 font-mono text-sm text-muted">
                    {certificate.referenceNumber}
                  </p>
                  <p className="mt-0.5 text-sm text-muted">
                    Issued {formatIssuedDate(certificate.issuedAt)}
                    {certificate.verificationStatus === "revoked"
                      ? " · Revoked"
                      : ""}
                  </p>
                </div>
                <Link
                  href={`/student/certificates/${certificate.id}`}
                  className="btn btn-secondary shrink-0"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
