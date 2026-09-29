"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Eye, Gauge, ShieldCheck, Timer, type LucideIcon } from "lucide-react";
import { RouteMap } from "@/components/illustrations/RouteMap";
import { pillars, type Pillar } from "@/data/site";
import { clamp, onPinned, onScroll, pinnedAt } from "@/lib/motion";
import { cn } from "@/lib/cn";

const icons: Record<Pillar["icon"], LucideIcon> = {
  trust: ShieldCheck,
  speed: Gauge,
  transparency: Eye,
  reliability: Timer,
};

/**
 * The share of the pinned track the horizontal run occupies.
 *
 * The margins are not padding. The head is the beat where the first card is
 * already centred and still — long enough to read one card before anything
 * starts moving — and the tail is the same courtesy paid to the last one, which
 * the brief asks for by name: the track stops dead on Reliability and holds it
 * there before the stage lets go of the screen.
 */
const RUN: readonly [number, number] = [0.06, 0.88];

/** The ease every pinned sequence on this page scrubs with. */
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * How far a card's background and its red accent drift against the card itself,
 * in pixels, at one full step off centre.
 *
 * The three layer speeds — 0.6x, 1.0x, 1.15x — are *ratios*, and a ratio has to
 * be given a distance before it can be drawn. Taking the distance literally from
 * the track would mean 0.4 of an ~880px step, which slides a photograph clean out
 * of its own frame long before its card reaches the middle. So the set is scaled
 * down whole, and the ratios between the layers survive exactly: 40 / 0.4 is 15 /
 * 0.15. The one layer that *can* take the track literally is the grid behind the
 * rail, because it repeats forever — that one runs at a true 0.6x of `--wy-x`.
 */
const BACK = 40;
const ACCENT = 15;

const bound = (value: number) => (value < -1 ? -1 : value > 1 ? 1 : value);

/**
 * Four principles as one horizontal journey, walked by the page scrolling.
 *
 * The geometry is the whole trick, so it is worth stating plainly. `.wy-run` is
 * exactly as wide as the rail, and each card is `(100% - 2 * gap) / 1.34` of it.
 * Centre any card and the clear space either side is `(rail - card) / 2`, so the
 * sliver of the next card showing past the gap is `(rail - card) / 2 - gap`,
 * which that 1.34 makes precisely 0.17 of a card — the 15-20% of the next card
 * the brief asks for, as an identity rather than a guess. Cards four and three
 * gaps wide overflow the run; the rail clips them.
 *
 * Everything below is a pure function of scroll position: no chased targets, no
 * accumulated state, no transitions on anything being scrubbed. That is what
 * makes scrolling back up reproduce the sequence exactly rather than approximately.
 *
 * Without the pin — phone, tablet, reduced motion, or scripting off — none of
 * this runs and the same markup is a native scroll-snap carousel.
 */
export function WhyJourney() {
  const ref = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const rail = ref.current;
    if (!rail) return;

    const track = rail.closest<HTMLElement>(".wy-track");
    const stage = track?.querySelector<HTMLElement>(".wy-stage");
    if (!track || !stage) return;

    const cards = Array.from(rail.querySelectorAll<HTMLElement>(".wy-card"));
    const segments = Array.from(track.querySelectorAll<HTMLElement>(".wy-seg"));
    const last = cards.length - 1;
    if (last < 1) return;

    /** Write-through cache: a custom property is only touched when it changes. */
    const held = new Map<HTMLElement, Map<string, string>>();
    const put = (node: HTMLElement, name: string, value: string) => {
      let own = held.get(node);
      if (!own) held.set(node, (own = new Map()));
      if (own.get(name) === value) return;
      own.set(name, value);
      node.style.setProperty(name, value);
    };

    // Measured once per layout rather than per frame: reading offsetLeft inside
    // the scroll callback would force a synchronous layout sixty times a second.
    let home = 0;
    let travel = 1;
    const measure = () => {
      home = cards[0].offsetLeft + cards[0].offsetWidth / 2 - rail.clientWidth / 2;
      travel = Math.max(cards[last].offsetLeft - cards[0].offsetLeft, 1);
    };

    const draw = () => {
      const p = smooth(clamp((pinnedAt(track, stage) - RUN[0]) / (RUN[1] - RUN[0])));
      const step = travel / last;
      const run = p * travel;

      put(track, "--wy-p", p.toFixed(4));
      put(track, "--wy-x", `${(-(home + run)).toFixed(2)}px`);
      put(track, "--wy-gx", `${(-(home + run) * 0.6).toFixed(2)}px`);

      cards.forEach((card, i) => {
        // Where this card sits relative to the middle, in steps: 0 dead centre,
        // ±1 a whole card away. Both the emphasis and the drift read off it.
        const off = bound((run - i * step) / step);
        const near = 1 - Math.abs(off);

        put(card, "--wy-off", off.toFixed(4));
        put(card, "--wy-near", smooth(near).toFixed(4));
        const segment = segments[i];
        if (segment) put(segment, "--wy-near", smooth(near).toFixed(4));
      });

      const at = Math.round(run / step);
      setIndex((was) => (was === at ? was : at));
    };

    /**
     * A scroll container has to be focusable before a keyboard can scroll it —
     * and has no business being a tab stop when there is nothing to scroll,
     * which is both the pinned journey and the two-by-two grid a reduced-motion
     * desktop gets. The attribute ships in the markup so the carousel is
     * keyboard scrollable with no JavaScript at all; this only takes it away.
     */
    const reach = (on: boolean) => {
      if (!on && rail.scrollWidth - rail.clientWidth > 1) {
        rail.setAttribute("tabindex", "0");
      } else {
        rail.removeAttribute("tabindex");
      }
    };

    let stop: (() => void) | null = null;
    let pinned = false;
    const release = onPinned((on) => {
      pinned = on;
      stop?.();
      stop = null;

      reach(on);

      if (!on) return;
      measure();
      stop = onScroll(draw);
    });

    const resize = () => {
      reach(pinned);
      if (!stop) return;
      measure();
      draw();
    };
    window.addEventListener("resize", resize, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      release();
      stop?.();
    };
  }, []);

  return (
    <>
      <div
        ref={ref}
        className="wy-rail"
        role="group"
        aria-label="Why MEDURUN, four principles"
        tabIndex={0}
      >
        <div className="wy-run">
          {pillars.map((pillar) => {
            const Icon = icons[pillar.icon];

            return (
              <article key={pillar.id} className="wy-card">
                <div
                  className={cn(
                    "wy-art",
                    pillar.visual.kind === "route" && "wy-art--route",
                  )}
                >
                  <div className="wy-art-in">
                    {pillar.visual.kind === "photo" ? (
                      <Image
                        src={pillar.visual.src}
                        alt={pillar.visual.alt}
                        fill
                        sizes="(min-width: 1024px) 58vw, 86vw"
                        className={cn(
                          "object-cover saturate-[0.92] contrast-[1.04]",
                          pillar.visual.position,
                        )}
                      />
                    ) : (
                      <div className="wy-route">
                        <RouteMap progress={0.62} instanceId="wy-transparency" />
                      </div>
                    )}
                  </div>
                  <span aria-hidden="true" className="wy-art-scrim" />
                </div>

                <div className="wy-body">
                  <p className="wy-num">{pillar.number}</p>

                  <span aria-hidden="true" className="wy-accent">
                    <Icon className="wy-accent-icon" strokeWidth={1.5} />
                    <span className="wy-accent-line" />
                  </span>

                  <h3 className="wy-name">{pillar.title}</h3>
                  <p className="wy-text">{pillar.body}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div aria-hidden="true" className="wy-meter">
        <span className="wy-bar">
          {pillars.map((pillar) => (
            <span key={pillar.id} className="wy-seg" />
          ))}
        </span>
        <span className="wy-count">
          <b>{String(index + 1).padStart(2, "0")}</b>
          <i>/</i>
          {String(pillars.length).padStart(2, "0")}
        </span>
      </div>
    </>
  );
}
