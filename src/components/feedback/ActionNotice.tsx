export function ActionNotice({
  tone = "success",
  title,
  detail,
  onDismiss,
}: {
  tone?: "success" | "danger";
  title: string;
  detail?: string;
  onDismiss?: () => void;
}) {
  const isSuccess = tone === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 ${
        isSuccess
          ? "border-success/25 bg-success-soft"
          : "border-danger/20 bg-danger-soft"
      }`}
    >
      <div className="min-w-0">
        <p
          className={`text-sm font-medium ${
            isSuccess ? "text-success" : "text-danger"
          }`}
        >
          {title}
        </p>
        {detail ? (
          <p className="mt-0.5 text-sm text-muted">{detail}</p>
        ) : null}
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-sm font-medium text-muted hover:text-ink"
        >
          Dismiss
        </button>
      ) : null}
    </div>
  );
}
