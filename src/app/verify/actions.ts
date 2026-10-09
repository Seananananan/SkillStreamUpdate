"use server";

import { redirect } from "next/navigation";
import { normalizeReference } from "@/lib/certificates";

export async function lookupCertificate(formData: FormData) {
  const reference = normalizeReference(String(formData.get("ref") ?? ""));
  if (!reference) {
    redirect("/verify");
  }
  redirect(`/verify/${encodeURIComponent(reference)}`);
}
