const steps = [
  {
    title: "Enroll",
    detail: "Confirm a place. Course access is set up after you enroll.",
  },
  {
    title: "Learn",
    detail: "Complete modules and lessons. Progress is recorded as you go.",
  },
  {
    title: "Get certified",
    detail: "Finishing every lesson issues a public reference anyone can check.",
  },
] as const;

export function PathRail() {
  return (
    <ol className="path-rail">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-3">
          <div className="flex flex-col items-center self-stretch">
            <span
              className="path-rail-dot grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            {index < steps.length - 1 ? (
              <span className="path-rail-line mt-1 w-px min-h-5 flex-1" />
            ) : null}
          </div>
          <div className={index < steps.length - 1 ? "pb-5" : ""}>
            <p className="pt-2 text-sm font-semibold">{step.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{step.detail}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
