export const confirmationKeys = [
  "signed-in",
  "account-created",
  "signed-out",
  "password-updated",
  "enrolled",
  "access-pending",
  "access-failed",
  "lesson-complete",
  "certified",
  "course-created",
  "course-from-pdf",
  "module-added",
  "lesson-added",
  "published",
  "unpublished",
  "archived",
  "restored",
  "saved",
  "deleted",
  "order-saved",
  "revoked",
  "question-sent",
  "submitted",
  "withdrawn",
  "sent-back",
] as const;

export type ConfirmationKey = (typeof confirmationKeys)[number];

export const confirmationCopy: Record<
  ConfirmationKey,
  { title: string; detail?: string; tone?: "success" | "danger" }
> = {
  "signed-in": {
    title: "Signed in",
    detail: "You are in your workspace.",
  },
  "account-created": {
    title: "Account created",
    detail: "You are signed in.",
  },
  "signed-out": {
    title: "Signed out",
    detail: "Sign in again to continue.",
  },
  "password-updated": {
    title: "Password updated",
    detail: "You are signed in with the new password.",
  },
  enrolled: {
    title: "Enrollment confirmed",
    detail: "Course access is ready. Start the first lesson when you are.",
  },
  "access-pending": {
    title: "Enrollment confirmed",
    detail: "Course access is being set up. Lessons open when it finishes.",
  },
  "access-failed": {
    title: "Enrollment confirmed",
    detail: "Course access did not provision. Retry is Planned.",
    tone: "danger",
  },
  "lesson-complete": {
    title: "Lesson complete",
    detail: "Your progress is saved.",
  },
  certified: {
    title: "Course complete",
    detail: "Your results are below. Open the certificate when you want to share it.",
  },
  "course-created": {
    title: "Course created",
    detail: "Saved as a draft. Add modules and lessons, then submit it for review.",
  },
  "course-from-pdf": {
    title: "Draft course created",
    detail: "Review the modules and lessons from the PDF, then submit the course for review.",
  },
  "module-added": {
    title: "Module added",
  },
  "lesson-added": {
    title: "Lesson added",
  },
  published: {
    title: "Published",
    detail: "Students can now see this course in the catalog.",
  },
  submitted: {
    title: "Submitted for review",
    detail: "An admin will publish it or send it back with feedback.",
  },
  withdrawn: {
    title: "Submission withdrawn",
    detail: "This draft is private again.",
  },
  "sent-back": {
    title: "Sent back",
    detail: "The instructor can read the feedback and submit again.",
  },
  unpublished: {
    title: "Returned to draft",
    detail: "Students can no longer see this course in the catalog.",
  },
  archived: {
    title: "Archived",
    detail: "Off the catalog. Students who already enrolled keep access.",
  },
  restored: {
    title: "Restored to draft",
    detail: "This is a private draft again. Submit it for review when you want it in the catalog.",
  },
  saved: {
    title: "Saved",
  },
  deleted: {
    title: "Deleted",
  },
  "order-saved": {
    title: "Order saved",
  },
  "question-sent": {
    title: "Question saved",
    detail: "The assistant answers from this course’s lessons.",
  },
  revoked: {
    title: "Certificate revoked",
    detail: "The reference stays in the registry. Public verify now shows it as revoked.",
    tone: "danger",
  },
};

export function withConfirmed(path: string, key: ConfirmationKey) {
  const url = new URL(path, "http://local");
  url.searchParams.set("confirmed", key);
  return `${url.pathname}${url.search}`;
}

export function isConfirmationKey(value: string | null): value is ConfirmationKey {
  return confirmationKeys.includes(value as ConfirmationKey);
}
