import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Circle, Minus } from "lucide-react";
import { AdminReviewForm } from "@/components/AdminReviewForm";
import { AppShell } from "@/components/AppShell";
import { requireRole } from "@/lib/auth";
import { getCourseWithContent, getUserById } from "@/lib/db";
import { adminNav } from "@/lib/nav";
import { coursePublishChecklist } from "@/lib/publishChecklist";

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminCourseReviewDetailPage({ params }: PageProps) {
  const session = await requireRole(["admin"]);
  const { id } = await params;
  const course = await getCourseWithContent(id);
  if (!course || course.status !== "draft" || course.reviewStatus !== "submitted") {
    notFound();
  }

  const instructor = await getUserById(course.instructorId);
  const checklist = coursePublishChecklist(course);
  const instructorName = instructor
    ? `${instructor.firstName} ${instructor.lastName}`
    : "Unknown instructor";

  return (
    <AppShell
      user={session}
      title={course.title}
      subtitle={`Submitted by ${instructorName}. Approving publishes it.`}
      nav={adminNav}
      actions={
        <Link href="/admin/courses" className="btn btn-secondary">
          <ArrowLeft aria-hidden="true" size={16} />
          Review queue
        </Link>
      }
    >
      <div className="space-y-6">
        <section aria-labelledby="checklist-title" className="card p-5">
          <h2 id="checklist-title" className="section-title">
            Checklist
          </h2>
          <ul className="mt-3 space-y-2.5">
            {checklist.items.map((item) => (
              <li key={item.id} className="flex gap-2.5">
                <span
                  className={
                    item.done
                      ? "mt-0.5 text-success"
                      : item.required
                        ? "mt-0.5 text-warn"
                        : "mt-0.5 text-muted"
                  }
                >
                  {item.done ? (
                    <Check aria-hidden="true" size={16} />
                  ) : item.required ? (
                    <Circle aria-hidden="true" size={16} />
                  ) : (
                    <Minus aria-hidden="true" size={16} />
                  )}
                </span>
                <div>
                  <p className="text-sm">{item.label}</p>
                  {item.detail && !item.done ? (
                    <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="content-title" className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 id="content-title" className="section-title">
              Modules and lessons
            </h2>
          </div>
          {course.modules.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted">No modules yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {course.modules.map((courseModule) => (
                <li key={courseModule.id} className="px-5 py-4">
                  <p className="text-sm font-medium">{courseModule.title}</p>
                  {courseModule.lessons.length === 0 ? (
                    <p className="mt-1 text-sm text-muted">No lessons.</p>
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {courseModule.lessons.map((lesson) => (
                        <li key={lesson.id} className="text-sm text-muted">
                          {lesson.title || "Untitled lesson"} · {lesson.contentType}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <AdminReviewForm courseId={course.id} />
      </div>
    </AppShell>
  );
}
