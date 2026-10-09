"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { withConfirmed } from "@/lib/confirmations";
import { ConfirmDialog, useConfirmDialog } from "./feedback/ConfirmDialog";

export function CreateCourseForm() {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    confirm.request();
  }

  async function handleCreate() {
    setError("");
    await confirm.run(async () => {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          status: "draft",
        }),
      });

      const data = (await response.json()) as { error?: string; id?: string };

      if (!response.ok) {
        setError(data.error ?? "The course could not be created.");
        return;
      }

      router.push(
        withConfirmed(`/instructor/courses/${data.id}/modules`, "course-created"),
      );
      router.refresh();
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="space-y-5 px-5 py-5">
          <div>
            <label className="label" htmlFor="course-title">
              Course title
            </label>
            <input
              id="course-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="field mt-1.5"
              placeholder="Web Development Foundations"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label className="label" htmlFor="course-description">
              Description
            </label>
            <textarea
              id="course-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={5}
              className="field mt-1.5 resize-y"
              placeholder="What students will learn and what they can do afterwards."
            />
            <p className="hint mt-1.5">Shown in the student catalog.</p>
          </div>

          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          <p className="hint">Saved as a draft until an admin publishes it.</p>
          <div className="flex gap-2">
            <Link href="/instructor/courses" className="btn btn-quiet">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={confirm.busy}
              className="btn btn-primary"
            >
              {confirm.busy ? "Creating…" : "Create and add content"}
            </button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={confirm.open}
        title="Create this course?"
        description={`${title || "Untitled course"} will be saved as a draft. Students will not see it until an admin publishes it.`}
        confirmLabel="Create draft"
        busy={confirm.busy}
        onConfirm={handleCreate}
        onCancel={confirm.cancel}
      />
    </>
  );
}
