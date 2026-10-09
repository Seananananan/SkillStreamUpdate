import type { Metadata } from "next";
import { Geist_Mono, Source_Sans_3 } from "next/font/google";
import { SingleActiveTab } from "@/components/auth/SingleActiveTab";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Skillstream Academy",
    template: "%s · Skillstream Academy",
  },
  description:
    "A connected learning platform for enrollment, guided learning, and verifiable certification.",
};

function DirectionContract() {
  return (
    <div
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: `<!--
THESIS: The landing is the LMS category page: type-first offer, enroll→learn→certify in one view, Sign in as the only primary. It refuses metaphor worlds.
OWN-WORLD: Daylight laptop. Canvas #f8fafc, white panels, ink #0f172a, teal #0F766E. Source Sans 3. 8px radius, 1px slate lines, offset shadows. Path rail and form panels — not icon-tile grids.
STORY: A faculty evaluator sees the journey is real, planned V1 is labeled, and can sign in as a student or verify a certificate without an account.
FIRST VIEWPORT: Sticky How it works / Verify / Sign in (Verify on mobile). Headline left, three-step rail right, Sign in under the lede.
FORM: Category standard (canon) against Canvas, Moodle, Coursera. Seed key 4b6604bd. Signature: Sign in defaults to the student demo; the path rail lights Enroll first.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`,
      }}
      hidden
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sourceSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <DirectionContract />
        <a
          href="#main-content"
          className="fixed left-4 top-4 z-100 -translate-y-24 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <SingleActiveTab>{children}</SingleActiveTab>
      </body>
    </html>
  );
}
