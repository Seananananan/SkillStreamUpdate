"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BookOpen,
  LayoutDashboard,
  Library,
  ShieldCheck,
} from "lucide-react";
import type { SessionUser } from "@/lib/types";
import { BrandMark } from "./BrandMark";
import { ConfirmedBanner } from "./feedback/ConfirmedBanner";
import { LogoutButton } from "./LogoutButton";

const roleLabels: Record<SessionUser["role"], string> = {
  student: "Student",
  instructor: "Instructor",
  admin: "Admin",
};

const navIcons = {
  Home: LayoutDashboard,
  Catalog: Library,
  Courses: BookOpen,
  "My courses": BookOpen,
  Certificates: Award,
  Overview: ShieldCheck,
};

interface AppShellProps {
  user: SessionUser;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  nav: { href: string; label: string }[];
}

function isNavActive(pathname: string, href: string, nav: { href: string }[]) {
  if (pathname === href) return true;
  if (!pathname.startsWith(href)) return false;

  return !nav.some(
    (candidate) =>
      candidate.href !== href &&
      candidate.href.startsWith(href) &&
      pathname.startsWith(candidate.href),
  );
}

export function AppShell({
  user,
  title,
  subtitle,
  actions,
  children,
  nav,
}: AppShellProps) {
  const pathname = usePathname();
  const roleLabel = roleLabels[user.role];

  return (
    <div className="min-h-screen bg-canvas text-ink lg:grid lg:grid-cols-[200px_minmax(0,1fr)]">
      <aside className="border-b border-line bg-canvas lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 px-5 py-3 lg:block lg:px-6 lg:pt-7 lg:pb-8">
          <BrandMark subtitle={roleLabel} />
          <div className="lg:hidden">
            <LogoutButton
              iconOnly
              redirectTo={user.role === "admin" ? "/admin/login" : "/login"}
            />
          </div>
        </div>

        <nav
          aria-label={`${roleLabel} navigation`}
          className="flex border-t border-line lg:flex-1 lg:flex-col lg:border-t-0 lg:px-6"
        >
          {nav.map((item) => {
            const active = isNavActive(pathname, item.href, nav);
            const Icon =
              navIcons[item.label as keyof typeof navIcons] ?? BookOpen;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-11 flex-1 items-center justify-center gap-2.5 border-b-2 px-3 text-sm lg:flex-none lg:justify-start lg:border-0 lg:px-0 ${
                  active
                    ? "border-brand font-medium text-ink"
                    : "border-transparent text-muted hover:text-ink"
                }`}
              >
                <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto hidden border-t border-line px-6 py-5 lg:block">
          <p className="truncate text-sm font-medium">
            {user.firstName} {user.lastName}
          </p>
          <p className="mt-0.5 truncate text-xs text-muted" title={user.email}>
            {user.email}
          </p>
          <div className="mt-3">
            <LogoutButton
              redirectTo={user.role === "admin" ? "/admin/login" : "/login"}
            />
          </div>
        </div>
      </aside>

      <main
        id="main-content"
        className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-7 lg:px-10 lg:py-10"
      >
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
          <div className="min-w-0">
            <h1 className="page-title">{title}</h1>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {subtitle}
              </p>
            ) : null}
          </div>
          {actions ? (
            <div className="flex w-full min-w-0 items-center justify-end gap-2 sm:w-auto">
              {actions}
            </div>
          ) : null}
        </header>

        <Suspense fallback={null}>
          <ConfirmedBanner />
        </Suspense>

        {children}
      </main>
    </div>
  );
}
