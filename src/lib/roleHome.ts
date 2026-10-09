import type { UserRole } from "./types";

export function rolePrefix(role: UserRole): string {
  switch (role) {
    case "student":
      return "/student";
    case "instructor":
      return "/instructor";
    case "admin":
      return "/admin";
  }
}

export function loginPathForRole(role: UserRole): string {
  switch (role) {
    case "student":
      return "/login/student";
    case "instructor":
      return "/login/instructor";
    case "admin":
      return "/admin/login";
  }
}

export function roleHomePath(role: UserRole): string {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "instructor":
      return "/instructor/dashboard";
    case "admin":
      return "/admin";
    default:
      return "/login";
  }
}

export function destinationAfterAuth(role: UserRole, next: string | null): string {
  const home = roleHomePath(role);
  if (!next || !next.startsWith("/") || next.startsWith("//")) return home;
  const prefix = rolePrefix(role);
  if (next === prefix || next.startsWith(`${prefix}/`)) {
    if (next === "/admin/login" || next.startsWith("/admin/login?")) return home;
    return next;
  }
  return home;
}
