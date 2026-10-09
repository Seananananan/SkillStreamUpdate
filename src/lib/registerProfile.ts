import { getUserById } from "./db";
import type { createClient } from "./supabase/server";
import type { User, UserRole } from "./types";

type AuthClient = Awaited<ReturnType<typeof createClient>>;

function metaString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function academyRole(value: unknown): Extract<UserRole, "student" | "instructor"> | null {
  return value === "student" || value === "instructor" ? value : null;
}

export async function ensureAcademyProfile(
  supabase: AuthClient,
  fallback?: { firstName?: string; lastName?: string; role?: string },
): Promise<{ user: User } | { error: string }> {
  const authUser = (await supabase.auth.getUser()).data.user;
  if (!authUser) return { error: "Sign in again to finish this account." };

  const existing = await getUserById(authUser.id);
  if (existing) return { user: existing };

  const meta = authUser.user_metadata ?? {};
  const firstName = metaString(fallback?.firstName) || metaString(meta.first_name);
  const lastName = metaString(fallback?.lastName) || metaString(meta.last_name);
  const role = academyRole(meta.role) ?? academyRole(fallback?.role);
  if (!firstName || !lastName || !role) {
    return {
      error:
        "Email confirmed. Sign in on the student or instructor page you used to create the account.",
    };
  }

  const { error } = await supabase.rpc("register_academy_user", {
    p_first_name: firstName,
    p_last_name: lastName,
    p_role: role,
  });
  if (error) return { error: error.message };

  await supabase.auth.refreshSession();
  const user = await getUserById(authUser.id);
  if (!user) return { error: "Could not create the academy profile." };
  return { user };
}
