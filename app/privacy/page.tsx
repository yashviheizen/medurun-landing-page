import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { privacyPolicy } from "@/data/legal";
import { company } from "@/data/site";

export const metadata: Metadata = {
  title: `Privacy Policy — ${company.name}`,
  description: `How ${company.legalName} collects, uses, and protects personal information across the MEDURUN platform.`,
};

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" paragraphs={privacyPolicy} />;
}
