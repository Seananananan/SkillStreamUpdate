import { randomBytes, randomUUID } from "crypto";
import type {
  Certificate,
  Course,
  CourseModule,
  Enrollment,
  Lesson,
  LessonProgress,
  LmsAccount,
  User,
} from "./types";
import { normalizeReference, certificateFilePath } from "./certificates";
import { makeIntegrationEvent } from "./integrationEvents";
import { canAccessLessons } from "./access";
import { answerFromLessons } from "./lessonAssistant";
import { parseQuizConfig } from "./lessonContent";
import { coursePublishChecklist, type CourseForPublish } from "./publishChecklist";
import { attentionReason, lastActivityAt, needsAttention } from "./roster";
import { createClient } from "./supabase/server";
import {
  mapCertificate,
  mapConversation,
  mapCourse,
  mapEnrollment,
  mapLesson,
  mapLmsAccount,
  mapMessage,
  mapModule,
  mapProgress,
  mapUser,
} from "./supabase/map";

type DbClient = Awaited<ReturnType<typeof createClient>>;

function throwOnError(error: { message: string } | null, context: string) {
  if (error) throw new Error(`${context}: ${error.message}`);
}

async function db() {
  return createClient();
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .ilike("email", email.trim())
    .maybeSingle();
  throwOnError(error, "getUserByEmail");
  return data ? mapUser(data) : undefined;
}

export async function getUserById(id: string): Promise<User | undefined> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwOnError(error, "getUserById");
  return data ? mapUser(data) : undefined;
}

export async function listCourses(filters?: {
  instructorId?: string;
  status?: Course["status"];
}): Promise<Course[]> {
  const supabase = await db();
  let query = supabase.from("courses").select("*");
  if (filters?.instructorId) query = query.eq("instructor_id", filters.instructorId);
  if (filters?.status) query = query.eq("status", filters.status);
  const { data, error } = await query;
  throwOnError(error, "listCourses");
  return (data ?? []).map(mapCourse);
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  throwOnError(error, "getCourseById");
  return data ? mapCourse(data) : undefined;
}

export async function createCourse(
  input: Omit<
    Course,
    "id" | "createdAt" | "updatedAt" | "reviewStatus" | "reviewFeedback" | "submittedAt"
  >,
): Promise<Course> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      id: randomUUID(),
      instructor_id: input.instructorId,
      title: input.title,
      description: input.description,
      status: input.status,
      review_status: "none",
      review_feedback: null,
      submitted_at: null,
    })
    .select()
    .single();
  throwOnError(error, "createCourse");
  return mapCourse(data);
}

export async function updateCourse(
  id: string,
  input: Partial<
    Pick<Course, "title" | "description" | "status" | "reviewStatus" | "reviewFeedback" | "submittedAt">
  >,
): Promise<Course | undefined> {
  const supabase = await db();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.description !== undefined) patch.description = input.description;
  if (input.status !== undefined) patch.status = input.status;
  if (input.reviewStatus !== undefined) patch.review_status = input.reviewStatus;
  if (input.reviewFeedback !== undefined) patch.review_feedback = input.reviewFeedback;
  if (input.submittedAt !== undefined) patch.submitted_at = input.submittedAt;
  const { data, error } = await supabase
    .from("courses")
    .update(patch)
    .eq("id", id)
    .select()
    .maybeSingle();
  throwOnError(error, "updateCourse");
  return data ? mapCourse(data) : undefined;
}

function checklistError(course: CourseForPublish) {
  const checklist = coursePublishChecklist(course);
  if (checklist.ready) return null;
  const missing = checklist.items.find((item) => item.required && !item.done);
  return missing?.detail
    ? `Finish the checklist first. ${missing.label}. ${missing.detail}`
    : `Finish the checklist first. ${missing?.label ?? "Required items are still open."}`;
}

export async function listCoursesForReview(): Promise<Course[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("courses")
    .select("*")
    .eq("status", "draft")
    .eq("review_status", "submitted")
    .order("submitted_at", { ascending: true });
  throwOnError(error, "listCoursesForReview");
  return (data ?? []).map(mapCourse);
}

export async function submitCourseForReview(instructorId: string, courseId: string) {
  const course = await getCourseWithContent(courseId);
  if (!course || course.instructorId !== instructorId) {
    return { ok: false as const, error: "Not found", status: 404 };
  }
  if (course.status !== "draft") {
    return { ok: false as const, error: "Only a draft can be submitted.", status: 400 };
  }
  if (course.reviewStatus === "submitted") {
    return { ok: false as const, error: "This course is already in review.", status: 400 };
  }
  const error = checklistError(course);
  if (error) return { ok: false as const, error, status: 400 };

  const updated = await updateCourse(courseId, {
    reviewStatus: "submitted",
    reviewFeedback: null,
    submittedAt: new Date().toISOString(),
  });
  if (!updated) return { ok: false as const, error: "Not found", status: 404 };
  return { ok: true as const, course: updated };
}

export async function withdrawCourseReview(instructorId: string, courseId: string) {
  const course = await getCourseById(courseId);
  if (!course || course.instructorId !== instructorId) {
    return { ok: false as const, error: "Not found", status: 404 };
  }
  if (course.reviewStatus !== "submitted") {
    return { ok: false as const, error: "This course is not in review.", status: 400 };
  }
  const updated = await updateCourse(courseId, {
    reviewStatus: "none",
    reviewFeedback: null,
    submittedAt: null,
  });
  if (!updated) return { ok: false as const, error: "Not found", status: 404 };
  return { ok: true as const, course: updated };
}

export async function decideCourseReview(
  courseId: string,
  decision: "approve" | "return",
  feedback?: string,
) {
  const course = await getCourseWithContent(courseId);
  if (!course) return { ok: false as const, error: "Not found", status: 404 };
  if (course.status !== "draft" || course.reviewStatus !== "submitted") {
    return { ok: false as const, error: "This course is not waiting for review.", status: 400 };
  }

  if (decision === "approve") {
    const error = checklistError(course);
    if (error) return { ok: false as const, error, status: 400 };
    const updated = await updateCourse(courseId, {
      status: "published",
      reviewStatus: "none",
      reviewFeedback: null,
      submittedAt: null,
    });
    if (!updated) return { ok: false as const, error: "Not found", status: 404 };
    return { ok: true as const, course: updated };
  }

  const note = feedback?.trim() ?? "";
  if (!note) {
    return { ok: false as const, error: "Write feedback before sending the course back.", status: 400 };
  }
  if (note.length > 1000) {
    return { ok: false as const, error: "Feedback must be 1000 characters or fewer.", status: 400 };
  }
  const updated = await updateCourse(courseId, {
    reviewStatus: "returned",
    reviewFeedback: note,
    submittedAt: null,
  });
  if (!updated) return { ok: false as const, error: "Not found", status: 404 };
  return { ok: true as const, course: updated };
}

export async function listModulesByCourse(courseId: string): Promise<CourseModule[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("course_modules")
    .select("*")
    .eq("course_id", courseId)
    .order("sequence_order", { ascending: true });
  throwOnError(error, "listModulesByCourse");
  return (data ?? []).map(mapModule);
}

export async function createModule(
  input: Omit<CourseModule, "id" | "createdAt">,
): Promise<CourseModule> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("course_modules")
    .insert({
      id: randomUUID(),
      course_id: input.courseId,
      title: input.title,
      sequence_order: input.sequenceOrder,
    })
    .select()
    .single();
  throwOnError(error, "createModule");
  return mapModule(data);
}

export async function listLessonsByModule(moduleId: string): Promise<Lesson[]> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("sequence_order", { ascending: true });
  throwOnError(error, "listLessonsByModule");
  return (data ?? []).map(mapLesson);
}

export async function createLesson(input: Omit<Lesson, "id" | "createdAt">): Promise<Lesson> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("lessons")
    .insert({
      id: randomUUID(),
      module_id: input.moduleId,
      title: input.title,
      sequence_order: input.sequenceOrder,
      content_type: input.contentType,
      content_ref: input.contentRef,
      duration_minutes: input.durationMinutes,
    })
    .select()
    .single();
  throwOnError(error, "createLesson");
  return mapLesson(data);
}

function resequence<T extends { sequenceOrder: number }>(items: T[]) {
  return items
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .map((item, index) => ({ ...item, sequenceOrder: index + 1 }));
}

function swapSequence<T extends { id: string; sequenceOrder: number }>(
  items: T[],
  id: string,
  direction: "up" | "down",
) {
  const ordered = [...items].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const index = ordered.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= ordered.length) return ordered;

  const current = ordered[index];
  ordered[index] = ordered[target];
  ordered[target] = current;
  return ordered.map((item, nextIndex) => ({
    ...item,
    sequenceOrder: nextIndex + 1,
  }));
}

export async function updateModule(
  id: string,
  input: Partial<Pick<CourseModule, "title">>,
): Promise<CourseModule | undefined> {
  const supabase = await db();
  const { data, error } = await supabase
    .from("course_modules")
    .update({ title: input.title })
    .eq("id", id)
    .select()
    .maybeSingle();
  throwOnError(error, "updateModule");
  return data ? mapModule(data) : undefined;
}

export async function deleteModule(courseId: string, moduleId: string) {
  const supabase = await db();
  const { data: existing, error: findError } = await supabase
    .from("course_modules")
    .select("id")
    .eq("id", moduleId)
    .eq("course_id", courseId)
    .maybeSingle();
  throwOnError(findError, "deleteModule");
  if (!existing) return { ok: false as const };

  const { error: deleteError } = await supabase.from("course_modules").delete().eq("id", moduleId);
  throwOnError(deleteError, "deleteModule");

  const remaining = await listModulesByCourse(courseId);
  await Promise.all(
    resequence(remaining).map((item) =>
      supabase.from("course_modules").update({ sequence_order: item.sequenceOrder }).eq("id", item.id),
    ),
  );
  return { ok: true as const };
}

export async function moveModule(courseId: string, moduleId: string, direction: "up" | "down") {
  const courseModules = await listModulesByCourse(courseId);
  const next = swapSequence(courseModules, moduleId, direction);
  if (!next) return undefined;
  const supabase = await db();
  await Promise.all(
    next.map((item) =>
      supabase.from("course_modules").update({ sequence_order: item.sequenceOrder }).eq("id", item.id),
    ),
  );
  return listModulesByCourse(courseId);
}

export async function updateLesson(
  id: string,
  input: Partial<Pick<Lesson, "title" | "contentType" | "contentRef" | "durationMinutes">>,
): Promise<Lesson | undefined> {
  const supabase = await db();
  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.contentType !== undefined) patch.content_type = input.contentType;
  if (input.contentRef !== undefined) patch.content_ref = input.contentRef;
  if (input.durationMinutes !== undefined) patch.duration_minutes = input.durationMinutes;
  const { data, error } = await supabase.from("lessons").update(patch).eq("id", id).select().maybeSingle();
  throwOnError(error, "updateLesson");
  return data ? mapLesson(data) : undefined;
}

export async function createDraftCourseFromOutline(
  instructorId: string,
  input: {
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
  },
): Promise<Course> {
  const course = await createCourse({
    instructorId,
    title: input.title,
    description: input.description,
    status: "draft",
  });

  for (const [moduleIndex, moduleInput] of input.modules.entries()) {
    const courseModule = await createModule({
      courseId: course.id,
      title: moduleInput.title,
      sequenceOrder: moduleIndex + 1,
    });
    for (const [lessonIndex, lessonInput] of moduleInput.lessons.entries()) {
      await createLesson({
        moduleId: courseModule.id,
        title: lessonInput.title,
        sequenceOrder: lessonIndex + 1,
        contentType: lessonInput.contentType,
        contentRef: lessonInput.contentRef,
        durationMinutes: null,
      });
    }
  }

  return course;
}

export async function deleteLesson(moduleId: string, lessonId: string) {
  const supabase = await db();
  const { data: existing, error: findError } = await supabase
    .from("lessons")
    .select("id")
    .eq("id", lessonId)
    .eq("module_id", moduleId)
    .maybeSingle();
  throwOnError(findError, "deleteLesson");
  if (!existing) return { ok: false as const };

  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  throwOnError(error, "deleteLesson");
  const remaining = await listLessonsByModule(moduleId);
  await Promise.all(
    resequence(remaining).map((item) =>
      supabase.from("lessons").update({ sequence_order: item.sequenceOrder }).eq("id", item.id),
    ),
  );
  return { ok: true as const };
}

export async function moveLesson(moduleId: string, lessonId: string, direction: "up" | "down") {
  const lessons = await listLessonsByModule(moduleId);
  const next = swapSequence(lessons, lessonId, direction);
  if (!next) return undefined;
  const supabase = await db();
  await Promise.all(
    next.map((item) =>
      supabase.from("lessons").update({ sequence_order: item.sequenceOrder }).eq("id", item.id),
    ),
  );
  return listLessonsByModule(moduleId);
}

export async function deleteCourse(courseId: string) {
  const supabase = await db();
  const course = await getCourseById(courseId);
  if (!course) return { ok: false as const, error: "Course not found.", status: 404 };

  const { count, error: countError } = await supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("course_id", courseId)
    .neq("status", "cancelled");
  throwOnError(countError, "deleteCourse");
  if ((count ?? 0) > 0) {
    return {
      ok: false as const,
      error: "This course has enrollments. Archive it instead of deleting.",
      status: 409,
    };
  }

  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  throwOnError(error, "deleteCourse");
  return { ok: true as const };
}

export async function getCourseWithContent(courseId: string) {
  const course = await getCourseById(courseId);
  if (!course) return null;

  const modules = await listModulesByCourse(courseId);
  const modulesWithLessons = await Promise.all(
    modules.map(async (module) => ({
      ...module,
      lessons: await listLessonsByModule(module.id),
    })),
  );

  return { ...course, modules: modulesWithLessons };
}

function isOpenEnrollment(status: Enrollment["status"]) {
  return status !== "cancelled";
}

export async function listEnrollments(filters: {
  studentId?: string;
  courseId?: string;
}): Promise<Enrollment[]> {
  const supabase = await db();
  let query = supabase.from("enrollments").select("*").neq("status", "cancelled");
  if (filters.studentId) query = query.eq("student_id", filters.studentId);
  if (filters.courseId) query = query.eq("course_id", filters.courseId);
  const { data, error } = await query;
  throwOnError(error, "listEnrollments");
  return (data ?? []).map(mapEnrollment);
}

export async function getEnrollmentByStudentAndCourse(studentId: string, courseId: string) {
  const enrollments = await listEnrollments({ studentId, courseId });
  return enrollments[0];
}

export async function listEnrollmentsWithCourses(studentId: string) {
  const enrollments = await listEnrollments({ studentId });
  const courses = await Promise.all(
    enrollments.map((enrollment) => getCourseById(enrollment.courseId)),
  );

  return enrollments.flatMap((enrollment, index) => {
    const course = courses[index];
    if (!course) return [];
    return [{ enrollment, course }];
  });
}

async function listProgress(supabase: DbClient, enrollmentId: string) {
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("enrollment_id", enrollmentId);
  throwOnError(error, "listProgress");
  return (data ?? []).map(mapProgress);
}

async function getLmsAccount(supabase: DbClient, enrollmentId: string) {
  const { data, error } = await supabase
    .from("lms_accounts")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();
  throwOnError(error, "getLmsAccount");
  return data ? mapLmsAccount(data) : null;
}

async function getCertificateRow(supabase: DbClient, enrollmentId: string) {
  const { data, error } = await supabase
    .from("certificates")
    .select("*")
    .eq("enrollment_id", enrollmentId)
    .maybeSingle();
  throwOnError(error, "getCertificateRow");
  return data ? mapCertificate(data) : null;
}

async function insertEvent(supabase: DbClient, event: ReturnType<typeof makeIntegrationEvent>) {
  const { error } = await supabase.from("integration_events").insert({
    id: event.id,
    enrollment_id: event.enrollmentId,
    event_type: event.eventType,
    payload: event.payload,
    status: event.status,
    retry_count: event.retryCount,
    last_error: event.lastError,
    created_at: event.createdAt,
    processed_at: event.processedAt,
  });
  throwOnError(error, "insertEvent");
}

export async function listRosterByCourse(courseId: string) {
  const enrollments = await listEnrollments({ courseId });
  const course = await getCourseWithContent(courseId);
  const lessons = course ? flattenCourseLessons(course.modules) : [];
  const supabase = await db();
  const now = new Date().toISOString();

  for (const enrollment of enrollments) {
    await issueCertificateIfEligible(supabase, enrollment, now);
  }

  return (
    await Promise.all(
      enrollments.map(async (enrollment) => {
        const student = await getUserById(enrollment.studentId);
        if (!student) return [];
        const progress = await listProgress(supabase, enrollment.id);
        const activityAt = lastActivityAt(progress);
        const lmsAccount = await getLmsAccount(supabase, enrollment.id);
        return [
          {
            enrollment,
            student: {
              id: student.id,
              firstName: student.firstName,
              lastName: student.lastName,
              email: student.email,
            },
            summary: summarizeProgress(lessons, progress),
            progress,
            lastActivityAt: activityAt,
            needsAttention: needsAttention(enrollment, activityAt, lmsAccount?.syncStatus),
            attentionReason: attentionReason(enrollment, activityAt, lmsAccount?.syncStatus),
            lmsAccount,
            certificate: await getCertificateRow(supabase, enrollment.id),
          },
        ];
      }),
    )
  ).flat();
}

export async function getRosterDetail(courseId: string, enrollmentId: string) {
  const course = await getCourseWithContent(courseId);
  if (!course) return null;

  const roster = await listRosterByCourse(courseId);
  const row = roster.find((item) => item.enrollment.id === enrollmentId);
  if (!row) return null;

  return { ...row, course };
}

export type EnrollResult =
  | { ok: true; enrollment: Enrollment; lmsAccount: LmsAccount }
  | { ok: false; error: string; status: number; enrollment?: Enrollment };

export async function enrollStudent(
  studentId: string,
  courseId: string,
): Promise<EnrollResult> {
  const supabase = await db();
  const course = await getCourseById(courseId);

  if (!course) {
    return { ok: false, error: "Course not found.", status: 404 };
  }

  if (course.status !== "published") {
    return {
      ok: false,
      error: "Only published courses can be enrolled.",
      status: 400,
    };
  }

  const existing = await getEnrollmentByStudentAndCourse(studentId, courseId);
  if (existing) {
    return {
      ok: false,
      error: "You are already enrolled in this course.",
      status: 409,
      enrollment: existing,
    };
  }

  const now = new Date().toISOString();
  const enrollmentId = randomUUID();
  const { data: enrollmentRow, error: enrollError } = await supabase
    .from("enrollments")
    .insert({
      id: enrollmentId,
      student_id: studentId,
      course_id: courseId,
      status: "confirmed",
      enrolled_at: now,
      completed_at: null,
    })
    .select()
    .single();
  if (enrollError?.code === "23505") {
    const again = await getEnrollmentByStudentAndCourse(studentId, courseId);
    return {
      ok: false,
      error: "You are already enrolled in this course.",
      status: 409,
      enrollment: again,
    };
  }
  throwOnError(enrollError, "enrollStudent");

  const { data: lmsRow, error: lmsError } = await supabase
    .from("lms_accounts")
    .insert({
      id: randomUUID(),
      enrollment_id: enrollmentId,
      provisioned_at: null,
      sync_status: "pending",
      external_lms_id: null,
    })
    .select()
    .single();
  throwOnError(lmsError, "enrollStudent lms");

  const enrollment = mapEnrollment(enrollmentRow);
  let lmsAccount = mapLmsAccount(lmsRow);

  const provisionedAt = now;
  const { data: lmsUpdated, error: provisionError } = await supabase
    .from("lms_accounts")
    .update({
      sync_status: "provisioned",
      provisioned_at: provisionedAt,
      external_lms_id: `lms-${enrollment.id.slice(0, 8)}`,
    })
    .eq("id", lmsAccount.id)
    .select()
    .single();
  throwOnError(provisionError, "provision lms");
  lmsAccount = mapLmsAccount(lmsUpdated);

  const { data: enrollmentUpdated, error: activeError } = await supabase
    .from("enrollments")
    .update({
      status: "active",
      enrolled_at: enrollment.enrolledAt ?? now,
    })
    .eq("id", enrollment.id)
    .select()
    .single();
  throwOnError(activeError, "activate enrollment");
  const active = mapEnrollment(enrollmentUpdated);

  await insertEvent(
    supabase,
    makeIntegrationEvent({
      enrollmentId: active.id,
      eventType: "enrollment.confirmed",
      payload: {
        courseId: active.courseId,
        studentId: active.studentId,
        lmsAccountId: lmsAccount.id,
        syncStatus: lmsAccount.syncStatus,
      },
      ok: true,
      at: now,
    }),
  );

  return { ok: true, enrollment: active, lmsAccount };
}

export function flattenCourseLessons(
  modules: Array<CourseModule & { lessons: Lesson[] }>,
) {
  return modules.flatMap((courseModule) => courseModule.lessons);
}

export function summarizeProgress(lessons: Lesson[], progress: LessonProgress[]) {
  const completedIds = new Set(
    progress.filter((item) => item.status === "completed").map((item) => item.lessonId),
  );
  const completed = lessons.filter((lesson) => completedIds.has(lesson.id)).length;
  const total = lessons.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const nextLesson = lessons.find((lesson) => !completedIds.has(lesson.id)) ?? null;
  return { completed, total, percent, nextLesson };
}

export async function listLearningForStudent(studentId: string) {
  const enrolled = await listEnrollmentsWithCourses(studentId);
  const supabase = await db();
  const now = new Date().toISOString();

  for (const { enrollment } of enrolled) {
    await issueCertificateIfEligible(supabase, enrollment, now);
  }

  return Promise.all(
    enrolled.map(async ({ enrollment, course }) => {
      const content = await getCourseWithContent(course.id);
      const lessons = content ? flattenCourseLessons(content.modules) : [];
      const summary = summarizeProgress(lessons, await listProgress(supabase, enrollment.id));
      const certificate = await getCertificateRow(supabase, enrollment.id);
      const lmsAccount = await getLmsAccount(supabase, enrollment.id);
      return { enrollment, course, summary, certificate, lmsAccount };
    }),
  );
}

export async function getPlayerState(studentId: string, courseId: string) {
  const enrollment = await getEnrollmentByStudentAndCourse(studentId, courseId);
  if (!enrollment) return null;

  const course = await getCourseWithContent(courseId);
  if (!course) return null;

  const supabase = await db();
  const progress = await listProgress(supabase, enrollment.id);
  const lessons = flattenCourseLessons(course.modules);
  const summary = summarizeProgress(lessons, progress);
  const lmsAccount = await getLmsAccount(supabase, enrollment.id);
  const certificate =
    enrollment.status === "completed"
      ? await getCertificateForEnrollment(enrollment.id)
      : null;

  return {
    enrollment,
    course,
    progress,
    lessons,
    summary,
    certificate,
    lmsAccount,
  };
}

export async function startLesson(studentId: string, courseId: string, lessonId: string) {
  const supabase = await db();
  const enrollment = await getEnrollmentByStudentAndCourse(studentId, courseId);
  if (!enrollment) {
    return { ok: false as const, error: "Not enrolled.", status: 404 };
  }

  const lmsAccount = await getLmsAccount(supabase, enrollment.id);
  if (!canAccessLessons(enrollment, lmsAccount)) {
    return {
      ok: false as const,
      error: "Course access is not ready.",
      status: 403,
    };
  }

  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("id, module_id")
    .eq("id", lessonId)
    .maybeSingle();
  throwOnError(lessonError, "startLesson lesson");
  if (!lesson) {
    return { ok: false as const, error: "Lesson not found.", status: 404 };
  }
  const { data: courseModule, error: moduleError } = await supabase
    .from("course_modules")
    .select("course_id")
    .eq("id", lesson.module_id)
    .maybeSingle();
  throwOnError(moduleError, "startLesson module");
  if (!courseModule || courseModule.course_id !== courseId) {
    return { ok: false as const, error: "Lesson not found.", status: 404 };
  }

  const { data: existing, error: existingError } = await supabase
    .from("lesson_progress")
    .select("*")
    .eq("enrollment_id", enrollment.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  throwOnError(existingError, "startLesson progress");
  if (existing) {
    return { ok: true as const, progress: mapProgress(existing), enrollment };
  }

  const { data: created, error } = await supabase
    .from("lesson_progress")
    .insert({
      id: randomUUID(),
      enrollment_id: enrollment.id,
      lesson_id: lessonId,
      status: "in_progress",
      completed_at: null,
      score: null,
    })
    .select()
    .single();
  throwOnError(error, "startLesson insert");
  return { ok: true as const, progress: mapProgress(created), enrollment };
}

export async function completeLesson(
  studentId: string,
  courseId: string,
  lessonId: string,
  choiceIndex?: number,
) {
  const started = await startLesson(studentId, courseId, lessonId);
  if (!started.ok) return started;

  const supabase = await db();
  const now = new Date().toISOString();
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", lessonId)
    .maybeSingle();
  throwOnError(lessonError, "completeLesson");
  const mappedLesson = lesson ? mapLesson(lesson) : undefined;
  const needsScore =
    mappedLesson?.contentType === "quiz" || mappedLesson?.contentType === "assignment";

  if (mappedLesson?.contentType === "quiz") {
    const quiz = parseQuizConfig(mappedLesson.contentRef);
    if (quiz.correctIndex == null) {
      return {
        ok: false as const,
        error: "This quiz does not have a correct choice yet.",
        status: 400,
      };
    }
    if (choiceIndex !== quiz.correctIndex) {
      return {
        ok: false as const,
        error: "That answer is not right. Try again.",
        status: 400,
      };
    }
  }

  const { data: progressRow, error: progressError } = await supabase
    .from("lesson_progress")
    .update({
      status: "completed",
      completed_at: now,
      score: needsScore ? 100 : started.progress.score,
    })
    .eq("id", started.progress.id)
    .select()
    .single();
  throwOnError(progressError, "completeLesson progress");

  const course = await getCourseWithContent(courseId);
  const lessons = course ? flattenCourseLessons(course.modules) : [];
  const enrollmentProgress = await listProgress(supabase, started.enrollment.id);
  const summary = summarizeProgress(lessons, enrollmentProgress);
  const completedIds = new Set(
    enrollmentProgress.filter((item) => item.status === "completed").map((item) => item.lessonId),
  );
  const currentIndex = lessons.findIndex((item) => item.id === lessonId);
  const nextLesson =
    lessons.slice(currentIndex + 1).find((item) => !completedIds.has(item.id)) ??
    lessons.find((item) => !completedIds.has(item.id)) ??
    null;

  const wasComplete = started.enrollment.status === "completed";
  let enrollment = started.enrollment;
  if (summary.total > 0 && summary.completed === summary.total) {
    const { data: completedEnrollment, error } = await supabase
      .from("enrollments")
      .update({
        status: "completed",
        completed_at: enrollment.completedAt ?? now,
      })
      .eq("id", enrollment.id)
      .select()
      .single();
    throwOnError(error, "complete enrollment");
    enrollment = mapEnrollment(completedEnrollment);
  }

  const certificate = await issueCertificateIfEligible(supabase, enrollment, now);
  const justCertified =
    Boolean(certificate) && !wasComplete && enrollment.status === "completed";

  return {
    ok: true as const,
    progress: mapProgress(progressRow),
    enrollment,
    summary,
    nextLesson,
    certificate,
    justCertified,
  };
}

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateReferenceNumber(existing: Set<string>, issuedAt: string) {
  const year = new Date(issuedAt).getUTCFullYear();

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const bytes = randomBytes(6);
    let suffix = "";
    for (const byte of bytes) {
      suffix += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
    }
    const reference = `SSA-${year}-${suffix}`;
    if (!existing.has(reference)) {
      return reference;
    }
  }

  return `SSA-${year}-${randomUUID().replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

async function issueCertificateIfEligible(
  supabase: DbClient,
  enrollment: Enrollment,
  now: string,
): Promise<Certificate | null> {
  if (enrollment.status !== "completed") {
    return null;
  }

  const existing = await getCertificateRow(supabase, enrollment.id);
  if (existing) return existing;

  const { data: refs, error: refError } = await supabase
    .from("certificates")
    .select("reference_number");
  throwOnError(refError, "certificate refs");
  const issuedAt = enrollment.completedAt ?? now;
  const referenceNumber = generateReferenceNumber(
    new Set((refs ?? []).map((item) => item.reference_number)),
    issuedAt,
  );
  const { data, error } = await supabase
    .from("certificates")
    .insert({
      id: randomUUID(),
      enrollment_id: enrollment.id,
      reference_number: referenceNumber,
      issued_at: issuedAt,
      file_url: certificateFilePath(referenceNumber),
      verification_status: "valid",
    })
    .select()
    .single();
  if (error?.code === "23505") {
    return getCertificateRow(supabase, enrollment.id);
  }
  throwOnError(error, "issueCertificate");
  const certificate = mapCertificate(data);
  await insertEvent(
    supabase,
    makeIntegrationEvent({
      enrollmentId: enrollment.id,
      eventType: "enrollment.completed",
      payload: {
        courseId: enrollment.courseId,
        studentId: enrollment.studentId,
        certificateId: certificate.id,
        referenceNumber: certificate.referenceNumber,
      },
      ok: true,
      at: now,
    }),
  );
  return certificate;
}

export async function getCertificateForEnrollment(enrollmentId: string) {
  const supabase = await db();
  const { data: enrollment, error } = await supabase
    .from("enrollments")
    .select("*")
    .eq("id", enrollmentId)
    .maybeSingle();
  throwOnError(error, "getCertificateForEnrollment");
  if (!enrollment) return null;
  return issueCertificateIfEligible(supabase, mapEnrollment(enrollment), new Date().toISOString());
}

export async function revokeCertificate(
  instructorId: string,
  courseId: string,
  enrollmentId: string,
) {
  const course = await getCourseById(courseId);
  if (!course) {
    return { ok: false as const, error: "Course not found.", status: 404 };
  }
  if (course.instructorId !== instructorId) {
    return { ok: false as const, error: "Forbidden.", status: 403 };
  }

  const supabase = await db();
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id")
    .eq("id", enrollmentId)
    .eq("course_id", courseId)
    .maybeSingle();
  throwOnError(enrollmentError, "revokeCertificate");
  if (!enrollment) {
    return { ok: false as const, error: "Enrollment not found.", status: 404 };
  }

  const { data, error } = await supabase
    .from("certificates")
    .update({ verification_status: "revoked" })
    .eq("enrollment_id", enrollmentId)
    .select()
    .maybeSingle();
  throwOnError(error, "revokeCertificate");
  if (!data) {
    return { ok: false as const, error: "No certificate to revoke.", status: 404 };
  }
  return { ok: true as const, certificate: mapCertificate(data) };
}

export async function listCertificatesForStudent(studentId: string) {
  const supabase = await db();
  const enrollments = await listEnrollments({ studentId });
  const now = new Date().toISOString();
  for (const enrollment of enrollments) {
    await issueCertificateIfEligible(supabase, enrollment, now);
  }

  const { data, error } = await supabase.from("certificates").select("*");
  throwOnError(error, "listCertificatesForStudent");
  const rows = (data ?? []).map(mapCertificate);

  return (
    await Promise.all(
      rows.map(async (certificate) => {
        const { data: enrollmentRow } = await supabase
          .from("enrollments")
          .select("*")
          .eq("id", certificate.enrollmentId)
          .maybeSingle();
        if (!enrollmentRow || enrollmentRow.student_id !== studentId) return [];
        const enrollment = mapEnrollment(enrollmentRow);
        const course = await getCourseById(enrollment.courseId);
        if (!course) return [];
        return [{ certificate, enrollment, course }];
      }),
    )
  ).flat();
}

export async function getStudentCertificate(studentId: string, certificateId: string) {
  const records = await listCertificatesForStudent(studentId);
  return records.find((item) => item.certificate.id === certificateId) ?? null;
}

export async function getPublicCertificate(referenceNumber: string) {
  const reference = normalizeReference(referenceNumber);
  if (!reference) return null;

  const supabase = await db();
  const { data, error } = await supabase.rpc("lookup_certificate", { p_ref: reference });
  throwOnError(error, "getPublicCertificate");
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;

  return {
    certificate: {
      id: "",
      enrollmentId: "",
      referenceNumber: row.reference_number,
      issuedAt: row.issued_at,
      fileUrl: row.file_url,
      verificationStatus: row.verification_status,
      createdAt: row.issued_at,
    } satisfies Certificate,
    courseTitle: row.course_title,
    studentName: row.student_name,
    issuedAt: row.issued_at,
  };
}

export async function askCourseQuestion(studentId: string, courseId: string, content: string) {
  const question = content.trim();
  if (!question) {
    return { ok: false as const, error: "Write a question first.", status: 400 };
  }
  if (question.length > 2000) {
    return {
      ok: false as const,
      error: "Keep the question under 2,000 characters.",
      status: 400,
    };
  }

  const enrollment = await getEnrollmentByStudentAndCourse(studentId, courseId);
  if (!enrollment) {
    return { ok: false as const, error: "Not enrolled.", status: 404 };
  }

  const course = await getCourseById(courseId);
  if (!course) {
    return { ok: false as const, error: "Course not found.", status: 404 };
  }

  const contentCourse = await getCourseWithContent(courseId);
  const lessons = contentCourse ? flattenCourseLessons(contentCourse.modules) : [];
  const supabase = await db();
  const summary = summarizeProgress(lessons, await listProgress(supabase, enrollment.id));
  const now = new Date().toISOString();
  const conversationId = randomUUID();

  const { data: conversationRow, error: conversationError } = await supabase
    .from("ai_conversations")
    .insert({
      id: conversationId,
      student_id: studentId,
      enrollment_id: enrollment.id,
      started_at: now,
      ended_at: null,
      context_snapshot: {
        courseId: course.id,
        courseTitle: course.title,
        enrollmentStatus: enrollment.status,
        completed: summary.completed,
        total: summary.total,
        percent: summary.percent,
        nextLessonTitle: summary.nextLesson?.title ?? null,
      },
    })
    .select()
    .single();
  throwOnError(conversationError, "askCourseQuestion conversation");

  const { data: messageRow, error: messageError } = await supabase
    .from("ai_messages")
    .insert({
      id: randomUUID(),
      conversation_id: conversationId,
      role: "student",
      content: question,
      created_at: now,
    })
    .select()
    .single();
  throwOnError(messageError, "askCourseQuestion message");

  const conversation = mapConversation(conversationRow);
  const message = mapMessage(messageRow);

  const reply = await answerFromLessons(question, lessons);
  if (reply) {
    await supabase.from("ai_messages").insert({
      id: randomUUID(),
      conversation_id: conversation.id,
      role: "assistant",
      content: reply,
      created_at: new Date().toISOString(),
    });
  }

  return { ok: true as const, conversation, message };
}

export async function listQuestionsForEnrollment(enrollmentId: string) {
  const supabase = await db();
  const { data: conversations, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("enrollment_id", enrollmentId);
  throwOnError(error, "listQuestionsForEnrollment");

  const results = await Promise.all(
    (conversations ?? []).map(async (conversation) => {
      const { data: messages, error: messageError } = await supabase
        .from("ai_messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      throwOnError(messageError, "listQuestions messages");
      const student = (messages ?? []).find((item) => item.role === "student");
      const reply = (messages ?? []).find((item) => item.role === "assistant");
      return {
        id: conversation.id,
        createdAt: student?.created_at ?? conversation.started_at,
        content: student?.content ?? "",
        reply: reply?.content ?? null,
      };
    }),
  );

  return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
