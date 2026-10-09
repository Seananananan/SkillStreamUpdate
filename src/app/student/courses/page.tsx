import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { CourseCover } from "@/components/dashboard/CourseCover";
import { EnrollButton } from "@/components/EnrollButton";
import { requireRole } from "@/lib/auth";
import { courseAccessState } from "@/lib/access";
import { listCourses, listLearningForStudent } from "@/lib/db";
import { studentNav } from "@/lib/nav";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

function matchesTitle(title: string, query: string) {
  return title.toLowerCase().includes(query.toLowerCase());
}

export default async function StudentCoursesPage({ searchParams }: PageProps) {
  const session = await requireRole(["student"]);
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const [courses, enrolled] = await Promise.all([
    listCourses({ status: "published" }),
    listLearningForStudent(session.id),
  ]);
  const enrolledByCourse = new Map(
    enrolled.map((item) => [item.course.id, item]),
  );
  const visible = query
    ? courses.filter((course) => matchesTitle(course.title, query))
    : courses;
  const heading = query
    ? visible.length === 0
      ? `No courses match “${query}”`
      : `${visible.length} of ${courses.length} matching “${query}”`
    : `${courses.length} course${courses.length === 1 ? "" : "s"}`;

  return (
    <AppShell
      user={session}
      title="Course catalog"
      subtitle="All courses are free. Confirm a place; access is set up after you enroll."
      nav={studentNav}
      actions={
        courses.length === 0 ? undefined : (
          <>
            <form
              action="/student/courses"
              method="get"
              role="search"
              className="flex min-w-0 flex-1 items-center gap-2 sm:w-[24rem] sm:flex-none"
            >
              <label className="sr-only" htmlFor="catalog-q">
                Search by title
              </label>
              <input
                id="catalog-q"
                name="q"
                type="search"
                defaultValue={query}
                placeholder="Search by title"
                className="field min-w-0 flex-1"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-secondary shrink-0">
                Search
              </button>
            </form>
            {query ? (
              <Link href="/student/courses" className="btn btn-quiet shrink-0">
                Clear
              </Link>
            ) : null}
          </>
        )
      }
    >
      {courses.length === 0 ? (
        <div className="card px-5 py-10">
          <p className="text-sm font-medium">Nothing is open for enrollment</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            An admin publishes a course after review. Published courses show
            up here.
          </p>
        </div>
      ) : (
        <section aria-labelledby="catalog-title" className="card">
          <h2 id="catalog-title" className="sr-only">
            {heading}
          </h2>

          {visible.length === 0 ? (
            <p className="px-5 py-10 text-sm text-muted">
              Nothing in the catalog uses that title. Clear the search to see
              every published course.
            </p>
          ) : (
            <ul className="divide-y divide-line">
              {visible.map((course) => (
                <li
                  key={course.id}
                  className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start"
                >
                  <div className="flex min-w-0 gap-3">
                    <CourseCover title={course.title} status={course.status} />
                    <div className="min-w-0">
                      <h3 className="text-base font-medium">{course.title}</h3>
                      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted">
                        {course.description || "No description yet."}
                      </p>
                      <p className="mt-2 text-xs text-muted">
                        Self-paced · access after enrollment
                      </p>
                    </div>
                  </div>

                  <div className="sm:w-48">
                    <p className="text-sm font-medium sm:text-right">Free</p>
                    <div className="mt-2">
                      <EnrollButton
                        courseId={course.id}
                        courseTitle={course.title}
                        enrolled={enrolledByCourse.has(course.id)}
                        accessState={courseAccessState(
                          enrolledByCourse.get(course.id)?.lmsAccount,
                        )}
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </AppShell>
  );
}
