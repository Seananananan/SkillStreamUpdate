import { PublicShell } from "@/components/landing/PublicShell";
import { VerifyForm } from "@/components/certificate/VerifyForm";

export default function VerifyIndexPage() {
  return (
    <PublicShell active="verify">
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-7"
      >
        <div className="w-full max-w-[28rem]">
          <h1 className="page-title text-center">Verify a certificate</h1>
          <p className="mt-3 text-center text-sm leading-6 text-muted">
            Enter the reference number from a Skillstream Academy certificate.
            Anyone can check it — you do not need an account.
          </p>
          <div className="card mt-8 px-5 py-6 sm:px-6">
            <VerifyForm />
          </div>
        </div>
      </main>
    </PublicShell>
  );
}
