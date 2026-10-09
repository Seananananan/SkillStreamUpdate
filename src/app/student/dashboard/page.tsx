import Link from "next/link";
import { Award, BookOpen, ClipboardCheck, Library } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CourseCover } from "@/components/dashboard/CourseCover";
import { EnrollmentBadge } from "@/components/EnrollmentBadge";
import { IntegrationFlow } from "@/components/dashboard/IntegrationFlow";
import { JourneyStepper } from "@/components/dashboard/JourneyStepper";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { StatCard } from "@/components/dashboard/StatCard";
import { studentJourneySteps } from "@/components/dashboard/constants";
import { requireRole } from "@/lib/auth";
import {
  canAccessLessons,
  courseAccessState,
  studentCourseActionLabel,
  studentCourseHref,
} from "@/lib/access";
import { listLearningForStudent, listCourses } from "@/lib/db";
import { studentNav } from "@/lib/nav";

export default async function StudentDashboardPage() {
  const session = await requireRole(["student"]);
  const [catalog, enrolled] = await Promise.all([
    listCourses({ status: "published" }),
    listLearningForStudent(session.id),
  ]);

  const enrolledCount = enrolled.length;
  const inProgressCount = enrolled.filter(
    (item) =>
      item.enrollment.status === "active" &&
      canAccessLessons(item.enrollment, item.lmsAccount),
  ).length;
  const certifiedCount = enrolled.filter((item) => item.certificate).length;
  const openCourses = catalog.filter(
    (course) => !enrolled.some((item) => item.course.id === course.id),
  );
  const hasUnfinished = enrolled.some(
    (item) =>
      item.enrollment.status !== "completed" &&
      item.enrollment.status !== "cancelled",
  );
  const continueItem =
    enrolled.find(
      (item) =>
        item.enrollment.status === "active" &&
        canAccessLessons(item.enrollment, item.lmsAccount),
    ) ??
    enrolled.find(
      (item) =>
        item.enrollment.status !== "completed" &&
        item.enrollment.status !== "cancelled",
    );
  const continueHref = continueItem
    ? studentCourseHref(continueItem.course.id, {
        accessReady: canAccessLessons(
          continueItem.enrollment,
          continueItem.lmsAccount,
        ),
        certificateId: continueItem.certificate?.id,
        nextLessonId: continueItem.summary.nextLesson?.id,
      })
    : "/student/learning";
  const journeyStep =
    enrolledCount === 0 ? "enroll" : hasUnfinished ? "learn" : "certify";

  return (
    <AppShell
      user={session}
      title={`Welcome back, ${session.firstName}`}
      subtitle="Enroll, learn, and get certified — the platform handles the steps in between."
      nav={studentNav}
      actions={
        <Link href="/student/courses" className="btn btn-primary">
          Browse catalog
        </Link>
      }
    >
      <div className="space-y-6">
        <JourneyStepper
          steps={studentJourneySteps}
          activeStepId={journeyStep}
        />

        <section
          aria-label="Your numbers"
          className="card grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          <StatCard
            label="Enrolled"
            value={enrolledCount}
            hint="Courses confirmed"
            icon={ClipboardCheck}
            tone="brand"
          />
          <StatCard
            label="In progress"
            value={inProgressCount}
            hint="Started, not finished"
            icon={BookOpen}
            tone={inProgressCount > 0 ? "brand" : "muted"}
          />
          <StatCard
            label="Certified"
            value={certifiedCount}
            hint="Credentials issued"
            icon={Award}
            tone={certifiedCount > 0 ? "success" : "muted"}
          />
        </section>

        <section aria-labelledby="next-title" className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 id="next-title" className="section-title">
              What to do next
            </h2>
          </div>
          <div className="divide-y divide-line">
            <QuickActionCard
              title="Browse the catalog"
              description="Find a published course to enroll in."
              href="/student/courses"
              icon={Library}
            />
            <QuickActionCard
              title="Continue a course"
              description="Pick up the next lesson in a course you enrolled in."
              href={continueHref}
              icon={BookOpen}
              disabled={enrolledCount === 0}
              disabledLabel="Enroll first"
            />
            <QuickActionCard
              title="View certificates"
              description="Open credentials you have earned and share a public reference."
              href="/student/certificates"
              icon={Award}
              disabled={certifiedCount === 0}
              disabledLabel="Finish a course first"
            />
          </div>
        </section>

        {enrolledCount > 0 ? (
          <section aria-labelledby="enrolled-title" className="card">
            <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h2 id="enrolled-title" className="section-title">
                Your courses
              </h2>
              <Link
                href="/student/learning"
                className="text-sm font-medium text-brand hover:text-brand-strong"
              >
                View all
              </Link>
            </div>
            <ul className="divide-y divide-line">
              {enrolled.slice(0, 3).map(
                ({ enrollment, course, summary, certificate, lmsAccount }) => {
                const accessReady = canAccessLessons(enrollment, lmsAccount);
                const href = studentCourseHref(course.id, {
                  accessReady,
                  certificateId: certificate?.id,
                  nextLessonId: summary.nextLesson?.id,
                });
                const action = studentCourseActionLabel({
                  accessReady,
                  completed: enrollment.status === "completed",
                  started: summary.completed > 0,
                  hasCertificate: Boolean(certificate),
                });

                return (
                  <li
                    key={enrollment.id}
                    className="flex items-center gap-3 px-5 py-4"
                  >
                    <CourseCover title={course.title} status={course.status} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {course.title}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {!accessReady
                          ? courseAccessState(lmsAccount) === "failed"
                            ? "Course access did not provision"
                            : "Setting up course access"
                          : certificate
                            ? certificate.referenceNumber
                            : enrollment.status === "completed"
                              ? "Course complete"
                              : `${summary.percent}% complete`}
                      </p>
                    </div>
                    <EnrollmentBadge status={enrollment.status} />
                    <Link
                      href={href}
                      className="shrink-0 text-sm font-medium text-brand hover:text-brand-strong"
                    >
                      {action}
                    </Link>
                  </li>
                );
              },
              )}
            </ul>
          </section>
        ) : null}

        <section aria-labelledby="open-courses-title" className="card">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id="open-courses-title" className="section-title">
              Open for enrollment
            </h2>
            <Link
              href="/student/courses"
              className="text-sm font-medium text-brand hover:text-brand-strong"
            >
              View all
            </Link>
          </div>

          {openCourses.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">
              {catalog.length === 0
                ? "No courses are published yet. They will appear here once an admin publishes one."
                : "You are enrolled in every published course."}
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {openCourses.slice(0, 3).map((course) => (
                <li
                  key={course.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <CourseCover title={course.title} status={course.status} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {course.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-sm text-muted">
                        {course.description || "No description yet."}
                      </p>
                    </div>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-muted">
                    Free
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <IntegrationFlow />
      </div>
    </AppShell>
  );
}
