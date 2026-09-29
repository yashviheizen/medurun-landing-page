import { Header } from "@/components/site/Header";
import { Hero } from "@/components/site/Hero";
import { JourneyTracker } from "@/components/site/JourneyTracker";
import { Positioning } from "@/components/site/Positioning";
import { About } from "@/components/site/About";
import { Services } from "@/components/site/Services";
import { PartnerStory } from "@/components/site/PartnerStory";
import { WhyMedurun } from "@/components/site/WhyMedurun";
import { HowItWorks } from "@/components/site/HowItWorks";
import { CredibilityStrip } from "@/components/site/CredibilityStrip";
import { Testimonials } from "@/components/site/Testimonials";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";

export default function HomePage() {
  return (
    <>
      <Header />
      <JourneyTracker />
      <main id="main">
        <Hero />
        <Positioning />
        <About />
        <Services />
        <PartnerStory />
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
