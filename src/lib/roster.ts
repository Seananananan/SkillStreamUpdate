import type { Enrollment, LessonProgress, LmsSyncStatus } from "./types";

export const ATTENTION_IDLE_DAYS = 7;

export function lastActivityAt(progress: LessonProgress[]): string | null {
  const times = progress.flatMap((item) =>
    [item.updatedAt, item.completedAt, item.createdAt].filter(
      (value): value is string => Boolean(value),
    ),
  );
  if (times.length === 0) return null;
  return times.sort()[times.length - 1];
}

export function needsAttention(
  enrollment: Pick<Enrollment, "status">,
  activityAt: string | null,
  syncStatus?: LmsSyncStatus | null,
  now = Date.now(),
): boolean {
  if (syncStatus === "failed" || syncStatus === "pending") return true;
  if (enrollment.status === "completed" || enrollment.status === "cancelled") {
    return false;
  }
  if (!activityAt) return true;
  return now - Date.parse(activityAt) >= ATTENTION_IDLE_DAYS * 24 * 60 * 60 * 1000;
}

export function attentionReason(
  enrollment: Pick<Enrollment, "status">,
  activityAt: string | null,
  syncStatus?: LmsSyncStatus | null,
  now = Date.now(),
): string | null {
  if (syncStatus === "failed") return "Course access did not provision.";
  if (syncStatus === "pending") return "Course access is still being set up.";
  if (!needsAttention(enrollment, activityAt, syncStatus, now)) return null;
  if (!activityAt) return "Enrolled, no lesson started.";
  return `No lesson activity in ${ATTENTION_IDLE_DAYS} days.`;
}

export function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatLastActivity(iso: string | null, now = Date.now()) {
  if (!iso) return "No lesson activity yet";

  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "No lesson activity yet";

  const days = Math.floor((now - then) / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Last activity today";
  if (days === 1) return "Last activity yesterday";
  if (days < 14) return `Last activity ${days} days ago`;
  return `Last activity ${formatShortDate(iso)}`;
}
