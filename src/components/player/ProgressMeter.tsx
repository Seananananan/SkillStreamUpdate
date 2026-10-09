export function ProgressMeter({
  completed,
  total,
  percent,
}: {
  completed: number;
  total: number;
  percent: number;
}) {
  const tone = percent === 100 ? "bg-success" : "bg-brand";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm text-muted">
          {total === 0
            ? "No lessons yet"
            : `${completed} of ${total} lesson${total === 1 ? "" : "s"} complete`}
        </p>
        <p className="text-sm font-medium tabular-nums">{percent}%</p>
      </div>
      <div
        className="mt-2 h-1.5 overflow-hidden rounded-full bg-subtle"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Course progress"
      >
        <div
          className={`h-full rounded-full ${tone}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
