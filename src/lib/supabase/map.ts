import type {
  AiConversation,
  AiMessage,
  Certificate,
  Course,
  CourseModule,
  Enrollment,
  EnrollmentStatus,
  Lesson,
  LessonProgress,
  LmsAccount,
  QuizAttempt,
  User,
} from "../types";

export function iso(value: string | null | undefined): string {
  return value ? new Date(value).toISOString() : "";
}

export function isoNull(value: string | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function mapUser(row: {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: User["role"];
}): User {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
  };
}

export function mapCourse(row: {
  id: string;
  instructor_id: string;
  title: string;
  description: string;
  status: Course["status"];
  review_status: Course["reviewStatus"] | null;
  review_feedback: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}): Course {
  const reviewStatus =
    row.review_status === "submitted" || row.review_status === "returned"
      ? row.review_status
      : "none";
  return {
    id: row.id,
    instructorId: row.instructor_id,
    title: row.title,
    description: row.description,
    status: row.status,
    reviewStatus,
    reviewFeedback: row.review_feedback ?? null,
    submittedAt: isoNull(row.submitted_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapModule(row: {
  id: string;
  course_id: string;
  title: string;
  sequence_order: number;
  created_at: string;
}): CourseModule {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    sequenceOrder: row.sequence_order,
    createdAt: iso(row.created_at),
  };
}

export function mapLesson(row: {
  id: string;
  module_id: string;
  title: string;
  sequence_order: number;
  content_type: Lesson["contentType"];
  content_ref: string;
  duration_minutes: number | null;
  created_at: string;
}): Lesson {
  return {
    id: row.id,
    moduleId: row.module_id,
    title: row.title,
    sequenceOrder: row.sequence_order,
    contentType: row.content_type,
    contentRef: row.content_ref,
    durationMinutes: row.duration_minutes,
    createdAt: iso(row.created_at),
  };
}

export function mapEnrollment(row: {
  id: string;
  student_id: string;
  course_id: string;
  status: EnrollmentStatus;
  enrolled_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}): Enrollment {
  return {
    id: row.id,
    studentId: row.student_id,
    courseId: row.course_id,
    status: row.status,
    enrolledAt: isoNull(row.enrolled_at),
    completedAt: isoNull(row.completed_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapLmsAccount(row: {
  id: string;
  enrollment_id: string;
  provisioned_at: string | null;
  sync_status: LmsAccount["syncStatus"];
  external_lms_id: string | null;
  created_at: string;
  updated_at: string;
}): LmsAccount {
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    provisionedAt: isoNull(row.provisioned_at),
    syncStatus: row.sync_status,
    externalLmsId: row.external_lms_id,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapProgress(row: {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  status: LessonProgress["status"];
  completed_at: string | null;
  score: number | string | null;
  created_at: string;
  updated_at: string;
}): LessonProgress {
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    lessonId: row.lesson_id,
    status: row.status,
    completedAt: isoNull(row.completed_at),
    score: row.score == null ? null : Number(row.score),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapQuizAttempt(row: {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  attempt_number: number;
  status: QuizAttempt["status"];
  answers: unknown;
  score: number | string | null;
  started_at: string;
  expires_at: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}): QuizAttempt {
  const answers = Array.isArray(row.answers)
    ? row.answers.map((answer) =>
        typeof answer === "number" && Number.isInteger(answer) ? answer : null,
      )
    : [];
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    lessonId: row.lesson_id,
    attemptNumber: row.attempt_number,
    status: row.status,
    answers,
    score: row.score == null ? null : Number(row.score),
    startedAt: iso(row.started_at),
    expiresAt: isoNull(row.expires_at),
    submittedAt: isoNull(row.submitted_at),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

export function mapCertificate(row: {
  id: string;
  enrollment_id: string;
  reference_number: string;
  issued_at: string;
  file_url: string;
  verification_status: Certificate["verificationStatus"];
  created_at: string;
}): Certificate {
  return {
    id: row.id,
    enrollmentId: row.enrollment_id,
    referenceNumber: row.reference_number,
    issuedAt: iso(row.issued_at),
    fileUrl: row.file_url,
    verificationStatus: row.verification_status,
    createdAt: iso(row.created_at),
  };
}

export function mapConversation(row: {
  id: string;
  student_id: string;
  enrollment_id: string | null;
  started_at: string;
  ended_at: string | null;
  context_snapshot: AiConversation["contextSnapshot"];
}): AiConversation {
  return {
    id: row.id,
    studentId: row.student_id,
    enrollmentId: row.enrollment_id,
    startedAt: iso(row.started_at),
    endedAt: isoNull(row.ended_at),
    contextSnapshot: row.context_snapshot,
  };
}

export function mapMessage(row: {
  id: string;
  conversation_id: string;
  role: AiMessage["role"];
  content: string;
  created_at: string;
}): AiMessage {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    createdAt: iso(row.created_at),
  };
}
