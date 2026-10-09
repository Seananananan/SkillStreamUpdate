export function ScopeBadge({ status }: { status: "Live" | "Planned" }) {
  const live = status === "Live";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold ${
        live
          ? "border-success/25 bg-success-soft text-success"
          : "border-warn/25 bg-warn-soft text-warn"
      }`}
    >
      {status}
    </span>
  );
}
