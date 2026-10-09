import { AppShell } from "@/components/AppShell";
import { CreateCourseForm } from "@/components/CreateCourseForm";
import { requireRole } from "@/lib/auth";
import { instructorNav } from "@/lib/nav";

export default async function NewCoursePage() {
  const session = await requireRole(["instructor"]);

  return (
    <AppShell
      user={session}
      title="New course"
      subtitle="Set the basics now. You will add modules and lessons on the next screen."
      nav={instructorNav}
    >
      <CreateCourseForm />
    </AppShell>
  );
}
