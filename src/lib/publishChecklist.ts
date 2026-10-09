import {
  contentTypeLabels,
  lessonHasPublishableContent,
} from "./lessonContent";
import type { Course, CourseModule, Lesson } from "./types";

export type PublishChecklistItem = {
  id: string;
  label: string;
  done: boolean;
  required: boolean;
  detail?: string;
};

export type PublishChecklist = {
  items: PublishChecklistItem[];
  ready: boolean;
};

export type CourseForPublish = Pick<Course, "title" | "description"> & {
  modules: Array<
    Pick<CourseModule, "title"> & {
      lessons: Array<
        Pick<Lesson, "title" | "contentType" | "contentRef" | "durationMinutes">
      >;
    }
  >;
};

function joinNames(names: string[]) {
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, 2).join(", ")}, and ${names.length - 2} more`;
}

function lessonLabel(lesson: { title: string }) {
  return lesson.title.trim() || "Untitled lesson";
}

function missingContentPhrase(
  contentType: Lesson["contentType"],
): string {
  switch (contentType) {
    case "video":
      return "no video URL";
    case "quiz":
      return "no question";
    case "assignment":
      return "no brief";
    default:
      return "no reading";
  }
}

export function coursePublishChecklist(
  course: CourseForPublish,
): PublishChecklist {
  const lessons = course.modules.flatMap((courseModule) => courseModule.lessons);
  const emptyModules = course.modules.filter(
    (courseModule) => courseModule.lessons.length === 0,
  );
  const untitled = lessons.filter((lesson) => !lesson.title.trim());
  const missingContent = lessons.filter(
    (lesson) => !lessonHasPublishableContent(lesson),
  );
  const missingDuration = lessons.filter(
    (lesson) => lesson.durationMinutes == null,
  );

  const items: PublishChecklistItem[] = [
    {
      id: "title",
      label: "Course title",
      required: true,
      done: Boolean(course.title.trim()),
    },
    {
      id: "modules",
      label: "At least one module",
      required: true,
      done: course.modules.length > 0,
    },
    {
      id: "module-lessons",
      label: "Every module has a lesson",
      required: true,
      done: course.modules.length > 0 && emptyModules.length === 0,
      detail:
        course.modules.length === 0
          ? "Add a module first."
          : emptyModules.length > 0
            ? `${joinNames(emptyModules.map((item) => item.title.trim() || "Untitled module"))} ${emptyModules.length === 1 ? "has" : "have"} no lessons.`
            : undefined,
    },
    {
      id: "lesson-titles",
      label: "Every lesson has a title",
      required: true,
      done: lessons.length > 0 && untitled.length === 0,
      detail:
        lessons.length === 0
          ? "Add a lesson first."
          : untitled.length > 0
            ? `${untitled.length} lesson${untitled.length === 1 ? "" : "s"} ${untitled.length === 1 ? "has" : "have"} no title.`
            : undefined,
    },
    {
      id: "lesson-content",
      label: "Every lesson has content",
      required: true,
      done: lessons.length > 0 && missingContent.length === 0,
      detail:
        lessons.length === 0
          ? "Add a lesson first."
          : missingContent.length === 1
            ? `${lessonLabel(missingContent[0])} (${contentTypeLabels[missingContent[0].contentType]}) has ${missingContentPhrase(missingContent[0].contentType)}.`
            : missingContent.length > 1
              ? `${joinNames(missingContent.map(lessonLabel))} still need a body, URL, question, or brief.`
              : undefined,
    },
    {
      id: "duration",
      label: "Duration on every lesson",
      required: false,
      done: lessons.length > 0 && missingDuration.length === 0,
      detail:
        lessons.length === 0
          ? "Added after the first lesson."
          : missingDuration.length > 0
            ? `${missingDuration.length} lesson${missingDuration.length === 1 ? " has" : "s have"} no time estimate.`
            : undefined,
    },
  ];

  return {
    items,
    ready: items.filter((item) => item.required).every((item) => item.done),
  };
}
