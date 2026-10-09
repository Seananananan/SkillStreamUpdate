import type { EnrollmentStatus } from "@/lib/types";

const styles: Record<EnrollmentStatus, string> = {
  pending: "border-warn/25 bg-warn-soft text-warn",
  confirmed: "border-brand/25 bg-brand-soft text-brand-strong",
  active: "border-success/25 bg-success-soft text-success",
  completed: "border-success/25 bg-success-soft text-success",
  cancelled: "border-line bg-subtle text-muted",
};

const labels: Record<EnrollmentStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function EnrollmentBadge({ status }: { status: EnrollmentStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
