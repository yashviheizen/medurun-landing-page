import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SignalRail } from "@/components/ui/Section";
import { DispatchRail } from "@/components/illustrations/DispatchRail";
import { hero } from "@/data/site";
import { cn } from "@/lib/cn";

/**
 * The hero is one full-width navy canvas rather than a column of text beside a
 * framed photograph: the grid, the ambulance and the type all share a plane, and
 * the photograph is masked into the navy rather than given an edge of its own.
 *
 * The dispatch route used to be a curve plotted diagonally across that whole
 * canvas, with CARE held off the top-right corner. It has been replaced by a
 * horizontal rail in normal flow beneath the actions — see DispatchRail. Two
 * things follow, and both are the point of the change: the four stages are read
 * left to right in the order they happen, and the section no longer has to
 * reserve a third of its height as clearance for a curve, so the whole hero now
 * fits a short laptop viewport with the rail above the fold.
 *
 * The entrance is one sequence, read in the order the page is read:
 *
 *   0ms     eyebrow
 *   90ms    headline line one          180ms  the ambulance is wiped in from the right
 *   170ms   headline line two
 *   220ms   rule
 *   260ms   the sentence
 *   320ms   the actions                → all usable by 740ms
 *   560ms   the rail's operational label
 *   820ms   the rail draws, and runs one signal REQUEST → CARE, settling at 2.36s
 *
 * Nothing loops. The two things still moving after the actions are usable are the
 * rail's single run and the photograph's 1.2% settle, and both stop for good —
 * a canvas that keeps drifting is a screensaver, and this section is meant to read
 * as an instrument that has finished taking its reading.
 */
export function Hero() {
  return (
    <section className="hero-canvas relative isolate overflow-hidden bg-navy-ink pb-9 pt-14 text-white sm:pb-10 sm:pt-16 lg:pb-11 lg:pt-[4.5rem]">
      {/* Ground plane: the plotting grid the whole canvas is drawn on. */}
      <div aria-hidden="true" className="grid-field pointer-events-none absolute inset-0" />

      {/* The ambulance, masked into the navy instead of framed. On mobile it rises
          out of the bottom edge of the canvas; from lg it is anchored to the right
          edge and bleeds off it. The wipe uncovers it from that right edge inwards,
          which is the direction it is already bleeding from. */}
      <div
        className="hero-plate pointer-events-none absolute inset-x-0 bottom-0 h-[15rem] mix-blend-luminosity motion-safe:animate-plate-wipe sm:h-[18rem] lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-[62%]"
      >
        <Image
          src={hero.image.src}
          alt={hero.image.alt}
          fill
          priority
          sizes="(min-width: 1024px) 62vw, 100vw"
          className="object-cover object-[50%_44%] opacity-[0.58] contrast-[1.1] motion-safe:animate-plate-drift lg:object-[46%_50%]"
        />
      </div>

      {/* Two scrims, not decoration: one keeps the headline off the vehicle, the
          other keeps the rail and its labels legible along the bottom. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 hidden w-[78%] bg-gradient-to-r from-navy-ink via-navy-ink/80 to-transparent lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[46%] bg-gradient-to-t from-navy-ink via-navy-ink/70 to-transparent"
      />

      {/* The one vertical red signal line. */}
      <SignalRail tone="dark" />

      <div className="shell relative">
        <div className="lg:w-[47%] xl:w-[45%]">
          <p className="op-label op-label--rail motion-safe:animate-rise-in">
            <span>{hero.eyebrow}</span>
          </p>

          {/* A grid rather than a block: each line is its own mask, and grid items
              do not collapse the negative margins those masks depend on. */}
          <h1 className="hero-head mt-7 grid text-[2.6rem] leading-[1.02] sm:text-[3.5rem] lg:text-[4.15rem]">
            <span className="hero-line">
              <span className="motion-safe:animate-line-rise motion-safe:[animation-delay:90ms]">
                {hero.headline.before}
              </span>
            </span>
            <span className="hero-line">
              <span className="motion-safe:animate-line-rise motion-safe:[animation-delay:170ms]">
                <em className="not-italic text-red">
                  <span className="font-serif italic">{hero.headline.accent}</span>
                </em>
                {hero.headline.after}
              </span>
            </span>
          </h1>

          <div
            aria-hidden="true"
            className="hero-rule mt-8 h-px w-full max-w-sm bg-white/15 motion-safe:animate-rise-in motion-safe:[animation-delay:220ms]"
          />

          <p className="mt-6 max-w-md text-base leading-relaxed text-white/[0.78] motion-safe:animate-rise-in motion-safe:[animation-delay:260ms] sm:text-lg">
            {hero.subhead}
          </p>

          <div className="hero-actions mt-9 flex flex-wrap gap-3 motion-safe:animate-rise-in motion-safe:[animation-delay:320ms]">
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

        {/* The rail is a sibling of the copy column, not a child of it, so it
            spans the shell across both the text and the ambulance as one
            connected system. Beneath both buttons at every width. */}
        <DispatchRail className="mt-12 sm:mt-14 lg:mt-16" />
      </div>
    </section>
  );
}
