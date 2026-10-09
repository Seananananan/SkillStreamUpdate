export function normalizeReference(value: string) {
  const compact = value.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  const match = compact.match(/^SSA(\d{4})([A-Z0-9]{6})$/);
  if (match) {
    return `SSA-${match[1]}-${match[2]}`;
  }

  return value.trim().toUpperCase().replace(/\s+/g, "");
}

export function certificateFilePath(referenceNumber: string) {
  return `/api/certificates/${encodeURIComponent(referenceNumber)}`;
}

export function formatIssuedDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
