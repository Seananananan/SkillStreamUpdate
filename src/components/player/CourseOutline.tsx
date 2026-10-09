import Link from "next/link";
import { Check } from "lucide-react";
import type { CourseModule, Lesson, LessonProgress } from "@/lib/types";
import { contentTypeLabels, getLessonProgressStatus } from "@/lib/player";

export function CourseOutline({
  courseId,
  modules,
  progress,
  currentLessonId,
  locked = false,
}: {
  courseId: string;
  modules: Array<CourseModule & { lessons: Lesson[] }>;
  progress: LessonProgress[];
  currentLessonId?: string;
  locked?: boolean;
}) {
  return (
    <nav aria-label="Course outline" className="card overflow-hidden">
      <div className="border-b border-line px-4 py-3">
        <p className="section-title">Outline</p>
      </div>
      {modules.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">No modules yet.</p>
      ) : (
        <ol className="divide-y divide-line">
          {modules.map((courseModule, moduleIndex) => (
            <li key={courseModule.id} className="px-4 py-3">
              <p className="text-xs font-medium tracking-wide text-muted uppercase">
                {moduleIndex + 1}. {courseModule.title}
              </p>
              {courseModule.lessons.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No lessons in this module.</p>
              ) : (
                <ol className="mt-2 space-y-0.5">
                  {courseModule.lessons.map((lesson) => {
                    const status = getLessonProgressStatus(progress, lesson.id);
                    const current = lesson.id === currentLessonId;
                    const itemClass = `flex items-start gap-2 rounded-md px-2 py-1.5 text-sm ${
                      current
                        ? "bg-brand-soft font-medium text-brand-strong"
                        : locked
                          ? "text-muted"
                          : "text-ink hover:bg-subtle"
                    }`;
                    const itemBody = (
                      <>
                        <span
                          className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${
                            status === "completed"
                              ? "bg-success text-white"
                              : status === "in_progress"
                                ? "border border-brand bg-brand-soft"
                                : "border border-line-strong"
                          }`}
                          aria-hidden="true"
                        >
                          {status === "completed" ? (
                            <Check size={10} strokeWidth={3} />
                          ) : null}
                        </span>
                        <span className="min-w-0">
                          <span className="sr-only">
                            {locked
                              ? "Locked. "
                              : status === "completed"
                                ? "Completed. "
                                : status === "in_progress"
                                  ? "In progress. "
                                  : "Not started. "}
                          </span>
                          <span className="block leading-5">{lesson.title}</span>
                          <span className="mt-0.5 block text-xs font-normal text-muted">
                            {contentTypeLabels[lesson.contentType]}
                            {lesson.durationMinutes
                              ? ` · ${lesson.durationMinutes} min`
                              : ""}
                          </span>
                        </span>
                      </>
                    );

                    return (
                      <li key={lesson.id}>
                        {locked ? (
                          <span className={itemClass}>{itemBody}</span>
                        ) : (
                          <Link
                            href={`/student/learning/${courseId}/lessons/${lesson.id}`}
                            aria-current={current ? "page" : undefined}
                            className={itemClass}
                          >
                            {itemBody}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
