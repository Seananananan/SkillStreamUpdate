import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CourseDetailsForm } from "@/components/CourseDetailsForm";
import { CoursePublishControl } from "@/components/CoursePublishControl";
import { ReviewBadge, StatusBadge } from "@/components/StatusBadge";
import { requireRole } from "@/lib/auth";
import { instructorNav } from "@/lib/nav";
import { getCourseWithContent, listEnrollments } from "@/lib/db";
import { coursePublishChecklist } from "@/lib/publishChecklist";

type PageProps = { params: Promise<{ id: string }> };

export default async function InstructorCourseDetailPage({ params }: PageProps) {
  const session = await requireRole(["instructor"]);
  const { id } = await params;
  const course = await getCourseWithContent(id);

  if (!course || course.instructorId !== session.id) {
    notFound();
  }

  const lessonCount = course.modules.reduce(
    (total, module) => total + module.lessons.length,
    0,
  );
  const enrollments = await listEnrollments({ courseId: course.id });

  return (
    <AppShell
      user={session}
      title={course.title}
      subtitle={course.description || "No description yet."}
      nav={instructorNav}
      actions={
        <span className="flex flex-wrap items-center gap-2">
          <StatusBadge status={course.status} />
          <ReviewBadge status={course.reviewStatus} />
        </span>
      }
    >
      <div className="space-y-6">
        <section
          aria-label="Course summary"
          className="card grid divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0"
        >
          <div className="px-5 py-4">
            <p className="text-sm text-muted">Modules</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {course.modules.length}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-muted">Lessons</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {lessonCount}
            </p>
          </div>
          <div className="px-5 py-4">
            <p className="text-sm text-muted">Enrolled</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {enrollments.length}
            </p>
          </div>
        </section>

        <section aria-labelledby="manage-title" className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 id="manage-title" className="section-title">
              Manage
            </h2>
          </div>
          <div className="divide-y divide-line">
            <Link
              href={`/instructor/courses/${course.id}/modules`}
              className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-subtle"
            >
              <div>
                <p className="text-sm font-medium">Modules and lessons</p>
                <p className="mt-0.5 text-sm text-muted">
                  {course.modules.length === 0
                    ? "No content yet — add the first module."
                    : `${course.modules.length} module${course.modules.length === 1 ? "" : "s"}, ${lessonCount} lesson${lessonCount === 1 ? "" : "s"}.`}
                </p>
              </div>
              <ChevronRight
                aria-hidden="true"
                size={17}
                className="shrink-0 text-muted group-hover:text-brand"
              />
            </Link>

            <Link
              href={`/instructor/courses/${course.id}/roster`}
              className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-subtle"
            >
              <div>
                <p className="text-sm font-medium">Roster and progress</p>
                <p className="mt-0.5 text-sm text-muted">
                  {enrollments.length === 0
                    ? "No students enrolled yet."
                    : `${enrollments.length} student${enrollments.length === 1 ? "" : "s"} enrolled.`}
                </p>
              </div>
              <ChevronRight
                aria-hidden="true"
                size={17}
                className="shrink-0 text-muted group-hover:text-brand"
              />
            </Link>
          </div>
        </section>

        <CourseDetailsForm
          courseId={course.id}
          title={course.title}
          description={course.description}
          enrolledCount={enrollments.length}
        />

        <CoursePublishControl
          courseId={course.id}
          status={course.status}
          reviewStatus={course.reviewStatus}
          reviewFeedback={course.reviewFeedback}
          checklist={coursePublishChecklist(course)}
          modulesHref={`/instructor/courses/${course.id}/modules`}
          enrolledCount={enrollments.length}
        />
      </div>
    </AppShell>
  );
}
