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
  quizQuestions: QuizQuestionDraft[];
};

export type LessonPayload = {
  title: string;
  contentType: LessonContentType;
  contentRef: string;
  durationMinutes: number | null;
};

export type QuizQuestion = {
  prompt: string;
  choices: string[];
  correctIndex: number | null;
};

export type QuizConfig = {
  questions: QuizQuestion[];
};

export type QuizQuestionDraft = {
  prompt: string;
  choices: string[];
  correctIndex: number;
};

function emptyQuizQuestion(): QuizQuestionDraft {
  return { prompt: "", choices: ["", ""], correctIndex: 0 };
}

export function emptyLessonDraft(): LessonDraft {
  return {
    title: "",
    contentType: "text",
    durationMinutes: "",
    contentRef: "",
    quizQuestions: Array.from({ length: 3 }, emptyQuizQuestion),
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
  if (!trimmed) return { questions: [] };

  try {
    const parsed = JSON.parse(trimmed) as {
      questions?: unknown;
      prompt?: unknown;
      choices?: unknown;
      correctIndex?: unknown;
    };
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      const rawQuestions = Array.isArray(parsed.questions)
        ? parsed.questions
        : [parsed];
      const questions = rawQuestions.flatMap((value) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) return [];
        const question = value as {
          prompt?: unknown;
          choices?: unknown;
          correctIndex?: unknown;
        };
        const prompt = typeof question.prompt === "string" ? question.prompt : "";
        const choices = Array.isArray(question.choices)
          ? question.choices.filter(
              (choice): choice is string => typeof choice === "string",
            )
          : [];
        const correctIndex =
          typeof question.correctIndex === "number" &&
          Number.isInteger(question.correctIndex) &&
          question.correctIndex >= 0 &&
          question.correctIndex < choices.length
            ? question.correctIndex
            : null;
        return [{ prompt, choices, correctIndex }];
      });
      return { questions };
    }
  } catch {
    // Plain-text prompts from older records.
  }

  return {
    questions: [{ prompt: trimmed, choices: [], correctIndex: null }],
  };
}

export function serializeQuizConfig(config: QuizConfig): string {
  const questions = config.questions.flatMap((question) => {
    const prompt = question.prompt.trim();
    const pairs = question.choices
      .map((choice, index) => ({ choice: choice.trim(), index }))
      .filter((item) => item.choice);
    const choices = pairs.map((item) => item.choice);
    if (!prompt && choices.length === 0) return [];
    const matched = pairs.findIndex(
      (item) => item.index === question.correctIndex,
    );
    return [{ prompt, choices, correctIndex: matched >= 0 ? matched : 0 }];
  });
  if (questions.length === 0) return "";
  return JSON.stringify({ questions });
}

export function draftFromLesson(
  lesson: Pick<
    Lesson,
    "title" | "contentType" | "contentRef" | "durationMinutes"
  >,
): LessonDraft {
  const quiz = parseQuizConfig(lesson.contentRef);
  const quizQuestions = quiz.questions.slice(0, 3).map((question) => {
    const choices =
      question.choices.length >= 2
        ? question.choices.slice(0, 4)
        : [...question.choices, "", ""].slice(0, 2);
    return {
      prompt: question.prompt,
      choices,
      correctIndex: question.correctIndex ?? 0,
    };
  });
  while (quizQuestions.length < 3) quizQuestions.push(emptyQuizQuestion());

  return {
    title: lesson.title,
    contentType: lesson.contentType,
    durationMinutes:
      lesson.durationMinutes == null ? "" : String(lesson.durationMinutes),
    contentRef: lesson.contentType === "quiz" ? "" : lesson.contentRef,
    quizQuestions:
      lesson.contentType === "quiz"
        ? quizQuestions
        : Array.from({ length: 3 }, emptyQuizQuestion),
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
          questions: draft.quizQuestions,
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
  if (!contentRef) {
    return contentType === "quiz"
      ? "A quiz must have exactly 3 questions."
      : null;
  }

  if (contentType === "video" && !isHttpUrl(contentRef)) {
    return "Video content must be an http(s) URL.";
  }

  if (contentType === "quiz") {
    const questions = parseQuizConfig(contentRef).questions;
    if (questions.length !== 3) {
      return "A quiz must have exactly 3 questions.";
    }
    if (
      questions.some(
        (question) =>
          !question.prompt.trim() ||
          question.choices.filter((choice) => choice.trim()).length < 2 ||
          question.correctIndex == null,
      )
    ) {
      return "Each quiz question needs a prompt, at least 2 choices, and a correct answer.";
    }
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
    case "quiz": {
      const questions = parseQuizConfig(ref).questions;
      return (
        questions.length === 3 &&
        questions.every(
          (question) =>
            question.prompt.trim().length > 0 &&
            question.choices.filter((choice) => choice.trim()).length >= 2 &&
            question.correctIndex != null,
        )
      );
    }
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
      return "Add 3 questions and mark the correct choice for each. A wrong answer does not complete the lesson.";
    case "assignment":
      return "File upload is not in this build. Students read the brief, then mark it complete.";
    default:
      return "Shown as the lesson body. Separate paragraphs with a blank line.";
  }
}
