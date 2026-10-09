"use client";

import { useSyncExternalStore } from "react";
import {
  activateThisTab,
  isThisTabLocked,
  subscribeToActiveTabState,
} from "@/lib/singleActiveTab";

export function SingleActiveTab({ children }: { children: React.ReactNode }) {
  const locked = useSyncExternalStore(
    subscribeToActiveTabState,
    isThisTabLocked,
    () => false,
  );

  if (!locked) return children;

  return (
    <main
      id="main-content"
      className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12"
    >
      <div className="card w-full max-w-md px-6 py-8 text-center">
        <p className="text-sm font-semibold text-brand">SkillStream Academy</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Continued in another tab
        </h1>
        <p role="status" className="mt-3 text-sm leading-6 text-muted">
          This tab is inactive because your SkillStream session continued in a
          newer tab.
        </p>
        <button
          type="button"
          className="btn btn-secondary mt-6"
          onClick={activateThisTab}
        >
          Continue in this tab instead
        </button>
      </div>
    </main>
  );
}
