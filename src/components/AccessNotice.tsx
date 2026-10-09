import { accessCopy, type CourseAccessState } from "@/lib/access";

export function AccessNotice({ state }: { state: CourseAccessState }) {
  if (state === "ready") return null;

  const copy = accessCopy[state];
  const failed = state === "failed";

  return (
    <p
      role={failed ? "alert" : "status"}
      className={`mt-3 rounded-lg px-3 py-2 text-sm ${
        failed ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn"
      }`}
    >
      <span className="font-medium">{copy.title}.</span> {copy.detail}
    </p>
  );
}
