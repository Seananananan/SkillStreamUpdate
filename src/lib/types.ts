export type UserRole = "student" | "instructor" | "admin";

export type CourseStatus = "draft" | "published" | "archived";

export type CourseReviewStatus = "none" | "submitted" | "returned";

export type LessonContentType = "video" | "text" | "quiz" | "assignment";

export type EnrollmentStatus =
  | "pending"
  | "confirmed"
  | "active"
  | "completed"
  | "cancelled";

export type LmsSyncStatus = "pending" | "provisioned" | "failed";

export type LessonProgressStatus = "not_started" | "in_progress" | "completed";

export type QuizAttemptStatus = "in_progress" | "passed" | "failed" | "timed_out";

export type CertificateVerificationStatus = "valid" | "revoked";

export type IntegrationEventType =
  | "enrollment.confirmed"
  | "enrollment.completed";

export type IntegrationEventStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface Course {
  id: string;
  instructorId: string;
  title: string;
  description: string;
  status: CourseStatus;
  reviewStatus: CourseReviewStatus;
  reviewFeedback: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  sequenceOrder: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  sequenceOrder: number;
  contentType: LessonContentType;
  contentRef: string;
  durationMinutes: number | null;
  createdAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LmsAccount {
  id: string;
  enrollmentId: string;
  provisionedAt: string | null;
  syncStatus: LmsSyncStatus;
  externalLmsId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LessonProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  status: LessonProgressStatus;
  completedAt: string | null;
  score: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  enrollmentId: string;
  lessonId: string;
  attemptNumber: number;
  status: QuizAttemptStatus;
  answers: Array<number | null>;
  score: number | null;
  startedAt: string;
  expiresAt: string | null;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  enrollmentId: string;
  referenceNumber: string;
  issuedAt: string;
  fileUrl: string;
  verificationStatus: CertificateVerificationStatus;
  createdAt: string;
}

export type AiMessageRole = "student" | "assistant" | "system";

export interface AiConversation {
  id: string;
  studentId: string;
  enrollmentId: string | null;
  startedAt: string;
  endedAt: string | null;
  contextSnapshot: {
    courseId: string;
    courseTitle: string;
    enrollmentStatus: EnrollmentStatus;
    completed: number;
    total: number;
    percent: number;
    nextLessonTitle: string | null;
  } | null;
}

export interface AiMessage {
  id: string;
  conversationId: string;
  role: AiMessageRole;
  content: string;
  createdAt: string;
}

export interface IntegrationEvent {
  id: string;
  enrollmentId: string;
  eventType: IntegrationEventType;
  payload: Record<string, unknown>;
  status: IntegrationEventStatus;
  retryCount: number;
  lastError: string | null;
  createdAt: string;
  processedAt: string | null;
}

export interface DataStore {
  users: User[];
  courses: Course[];
  modules: CourseModule[];
  lessons: Lesson[];
  enrollments: Enrollment[];
  lmsAccounts: LmsAccount[];
  lessonProgress: LessonProgress[];
  quizAttempts: QuizAttempt[];
  certificates: Certificate[];
  integrationEvents: IntegrationEvent[];
  aiConversations: AiConversation[];
  aiMessages: AiMessage[];
}
