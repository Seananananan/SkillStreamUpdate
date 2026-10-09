import { ExternalLink, Play } from "lucide-react";
import type { Lesson } from "@/lib/types";
import {
  contentTypeLabels,
  isHttpUrl,
  parseQuizConfig,
  youtubeEmbedSrc,
} from "@/lib/lessonContent";

function paragraphs(text: string) {
  return text
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function VideoFrame({ lesson }: { lesson: Lesson }) {
  const url = lesson.contentRef.trim();
  const embed = url ? youtubeEmbedSrc(url) : null;
  const duration = lesson.durationMinutes
    ? ` · ${lesson.durationMinutes} min`
    : "";

  if (embed) {
    return (
      <div className="overflow-hidden rounded-lg border border-line bg-ink">
        <iframe
          title={lesson.title}
          src={embed}
          className="aspect-video w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
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
            <p className="max-w-md text-sm text-white/70">
              This build does not host video files{duration}. Open the source
              URL the instructor set.
            </p>
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
    <p className="text-sm leading-6 text-muted">
      No video URL is set for this lesson{duration}.
    </p>
  );
}

function QuizFrame({ lesson }: { lesson: Lesson }) {
  const quiz = parseQuizConfig(lesson.contentRef);
  const name = `quiz-${lesson.id}`;

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">
        Choose an answer. A wrong choice leaves this lesson incomplete.
      </p>
      {quiz.prompt ? (
        <fieldset className="card px-4 py-4">
          <legend className="text-sm font-medium">{quiz.prompt}</legend>
          {quiz.choices.length > 0 ? (
            quiz.choices.map((choice, index) => (
              <label
                key={`${lesson.id}-choice-${index}`}
                className="mt-3 flex items-start gap-2 text-sm first:mt-3"
              >
                <input
                  type="radio"
                  name={name}
                  value={index}
                  className="mt-0.5"
                />
                {choice}
              </label>
            ))
          ) : (
            <p className="mt-3 text-sm text-muted">No choices were added.</p>
          )}
        </fieldset>
      ) : (
        <p className="text-sm leading-6 text-muted">
          No question is set for this quiz yet.
        </p>
      )}
    </div>
  );
}

function AssignmentFrame({ lesson }: { lesson: Lesson }) {
  const brief = lesson.contentRef.trim();

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6 text-muted">
        File upload is not in this build. Submitting marks the work complete
        with a score of 100.
      </p>
      <div className="card px-4 py-4">
        <p className="text-sm font-medium">Brief</p>
        {brief ? (
          <div className="mt-1.5 space-y-3 text-sm leading-6 text-muted">
            {paragraphs(brief).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        ) : (
          <p className="mt-1.5 text-sm leading-6 text-muted">
            No brief is set for this assignment yet.
          </p>
        )}
      </div>
    </div>
  );
}

function ReadingFrame({ lesson }: { lesson: Lesson }) {
  const body = paragraphs(lesson.contentRef);

  if (body.length === 0) {
    return (
      <p className="text-sm leading-6 text-muted">
        This reading has no body yet.
      </p>
    );
  }

  return (
    <div className="space-y-4 text-sm leading-6 text-ink">
      {body.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

export function LessonBody({ lesson }: { lesson: Lesson }) {
  return (
    <article>
      <h2 className="sr-only">{contentTypeLabels[lesson.contentType]}</h2>
      {lesson.contentType === "video" ? <VideoFrame lesson={lesson} /> : null}
      {lesson.contentType === "quiz" ? <QuizFrame lesson={lesson} /> : null}
      {lesson.contentType === "assignment" ? (
        <AssignmentFrame lesson={lesson} />
      ) : null}
      {lesson.contentType === "text" ? <ReadingFrame lesson={lesson} /> : null}
    </article>
  );
}
