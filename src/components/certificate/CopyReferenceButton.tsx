"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function CopyReferenceButton({
  referenceNumber,
}: {
  referenceNumber: string;
}) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleCopy() {
    setError("");
    try {
      await navigator.clipboard.writeText(referenceNumber);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
      setError("The reference could not be copied. Select it and copy manually.");
    }
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleCopy}
        className="btn btn-secondary"
      >
        {copied ? (
          <Check aria-hidden="true" size={16} />
        ) : (
          <Copy aria-hidden="true" size={16} />
        )}
        {copied ? "Copied" : "Copy reference"}
      </button>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </span>
  );
}
