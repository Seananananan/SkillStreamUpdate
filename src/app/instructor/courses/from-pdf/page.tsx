import { AppShell } from "@/components/AppShell";
import { PdfCourseForm } from "@/components/PdfCourseForm";
import { requireRole } from "@/lib/auth";
import { instructorNav } from "@/lib/nav";

export default async function CourseFromPdfPage() {
  const session = await requireRole(["instructor"]);

  return (
    <AppShell
      user={session}
      title="Create from a PDF"
      subtitle="The PDF becomes a private draft. Review the modules and lessons, then submit the course for review."
      nav={instructorNav}
    >
      <PdfCourseForm />
    </AppShell>
  );
}
