import { ScopeBadge } from "@/components/landing/ScopeBadge";

const steps = [
  {
    title: "Enroll",
    description:
      "Choose a published course and confirm your place. Course access is set up after you enroll.",
    status: "Live" as const,
  },
  {
    title: "Learn",
    description:
      "Work through modules and lessons. Completion is recorded per lesson. The course assistant answers from that course’s lesson text.",
    status: "Live" as const,
  },
  {
    title: "Get certified",
    description:
      "When every lesson is done, a certificate is issued with a server-generated reference. Anyone can check it without an account.",
    status: "Live" as const,
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="border-t border-line bg-surface py-16 md:py-20"
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-7">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          How it works
        </h2>
        <p className="mt-3 max-w-[40rem] text-muted">
          The path the evaluator walks is live. Planned V1 is labeled where it
          appears later on this page.
        </p>

        <ol className="mt-10 divide-y divide-line border-y border-line">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="grid gap-3 py-6 sm:grid-cols-[2.5rem_1fr_auto] sm:items-start sm:gap-6"
            >
              <span
                aria-hidden="true"
                className="text-sm font-semibold tabular-nums text-brand"
              >
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1.5 max-w-[42rem] text-sm leading-6 text-muted">
                  {step.description}
                </p>
              </div>
              <ScopeBadge status={step.status} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
