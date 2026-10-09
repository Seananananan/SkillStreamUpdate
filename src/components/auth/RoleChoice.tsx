import Link from "next/link";
import { PublicShell } from "@/components/landing/PublicShell";
import { ConfirmedBanner } from "@/components/feedback/ConfirmedBanner";

function roleHref(path: string, next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return path;
  return `${path}?next=${encodeURIComponent(next)}`;
}

export function RoleChoice({ next }: { next?: string }) {
  return (
    <PublicShell active="login">
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-7"
      >
        <div className="w-full max-w-[26rem]">
          <h1 className="page-title text-center">Sign in</h1>
          <p className="mt-3 text-center text-sm leading-6 text-muted">
            Choose student or instructor. You can create an account on the next
            screen.
          </p>

          <div className="mt-8">
            <ConfirmedBanner />
          </div>

          <div className="card space-y-3 px-5 py-6 sm:px-6">
            <Link href={roleHref("/login/student", next)} className="btn btn-primary w-full">
              Student
            </Link>
            <Link href={roleHref("/login/instructor", next)} className="btn btn-secondary w-full">
              Instructor
            </Link>
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
