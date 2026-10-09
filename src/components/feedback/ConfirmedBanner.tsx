"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  confirmationCopy,
  isConfirmationKey,
} from "@/lib/confirmations";
import { ActionNotice } from "./ActionNotice";

export function ConfirmedBanner() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const key = searchParams.get("confirmed");
  const copy = isConfirmationKey(key) ? confirmationCopy[key] : null;

  const dismiss = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("confirmed");
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  if (!copy) return null;

  return (
    <div className="mb-6">
      <ActionNotice
        tone={copy.tone ?? "success"}
        title={copy.title}
        detail={copy.detail}
        onDismiss={dismiss}
      />
    </div>
  );
}
