import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { Positioning } from "@/components/site/Positioning";
import { About } from "@/components/site/About";
import { Services } from "@/components/site/Services";
import { PartnerSection } from "@/components/site/PartnerSection";
import { WhyMedurun } from "@/components/site/WhyMedurun";
import { HowItWorks } from "@/components/site/HowItWorks";
import { CredibilityStrip } from "@/components/site/CredibilityStrip";
import { Testimonials } from "@/components/site/Testimonials";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { agencyPartner, driverPartner } from "@/data/site";

export default function HomePage() {
  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Positioning />
        <About />
        <Services />
        <PartnerSection id="drivers" index="04" content={driverPartner} imageSide="left" />
        <PartnerSection id="agencies" index="05" content={agencyPartner} imageSide="right" tone="dark" />
        <WhyMedurun />
        <HowItWorks />
        <CredibilityStrip />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
