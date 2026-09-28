import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DispatchRail } from "@/components/illustrations/DispatchRail";
import { company, hero } from "@/data/site";
import { asset } from "@/lib/asset";
import { cn } from "@/lib/cn";
import { HeroMotion } from "@/components/site/HeroMotion";

/**
 * The hero is one cinematic frame: a night call, photographed head-on, with the
 * whole content group standing centred on top of it.
 *
 * The composition that came before was a split — copy on the left, the ambulance
 * masked into the navy on the right — and every layer it carried (the plotting
 * grid, the lamp behind the vehicle, the grid's sweep, the dispatch annotation)
 * existed to build depth the photograph did not have. The supplied photograph has
 * its own depth: a wet road, a city behind, headlights and a lit bar. So those
 * layers are gone rather than kept and dimmed. What is left is the photograph, one
 * navy veil over it, the two roof lamps, and the type.
 *
 * Height is `calc(100svh - header)`, as a *minimum* rather than a fixed height —
 * `svh` so a phone's collapsing toolbar cannot crop the rail, and a minimum so a
 * short window or a large font grows the section instead of clipping it.
 *
 * Three things are stacked and they never cross:
 *
 *   `.hero-stage`   the photograph, the veil and the roof lamps, in one box that
 *                   carries the standing scale so all three move together and the
 *                   lamps cannot slide off the light bar.
 *   the copy group   logo, eyebrow, headline, sentence, actions — centred in what
 *                   is left after the rail, so the vertical centre is the copy's
 *                   own, not the section's.
 *   the rail         held at the bottom edge at every width.
 *
 * The entrance is a single staggered sequence and it is over at 1.12s:
 *
 *   0ms     the logo mark
 *   90ms    the eyebrow
 *   170ms   headline line one
 *   250ms   headline line two
 *   340ms   the sentence
 *   410ms   the actions                → everything usable by 830ms
 *   560ms   the rail's operational label
 *   700ms   the rail draws (420ms) — and the standing signal leaves REQUEST at 1.12s
 *
 * After that, three things loop and none of them finishes: the rail's signal on a
 * 4s cycle (DispatchRail holds that clock), the two roof lamps breathing over
 * 4.4s, and a 5% scale swell on the whole stage over 32s. Nothing floats, blinks
 * or flashes. Under `prefers-reduced-motion` none of the three is declared at all
 * and the markup's own resting state is what shows: photograph at rest, both lamps
 * lit, the route drawn and the signal parked on CARE.
 *
 * On a desktop viewport the section is also the first movement of the page's
 * scroll sequence, and that is the one thing not expressed here. `.hero-track`
 * gives it 150vh of scroll and pins `.hero-canvas` under the header; `HeroMotion`
 * writes `--hero-exit` across that distance; and the stylesheet spends it moving
 * the copy off, swelling the photograph toward the reader, lighting the headlamps
 * and beacons, walking the rail's signal to CARE and bending the route down into
 * Positioning. All of it is a pure function of one number, so scrolling back up
 * runs it backwards. Below `lg`, and under `prefers-reduced-motion`, none of that
 * is declared: the track is a plain wrapper and the hero is the section it has
 * always been.
 */
export function Hero() {
  return (
    /* The track the hero is pinned inside. It has no styling of its own below
       `lg` or under `prefers-reduced-motion` — it is a plain wrapper there, and the
       hero is exactly the section it has always been. See `.hero-track`. */
    <div className="hero-track">
      <section className="hero-canvas relative isolate flex flex-col overflow-hidden bg-navy-ink text-white">
        <HeroMotion />
        {/* The photograph, its veil and its two lamps, in one box.
          
          They share a box because they have to: the lamps are pinned to points in
          the photograph using the box's own container units, so anything that moves
          the photograph has to move them by the same amount. The standing scale is
          therefore on this wrapper and not on the image — one transform, applied
          once, to all three. */}
        <div
          aria-hidden="true"
          className="hero-stage pointer-events-none absolute inset-0 motion-safe:animate-bg-drift"
        >
          <Image
            src={asset(hero.background.src)}
            alt={hero.background.alt}
            fill
            priority
            // Not `100vw`. The frame is portrait on a phone and the photograph is
            // 16:9, so `object-cover` fits the *height* and the rendered width runs
            // well past the viewport — about 1370px inside a 390px frame. A `100vw`
            // hint would ask for a 390px file and stretch it three and a half times.
            // These three are that rendered width (H x 1.777, or the frame's own
            // width on a wide desktop) rounded up to the nearest size Next emits.
            sizes="(max-width: 480px) 1200px, (max-width: 1024px) 1600px, 1920px"
            // Centred on both axes at every width, which is what keeps the vehicle
            // centred in the frame: it is centred in the source, so a 50% crop
            // window is always the one that holds it. The crop maths the lamps are
            // positioned by assumes exactly this — see `.hero-beacon` in globals.css.
            className="object-cover object-center motion-safe:animate-fade-in motion-safe:[animation-duration:900ms]"
          />

          {/* One navy veil, not a flat wash: darkest along the top where the type
            stands, thinnest across the band the vehicle occupies, and heavy again
            at the very bottom so the rail has ground. The lamps are painted after
            it, so the only things on the canvas the veil does not touch are the
            two lights. */}
          <div className="hero-veil absolute inset-0" />

          <span className="hero-beacon hero-beacon--red" />
          <span className="hero-beacon hero-beacon--blue" />

          {/* The headlamps, blooming as the vehicle closes on the viewer. Two soft
            warm discs pinned to the lamps in the photograph by the same crop
            maths the roof lights use, painted at nothing until the departure is
            well under way — so the hero at rest is exactly the frame it was, and
            what changes is only how near the vehicle gets. */}
          <span className="hero-lamp hero-lamp--left" />
          <span className="hero-lamp hero-lamp--right" />
        </div>

        <div className="hero-shell shell relative flex min-h-0 flex-1 flex-col pb-7 pt-9 sm:pb-8 sm:pt-11 lg:pb-10 lg:pt-14">
          {/* Centred across the frame and held to the top of it, which is the whole
            composition in one line: the type owns the sky, the vehicle owns the
            road under it, and neither is asked to share.

            Not vertically centred, at any width. The photograph puts the light bar
            at 57% of the frame's height and it stays there — the vehicle is
            centred in the source, so `object-cover` has no vertical slack to give
            on any frame narrower than 16:9. A group centred in the section would
            therefore lay its sentence across the light bar on every ordinary
            desktop window, which is exactly what it did before this line. */}
          <div className="hero-copy flex min-h-0 flex-1 flex-col items-center justify-start text-center">
            <Image
              src={asset("/brand/medurun-logo.png")}
              alt={`${company.name} logo`}
              width={56}
              height={56}
              priority
              className="h-11 w-11 shrink-0 motion-safe:animate-rise-in sm:h-[3.25rem] sm:w-[3.25rem]"
            />

            <p className="hero-eyebrow mt-5 flex items-center gap-3 text-[0.625rem] font-medium uppercase leading-none tracking-[0.26em] text-white/70 motion-safe:animate-rise-in motion-safe:[animation-delay:90ms] sm:text-[0.6875rem] sm:tracking-[0.3em]">
              {/* The same red tick every operational label on the page carries, given
                a second copy so it reads as centred rather than left-hung. */}
              <span
                aria-hidden="true"
                className="h-px w-5 shrink-0 bg-red sm:w-7"
              />
              {hero.eyebrow}
              <span
                aria-hidden="true"
                className="h-px w-5 shrink-0 bg-red sm:w-7"
              />
            </p>

            {/* A grid rather than a block: each line is its own mask, and grid items
              do not collapse the negative margins those masks depend on. */}
            <h1 className="hero-head mt-6 grid text-[2.3rem] leading-[1.04] sm:text-[3.25rem] lg:text-[4rem] xl:text-[4.35rem]">
              <span className="hero-line">
                <span className="motion-safe:animate-line-rise motion-safe:[animation-delay:170ms]">
                  {hero.headline.before}
                </span>
              </span>
              <span className="hero-line">
                <span className="motion-safe:animate-line-rise motion-safe:[animation-delay:250ms]">
                  <em className="not-italic text-red">
                    <span className="font-serif italic">
                      {hero.headline.accent}
                    </span>
                  </em>
                  {hero.headline.after}
                </span>
              </span>
            </h1>

            <p className="hero-sub mt-6 max-w-[34rem] text-balance text-[0.9375rem] leading-relaxed text-white/[0.82] motion-safe:animate-rise-in motion-safe:[animation-delay:340ms] sm:text-lg">
              {hero.subhead}
            </p>

            {/* Stacked on a phone, side by side from 420px — the width at which the
              two labels stop having to wrap inside their own buttons. Centred in
              both arrangements. */}
            <div className="hero-actions mt-8 flex w-full max-w-[19rem] flex-col items-stretch gap-3 motion-safe:animate-rise-in motion-safe:[animation-delay:410ms] min-[420px]:max-w-none min-[420px]:flex-row min-[420px]:justify-center">
              <Button
                href={hero.primaryCta.href}
                variant="primary"
                className={cn(
                  "group",
                  "hover:shadow-[0_12px_28px_-12px_rgba(237,28,36,0.8)]",
                  "focus-visible:shadow-[0_12px_28px_-12px_rgba(237,28,36,0.8)]",
                )}
              >
                {hero.primaryCta.label}
                {/* The arrow leads on hover and on focus: 4px, 200ms, and the same
                  step for both, so the keyboard gets the pointer's answer. */}
                <ArrowRight
                  size={15}
                  aria-hidden="true"
                  className="transition-transform duration-200 ease-out motion-safe:group-hover:translate-x-1 motion-safe:group-focus-visible:translate-x-1"
                />
              </Button>
              <Button href={hero.secondaryCta.href} variant="ghost">
                {hero.secondaryCta.label}
              </Button>
            </div>
          </div>

          {/* Held at the bottom edge of the frame at every width, spanning the whole
            shell under the centred group. */}
          <DispatchRail align="center" className="mt-9 shrink-0 sm:mt-10" />
        </div>

        {/* The call, annotated onto the frame once the centred group has started to
          go. It exists only inside the pinned departure — see `.hero-dispatch` —
          and it is deliberately not a panel: three lines of small type and two
          hairlines, drawn straight onto the photograph, in the space the headline
          has just vacated and well above the vehicle at every desktop height. */}
        <div className="hero-dispatch" aria-hidden="true">
          <span className="hero-dispatch-rule" />
          <p className="hero-dispatch-tag">
            <span className="hero-dispatch-dot" />
            Live request
          </p>
          <p className="hero-dispatch-unit">Unit M-24 · Ambulance assigned</p>
          <p className="hero-dispatch-eta">ETA 08 min</p>
          <span className="hero-dispatch-stem" />
        </div>
      </section>
    </div>
  );
}
