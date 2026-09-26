import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { termsAndConditions } from "@/data/legal";
import { company } from "@/data/site";

export const metadata: Metadata = {
  title: `Terms & Conditions — ${company.name}`,
  description: `The terms governing use of the MEDURUN platform, operated by ${company.legalName}.`,
};

export default function TermsPage() {
  return <LegalPage title="Terms & Conditions" paragraphs={termsAndConditions} />;
}
