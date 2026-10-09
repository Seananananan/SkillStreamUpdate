import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ModuleEditor } from "@/components/ModuleEditor";
import { requireRole } from "@/lib/auth";
import { instructorNav } from "@/lib/nav";
import { getCourseWithContent } from "@/lib/db";

type PageProps = { params: Promise<{ id: string }> };

export default async function CourseModulesPage({ params }: PageProps) {
  const session = await requireRole(["instructor"]);
  const { id } = await params;
  const course = await getCourseWithContent(id);

  if (!course || course.instructorId !== session.id) {
    notFound();
  }

  return (
    <AppShell
      user={session}
      title="Modules and lessons"
      subtitle={course.title}
      nav={instructorNav}
      actions={
        <Link
          href={`/instructor/courses/${course.id}`}
          className="btn btn-secondary"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          Back to course
        </Link>
      }
    >
      <ModuleEditor courseId={course.id} initialModules={course.modules} />
    </AppShell>
  );
}
