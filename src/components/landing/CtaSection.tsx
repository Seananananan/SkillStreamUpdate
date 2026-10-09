import Link from "next/link";

export function CtaSection() {
  return (
    <section className="py-16 md:py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-7">
        <div className="card flex flex-col items-start justify-between gap-6 px-6 py-8 sm:flex-row sm:items-center sm:px-8">
          <div>
            <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
              Walk the path
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-muted">
              Create a student account, or sign in, to enroll, complete
              lessons, and share a certificate reference. Instructors have
              their own sign-in.
            </p>
          </div>
          <Link href="/login" className="btn btn-primary">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
