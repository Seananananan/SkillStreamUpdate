import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ReviewBadge, StatusBadge } from "@/components/StatusBadge";
import { requireRole } from "@/lib/auth";
import { listCourses } from "@/lib/db";
import { instructorNav } from "@/lib/nav";

export default async function InstructorCoursesPage() {
  const session = await requireRole(["instructor"]);
  const courses = await listCourses({ instructorId: session.id });

  return (
    <AppShell
      user={session}
      title="My courses"
      subtitle="Drafts stay private until an admin publishes them. Archived courses stay in your library, and enrollments stay intact."
      nav={instructorNav}
      actions={
        <div className="flex flex-wrap gap-2">
          <Link href="/instructor/courses/from-pdf" className="btn btn-secondary">
            <FileText aria-hidden="true" size={16} />
            Create from PDF
          </Link>
          <Link href="/instructor/courses/new" className="btn btn-primary">
            <Plus aria-hidden="true" size={16} />
            New course
          </Link>
        </div>
      }
    >
      {courses.length === 0 ? (
        <div className="card px-5 py-10">
          <p className="text-sm font-medium">No courses yet</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Start with a title and description. You can add modules and
            lessons, then submit it for review.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/instructor/courses/new" className="btn btn-primary">
              <Plus aria-hidden="true" size={16} />
              Create a course
            </Link>
            <Link href="/instructor/courses/from-pdf" className="btn btn-secondary">
              <FileText aria-hidden="true" size={16} />
              Create from PDF
            </Link>
          </div>
        </div>
      ) : (
        <section aria-labelledby="library-title" className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 id="library-title" className="section-title">
              {courses.length} course{courses.length === 1 ? "" : "s"}
            </h2>
          </div>

          <ul className="divide-y divide-line">
            {courses.map((course) => (
              <li key={course.id}>
                <Link
                  href={`/instructor/courses/${course.id}`}
                  className="grid gap-2 px-5 py-4 hover:bg-subtle sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate text-sm font-medium">
                        {course.title}
                      </h3>
                      <StatusBadge status={course.status} />
                      <ReviewBadge status={course.reviewStatus} />
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-sm text-muted">
                      {course.description || "No description yet."}
                    </p>
                  </div>
                  <p className="text-sm text-muted sm:text-right">
                    Updated{" "}
                    {new Date(course.updatedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}
