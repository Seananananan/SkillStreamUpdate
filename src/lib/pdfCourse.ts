import { extractText } from "unpdf";
import { serializeQuizConfig } from "./lessonContent";

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
    const draftedLessons = lessons.slice(0, 4).flatMap((lessonValue) => {
      const lesson = asRecord(lessonValue);
      if (!lesson) return [];
      const lessonTitle = clip(asString(lesson.title), 80);
      if (!lessonTitle) return [];

      const kind = lesson.kind === "quiz" ? "quiz" : "text";
      if (kind === "quiz") {
        const prompt = clip(asString(lesson.prompt), 300);
        const choices = Array.isArray(lesson.choices)
          ? lesson.choices
              .filter((choice): choice is string => typeof choice === "string")
              .map((choice) => clip(choice, 120))
              .filter(Boolean)
              .slice(0, 4)
          : [];
        if (!prompt || choices.length < 2) {
          const body = clip(prompt || asString(lesson.body), 1500);
          if (!body) return [];
          return [{ title: lessonTitle, contentType: "text" as const, contentRef: body }];
        }
        const rawIndex = Number(lesson.correctIndex);
        const correctIndex =
          Number.isInteger(rawIndex) && rawIndex >= 0 && rawIndex < choices.length
            ? rawIndex
            : 0;
        return [
          {
            title: lessonTitle,
            contentType: "quiz" as const,
            contentRef: serializeQuizConfig({ prompt, choices, correctIndex }),
          },
        ];
      }

      const body = clip(asString(lesson.body), 1500);
      if (!body) return [];
      return [{ title: lessonTitle, contentType: "text" as const, contentRef: body }];
    });

    if (draftedLessons.length === 0) return [];
    return [{ title: moduleTitle, lessons: draftedLessons }];
  });

  if (drafted.length === 0) return null;
  return { title, description, modules: drafted };
}

export async function textFromPdf(bytes: Uint8Array): Promise<string> {
  const extracted = await extractText(bytes, { mergePages: true });
  const raw = typeof extracted.text === "string" ? extracted.text : extracted.text.join("\n");
  return raw.replace(/\s+/g, " ").trim().slice(0, MAX_SOURCE_CHARS);
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
        max_completion_tokens: 4000,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: [
              "Turn the PDF text into a draft course for Skillstream Academy.",
              "Use only what the PDF says. Do not add topics that are not in the text.",
              "Return JSON with title, description, and modules.",
              "Each module has a title and lessons.",
              "Each lesson has title, kind (text or quiz), body, prompt, and choices.",
              "Use 2 to 6 modules. Each module has 1 to 4 lessons.",
              "Most lessons are kind text. Put the teaching text in body.",
              "Use kind quiz only when the PDF states a fact a student can check. Put the question in prompt, 2 to 4 choices in choices, and correctIndex as the position of the right choice.",
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
