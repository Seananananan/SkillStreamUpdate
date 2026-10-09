import Link from "next/link";
import { PathRail } from "@/components/landing/PathRail";

export function HeroSection() {
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 sm:px-7 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] lg:gap-16">
      <div>
        <h1 className="max-w-2xl text-[2.35rem] font-semibold leading-[1.12] tracking-[-0.035em] sm:text-5xl lg:text-[3.35rem]">
          Enroll, learn, and get a certificate you can verify
        </h1>
        <p className="mt-6 max-w-[40rem] text-lg leading-8 text-muted">
          Skillstream Academy connects those three steps so nobody has to chase
          handoffs by hand. Confirming enrollment opens the course. Finishing
          every lesson issues a public reference.
        </p>

        <div className="mt-9 flex flex-wrap gap-3">
          <Link href="/login" className="btn btn-primary">
            Sign in
          </Link>
          <a href="/verify" className="btn btn-secondary">
            Verify a certificate
          </a>
        </div>
      </div>

      <div className="card px-5 py-6 sm:px-6">
        <p className="text-sm font-semibold">The student path</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          Three steps. The joins in between already run.
        </p>
        <div className="mt-5">
          <PathRail />
        </div>
      </div>
    </section>
  );
}
