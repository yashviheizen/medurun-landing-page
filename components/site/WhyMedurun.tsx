import { Section, SectionHeading } from "@/components/ui/Section";
import { PrinciplesBand } from "@/components/site/PrinciplesBand";

/**
 * One dark band instead of four cards. The four principles sit on a single ruled
 * line and are uncovered by the scroll sweep — see `PrinciplesBand`.
 */
export function WhyMedurun() {
  return (
    <Section id="why" tone="deep" texture className="border-t border-white/10">
      <SectionHeading
        index="06"
        eyebrow="Why choose MEDURUN?"
        title="Reliability, transparency, and trust — at emergency speed."
        tone="dark"
      />

      <PrinciplesBand />
    </Section>
  );
}
