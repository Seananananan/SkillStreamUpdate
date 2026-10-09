import { AppShell } from "@/components/AppShell";
import { IntegrationFlow } from "@/components/dashboard/IntegrationFlow";
import { requireRole } from "@/lib/auth";
import { adminNav } from "@/lib/nav";
import Link from "next/link";

const plannedAreas = [
  {
    path: "/admin/enrollments",
    description: "Search enrollments and fix bad records.",
  },
  {
    path: "/admin/system-health",
    description: "Retry failed access and certificate syncs.",
  },
  { path: "/admin/users", description: "Manage accounts and roles." },
];

export default async function AdminHomePage() {
  const session = await requireRole(["admin"]);

  return (
    <AppShell
      user={session}
      title="Admin console"
      subtitle="Review submitted courses. Other operations stay planned."
      nav={adminNav}
    >
      <div className="space-y-6">
        <section aria-labelledby="review-title" className="card">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 id="review-title" className="section-title">
              Course review
            </h2>
            <Link
              href="/admin/courses"
              className="text-sm font-medium text-brand hover:text-brand-strong"
            >
              Open the queue
            </Link>
          </div>
          <p className="px-5 py-4 text-sm text-muted">
            Instructors submit drafts. Approving publishes the course. Sending
            it back keeps the draft and shows your feedback.
          </p>
        </section>

        <section aria-labelledby="planned-title" className="card">
          <div className="border-b border-line px-5 py-4">
            <h2 id="planned-title" className="section-title">
              Planned areas
            </h2>
          </div>
          <ul className="divide-y divide-line">
            {plannedAreas.map((area) => (
              <li
                key={area.path}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-4"
              >
                <div>
                  <p className="font-mono text-sm">{area.path}</p>
                  <p className="mt-0.5 text-sm text-muted">{area.description}</p>
                </div>
                <span className="text-xs font-medium text-muted">Planned</span>
              </li>
            ))}
          </ul>
        </section>

        <IntegrationFlow />
      </div>
    </AppShell>
  );
}
