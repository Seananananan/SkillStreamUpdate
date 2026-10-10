"use client";

import { useMemo, useState } from "react";
import { Check, ExternalLink, Play } from "lucide-react";
import {
  contentTypeLabels,
  isHttpUrl,
  parseQuizConfig,
  youtubeEmbedSrc,
} from "@/lib/lessonContent";
import type { CourseModule, Lesson } from "@/lib/types";

type ReviewModule = CourseModule & { lessons: Lesson[] };

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function VideoPreview({ lesson }: { lesson: Lesson }) {
  const url = lesson.contentRef.trim();
  const embed = url ? youtubeEmbedSrc(url) : null;

  if (embed) {
    return (
      <div className="space-y-3">
        <div className="overflow-hidden rounded-lg border border-line bg-ink">
          <iframe
            title={lesson.title}
            src={embed}
            className="aspect-video w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-strong"
        >
          Open source URL
          <ExternalLink aria-hidden="true" size={14} />
        </a>
      </div>
    );
  }

  if (url && isHttpUrl(url)) {
    return (
      <div className="overflow-hidden rounded-lg border border-line bg-ink text-white">
        <div className="relative aspect-video">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,#115e59,transparent_55%),linear-gradient(160deg,#0f172a,#134e4a)]" />
          <div className="relative flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="grid size-14 place-items-center rounded-full bg-white/15">
              <Play aria-hidden="true" size={22} fill="currentColor" />
            </span>
            <p className="text-sm font-medium">{lesson.title}</p>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink"
            >
              Open video
              <ExternalLink aria-hidden="true" size={14} />
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <p className="text-sm leading-6 text-muted">No video URL is set for this lesson.</p>
  );
}

function ReadingPreview({ text, empty }: { text: string; empty: string }) {
  const body = paragraphs(text);
  if (body.length === 0) {
    return <p className="text-sm leading-6 text-muted">{empty}</p>;
  }

  return (
    <div className="space-y-4 text-sm leading-6 text-ink">
      {body.map((paragraph, index) => (
        <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>
      ))}
    </div>
  );
}

function QuizPreview({ lesson }: { lesson: Lesson }) {
  const quiz = parseQuizConfig(lesson.contentRef);
  if (quiz.questions.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted">No questions are set for this quiz.</p>
    );
  }

  return (
    <ol className="space-y-4">
      {quiz.questions.map((question, questionIndex) => (
        <li key={`${lesson.id}-q-${questionIndex}`} className="card px-4 py-4">
          <p className="text-sm font-medium">
            {questionIndex + 1}. {question.prompt || "Untitled question"}
          </p>
          {question.choices.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {question.choices.map((choice, choiceIndex) => {
                const correct = choiceIndex === question.correctIndex;
                return (
                  <li
                    key={`${lesson.id}-q-${questionIndex}-c-${choiceIndex}`}
                    className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-sm ${
                      correct ? "bg-brand-soft text-brand-strong" : "text-ink"
                    }`}
                  >
                    <span className="mt-0.5 grid size-4 shrink-0 place-items-center" aria-hidden="true">
                      {correct ? <Check size={14} strokeWidth={3} /> : null}
                    </span>
                    <span>
                      {choice || "Empty choice"}
                      {correct ? <span className="sr-only"> Correct answer.</span> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted">No choices were added.</p>
          )}
          {question.correctIndex == null ? (
            <p className="mt-3 text-sm text-warn">No correct answer is marked.</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function LessonPreview({
  lesson,
  moduleTitle,
}: {
  lesson: Lesson;
  moduleTitle: string;
}) {
  return (
    <article>
      <p className="eyebrow">
        {moduleTitle} · {contentTypeLabels[lesson.contentType]}
        {lesson.durationMinutes ? ` · ${lesson.durationMinutes} min` : ""}
      </p>
      <h3 className="mt-2 text-base font-semibold">{lesson.title || "Untitled lesson"}</h3>
      <div className="mt-4">
        {lesson.contentType === "video" ? <VideoPreview lesson={lesson} /> : null}
        {lesson.contentType === "text" ? (
          <ReadingPreview text={lesson.contentRef} empty="This reading has no body yet." />
        ) : null}
        {lesson.contentType === "assignment" ? (
          <ReadingPreview
            text={lesson.contentRef}
            empty="No brief is set for this assignment yet."
          />
        ) : null}
        {lesson.contentType === "quiz" ? <QuizPreview lesson={lesson} /> : null}
      </div>
    </article>
  );
}

export function AdminContentReview({
  description,
  modules,
}: {
  description: string;
  modules: ReviewModule[];
}) {
  const lessons = useMemo(
    () =>
      modules.flatMap((courseModule) =>
        courseModule.lessons.map((lesson) => ({
          lesson,
          moduleTitle: courseModule.title,
        })),
      ),
    [modules],
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    lessons[0]?.lesson.id ?? null,
  );
  const selected =
    lessons.find((item) => item.lesson.id === selectedId) ?? lessons[0] ?? null;

  return (
    <section aria-labelledby="content-title" className="card">
      <div className="border-b border-line px-5 py-4">
        <h2 id="content-title" className="section-title">
          Course content
        </h2>
        <p className="mt-1 text-sm text-muted">
          Open a lesson to read what students will see. Quiz answers marked with a
          check are the correct choice.
        </p>
      </div>
      <div className="grid lg:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Submitted lessons" className="border-b border-line lg:border-r lg:border-b-0">
          <div className="px-4 py-3">
            <button
              type="button"
              aria-current={selectedId === null ? "true" : undefined}
              onClick={() => setSelectedId(null)}
              className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                selectedId === null
                  ? "bg-brand-soft font-medium text-brand-strong"
                  : "text-ink hover:bg-subtle"
              }`}
            >
              Description
            </button>
          </div>
          {modules.length === 0 ? (
            <p className="px-4 pb-4 text-sm text-muted">No modules yet.</p>
          ) : (
            <ol className="divide-y divide-line border-t border-line">
              {modules.map((courseModule, moduleIndex) => (
                <li key={courseModule.id} className="px-4 py-3">
                  <p className="text-xs font-medium tracking-wide text-muted uppercase">
                    {moduleIndex + 1}. {courseModule.title}
                  </p>
                  {courseModule.lessons.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">No lessons.</p>
                  ) : (
                    <ol className="mt-2 space-y-0.5">
                      {courseModule.lessons.map((lesson) => {
                        const current = selected?.lesson.id === lesson.id && selectedId !== null;
                        return (
                          <li key={lesson.id}>
                            <button
                              type="button"
                              aria-current={current ? "true" : undefined}
                              onClick={() => setSelectedId(lesson.id)}
                              className={`w-full rounded-md px-2 py-1.5 text-left text-sm ${
                                current
                                  ? "bg-brand-soft font-medium text-brand-strong"
                                  : "text-ink hover:bg-subtle"
                              }`}
                            >
                              <span className="block leading-5">
                                {lesson.title || "Untitled lesson"}
                              </span>
                              <span className="mt-0.5 block text-xs font-normal text-muted">
                                {contentTypeLabels[lesson.contentType]}
                                {lesson.durationMinutes
                                  ? ` · ${lesson.durationMinutes} min`
                                  : ""}
                              </span>
                            </button>
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
        <div className="px-5 py-5 sm:px-6">
          {selectedId === null || !selected ? (
            <article>
              <p className="eyebrow">Description</p>
              <h3 className="mt-2 text-base font-semibold">What this course covers</h3>
              <div className="mt-4">
                <ReadingPreview
                  text={description}
                  empty="No description is set for this course."
                />
              </div>
            </article>
          ) : (
            <LessonPreview lesson={selected.lesson} moduleTitle={selected.moduleTitle} />
          )}
        </div>
      </div>
    </section>
  );
}
