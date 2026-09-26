import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import { company } from "@/data/site";
import { asset } from "@/lib/asset";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://medurun.com"),
  // Named explicitly so the sub-path build points at its own copy rather than
  // the host's root, which is where a browser looks for /favicon.ico by default.
  icons: { icon: asset("/favicon.ico") },
  title: `${company.name} — ${company.tagline}`,
  description:
    "MEDURUN is India's digital healthcare mobility platform connecting patients and hospitals with ambulance providers, medical agencies, and emergency response teams.",
  openGraph: {
    title: `${company.name} — ${company.tagline}`,
    description:
      "A technology-driven emergency network for patients, hospitals, agencies, and crews.",
    type: "website",
    url: "https://medurun.com",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${instrumentSerif.variable}`}>
      <head>
        {/* Marks JS as available so scroll-reveal styles apply only when they can
            be undone. Inlined to run before first paint and avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.add('js')",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
