"use client";

import { FormEvent, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { confirmationCopy, type ConfirmationKey } from "@/lib/confirmations";
import {
  contentTypeLabels,
  draftFromLesson,
  draftToPayload,
  emptyLessonDraft,
  type LessonDraft,
} from "@/lib/lessonContent";
import type { LessonContentType } from "@/lib/types";
import { LessonContentFields } from "./LessonContentFields";
import { ActionNotice } from "./feedback/ActionNotice";
import { ConfirmDialog, useConfirmDialog } from "./feedback/ConfirmDialog";

type LessonItem = {
  id: string;
  title: string;
  contentType: LessonContentType;
  contentRef: string;
  durationMinutes: number | null;
  sequenceOrder: number;
};

type ModuleItem = {
  id: string;
  title: string;
  sequenceOrder: number;
  lessons: LessonItem[];
};

type PendingDelete =
  | { kind: "module"; id: string; title: string }
  | { kind: "lesson"; moduleId: string; id: string; title: string };

interface ModuleEditorProps {
  courseId: string;
  initialModules: ModuleItem[];
}

function sortModules(modules: ModuleItem[]) {
  return [...modules]
    .map((courseModule) => ({
      ...courseModule,
      lessons: [...courseModule.lessons].sort(
        (a, b) => a.sequenceOrder - b.sequenceOrder,
      ),
    }))
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
}

export function ModuleEditor({ courseId, initialModules }: ModuleEditorProps) {
  const addModuleConfirm = useConfirmDialog();
  const addLessonConfirm = useConfirmDialog();
  const deleteConfirm = useConfirmDialog();
  const [modules, setModules] = useState(() => sortModules(initialModules));
  const [moduleTitle, setModuleTitle] = useState("");
  const [lessonDrafts, setLessonDrafts] = useState<Record<string, LessonDraft>>(
    {},
  );
  const [pendingLessonModuleId, setPendingLessonModuleId] = useState<
    string | null
  >(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editLessonDraft, setEditLessonDraft] = useState<LessonDraft | null>(
    null,
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<
    | "module-added"
    | "lesson-added"
    | "saved"
    | "deleted"
    | "order-saved"
    | null
  >(null);

  const lessonCount = modules.reduce(
    (total, courseModule) => total + courseModule.lessons.length,
    0,
  );
  const pendingLessonDraft = pendingLessonModuleId
    ? (lessonDrafts[pendingLessonModuleId] ?? emptyLessonDraft())
    : emptyLessonDraft();
  const pendingLessonTitle = pendingLessonDraft.title.trim();
  const pendingLessonModule = modules.find(
    (courseModule) => courseModule.id === pendingLessonModuleId,
  );

  function flash(next: NonNullable<typeof notice>) {
    setNotice(next);
    setError("");
  }

  function requestAddModule(event: FormEvent) {
    event.preventDefault();
    addModuleConfirm.request();
  }

  function lessonDraftFor(moduleId: string) {
    return lessonDrafts[moduleId] ?? emptyLessonDraft();
  }

  function patchLessonDraft(moduleId: string, patch: Partial<LessonDraft>) {
    setLessonDrafts((current) => ({
      ...current,
      [moduleId]: { ...(current[moduleId] ?? emptyLessonDraft()), ...patch },
    }));
  }

  function requestAddLesson(moduleId: string) {
    const parsed = draftToPayload(lessonDraftFor(moduleId));
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setPendingLessonModuleId(moduleId);
    addLessonConfirm.request();
  }

  function requestDelete(target: PendingDelete) {
    setPendingDelete(target);
    deleteConfirm.request();
  }

  function startEditModule(courseModule: ModuleItem) {
    setEditingLessonId(null);
    setEditingModuleId(courseModule.id);
    setEditTitle(courseModule.title);
  }

  function startEditLesson(lesson: LessonItem) {
    setEditingModuleId(null);
    setEditingLessonId(lesson.id);
    setEditLessonDraft(draftFromLesson(lesson));
  }

  function cancelEdit() {
    setEditingModuleId(null);
    setEditingLessonId(null);
    setEditTitle("");
    setEditLessonDraft(null);
  }

  async function addModule() {
    setError("");
    setNotice(null);
    await addModuleConfirm.run(async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/modules`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: moduleTitle }),
        });

        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "The module could not be added.");
          return;
        }

        setModules((current) =>
          sortModules([...current, { ...data, lessons: [] }]),
        );
        setModuleTitle("");
        flash("module-added");
      } catch {
        setError("The module could not be added. Check your connection.");
      }
    });
  }

  async function addLesson() {
    const moduleId = pendingLessonModuleId;
    const parsed = draftToPayload(pendingLessonDraft);
    if (!moduleId || !parsed.ok) return;

    setError("");
    setNotice(null);
    await addLessonConfirm.run(async () => {
      try {
        const response = await fetch(
          `/api/courses/${courseId}/modules/${moduleId}/lessons`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.payload),
          },
        );

        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "The lesson could not be added.");
          return;
        }

        setModules((current) =>
          sortModules(
            current.map((courseModule) =>
              courseModule.id === moduleId
                ? { ...courseModule, lessons: [...courseModule.lessons, data] }
                : courseModule,
            ),
          ),
        );
        setLessonDrafts((current) => ({
          ...current,
          [moduleId]: emptyLessonDraft(),
        }));
        setPendingLessonModuleId(null);
        flash("lesson-added");
      } catch {
        setError("The lesson could not be added. Check your connection.");
      }
    });
  }

  async function saveModuleTitle(moduleId: string) {
    const title = editTitle.trim();
    if (!title) return;
    setSavingId(moduleId);
    setError("");
    setNotice(null);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/modules/${moduleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "The module could not be saved.");
        return;
      }
      setModules((current) =>
        current.map((courseModule) =>
          courseModule.id === moduleId ? { ...courseModule, title } : courseModule,
        ),
      );
      cancelEdit();
      flash("saved");
    } catch {
      setError("The module could not be saved. Check your connection.");
    } finally {
      setSavingId(null);
    }
  }

  async function saveLesson(moduleId: string, lessonId: string) {
    if (!editLessonDraft) return;
    const parsed = draftToPayload(editLessonDraft);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setSavingId(lessonId);
    setError("");
    setNotice(null);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(parsed.payload),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "The lesson could not be saved.");
        return;
      }
      setModules((current) =>
        current.map((courseModule) =>
          courseModule.id === moduleId
            ? {
                ...courseModule,
                lessons: courseModule.lessons.map((lesson) =>
                  lesson.id === lessonId
                    ? { ...lesson, ...parsed.payload }
                    : lesson,
                ),
              }
            : courseModule,
        ),
      );
      cancelEdit();
      flash("saved");
    } catch {
      setError("The lesson could not be saved. Check your connection.");
    } finally {
      setSavingId(null);
    }
  }

  async function moveModule(moduleId: string, direction: "up" | "down") {
    setError("");
    setNotice(null);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/modules/${moduleId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "The order could not be saved.");
        return;
      }
      const byId = new Map<string, number>(
        (data as Array<{ id: string; sequenceOrder: number }>).map((item) => [
          item.id,
          item.sequenceOrder,
        ]),
      );
      setModules((current) =>
        sortModules(
          current.map((courseModule) => ({
            ...courseModule,
            sequenceOrder: byId.get(courseModule.id) ?? courseModule.sequenceOrder,
          })),
        ),
      );
      flash("order-saved");
    } catch {
      setError("The order could not be saved. Check your connection.");
    }
  }

  async function moveLesson(
    moduleId: string,
    lessonId: string,
    direction: "up" | "down",
  ) {
    setError("");
    setNotice(null);
    try {
      const response = await fetch(
        `/api/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ direction }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "The order could not be saved.");
        return;
      }
      const byId = new Map<string, number>(
        (data as Array<{ id: string; sequenceOrder: number }>).map((item) => [
          item.id,
          item.sequenceOrder,
        ]),
      );
      setModules((current) =>
        sortModules(
          current.map((courseModule) =>
            courseModule.id === moduleId
              ? {
                  ...courseModule,
                  lessons: courseModule.lessons.map((lesson) => ({
                    ...lesson,
                    sequenceOrder: byId.get(lesson.id) ?? lesson.sequenceOrder,
                  })),
                }
              : courseModule,
          ),
        ),
      );
      flash("order-saved");
    } catch {
      setError("The order could not be saved. Check your connection.");
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setError("");
    setNotice(null);
    await deleteConfirm.run(async () => {
      try {
        const url =
          pendingDelete.kind === "module"
            ? `/api/courses/${courseId}/modules/${pendingDelete.id}`
            : `/api/courses/${courseId}/modules/${pendingDelete.moduleId}/lessons/${pendingDelete.id}`;
        const response = await fetch(url, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) {
          setError(data.error ?? "The item could not be deleted.");
          return;
        }

        setModules((current) => {
          if (pendingDelete.kind === "module") {
            return sortModules(
              current
                .filter((courseModule) => courseModule.id !== pendingDelete.id)
                .map((courseModule, index) => ({
                  ...courseModule,
                  sequenceOrder: index + 1,
                })),
            );
          }
          return sortModules(
            current.map((courseModule) =>
              courseModule.id === pendingDelete.moduleId
                ? {
                    ...courseModule,
                    lessons: courseModule.lessons
                      .filter((lesson) => lesson.id !== pendingDelete.id)
                      .map((lesson, index) => ({
                        ...lesson,
                        sequenceOrder: index + 1,
                      })),
                  }
                : courseModule,
            ),
          );
        });
        setPendingDelete(null);
        flash("deleted");
      } catch {
        setError("The item could not be deleted. Check your connection.");
      }
    });
  }

  return (
    <div className="max-w-3xl space-y-5">
      <form onSubmit={requestAddModule} className="card p-5">
        <label className="label" htmlFor="module-title">
          Add a module
        </label>
        <p className="hint mt-0.5">A group of related lessons.</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            id="module-title"
            value={moduleTitle}
            onChange={(event) => setModuleTitle(event.target.value)}
            placeholder="HTML fundamentals"
            className="field flex-1"
            required
          />
          <button
            type="submit"
            disabled={addModuleConfirm.busy}
            className="btn btn-primary"
          >
            <Plus aria-hidden="true" size={16} />
            {addModuleConfirm.busy ? "Adding…" : "Add module"}
          </button>
        </div>
      </form>

      {notice ? (
        <ActionNotice
          title={confirmationCopy[notice as ConfirmationKey].title}
          onDismiss={() => setNotice(null)}
        />
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {modules.length === 0 ? (
        <div className="card px-5 py-10">
          <p className="text-sm font-medium">This course has no content</p>
          <p className="mt-1 max-w-md text-sm text-muted">
            Add a module above, then list the lessons inside it.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted">
            {modules.length} module{modules.length === 1 ? "" : "s"} ·{" "}
            {lessonCount} lesson{lessonCount === 1 ? "" : "s"}
          </p>

          {modules.map((courseModule, moduleIndex) => (
            <section key={courseModule.id} className="card">
              <header className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
                <span className="text-sm tabular-nums text-muted">
                  {String(courseModule.sequenceOrder).padStart(2, "0")}
                </span>
                {editingModuleId === courseModule.id ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                    <label className="sr-only" htmlFor={`edit-module-${courseModule.id}`}>
                      Module title
                    </label>
                    <input
                      id={`edit-module-${courseModule.id}`}
                      value={editTitle}
                      onChange={(event) => setEditTitle(event.target.value)}
                      className="field flex-1"
                    />
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="btn-icon"
                        disabled={savingId === courseModule.id || !editTitle.trim()}
                        onClick={() => saveModuleTitle(courseModule.id)}
                        aria-label="Save module title"
                      >
                        <Check aria-hidden="true" size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={cancelEdit}
                        aria-label="Cancel editing module"
                      >
                        <X aria-hidden="true" size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h2 className="min-w-0 flex-1 truncate text-sm font-medium">
                      {courseModule.title}
                    </h2>
                    <span className="shrink-0 text-xs text-muted">
                      {courseModule.lessons.length} lesson
                      {courseModule.lessons.length === 1 ? "" : "s"}
                    </span>
                    <div className="flex">
                      <button
                        type="button"
                        className="btn-icon"
                        disabled={moduleIndex === 0}
                        onClick={() => moveModule(courseModule.id, "up")}
                        aria-label={`Move ${courseModule.title} up`}
                      >
                        <ChevronUp aria-hidden="true" size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        disabled={moduleIndex === modules.length - 1}
                        onClick={() => moveModule(courseModule.id, "down")}
                        aria-label={`Move ${courseModule.title} down`}
                      >
                        <ChevronDown aria-hidden="true" size={16} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => startEditModule(courseModule)}
                        aria-label={`Edit ${courseModule.title}`}
                      >
                        <Pencil aria-hidden="true" size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() =>
                          requestDelete({
                            kind: "module",
                            id: courseModule.id,
                            title: courseModule.title,
                          })
                        }
                        aria-label={`Delete ${courseModule.title}`}
                      >
                        <Trash2 aria-hidden="true" size={15} />
                      </button>
                    </div>
                  </>
                )}
              </header>

              {courseModule.lessons.length > 0 ? (
                <ul className="divide-y divide-line">
                  {courseModule.lessons.map((lesson, lessonIndex) => (
                    <li
                      key={lesson.id}
                      className={
                        editingLessonId === lesson.id
                          ? "px-5 py-4"
                          : "flex flex-wrap items-center gap-2 px-5 py-2.5"
                      }
                    >
                      {editingLessonId === lesson.id && editLessonDraft ? (
                        <div className="space-y-3">
                          <LessonContentFields
                            idPrefix={`edit-lesson-${lesson.id}`}
                            values={editLessonDraft}
                            onChange={(patch) =>
                              setEditLessonDraft((current) =>
                                current ? { ...current, ...patch } : current,
                              )
                            }
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn btn-primary"
                              disabled={
                                savingId === lesson.id ||
                                !editLessonDraft.title.trim()
                              }
                              onClick={() =>
                                saveLesson(courseModule.id, lesson.id)
                              }
                            >
                              <Check aria-hidden="true" size={16} />
                              {savingId === lesson.id ? "Saving…" : "Save lesson"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={cancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className="min-w-0 flex-1 truncate text-sm">
                            {lesson.title}
                          </span>
                          <span className="shrink-0 text-xs text-muted">
                            {contentTypeLabels[lesson.contentType]}
                            {lesson.durationMinutes
                              ? ` · ${lesson.durationMinutes} min`
                              : ""}
                          </span>
                          <div className="flex">
                            <button
                              type="button"
                              className="btn-icon"
                              disabled={lessonIndex === 0}
                              onClick={() =>
                                moveLesson(courseModule.id, lesson.id, "up")
                              }
                              aria-label={`Move ${lesson.title} up`}
                            >
                              <ChevronUp aria-hidden="true" size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              disabled={
                                lessonIndex === courseModule.lessons.length - 1
                              }
                              onClick={() =>
                                moveLesson(courseModule.id, lesson.id, "down")
                              }
                              aria-label={`Move ${lesson.title} down`}
                            >
                              <ChevronDown aria-hidden="true" size={16} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => startEditLesson(lesson)}
                              aria-label={`Edit ${lesson.title}`}
                            >
                              <Pencil aria-hidden="true" size={15} />
                            </button>
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() =>
                                requestDelete({
                                  kind: "lesson",
                                  moduleId: courseModule.id,
                                  id: lesson.id,
                                  title: lesson.title,
                                })
                              }
                              aria-label={`Delete ${lesson.title}`}
                            >
                              <Trash2 aria-hidden="true" size={15} />
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="space-y-3 border-t border-line px-5 py-4">
                <LessonContentFields
                  idPrefix={`lesson-${courseModule.id}`}
                  values={lessonDraftFor(courseModule.id)}
                  onChange={(patch) => patchLessonDraft(courseModule.id, patch)}
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => requestAddLesson(courseModule.id)}
                    disabled={
                      addLessonConfirm.busy ||
                      !lessonDraftFor(courseModule.id).title.trim()
                    }
                    className="btn btn-secondary"
                  >
                    <Plus aria-hidden="true" size={16} />
                    {addLessonConfirm.busy &&
                    pendingLessonModuleId === courseModule.id
                      ? "Adding…"
                      : "Add lesson"}
                  </button>
                </div>
              </div>
            </section>
          ))}
        </>
      )}

      <ConfirmDialog
        open={addModuleConfirm.open}
        title="Add this module?"
        description={`${moduleTitle || "Untitled module"} will be added to the course outline.`}
        confirmLabel="Add module"
        busy={addModuleConfirm.busy}
        onConfirm={addModule}
        onCancel={addModuleConfirm.cancel}
      />

      <ConfirmDialog
        open={addLessonConfirm.open}
        title="Add this lesson?"
        description={`${pendingLessonTitle || "Untitled lesson"} (${contentTypeLabels[pendingLessonDraft.contentType]})${pendingLessonModule ? ` will be added to ${pendingLessonModule.title}.` : "."}`}
        confirmLabel="Add lesson"
        busy={addLessonConfirm.busy}
        onConfirm={addLesson}
        onCancel={() => {
          addLessonConfirm.cancel();
          if (!addLessonConfirm.busy) setPendingLessonModuleId(null);
        }}
      />

      <ConfirmDialog
        open={deleteConfirm.open}
        title={
          pendingDelete?.kind === "module"
            ? "Delete this module?"
            : "Delete this lesson?"
        }
        description={
          pendingDelete?.kind === "module"
            ? `${pendingDelete.title} and its lessons will be removed from the outline.`
            : `${pendingDelete?.title ?? "This lesson"} will be removed from the outline.`
        }
        confirmLabel="Delete"
        tone="danger"
        busy={deleteConfirm.busy}
        onConfirm={confirmDelete}
        onCancel={() => {
          deleteConfirm.cancel();
          if (!deleteConfirm.busy) setPendingDelete(null);
        }}
      />
    </div>
  );
}
