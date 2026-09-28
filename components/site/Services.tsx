import { Section, SectionHeading } from "@/components/ui/Section";
import { ServiceExplorer } from "@/components/site/ServiceExplorer";
import { services } from "@/data/site";

/**
 * What we provide, as one scroll rather than five clicks.
 *
 * On a desktop frame this band is a split-screen gallery held under the header while
 * a 380vh track runs past it: one large photograph on the left, a vertical track of
 * five previews on the right, and the scroll position walking the two through
 * emergency ambulance, patient transfer, medical assistance, healthcare logistics
 * and agency coordination in order. The ground darkens as the gallery takes the
 * screen and lightens again as it gives it back, so the sequence begins and ends on
 * the page's own paper and the hand-over to Driver Partner is an ordinary boundary.
 *
 * The heading is inside the pinned stage rather than above it for the same reason it
 * is in `WhyMedurun` and `Testimonials`: a sequence whose question has already
 * scrolled off the top is five unattributed rows.
 *
 * `.svc-track` and `.svc-stage` carry no rules below `lg`, under
 * `prefers-reduced-motion`, or with scripting off — they are plain wrappers there,
 * and the section is the swipeable card row it has always been, with every service's
 * number, title, description and photograph in document order. `ServiceExplorer`
 * watches the same media query the stylesheet is written against, so the two cannot
 * disagree about which of the two presentations is happening, and the gallery's own
 * photographs are only ever mounted for the one that uses them.
 */
export function Services() {
  return (
    <Section id="services" tone="paper">
      <div className="svc-track">
        <div className="svc-stage">
          {/* The gallery's ground. Paper until the stage locks, navy while it holds
              the screen, paper again before it lets go — and stretched past the
              shell to the window's own edges by the explorer, because a full-bleed
              band that stops at the content column is a rectangle on a page. */}
          <div aria-hidden="true" className="svc-ground" />

          <div className="svc-head">
            <SectionHeading
              index="03"
              eyebrow="What we provide"
              title="One platform for every emergency movement."
            />
          </div>

          <ServiceExplorer items={services} />
        </div>
      </div>
    </Section>
  );
}
