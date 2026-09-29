import { Reveal } from "@/components/ui/Reveal";
import { SignalRail } from "@/components/ui/Section";
import { NetworkFlow } from "@/components/illustrations/NetworkFlow";
import { PositioningStatement } from "@/components/site/PositioningStatement";
import { networkFlow } from "@/data/site";

/**
 * The positioning statement carries the whole argument of the page, so it is set
 * as a manifesto: one large serif block on open paper, with nothing around it but
 * an operational label and a hairline.
 *
 * Under it, the same claim drawn: the five stages a single emergency passes
 * through, full width, with MEDURUN as the hub. It replaced a small four-dot
 * schematic parked in a 17rem column — at that size it was a decoration beside the
 * text rather than a diagram of anything, and it read as cropped.
 *
 * The band's padding is trimmed at both ends: the statement and the schematic are
 * one thought, and About brings its own top padding, so two full-height bands
 * stacked would leave a dead strip between them.
 *
 * On a desktop frame the whole thing is pinned, and it is lapped back over the
 * hero: `.pos-track` carries a negative margin the height of one pinned hero
 * screen, so this band is already standing behind the hero when the hero's
 * headlamps wipe it away, and the two never leave a strip of bare paper between
 * them. The section's own box stays where it was — the lap is on the track, not on
 * the section — so the journey tracker still finds station 01 at a sane offset.
 *
 * The statement and the schematic hold under the header while a 400vh track scrolls
 * past them, and that scroll does two things in order. First it reads the statement
 * out: the sentence is on screen whole from the first frame in a muted warm grey, and
 * the scroll walks a full-contrast copy of it across a phrase at a time, left to
 * right. Then — with a beat in between where the rule draws across and the
 * schematic's label arrives, so no part of the track is standing still — it routes
 * the network: the line draws, the five stages come on in order with their status
 * revealed as each is reached, and the band lets go once the route is complete.
 *
 * `NetworkFlow` and `PositioningStatement` both read the track they are standing in
 * and need nothing passed to them, so this stays a server component; below `lg`, and
 * for a reader who has asked for less motion, `.pos-track` and `.pos-stage` have no
 * rules at all, the reveal never subscribes, and the band is exactly the band it has
 * always been — one paragraph, complete and readable, fading in once.
 */
export function Positioning() {
  return (
    <section
      id="positioning"
      className="relative border-b border-paper-line bg-paper pb-10 pt-14 sm:pb-12 sm:pt-16 lg:pb-14 lg:pt-20"
    >
      <SignalRail tone="paper" />

      <div className="pos-track">
        <div className="pos-stage">
          <div className="shell relative">
            <p className="op-label op-label--rail">
              <span className="tabular-nums text-red">01</span>
              <span>Positioning</span>
            </p>

            <Reveal>
              {/* `pos-line` is the transition's hook, not a style: the statement
                  arrives a beat behind the label it sits under, and the class is
                  what the pinned reveal is written against. It has to be on the
                  paragraph rather than on the `Reveal` wrapper, which owns its own
                  opacity and transform for the unpinned page.

                  The paragraph itself is a client component now, because on a
                  desktop frame the scroll reads it out phrase by phrase — the copy,
                  the type and the measure are untouched, and every other width gets
                  this same element as the plain paragraph it has always been. */}
              <PositioningStatement className="pos-line mt-8 max-w-[52ch] font-serif text-[1.65rem] leading-[1.24] tracking-[-0.015em] text-ink sm:text-[2.2rem] lg:text-[2.75rem]" />
            </Reveal>

            {/* The rule between the statement and the schematic. On the pinned band
                it is drawn rather than simply present: it is what carries the beat
                between the sentence finishing and the route starting, so there is no
                stretch of the track where nothing at all is moving. */}
            <div
              aria-hidden="true"
              className="pos-rule mt-10 h-px w-full bg-paper-line lg:mt-12"
            />

            <Reveal delay={60}>
              <div className="pos-cue mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <p className="op-label">
                  <span>MEDURUN Emergency Network</span>
                </p>
                <p className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-muted">
                  One request, end to end
                </p>
              </div>

              <div className="relative mt-8 lg:mt-10">
                {/* The route leaving the ambulance. The drawing of the vehicle
                    from the hero has just been flown down into this column and
                    shrunk onto the third node — see `.hero-outline` — and this is
                    the thread that connects the two: a thin red line extending
                    from where the ambulance came to rest into AMBULANCE ASSIGNED
                    itself. 50% because that is the centre of the third of five
                    columns, which is where the node it lands on stands; it is in
                    the gap over the schematic so it crosses no type, and it is
                    drawn by `--hero-exit` — the hero's own clock, not a second one
                    that would have to be kept in step with it. */}
                <span
                  aria-hidden="true"
                  className="pos-drop absolute left-[50%]"
                />
                <NetworkFlow stages={networkFlow} />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
