import { Section, SectionHeading } from "@/components/ui/Section";
import { WhyJourney } from "@/components/site/WhyJourney";

/**
 * The four principles as one horizontal journey rather than four stacked claims.
 *
 * On a desktop frame the section is a ~320vh track with a 100vh sticky stage. The
 * question stays pinned at the top left for the whole of it — a sequence whose
 * question has already scrolled off the top is four unattributed statements — and
 * underneath it the four cards are walked past the middle of the screen, right to
 * left, by the page scrolling down. `WhyJourney` owns the motion; this file owns
 * only the three boxes the motion needs.
 *
 * `.wy-track` and `.wy-stage` carry no rules at all below `lg`, under
 * `prefers-reduced-motion`, or with scripting off: there the same four cards are a
 * native scroll-snap carousel, and every word of them is on the page.
 */
export function WhyMedurun() {
  return (
    <Section id="why" tone="deep" texture className="wy-section border-t border-white/10">
      <div className="wy-track">
        <div className="wy-stage">
          <SectionHeading
            className="wy-head"
            index="06"
            eyebrow="Why choose MEDURUN?"
            title="Reliability, transparency, and trust — at emergency speed."
            tone="dark"
          />

          <WhyJourney />
        </div>
      </div>
    </Section>
  );
}
