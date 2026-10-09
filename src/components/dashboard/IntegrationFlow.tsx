import { ArrowRight, Award, Bot, GraduationCap } from "lucide-react";
import { integrations } from "./constants";

const flowIcons = {
  "registration-lms": GraduationCap,
  "lms-cert": Award,
  "portal-ai": Bot,
} as const;

export function IntegrationFlow() {
  return (
    <section aria-labelledby="automations-title" className="card p-5">
      <h2 id="automations-title" className="section-title">
        Automated handoffs
      </h2>
      <p className="mt-1 text-sm text-muted">
        Live handoffs are recorded as integration events. Retry of failed
        events is Planned.
      </p>

      <ul className="mt-4 divide-y divide-line border-t border-line">
        {integrations.map((integration) => {
          const Icon = flowIcons[integration.id];
          const [from, to] = integration.label.split(" → ");

          return (
            <li key={integration.id} className="flex gap-3 py-4">
              <span
                aria-hidden="true"
                className="grid size-9 shrink-0 place-items-center rounded-lg bg-subtle text-muted"
              >
                <Icon size={18} strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                  <span>{from}</span>
                  <ArrowRight
                    aria-hidden="true"
                    size={14}
                    className="text-brand"
                  />
                  <span>{to}</span>
                  <span
                    className={`text-xs font-medium ${
                      integration.status === "Live"
                        ? "text-success"
                        : "text-muted"
                    }`}
                  >
                    {integration.status}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-muted">{integration.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
