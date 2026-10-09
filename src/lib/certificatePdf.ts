import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { CertificateVerificationStatus } from "./types";
import { formatIssuedDate } from "./certificates";

const PAGE_WIDTH = 792;
const PAGE_HEIGHT = 612;

function winAnsi(value: string) {
  return value
    .replaceAll("–", "-")
    .replaceAll("—", "-")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("’", "'")
    .replaceAll("‘", "'")
    .replace(/[^\u0020-\u00ff]/g, "");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number) {
  const words = winAnsi(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function drawCentered(
  page: PDFPage,
  text: string,
  y: number,
  font: PDFFont,
  size: number,
  color: ReturnType<typeof rgb>,
) {
  const safe = winAnsi(text);
  const width = font.widthOfTextAtSize(safe, size);
  page.drawText(safe, {
    x: (PAGE_WIDTH - width) / 2,
    y,
    size,
    font,
    color,
  });
}

export async function buildCertificatePdf(input: {
  studentName: string;
  courseTitle: string;
  issuedAt: string;
  referenceNumber: string;
  status: CertificateVerificationStatus;
  verifyUrl: string;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(15 / 255, 23 / 255, 42 / 255);
  const muted = rgb(71 / 255, 85 / 255, 105 / 255);
  const brand = rgb(15 / 255, 118 / 255, 110 / 255);
  const danger = rgb(185 / 255, 28 / 255, 28 / 255);
  const line = rgb(226 / 255, 232 / 255, 240 / 255);
  const revoked = input.status === "revoked";

  page.drawRectangle({
    x: 28,
    y: 28,
    width: PAGE_WIDTH - 56,
    height: PAGE_HEIGHT - 56,
    borderColor: brand,
    borderWidth: 2,
  });
  page.drawRectangle({
    x: 36,
    y: 36,
    width: PAGE_WIDTH - 72,
    height: PAGE_HEIGHT - 72,
    borderColor: line,
    borderWidth: 1,
  });

  drawCentered(page, "Skillstream Academy", 500, bold, 14, brand);
  drawCentered(page, "Certificate of completion", 458, bold, 28, ink);
  drawCentered(page, "This certifies that", 400, regular, 12, muted);
  drawCentered(page, input.studentName, 358, bold, 26, ink);
  drawCentered(page, "has completed", 312, regular, 12, muted);

  const titleLines = wrapText(input.courseTitle, bold, 16, 560);
  titleLines.forEach((lineText, index) => {
    drawCentered(page, lineText, 276 - index * 22, bold, 16, ink);
  });

  const detailY = 276 - titleLines.length * 22 - 36;
  const issued = formatIssuedDate(input.issuedAt);
  const statusLabel = revoked ? "Revoked" : "Valid";
  drawCentered(
    page,
    `Issued ${issued}  ·  ${statusLabel}  ·  ${input.referenceNumber}`,
    detailY,
    regular,
    11,
    revoked ? danger : muted,
  );
  drawCentered(page, `Verify at ${input.verifyUrl}`, detailY - 28, regular, 10, brand);

  pdf.setTitle(`Certificate ${input.referenceNumber}`);
  pdf.setAuthor("Skillstream Academy");
  pdf.setSubject(winAnsi(input.courseTitle));
  return pdf.save();
}
