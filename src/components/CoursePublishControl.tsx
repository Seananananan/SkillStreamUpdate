"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Circle, LoaderCircle, Minus } from "lucide-react";
import type { ConfirmationKey } from "@/lib/confirmations";
import { confirmationCopy } from "@/lib/confirmations";
import type { PublishChecklist } from "@/lib/publishChecklist";
import type { CourseReviewStatus, CourseStatus } from "@/lib/types";
import { ActionNotice } from "./feedback/ActionNotice";
import { ConfirmDialog, useConfirmDialog } from "./feedback/ConfirmDialog";

interface CoursePublishControlProps {
  courseId: string;
  status: CourseStatus;
  reviewStatus: CourseReviewStatus;
  reviewFeedback: string | null;
  checklist: PublishChecklist;
  modulesHref: string;
  enrolledCount: number;
}

function noticeForStatus(status: CourseStatus): ConfirmationKey {
  if (status === "published") return "published";
  if (status === "archived") return "archived";
  return "unpublished";
}

export function CoursePublishControl({
  courseId,
  status,
  reviewStatus,
  reviewFeedback,
  checklist,
  modulesHref,
  enrolledCount,
}: CoursePublishControlProps) {
  const router = useRouter();
  const publishConfirm = useConfirmDialog();
  const archiveConfirm = useConfirmDialog();
  const reviewConfirm = useConfirmDialog();
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<ConfirmationKey | null>(null);
  const isPublished = status === "published";
  const isArchived = status === "archived";
  const isSubmitted = reviewStatus === "submitted";
  const isReturned = reviewStatus === "returned";
  const canPublish = checklist.ready;
  const busy = publishConfirm.busy || archiveConfirm.busy || reviewConfirm.busy;

  async function setCourseStatus(
    nextStatus: CourseStatus,
    dialog: ReturnType<typeof useConfirmDialog>,
  ) {
    setError("");
    setNotice(null);

    await dialog.run(async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          setError(data.error ?? "The course status could not be updated.");
          return;
        }

        setNotice(
          status === "archived" && nextStatus === "draft"
            ? "restored"
            : noticeForStatus(nextStatus),
        );
        router.refresh();
      } catch {
        setError("The course status could not be updated. Check your connection.");
      }
    });
  }

  async function sendReview(action: "submit" | "withdraw") {
    setError("");
    setNotice(null);
    await reviewConfirm.run(async () => {
      try {
        const response = await fetch(`/api/courses/${courseId}/review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          setError(data.error ?? "The review request could not be saved.");
          return;
        }
        setNotice(action === "submit" ? "submitted" : "withdrawn");
        router.refresh();
      } catch {
        setError("The review request could not be saved. Check your connection.");
      }
    });
  }

  return (
    <section aria-labelledby="visibility-title" className="card p-5">
      <h2 id="visibility-title" className="section-title">
        Catalog visibility
      </h2>
      <p className="mt-1 text-sm text-muted">
        {isArchived
          ? "This course is archived. It is not listed in the catalog."
          : isPublished
            ? "This course is listed in the student catalog."
            : isSubmitted
              ? "Submitted for review. An admin will publish it or send it back."
              : "This draft is only visible to you. An admin publishes it after review."}
      </p>
      {isArchived && enrolledCount > 0 ? (
        <p className="mt-1 text-sm text-muted">
          {enrolledCount === 1
            ? "1 student who enrolled still has access."
            : `${enrolledCount} students who enrolled still have access.`}
        </p>
      ) : null}

      {isArchived ? (
        <p className="mt-4 rounded-lg bg-subtle px-3 py-2 text-sm text-muted">
          Restore it to a draft if you want to keep editing. Submit it for review
          to put it back in the catalog.
        </p>
      ) : (
        <>
          <h3 id="publish-checklist-heading" className="mt-5 text-sm font-medium">
            Ready for review
          </h3>
          <ul
            className="mt-3 space-y-2.5"
            aria-labelledby="publish-checklist-heading"
          >
            {checklist.items.map((item) => {
              const state = item.done
                ? "done"
                : item.required
                  ? "missing"
                  : "optional";

              return (
                <li key={item.id} className="flex gap-2.5">
                  <span
                    className={
                      state === "done"
                        ? "mt-0.5 text-success"
                        : state === "missing"
                          ? "mt-0.5 text-warn"
                          : "mt-0.5 text-muted"
                    }
                  >
                    <span className="sr-only">
                      {state === "done"
                        ? "Done. "
                        : state === "missing"
                          ? "Not done. "
                          : "Optional, not done. "}
                    </span>
                    {state === "done" ? (
                      <Check aria-hidden="true" size={16} />
                    ) : state === "missing" ? (
                      <Circle aria-hidden="true" size={16} />
                    ) : (
                      <Minus aria-hidden="true" size={16} />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={
                        state === "missing"
                          ? "text-sm font-medium text-ink"
                          : "text-sm text-ink"
                      }
                    >
                      {item.label}
                      {!item.required ? (
                        <span className="font-normal text-muted"> · optional</span>
                      ) : null}
                    </p>
                    {item.detail && !item.done ? (
                      <p className="mt-0.5 text-sm text-muted">{item.detail}</p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>

          {!canPublish ? (
            <p className="mt-4 text-sm text-muted">
              Finish the required items, then submit for review.{" "}
              <Link href={modulesHref} className="font-medium text-brand">
                Open modules and lessons
              </Link>
            </p>
          ) : null}

          {isReturned && reviewFeedback ? (
            <p className="mt-4 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
              An admin sent this back: {reviewFeedback}
            </p>
          ) : null}

          {isPublished && !canPublish ? (
            <p className="mt-4 rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">
              This published course no longer meets the checklist. Students can
              still see it until you return it to draft or archive it.
            </p>
          ) : null}
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {isArchived ? (
          <button
            type="button"
            disabled={busy}
            onClick={publishConfirm.request}
            className="btn btn-primary"
          >
            {publishConfirm.busy ? (
              <LoaderCircle
                aria-hidden="true"
                size={16}
                className="animate-spin"
              />
            ) : null}
            {publishConfirm.busy ? "Saving…" : "Restore to draft"}
          </button>
        ) : isSubmitted ? (
          <button
            type="button"
            disabled={busy}
            onClick={reviewConfirm.request}
            className="btn btn-secondary"
          >
            {reviewConfirm.busy ? (
              <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
            ) : null}
            {reviewConfirm.busy ? "Saving…" : "Withdraw submission"}
          </button>
        ) : isPublished ? (
          <button
            type="button"
            disabled={busy}
            onClick={publishConfirm.request}
            className="btn btn-secondary"
          >
            {publishConfirm.busy ? (
              <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
            ) : null}
            {publishConfirm.busy ? "Saving…" : "Return to draft"}
          </button>
        ) : (
          <button
            type="button"
            disabled={busy || !canPublish}
            onClick={reviewConfirm.request}
            className="btn btn-primary"
          >
            {reviewConfirm.busy ? (
              <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
            ) : null}
            {reviewConfirm.busy
              ? "Saving…"
              : isReturned
                ? "Submit again"
                : "Submit for review"}
          </button>
        )}

        {!isArchived ? (
          <button
            type="button"
            disabled={busy}
            onClick={archiveConfirm.request}
            className="btn btn-quiet"
          >
            {archiveConfirm.busy ? (
              <LoaderCircle
                aria-hidden="true"
                size={16}
                className="animate-spin"
              />
            ) : null}
            {archiveConfirm.busy ? "Saving…" : "Archive course"}
          </button>
        ) : null}
      </div>

      {notice ? (
        <div className="mt-3">
          <ActionNotice
            title={confirmationCopy[notice].title}
            detail={confirmationCopy[notice].detail}
          />
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ConfirmDialog
        open={publishConfirm.open}
        title={
          isArchived ? "Restore this course to draft?" : "Return this course to draft?"
        }
        description={
          isArchived
            ? "It stays off the catalog until an admin publishes it. Enrollments stay in place."
            : "Students will no longer see it in the catalog. Existing enrollments stay in place. Submit it for review when you want it listed again."
        }
        confirmLabel={isArchived ? "Restore to draft" : "Return to draft"}
        tone={isPublished ? "danger" : "brand"}
        busy={publishConfirm.busy}
        onConfirm={() => setCourseStatus("draft", publishConfirm)}
        onCancel={publishConfirm.cancel}
      />

      <ConfirmDialog
        open={archiveConfirm.open}
        title="Archive this course?"
        description={
          enrolledCount > 0
            ? "It will leave the catalog. Existing enrollments, progress, and certificates stay in place."
            : "It will leave the catalog. You can restore it to a draft later."
        }
        confirmLabel="Archive"
        tone="danger"
        busy={archiveConfirm.busy}
        onConfirm={() => setCourseStatus("archived", archiveConfirm)}
        onCancel={archiveConfirm.cancel}
      />

      <ConfirmDialog
        open={reviewConfirm.open}
        title={isSubmitted ? "Withdraw this submission?" : "Submit this course for review?"}
        description={
          isSubmitted
            ? "It leaves the admin queue and stays a private draft."
            : "An admin will publish it or send it back with feedback. Students will not see it until it is published."
        }
        confirmLabel={isSubmitted ? "Withdraw" : "Submit"}
        busy={reviewConfirm.busy}
        onConfirm={() => sendReview(isSubmitted ? "withdraw" : "submit")}
        onCancel={reviewConfirm.cancel}
      />
    </section>
  );
}
