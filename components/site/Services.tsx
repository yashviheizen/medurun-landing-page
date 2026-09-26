import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { ServiceExplorer } from "@/components/site/ServiceExplorer";
import { services } from "@/data/site";

export function Services() {
  return (
    <Section id="services" tone="paper">
      <SectionHeading
        index="03"
        eyebrow="What we provide"
        title="One platform for every emergency movement."
      />

      <Reveal className="mt-10 lg:mt-12">
        <ServiceExplorer items={services} />
      </Reveal>
    </Section>
  );
}
