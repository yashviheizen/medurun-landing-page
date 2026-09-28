import { Section, SectionHeading } from "@/components/ui/Section";
import { PrinciplesBand } from "@/components/site/PrinciplesBand";

/**
 * One dark band instead of four cards. The four principles sit on a single ruled
 * line and are uncovered by the scroll sweep — see `PrinciplesBand`.
 *
 * On a desktop frame that line becomes a stack. The heading and the four
 * principles pin together under the header while a ~250vh track scrolls past, and
 * the principles arrive one at a time, each sliding up to rest over the one before
 * it. The heading is inside the pinned stage rather than above it on purpose: the
 * question it asks is what the four answers are answers *to*, and a sequence whose
 * question has already scrolled off the top is four unattributed statements.
 *
 * `.why-track` and `.why-stage` carry no rules below `lg` or under
 * `prefers-reduced-motion` — they are plain wrappers there, and the band is the
 * four-column rule it has always been.
 */
export function WhyMedurun() {
  return (
    <Section id="why" tone="deep" texture className="border-t border-white/10">
      <div className="why-track">
        <div className="why-stage">
          <SectionHeading
            index="06"
            eyebrow="Why choose MEDURUN?"
            title="Reliability, transparency, and trust — at emergency speed."
            tone="dark"
          />

          <PrinciplesBand />
        </div>
      </div>
    </Section>
  );
}
