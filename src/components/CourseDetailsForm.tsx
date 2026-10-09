"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { confirmationCopy, withConfirmed } from "@/lib/confirmations";
import { ActionNotice } from "./feedback/ActionNotice";
import { ConfirmDialog, useConfirmDialog } from "./feedback/ConfirmDialog";

export function CourseDetailsForm({
  courseId,
  title: initialTitle,
  description: initialDescription,
  enrolledCount,
}: {
  courseId: string;
  title: string;
  description: string;
  enrolledCount: number;
}) {
  const router = useRouter();
  const deleteConfirm = useConfirmDialog();
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<"saved" | "deleted" | null>(null);

  const dirty =
    title.trim() !== initialTitle ||
    description.trim() !== initialDescription;

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError("");
    setNotice(null);
    setSaving(true);

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
        }),
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error ?? "The course could not be saved.");
        return;
      }

      setNotice("saved");
      router.refresh();
    } catch {
      setError("The course could not be saved. Check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setError("");
    setNotice(null);
    await deleteConfirm.run(async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`, {
          method: "DELETE",
        });
        const data = (await response.json()) as { error?: string };

        if (!response.ok) {
          setError(data.error ?? "The course could not be deleted.");
          return;
        }

        router.push(withConfirmed("/instructor/courses", "deleted"));
        router.refresh();
      } catch {
        setError("The course could not be deleted. Check your connection.");
      }
    });
  }

  return (
    <section aria-labelledby="details-title" className="card max-w-2xl">
      <div className="border-b border-line px-5 py-4">
        <h2 id="details-title" className="section-title">
          Course details
        </h2>
      </div>

      <form onSubmit={handleSave} className="space-y-5 px-5 py-5">
        <div>
          <label className="label" htmlFor="edit-course-title">
            Course title
          </label>
          <input
            id="edit-course-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="field mt-1.5"
            required
          />
        </div>

        <div>
          <label className="label" htmlFor="edit-course-description">
            Description
          </label>
          <textarea
            id="edit-course-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            className="field mt-1.5 resize-y"
          />
        </div>

        {notice ? (
          <ActionNotice
            title={confirmationCopy[notice].title}
            onDismiss={() => setNotice(null)}
          />
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <button
            type="button"
            onClick={deleteConfirm.request}
            disabled={enrolledCount > 0 || deleteConfirm.busy}
            className="btn btn-quiet"
          >
            Delete course
          </button>
          <button
            type="submit"
            disabled={saving || !dirty}
            className="btn btn-primary"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>

        {enrolledCount > 0 ? (
          <p className="hint">
            {enrolledCount} student{enrolledCount === 1 ? "" : "s"} enrolled.
            Delete is blocked so those records stay intact. Archive the course
            to take it off the catalog.
          </p>
        ) : (
          <p className="hint">
            Deleting removes this draft and its content. Enrolled courses cannot
            be deleted.
          </p>
        )}
      </form>

      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete this course?"
        description={`${initialTitle} and its modules and lessons will be removed. This cannot be undone.`}
        confirmLabel="Delete course"
        tone="danger"
        busy={deleteConfirm.busy}
        onConfirm={handleDelete}
        onCancel={deleteConfirm.cancel}
      />
    </section>
  );
}
