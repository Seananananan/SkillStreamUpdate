import { redirect } from "next/navigation";
import { getUserById } from "./db";
import { roleHomePath } from "./roleHome";
import { createClient } from "./supabase/server";
import type { SessionUser, UserRole } from "./types";

export { roleHomePath } from "./roleHome";

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const user = await getUserById(data.user.id);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(roles: UserRole[]): Promise<SessionUser> {
  const session = await requireSession();
  if (!roles.includes(session.role)) {
    redirect(roleHomePath(session.role));
  }
  return session;
}

export async function endSession(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
