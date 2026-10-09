import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getUserById, listCoursesForReview } from "@/lib/db";
import { adminNav } from "@/lib/nav";

export default async function AdminCourseReviewPage() {
  const session = await requireRole(["admin"]);
  const courses = await listCoursesForReview();
  const instructors = await Promise.all(
    courses.map((course) => getUserById(course.instructorId)),
  );

  return (
    <AppShell
      user={session}
      title="Course review"
      subtitle="Drafts waiting for a decision. Approving publishes the course."
      nav={adminNav}
    >
      {courses.length === 0 ? (
        <div className="card px-5 py-10">
          <p className="text-sm font-medium">Nothing is waiting</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            When an instructor submits a draft, it appears here.
          </p>
        </div>
      ) : (
        <section aria-labelledby="queue-title" className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 id="queue-title" className="section-title">
              {courses.length} waiting
            </h2>
          </div>
          <ul className="divide-y divide-line">
            {courses.map((course, index) => {
              const instructor = instructors[index];
              const name = instructor
                ? `${instructor.firstName} ${instructor.lastName}`
                : "Unknown instructor";
              return (
                <li key={course.id}>
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="grid gap-1 px-5 py-4 hover:bg-subtle sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{course.title}</p>
                      <p className="mt-0.5 text-sm text-muted">{name}</p>
                    </div>
                    <p className="text-sm text-muted sm:text-right">
                      {course.submittedAt
                        ? new Date(course.submittedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Submitted"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
