import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  hint: string;
  icon: LucideIcon;
  tone?: "brand" | "success" | "warn" | "muted";
}

const tones = {
  brand: "bg-brand-soft text-brand-strong",
  success: "bg-success-soft text-success",
  warn: "bg-warn-soft text-warn",
  muted: "bg-subtle text-muted",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
}: StatCardProps) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-muted">{label}</p>
        <span
          aria-hidden="true"
          className={`grid size-9 place-items-center rounded-lg ${tones[tone]}`}
        >
          <Icon size={18} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
