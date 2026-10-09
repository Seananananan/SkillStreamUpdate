import type { CourseStatus } from "@/lib/types";

const tones = [
  "bg-brand-soft text-brand-strong",
  "bg-subtle text-ink",
  "bg-success-soft text-success",
] as const;

function coverTone(title: string, status?: CourseStatus) {
  if (status === "draft") return "bg-warn-soft text-warn";
  if (status === "archived") return "bg-subtle text-muted";

  let hash = 0;
  for (const character of title) {
    hash += character.charCodeAt(0);
  }
  return tones[hash % tones.length];
}

export function CourseCover({
  title,
  status,
}: {
  title: string;
  status?: CourseStatus;
}) {
  const letter = title.trim().charAt(0).toUpperCase() || "?";

  return (
    <span
      aria-hidden="true"
      className={`grid size-12 shrink-0 place-items-center rounded-lg text-lg font-semibold ${coverTone(title, status)}`}
    >
      {letter}
    </span>
  );
}
