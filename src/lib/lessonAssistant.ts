import { parseQuizConfig } from "./lessonContent";
import type { Lesson } from "./types";

const MODEL = "gpt-6-luna";

export const missingLessonAnswer =
  "This course’s lessons do not include an answer to that.";

export function courseLessonText(lessons: Lesson[]): string {
  const sections: string[] = [];

  for (const lesson of lessons) {
    if (lesson.contentType === "text") {
      const text = lesson.contentRef.trim();
      if (!text) continue;
      sections.push(`Lesson: ${lesson.title}\n${text}`);
      continue;
    }

    if (lesson.contentType === "quiz") {
      const quiz = parseQuizConfig(lesson.contentRef);
      const lines = [`Quiz: ${lesson.title}`];
      for (const [index, question] of quiz.questions.entries()) {
        const choices = question.choices
          .map((choice) => choice.trim())
          .filter(Boolean);
        if (!question.prompt.trim() && choices.length === 0) continue;
        if (question.prompt.trim()) {
          lines.push(`${index + 1}. ${question.prompt.trim()}`);
        }
        if (choices.length > 0) lines.push(`Choices: ${choices.join("; ")}`);
      }
      if (lines.length === 1) continue;
      sections.push(lines.join("\n"));
    }
  }

  return sections.join("\n\n");
}

function replyText(content: unknown): string | null {
  if (typeof content === "string" && content.trim()) return content.trim();
  if (!Array.isArray(content)) return null;

  const text = content
    .map((part) => {
      if (typeof part === "string") return part;
      if (
        part &&
        typeof part === "object" &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }
      return "";
    })
    .join("")
    .trim();

  return text || null;
}

export async function answerFromLessons(
  question: string,
  lessons: Lesson[],
): Promise<string | null> {
  const knowledge = courseLessonText(lessons);
  if (!knowledge) return missingLessonAnswer;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

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
        max_completion_tokens: 400,
        messages: [
          {
            role: "system",
            content: [
              "You are the course assistant for Skillstream Academy.",
              "Answer the student using only the lesson text below.",
              `If the lessons do not contain the answer, reply with exactly: ${missingLessonAnswer}`,
              "Do not add anything else in that case.",
              "Do not use outside knowledge.",
              "",
              knowledge,
            ].join("\n"),
          },
          { role: "user", content: question },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    return replyText(data.choices?.[0]?.message?.content);
  } catch {
    return null;
  }
}
