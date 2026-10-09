import type { Lesson, LessonContentType } from "./types";

export const lessonContentTypes = [
  "text",
  "video",
  "quiz",
  "assignment",
] as const satisfies readonly LessonContentType[];

export const contentTypeLabels: Record<LessonContentType, string> = {
  video: "Video",
  text: "Reading",
  quiz: "Quiz",
  assignment: "Assignment",
};

export type LessonDraft = {
  title: string;
  contentType: LessonContentType;
  durationMinutes: string;
  contentRef: string;
  quizPrompt: string;
  quizChoices: string[];
  quizCorrectIndex: number;
};

export type LessonPayload = {
  title: string;
  contentType: LessonContentType;
  contentRef: string;
  durationMinutes: number | null;
};

export type QuizConfig = {
  prompt: string;
  choices: string[];
  correctIndex: number | null;
};

export function emptyLessonDraft(): LessonDraft {
  return {
    title: "",
    contentType: "text",
    durationMinutes: "",
    contentRef: "",
    quizPrompt: "",
    quizChoices: ["", ""],
    quizCorrectIndex: 0,
  };
}

export function isLessonContentType(
  value: unknown,
): value is LessonContentType {
  return (
    value === "text" ||
    value === "video" ||
    value === "quiz" ||
    value === "assignment"
  );
}

export function parseDurationMinutes(
  value: unknown,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value === null || value === undefined || value === "") {
    return { ok: true, value: null };
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || !Number.isInteger(parsed)) {
    return { ok: false, error: "Duration must be a whole number of minutes." };
  }

  return { ok: true, value: parsed === 0 ? null : parsed };
}

export function parseQuizConfig(contentRef: string): QuizConfig {
  const trimmed = contentRef.trim();
  if (!trimmed) return { prompt: "", choices: [], correctIndex: null };

  try {
    const parsed = JSON.parse(trimmed) as {
      prompt?: unknown;
      choices?: unknown;
      correctIndex?: unknown;
    };
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const prompt = typeof parsed.prompt === "string" ? parsed.prompt : "";
      const choices = Array.isArray(parsed.choices)
        ? parsed.choices.filter((choice): choice is string => typeof choice === "string")
        : [];
      const correctIndex =
        typeof parsed.correctIndex === "number" &&
        Number.isInteger(parsed.correctIndex) &&
        parsed.correctIndex >= 0 &&
        parsed.correctIndex < choices.length
          ? parsed.correctIndex
          : null;
      return { prompt, choices, correctIndex };
    }
  } catch {
    // Plain-text prompts from older records.
  }

  return { prompt: trimmed, choices: [], correctIndex: null };
}

export function serializeQuizConfig(config: QuizConfig): string {
  const prompt = config.prompt.trim();
  const pairs = config.choices
    .map((choice, index) => ({ choice: choice.trim(), index }))
    .filter((item) => item.choice);
  const choices = pairs.map((item) => item.choice);
  if (!prompt && choices.length === 0) return "";
  if (choices.length === 0) return prompt;
  const matched = pairs.findIndex((item) => item.index === config.correctIndex);
  const correctIndex = matched >= 0 ? matched : 0;
  return JSON.stringify({ prompt, choices, correctIndex });
}

export function draftFromLesson(
  lesson: Pick<
    Lesson,
    "title" | "contentType" | "contentRef" | "durationMinutes"
  >,
): LessonDraft {
  const quiz = parseQuizConfig(lesson.contentRef);
  const choices =
    quiz.choices.length >= 2
      ? quiz.choices.slice(0, 4)
      : [...quiz.choices, "", ""].slice(0, 2);

  return {
    title: lesson.title,
    contentType: lesson.contentType,
    durationMinutes:
      lesson.durationMinutes == null ? "" : String(lesson.durationMinutes),
    contentRef: lesson.contentType === "quiz" ? "" : lesson.contentRef,
    quizPrompt: lesson.contentType === "quiz" ? quiz.prompt : "",
    quizChoices: choices.length >= 2 ? choices : ["", ""],
    quizCorrectIndex: quiz.correctIndex ?? 0,
  };
}

export function draftToPayload(
  draft: LessonDraft,
): { ok: true; payload: LessonPayload } | { ok: false; error: string } {
  const title = draft.title.trim();
  if (!title) return { ok: false, error: "Title is required." };

  const duration = parseDurationMinutes(draft.durationMinutes);
  if (!duration.ok) return duration;

  const contentRef =
    draft.contentType === "quiz"
      ? serializeQuizConfig({
          prompt: draft.quizPrompt,
          choices: draft.quizChoices,
          correctIndex: draft.quizCorrectIndex,
        })
      : draft.contentRef.trim();

  const contentError = validateContentRef(draft.contentType, contentRef);
  if (contentError) return { ok: false, error: contentError };

  return {
    ok: true,
    payload: {
      title,
      contentType: draft.contentType,
      contentRef,
      durationMinutes: duration.value,
    },
  };
}

export function validateContentRef(
  contentType: LessonContentType,
  contentRef: string,
): string | null {
  if (!contentRef) return null;

  if (contentType === "video" && !isHttpUrl(contentRef)) {
    return "Video content must be an http(s) URL.";
  }

  return null;
}

export function lessonHasPublishableContent(
  lesson: Pick<Lesson, "contentType" | "contentRef">,
): boolean {
  const ref = lesson.contentRef.trim();
  switch (lesson.contentType) {
    case "video":
      return isHttpUrl(ref);
    case "quiz":
      return parseQuizConfig(ref).prompt.trim().length > 0;
    default:
      return ref.length > 0;
  }
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function youtubeEmbedSrc(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function contentFieldLabel(contentType: LessonContentType): string {
  switch (contentType) {
    case "video":
      return "Video URL";
    case "quiz":
      return "Question";
    case "assignment":
      return "Brief";
    default:
      return "Reading";
  }
}

export function contentFieldHint(contentType: LessonContentType): string {
  switch (contentType) {
    case "video":
      return "A public http(s) link. This build does not host video files.";
    case "quiz":
      return "Students must choose the marked answer. A wrong choice does not complete the lesson.";
    case "assignment":
      return "File upload is not in this build. Students read the brief, then mark it complete.";
    default:
      return "Shown as the lesson body. Separate paragraphs with a blank line.";
  }
}
