import { extractText } from "unpdf";
import { serializeQuizConfig, type QuizQuestion } from "./lessonContent";

const MODEL = "gpt-6-luna";
const MAX_SOURCE_CHARS = 60_000;

export type DraftOutline = {
  title: string;
  description: string;
  modules: Array<{
    title: string;
    lessons: Array<{
      title: string;
      contentType: "text" | "quiz";
      contentRef: string;
    }>;
  }>;
};

type DraftLesson = DraftOutline["modules"][number]["lessons"][number];

function clip(value: string, max: number) {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trim();
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function outlineFromModel(value: unknown): DraftOutline | null {
  const record = asRecord(value);
  if (!record) return null;

  const title = clip(asString(record.title), 120);
  const description = clip(asString(record.description), 500);
  if (!title) return null;

  const modules = Array.isArray(record.modules) ? record.modules : [];
  const drafted = modules.slice(0, 6).flatMap((moduleValue) => {
    const moduleRecord = asRecord(moduleValue);
    if (!moduleRecord) return [];
    const moduleTitle = clip(asString(moduleRecord.title), 80);
    if (!moduleTitle) return [];

    const lessons = Array.isArray(moduleRecord.lessons) ? moduleRecord.lessons : [];
    const draftedLessons = lessons.flatMap<DraftLesson>((lessonValue) => {
      const lesson = asRecord(lessonValue);
      if (!lesson) return [];
      const lessonTitle = clip(asString(lesson.title), 80);
      if (!lessonTitle) return [];

      const kind = lesson.kind === "quiz" ? "quiz" : "text";
      if (kind === "quiz") {
        const rawQuestions = Array.isArray(lesson.questions)
          ? lesson.questions
          : [];
        const questions = rawQuestions
          .slice(0, 3)
          .flatMap<QuizQuestion>((questionValue) => {
            const question = asRecord(questionValue);
            if (!question) return [];
            const prompt = clip(asString(question.prompt), 300);
            const choices = Array.isArray(question.choices)
              ? question.choices
                  .filter(
                    (choice): choice is string => typeof choice === "string",
                  )
                  .map((choice) => clip(choice, 120))
                  .filter(Boolean)
                  .slice(0, 4)
              : [];
            if (!prompt || choices.length < 2) return [];
            const rawIndex = Number(question.correctIndex);
            const correctIndex =
              Number.isInteger(rawIndex) &&
              rawIndex >= 0 &&
              rawIndex < choices.length
                ? rawIndex
                : 0;
            return [{ prompt, choices, correctIndex }];
          });
        if (questions.length !== 3) return [];
        return [
          {
            title: lessonTitle,
            contentType: "quiz" as const,
            contentRef: serializeQuizConfig({ questions }),
          },
        ];
      }

      const body = clip(asString(lesson.body), 1500);
      if (!body) return [];
      return [{ title: lessonTitle, contentType: "text" as const, contentRef: body }];
    });

    const quiz = draftedLessons.find((lesson) => lesson.contentType === "quiz");
    if (!quiz) return [];

    const limitedLessons = draftedLessons.slice(0, 4);
    if (!limitedLessons.some((lesson) => lesson.contentType === "quiz")) {
      limitedLessons.splice(3, 1, quiz);
    }

    return [{ title: moduleTitle, lessons: limitedLessons }];
  });

  if (drafted.length === 0) return null;
  return { title, description, modules: drafted };
}

export async function textFromPdf(bytes: Uint8Array): Promise<string> {
  const extracted = await extractText(bytes, { mergePages: true });
  return extracted.text.replace(/\s+/g, " ").trim().slice(0, MAX_SOURCE_CHARS);
}

export async function draftCourseFromPdfText(
  source: string,
): Promise<{ ok: true; outline: DraftOutline } | { ok: false; error: string }> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "The course assistant is not available right now." };
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        reasoning_effort: "none",
        max_completion_tokens: 6000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "Turn the PDF text into a draft course for Skillstream Academy.",
              "Use only what the PDF says. Do not add topics that are not in the text.",
              "Return JSON with title, description, and modules.",
              "Each module has a title and lessons.",
              "Each lesson has title, kind (text or quiz), and body. Each quiz lesson also has a questions array.",
              "Use 2 to 6 modules. Each module has 1 to 4 lessons and MUST include at least one kind quiz lesson.",
              "Most other lessons are kind text. Put the teaching text in body.",
              "Every quiz MUST have exactly 3 questions. Every question must test a fact stated in the PDF and have prompt, 2 to 4 choices, and correctIndex as the zero-based position of the right choice.",
              "Keep each reading body under 1200 characters.",
            ].join(" "),
          },
          { role: "user", content: source },
        ],
      }),
    });

    if (!response.ok) {
      return { ok: false, error: "The PDF could not be turned into a course. Try again." };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return { ok: false, error: "The PDF could not be turned into a course. Try again." };
    }

    const outline = outlineFromModel(JSON.parse(content) as unknown);
    if (!outline) {
      return { ok: false, error: "The PDF did not contain enough text to build a course." };
    }
    return { ok: true, outline };
  } catch {
    return { ok: false, error: "The PDF could not be turned into a course. Try again." };
  }
}
