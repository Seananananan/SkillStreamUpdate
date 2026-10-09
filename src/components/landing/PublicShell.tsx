import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";

export function PublicShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: "login" | "verify";
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <LandingNav active={active} />
      {children}
      <LandingFooter />
    </div>
  );
}
