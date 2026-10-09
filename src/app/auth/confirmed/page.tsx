import { AuthReturn } from "@/components/auth/AuthReturn";
import { getSession } from "@/lib/auth";
import { roleHomePath } from "@/lib/roleHome";

export default async function EmailConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const confirmed = status === "success";
  const session = confirmed ? await getSession() : null;
  const dashboardPath = session ? roleHomePath(session.role) : "/login";

  return (
    <AuthReturn
      confirmed={confirmed && Boolean(session)}
      dashboardPath={dashboardPath}
    />
  );
}
