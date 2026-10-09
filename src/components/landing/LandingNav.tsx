import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function LandingNav({
  active,
}: {
  active?: "login" | "verify";
}) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-canvas/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-7">
        <BrandMark stacked={false} />

        <nav aria-label="Primary" className="flex min-w-0 items-center gap-1 sm:gap-2">
          <a
            href="/#how-it-works"
            className="inline-flex min-h-11 items-center px-2 text-sm font-medium text-muted hover:text-ink sm:px-3"
          >
            How it works
          </a>
          <Link
            href="/verify"
            aria-current={active === "verify" ? "page" : undefined}
            className={`inline-flex min-h-11 items-center px-2 text-sm font-medium sm:px-3 ${
              active === "verify" ? "text-ink" : "text-muted hover:text-ink"
            }`}
          >
            Verify
          </Link>
          {active === "login" ? (
            <span className="btn btn-primary ml-1" aria-current="page">
              Sign in
            </span>
          ) : (
            <Link href="/login" className="btn btn-primary ml-1">
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
