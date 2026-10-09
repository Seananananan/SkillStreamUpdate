import Link from "next/link";
import { ChevronRight, type LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
  disabledLabel?: string;
}

export function QuickActionCard({
  title,
  description,
  href,
  icon: Icon,
  disabled,
  disabledLabel = "Not available yet",
}: QuickActionCardProps) {
  const content = (
    <div className="flex min-w-0 items-start gap-3">
      <span
        aria-hidden="true"
        className={`mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg ${
          disabled ? "bg-subtle text-muted" : "bg-brand-soft text-brand-strong"
        }`}
      >
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{description}</p>
      </div>
    </div>
  );

  if (disabled) {
    return (
      <div className="flex items-center justify-between gap-4 px-5 py-4 opacity-60">
        {content}
        <span className="shrink-0 text-xs font-medium text-muted">
          {disabledLabel}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 px-5 py-4 hover:bg-subtle"
    >
      {content}
      <ChevronRight
        aria-hidden="true"
        size={17}
        className="shrink-0 text-muted group-hover:text-brand"
      />
    </Link>
  );
}
