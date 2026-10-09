import type { Enrollment, LmsAccount } from "./types";

export type CourseAccessState = "ready" | "pending" | "failed";

export function courseAccessState(
  lmsAccount?: Pick<LmsAccount, "syncStatus"> | null,
): CourseAccessState {
  if (!lmsAccount || lmsAccount.syncStatus === "pending") return "pending";
  if (lmsAccount.syncStatus === "failed") return "failed";
  return "ready";
}

export function canAccessLessons(
  enrollment: Pick<Enrollment, "status">,
  lmsAccount?: Pick<LmsAccount, "syncStatus"> | null,
): boolean {
  if (enrollment.status === "cancelled") return false;
  if (lmsAccount?.syncStatus !== "provisioned") return false;
  return enrollment.status === "active" || enrollment.status === "completed";
}

export const accessCopy = {
  pending: {
    title: "Setting up course access",
    detail: "Lessons open when provisioning finishes.",
  },
  failed: {
    title: "Course access did not provision",
    detail: "Retry is Planned.",
  },
  ready: {
    title: "Access is ready",
    detail: "Finish every lesson to complete the course.",
  },
} as const;

export function studentCourseHref(
  courseId: string,
  input: {
    accessReady: boolean;
    certificateId?: string | null;
    nextLessonId?: string | null;
  },
) {
  if (!input.accessReady) return `/student/learning/${courseId}`;
  if (input.certificateId) {
    return `/student/certificates/${input.certificateId}`;
  }
  if (input.nextLessonId) {
    return `/student/learning/${courseId}/lessons/${input.nextLessonId}`;
  }
  return `/student/learning/${courseId}`;
}

export function studentCourseActionLabel(input: {
  accessReady: boolean;
  completed: boolean;
  started: boolean;
  hasCertificate?: boolean;
}) {
  if (!input.accessReady) return "View access";
  if (input.hasCertificate) return "Certificate";
  if (input.completed) return "Review";
  if (!input.started) return "Start";
  return "Continue";
}
