import {
  Award,
  BookOpen,
  Check,
  ClipboardCheck,
  Globe,
  MessageSquareText,
  PenLine,
  type LucideIcon,
} from "lucide-react";

const stepIcons: Record<string, LucideIcon> = {
  enroll: ClipboardCheck,
  learn: BookOpen,
  certify: Award,
  create: PenLine,
  publish: Globe,
  support: MessageSquareText,
};

interface JourneyStepperProps {
  steps: ReadonlyArray<{
    id: string;
    title: string;
    description: string;
  }>;
  activeStepId: string;
}

export function JourneyStepper({ steps, activeStepId }: JourneyStepperProps) {
  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStepId),
  );

  return (
    <section aria-label="Journey progress" className="card px-5 py-6 sm:px-6">
      <ol className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-0">
        {steps.map((step, index) => {
          const isActive = index === activeIndex;
          const isComplete = index < activeIndex;
          const Icon = stepIcons[step.id] ?? BookOpen;

          return (
            <li
              key={step.id}
              aria-current={isActive ? "step" : undefined}
              className="flex sm:min-w-0 sm:flex-1 sm:flex-col"
            >
              <div className="flex items-center sm:w-full">
                <span
                  className={`grid size-12 shrink-0 place-items-center rounded-full ${
                    isComplete
                      ? "bg-success text-white"
                      : isActive
                        ? "bg-brand text-white"
                        : "border border-line-strong bg-subtle text-muted"
                  }`}
                >
                  {isComplete ? (
                    <Check aria-hidden="true" size={20} strokeWidth={2.4} />
                  ) : (
                    <Icon aria-hidden="true" size={20} strokeWidth={1.8} />
                  )}
                </span>
                {index < steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className={`mx-3 hidden h-0.5 flex-1 sm:block ${
                      isComplete ? "bg-success" : isActive ? "bg-brand" : "bg-line"
                    }`}
                  />
                ) : null}
              </div>

              <div className="ml-3 min-w-0 sm:ml-0 sm:mt-3">
                <p className="text-sm font-medium">
                  {step.title}
                  {isActive ? (
                    <span className="ml-2 text-xs font-normal text-brand">
                      You are here
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-sm text-muted">{step.description}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
