import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { VoicesSlider } from "@/components/site/VoicesSlider";
import { testimonials, testimonialsIntro } from "@/data/site";

/**
 * One emergency, told four times over: the same moment as the patient's family, the
 * driver, the hospital and the agency each meet it. A carousel rather than a wall of
 * cards — one card is read while the next is already in view — and each card carries
 * the same two readings: what the moment used to be, and what one shared request
 * changes about it.
 *
 * These are workflow perspectives, written to show what each side of the network does
 * with one request, so the band says so in plain sight: directly under the controls
 * and inside the same reveal. A page that dresses written copy up as collected
 * customer testimonials is making a claim; this one states what it has.
 */
export function Testimonials() {
  return (
    <Section id="testimonials" tone="paper">
      <SectionHeading
        index="08"
        eyebrow={testimonialsIntro.eyebrow}
        title={testimonialsIntro.heading}
        body={testimonialsIntro.body}
      />

      <Reveal className="mt-7 lg:mt-9">
        <VoicesSlider items={testimonials} />

        <p className="mt-5 flex items-start gap-3 text-[0.8rem] leading-relaxed text-muted">
          <span aria-hidden="true" className="mt-2 h-px w-5 shrink-0 bg-red" />
          <span className="max-w-[62ch]">{testimonialsIntro.disclosure}</span>
        </p>
      </Reveal>
    </Section>
  );
}
