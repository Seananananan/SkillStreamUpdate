"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { withConfirmed } from "@/lib/confirmations";
import { ConfirmDialog, useConfirmDialog } from "./feedback/ConfirmDialog";

interface LogoutButtonProps {
  iconOnly?: boolean;
  redirectTo?: string;
}

export function LogoutButton({
  iconOnly = false,
  redirectTo = "/login",
}: LogoutButtonProps) {
  const router = useRouter();
  const confirm = useConfirmDialog();

  async function handleLogout() {
    await confirm.run(async () => {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push(withConfirmed(redirectTo, "signed-out"));
      router.refresh();
    });
  }

  return (
    <>
      {iconOnly ? (
        <button
          type="button"
          onClick={confirm.request}
          aria-label="Log out"
          className="grid size-11 place-items-center text-muted hover:text-ink"
        >
          <LogOut aria-hidden="true" size={17} strokeWidth={1.8} />
        </button>
      ) : (
        <button
          type="button"
          onClick={confirm.request}
          className="text-left text-sm text-muted hover:text-ink"
        >
          Log out
        </button>
      )}

      <ConfirmDialog
        open={confirm.open}
        title="Log out?"
        description="You will need to sign in again to reach your courses or authoring workspace."
        confirmLabel="Log out"
        tone="danger"
        busy={confirm.busy}
        onConfirm={handleLogout}
        onCancel={confirm.cancel}
      />
    </>
  );
}
