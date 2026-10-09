import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EnrollmentBadge } from "@/components/EnrollmentBadge";
import { requireRole } from "@/lib/auth";
import { getCourseById, listRosterByCourse } from "@/lib/db";
import { instructorNav } from "@/lib/nav";
import { formatLastActivity, formatShortDate } from "@/lib/roster";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ attention?: string }>;
};

export default async function CourseRosterPage({
  params,
  searchParams,
}: PageProps) {
  const session = await requireRole(["instructor"]);
  const { id } = await params;
  const { attention } = await searchParams;
  const course = await getCourseById(id);

  if (!course || course.instructorId !== session.id) {
    notFound();
  }

  const roster = await listRosterByCourse(course.id);
  const attentionOnly = attention === "1";
  const attentionCount = roster.filter((row) => row.needsAttention).length;
  const visible = attentionOnly
    ? roster.filter((row) => row.needsAttention)
    : roster;
  const rosterHref = `/instructor/courses/${course.id}/roster`;

  return (
    <AppShell
      user={session}
      title="Roster and progress"
      subtitle={course.title}
      nav={instructorNav}
      actions={
        <Link
          href={`/instructor/courses/${course.id}`}
          className="btn btn-secondary"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back to course
        </Link>
      }
    >
      {roster.length === 0 ? (
        <div className="card px-5 py-10">
          <p className="text-sm font-medium">No enrollments yet</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Students who enroll in this course will appear here with their
            lesson progress.
          </p>
        </div>
      ) : (
        <section aria-labelledby="roster-title" className="card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 id="roster-title" className="section-title">
              {attentionOnly
                ? "Needs attention"
                : `${roster.length} student${roster.length === 1 ? "" : "s"}`}
            </h2>
            <nav aria-label="Filter roster" className="flex gap-4 text-sm">
              <Link
                href={rosterHref}
                aria-current={attentionOnly ? undefined : "page"}
                className={
                  attentionOnly
                    ? "text-muted hover:text-ink"
                    : "font-medium text-ink"
                }
              >
                All
              </Link>
              <Link
                href={`${rosterHref}?attention=1`}
                aria-current={attentionOnly ? "page" : undefined}
                className={
                  attentionOnly
                    ? "font-medium text-ink"
                    : "text-muted hover:text-ink"
                }
              >
                Needs attention
                {attentionCount > 0 ? ` · ${attentionCount}` : ""}
              </Link>
            </nav>
          </div>
          {visible.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted">
              No one needs attention. Active students with no lesson activity,
              or none in 7 days, show up here.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((row) => {
                const {
                  enrollment,
                  student,
                  summary,
                  certificate,
                  lastActivityAt,
                  needsAttention: flagged,
                  attentionReason,
                } = row;

                return (
                  <li key={enrollment.id}>
                    <Link
                      href={`${rosterHref}/${enrollment.id}`}
                      className="group flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-subtle"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="mt-0.5 truncate text-sm text-muted">
                          {formatLastActivity(lastActivityAt)}
                          {enrollment.completedAt
                            ? ` · completed ${formatShortDate(enrollment.completedAt)}`
                            : enrollment.enrolledAt
                              ? ` · enrolled ${formatShortDate(enrollment.enrolledAt)}`
                              : ""}
                        </p>
                        {flagged && attentionReason ? (
                          <p className="mt-1 text-sm text-warn">
                            {attentionReason}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="text-sm tabular-nums text-muted">
                          {certificate
                            ? `${certificate.referenceNumber}${
                                certificate.verificationStatus === "revoked"
                                  ? " · Revoked"
                                  : ""
                              }`
                            : `${summary.percent}% complete`}
                        </p>
                        <EnrollmentBadge status={enrollment.status} />
                        <ChevronRight
                          aria-hidden="true"
                          size={17}
                          className="shrink-0 text-muted group-hover:text-brand"
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </AppShell>
  );
}
