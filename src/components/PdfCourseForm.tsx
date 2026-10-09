"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { withConfirmed } from "@/lib/confirmations";
import { ConfirmDialog, useConfirmDialog } from "./feedback/ConfirmDialog";

const MAX_PDF_BYTES = 8 * 1024 * 1024;

export function PdfCourseForm() {
  const router = useRouter();
  const confirm = useConfirmDialog();
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!file) {
      setError("Choose a PDF first.");
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Choose a PDF file.");
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError("Use a PDF under 8 MB.");
      return;
    }
    confirm.request();
  }

  async function handleCreate() {
    if (!file) return;
    setError("");
    await confirm.run(async () => {
      try {
        const body = new FormData();
        body.set("file", file);
        const response = await fetch("/api/courses/from-pdf", {
          method: "POST",
          body,
        });
        const data = (await response.json()) as { error?: string; id?: string };
        if (!response.ok || !data.id) {
          setError(data.error ?? "The PDF could not be turned into a course.");
          return;
        }
        router.push(withConfirmed(`/instructor/courses/${data.id}`, "course-from-pdf"));
        router.refresh();
      } catch {
        setError("The PDF could not be turned into a course. Check your connection.");
      }
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="card max-w-2xl">
        <div className="space-y-5 px-5 py-5">
          <div>
            <label className="label" htmlFor="course-pdf">
              PDF
            </label>
            <input
              id="course-pdf"
              type="file"
              accept="application/pdf,.pdf"
              className="field mt-1.5"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              required
            />
            <p className="hint mt-1.5">
              The draft uses the text in the PDF. A scanned page with no selectable text cannot be read. Students will not see the course until an admin publishes it.
            </p>
          </div>
          {error ? (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
          <p className="hint">Saved as a draft for you to review.</p>
          <div className="flex gap-2">
            <Link href="/instructor/courses" className="btn btn-quiet">
              Cancel
            </Link>
            <button type="submit" disabled={confirm.busy} className="btn btn-primary">
              {confirm.busy ? "Creating draft…" : "Create draft course"}
            </button>
          </div>
        </div>
      </form>
      <ConfirmDialog
        open={confirm.open}
        title="Create a draft course from this PDF?"
        description={`${file?.name ?? "This PDF"} will become a private draft with modules and lessons. Students will not see it until an admin publishes it.`}
        confirmLabel="Create draft"
        busy={confirm.busy}
        onConfirm={handleCreate}
        onCancel={confirm.cancel}
      />
    </>
  );
}
