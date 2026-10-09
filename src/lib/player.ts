import type { LessonContentType, LessonProgress, LessonProgressStatus } from "./types";
import { contentTypeLabels } from "./lessonContent";

export { contentTypeLabels };

export function getLessonProgressStatus(
  progress: LessonProgress[],
  lessonId: string,
): LessonProgressStatus {
  return (
    progress.find((item) => item.lessonId === lessonId)?.status ?? "not_started"
  );
}

export function completeActionLabel(contentType: LessonContentType) {
  switch (contentType) {
    case "video":
      return "Mark as watched";
    case "quiz":
      return "Submit quiz";
    case "assignment":
      return "Submit assignment";
    default:
      return "Mark as complete";
  }
}

