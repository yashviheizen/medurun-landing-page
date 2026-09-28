import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { VoicesSlider } from "@/components/site/VoicesSlider";
import { testimonials, testimonialsIntro } from "@/data/site";

/**
 * One emergency, told four times over: the same moment as the patient's family,
 * the driver, the hospital and the agency each meet it. Each card carries the
 * same two readings — what the moment used to be, and what one shared request
 * changes about it.
 *
 * These are workflow perspectives, written to show what each side of the network
 * does with one request, so the band says so in plain sight: under the cards and
 * inside the same reveal. A page that dresses written copy up as collected
 * customer testimonials is making a claim; this one states what it has.
 *
 * On a desktop the whole band is one pinned sequence. `.voices-run` is the track
 * and `.voices-pin` the stage, and everything in the stage is a layer on it: the
 * heading holds the screen alone, gives way as the four cards rise into a fanned
 * deck, and the deck is walked through card by card by the page scrolling. The
 * heading is *inside* the stage this time rather than above it — the sequence
 * starts with it on screen and the space it vacates is exactly the space the deck
 * needs, which is only possible if the two share a frame.
 *
 * At every other width, and with scripting off, the same markup is a heading, a
 * swipeable row of cards, the disclosure and a closing panel, in that order. None
 * of the pinning exists there at all.
 */
export function Testimonials() {
  return (
    <Section id="testimonials" tone="paper" className="voices-section">
      <div className="voices-run">
        <div className="voices-pin">
          <div className="vx-head">
            <SectionHeading
              index="08"
              eyebrow={testimonialsIntro.eyebrow}
              title={testimonialsIntro.heading}
              body={testimonialsIntro.body}
            />
          </div>

          <VoicesSlider items={testimonials} />

          <Reveal className="vx-note mt-5">
            <p className="flex items-start gap-3 text-[0.8rem] leading-relaxed text-muted">
              <span aria-hidden="true" className="mt-2 h-px w-5 shrink-0 bg-red" />
              <span className="max-w-[62ch]">{testimonialsIntro.disclosure}</span>
            </p>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
