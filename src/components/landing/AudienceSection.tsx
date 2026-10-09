import { ScopeBadge } from "@/components/landing/ScopeBadge";

const audiences = [
  {
    title: "Students",
    items: [
      { text: "Browse and enroll in published courses", status: "Live" as const },
      { text: "Track lesson progress in one place", status: "Live" as const },
      {
        text: "Share a certificate reference anyone can check",
        status: "Live" as const,
      },
      {
        text: "Ask the course assistant about a lesson",
        status: "Live" as const,
      },
    ],
  },
  {
    title: "Instructors",
    items: [
      { text: "Build courses from modules and lessons", status: "Live" as const },
      { text: "Submit a course for an admin to publish", status: "Live" as const },
      { text: "Follow student progress per course", status: "Live" as const },
    ],
  },
];

export function AudienceSection() {
  return (
    <section id="roles" className="border-t border-line bg-surface py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-7">
        <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Students and instructors, in the same academy
        </h2>
        <p className="mt-3 max-w-[40rem] text-muted">
          Create a student or instructor account, or sign in. Features that
          are not built yet are marked Planned.
        </p>

        <div className="mt-10 grid gap-12 md:grid-cols-2 md:gap-16">
          {audiences.map((audience) => (
            <div key={audience.title}>
              <h3 className="text-lg font-semibold">{audience.title}</h3>
              <ul className="mt-5 space-y-3">
                {audience.items.map((item) => (
                  <li
                    key={item.text}
                    className="flex items-start justify-between gap-4 text-sm leading-6 text-muted"
                  >
                    <span>{item.text}</span>
                    <ScopeBadge status={item.status} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
