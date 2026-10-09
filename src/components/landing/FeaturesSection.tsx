import { integrations } from "@/components/dashboard/constants";
import { ScopeBadge } from "@/components/landing/ScopeBadge";

export function FeaturesSection() {
  return (
    <section id="connected" className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-7">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          What it connects
        </h2>
        <p className="mt-3 max-w-[40rem] text-muted">
          Registration, the course platform, and certification behave as one
          system. Support that is not built yet stays labeled Planned.
        </p>

        <ul className="mt-10 divide-y divide-line border-y border-line">
          {integrations.map((integration) => {
            const [from, to] = integration.label.split(" → ");

            return (
              <li
                key={integration.id}
                className="grid gap-3 py-6 sm:grid-cols-[1fr_auto] sm:items-start sm:gap-6"
              >
                <div className="min-w-0">
                  <p className="font-semibold">
                    {from}
                    <span className="mx-2 font-normal text-brand" aria-hidden="true">
                      →
                    </span>
                    {to}
                  </p>
                  <p className="mt-1.5 max-w-[42rem] text-sm leading-6 text-muted">
                    {integration.detail}
                  </p>
                </div>
                <ScopeBadge status={integration.status} />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
