import Link from "next/link";

interface BrandMarkProps {
  href?: string;
  subtitle?: string;
  stacked?: boolean;
}

export function BrandMark({
  href = "/",
  subtitle = "Academy",
  stacked = true,
}: BrandMarkProps) {
  return (
    <Link href={href} className="text-ink">
      {stacked ? (
        <span className="block">
          <span className="block text-[15px] font-semibold leading-none tracking-tight">
            Skillstream
          </span>
          <span className="mt-1 block text-xs leading-none text-muted">
            {subtitle}
          </span>
        </span>
      ) : (
        <span className="text-[15px] font-semibold tracking-tight">
          Skillstream
          <span className="hidden sm:inline"> {subtitle}</span>
        </span>
      )}
    </Link>
  );
}
