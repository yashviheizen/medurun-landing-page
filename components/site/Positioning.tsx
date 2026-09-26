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
 */
export function Positioning() {
  return (
    <section className="relative border-b border-paper-line bg-paper pb-10 pt-14 sm:pb-12 sm:pt-16 lg:pb-14 lg:pt-20">
      <SignalRail tone="paper" />

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

        <div aria-hidden="true" className="mt-10 h-px w-full bg-paper-line lg:mt-12" />

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
    </section>
  );
}
