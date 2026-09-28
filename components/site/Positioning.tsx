import { Reveal } from "@/components/ui/Reveal";
import { SignalRail } from "@/components/ui/Section";
import { NetworkFlow } from "@/components/illustrations/NetworkFlow";
import { networkFlow, positioning } from "@/data/site";

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
 * On a desktop frame the whole thing is pinned. The statement and the schematic
 * hold under the header while a ~240vh track scrolls past them, and that scroll is
 * what routes the network: the line draws, the five stages come on in order with
 * their status revealed as each is reached, and the band lets go once the route is
 * complete. `NetworkFlow` reads the track it is standing in and needs nothing
 * passed to it, so this stays a server component; below `lg`, and for a reader who
 * has asked for less motion, `.pos-track` and `.pos-stage` have no rules at all and
 * the band is exactly the band it has always been.
 */
export function Positioning() {
  return (
    <section
      id="positioning"
      className="relative border-b border-paper-line bg-paper pb-10 pt-14 sm:pb-12 sm:pt-16 lg:pb-14 lg:pt-20"
    >
      <SignalRail tone="paper" />

      {/* The hero's dispatch route, arriving. It picks up at the same offset in
          the same shell the rail's CARE stop sits at, so the line that turned down
          out of the hero is the line that comes into this band — and it is drawn
          by `--hero-exit`, the hero's own clock, rather than by a second one that
          would have to be kept in step with it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0"
      >
        <div className="shell">
          <div className="relative h-20">
            <span
              className="route-drop absolute top-0"
              style={{ left: "87.5%" }}
            />
          </div>
        </div>
      </div>

      <div className="pos-track">
        <div className="pos-stage">
          <div className="shell relative">
            <p className="op-label op-label--rail">
              <span className="tabular-nums text-red">01</span>
              <span>Positioning</span>
            </p>

            <Reveal>
              <p className="mt-8 max-w-[52ch] font-serif text-[1.65rem] leading-[1.24] tracking-[-0.015em] text-ink sm:text-[2.2rem] lg:text-[2.75rem]">
                {positioning}
              </p>
            </Reveal>

            <div
              aria-hidden="true"
              className="mt-10 h-px w-full bg-paper-line lg:mt-12"
            />

            <Reveal delay={60}>
              <div className="mt-7 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
                <p className="op-label">
                  <span>MEDURUN Emergency Network</span>
                </p>
                <p className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-muted">
                  One request, end to end
                </p>
              </div>

              <div className="mt-8 lg:mt-10">
                <NetworkFlow stages={networkFlow} />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
