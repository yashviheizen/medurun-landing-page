"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Eye, Gauge, ShieldCheck, Timer, type LucideIcon } from "lucide-react";
import { pillars, type Pillar } from "@/data/site";
import {
  clamp,
  onPinned,
  onScroll,
  pinnedAt,
  stilled,
  viewport,
} from "@/lib/motion";
import { cn } from "@/lib/cn";

const icons: Record<Pillar["icon"], LucideIcon> = {
  trust: ShieldCheck,
  speed: Gauge,
  transparency: Eye,
  reliability: Timer,
};

/**
 * Each principle is uncovered a little before its share of the sweep, so the last
 * one is not still waiting when the sweep line has already run past it.
 *
 * This governs the indicator only. The cards' own entrance is not a function of
 * the sweep — see `entered` below.
 */
const revealAt = (index: number, count: number) =>
  ((index + 0.35) / count) * 0.9;

/**
 * The beat between one card arriving and the next.
 *
 * Longer than the 110ms a section header opens on, and deliberately so: a header's
 * three lines are one sentence being spoken, where these are four separate
 * statements on one rule. At 120ms the four land as a counted sequence — you can
 * see that there are four of them, and in which order — and the last one is still
 * only 360ms behind the first, well inside its own transition.
 */
const CARD_STEP = 120;

/**
 * The stack's timetable, in shares of the pinned track.
 *
 * `STACK_LEAD` is the beat after the band settles under the header and before the
 * second principle starts to climb — the first one is already standing there when
 * the stage pins, because a pinned section that opens empty reads as a section
 * that has not loaded. `STACK_GAP` is then one principle's turn and `STACK_IN` the
 * part of that turn it spends moving, so each card has a moment at rest, being
 * read, before the next one comes up over it. Three cards move, the fourth's turn
 * ends at 0.88, and the last eighth of the track is the settle before the section
 * lets go.
 */
const STACK_LEAD = 0.08;
const STACK_GAP = 0.28;
const STACK_IN = 0.24;

/** Where a principle's own climb begins, as a share of the track. */
const arrives = (index: number) => STACK_LEAD + (index - 1) * STACK_GAP;

/**
 * The network principles band: four principles on one ruled line, with a single red
 * indicator sitting over whichever one is currently being read.
 *
 * Three things move that indicator, and they compose in that order of authority:
 * pointing at a principle, focusing one from the keyboard, and — with neither of
 * those happening — the scroll position, which walks it across the band as the
 * section is read. Nothing is hijacked: the page scrolls at its own speed and the
 * indicator is the only thing that responds.
 *
 * Nothing is hidden or dimmed out of reach: an unemphasised principle never drops
 * below 0.85 opacity and its copy stays at white/80, so all four titles and
 * descriptions are readable at all times, without hovering or clicking. With no JS,
 * or under `prefers-reduced-motion`, the band renders complete (see `.principle` in
 * globals.css — the dimmed state is scoped to `.js`).
 *
 * The red accent lands on exactly one principle. Four red numbers emphasise
 * nothing, and the point of the indicator is that the band has a current position.
 *
 * Emphasis is carried by the indicator gliding along the rule, plus the number
 * turning red and the icon lifting a shade brighter and 12% larger. Nothing opens,
 * collapses, or resizes: the four columns hold still, and the reader's eye is the
 * only thing that has to move.
 */
export function PrinciplesBand() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  /**
   * Set when the band is not sweeping at all. A completed sweep would otherwise
   * put the indicator on the last principle, which reads as an end state; with no
   * motion there is no position to report, so it sits on the first.
   */
  const [still, setStill] = useState(false);
  /** Pointer or keyboard focus on one principle. Outranks the scroll position. */
  const [picked, setPicked] = useState<number | null>(null);
  /**
   * The band has been reached. The four cards' entrance is a one-time reveal on
   * its own observer rather than a function of the sweep, because those are two
   * different questions: the sweep answers "which principle am I reading", which
   * has to keep answering as the reader moves, and the entrance answers "has this
   * band arrived", which is only ever answered once. Driving the entrance from
   * the sweep meant the four cards faded back out when the reader scrolled up.
   */
  const [entered, setEntered] = useState(false);
  /**
   * The band is a stack rather than a row. Read from the same media query the
   * stylesheet's stacking rules are written inside, on mount rather than during
   * render — the server has no `matchMedia`, so the first paint is the row, and a
   * frame later it is whichever of the two this frame actually is.
   */
  const [stacked, setStacked] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    let cleanup: (() => void) | null = null;

    if (stilled()) {
      setProgress(1);
      setStill(true);
      setEntered(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setEntered(true);
    } else {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            setEntered(true);
            // Once opened, it stays open: the stagger is an arrival, and an
            // arrival that replays every time the band is scrolled past is a loop.
            observer.disconnect();
          }
        },
        { threshold: 0.2, rootMargin: "0px 0px -5% 0px" },
      );
      observer.observe(node);
      cleanup = () => observer.disconnect();
    }

    const track = node.closest<HTMLElement>(".why-track");
    const stage = node.closest<HTMLElement>(".why-stage");

    let pinned = false;
    let off: (() => void) | null = null;

    const stop = onPinned((on) => {
      pinned = on && !!track && !!stage;
      setStacked(pinned);

      // Resubscribed rather than branched inside the listener, so the frame a
      // breakpoint is crossed on is measured under the geometry that breakpoint
      // brings with it.
      off?.();
      off = onScroll(() => {
        if (pinned && track && stage) {
          const at = pinnedAt(track, stage);
          // Straight to the element: the four cards' positions are a function of
          // this and they move every frame, which is not something to re-render
          // twelve elements for. React is told the integer below instead.
          node.style.setProperty("--why-t", at.toFixed(4));
          setProgress(at);
          return;
        }

        node.style.removeProperty("--why-t");
        const rect = node.getBoundingClientRect();
        const view = viewport();
        // 0 when the band's top edge reaches 88% of the viewport height, 1 when
        // its bottom edge reaches 40% — so the sweep finishes while the band is
        // still comfortably on screen rather than as it leaves.
        const span = rect.height + view * 0.48;
        setProgress(clamp((view * 0.88 - rect.top) / span));
      });
    });

    return () => {
      stop();
      off?.();
      cleanup?.();
    };
  }, []);

  const revealedCount = pillars.filter(
    (_, index) => progress >= revealAt(index, pillars.length),
  ).length;
  /**
   * Which principle the band is currently on.
   *
   * Stacked, that is simply the topmost card that has finished climbing — the one
   * the reader is looking at, by construction. In a row it is the sweep, which has
   * to guess. Either way a pointer or a focus ring outranks it.
   */
  const reached = stacked
    ? pillars.filter(
        (_, index) =>
          index === 0 || progress >= arrives(index) + STACK_IN * 0.5,
      ).length - 1
    : Math.max(revealedCount - 1, 0);
  const swept = still ? 0 : reached;
  const active = picked ?? swept;

  return (
    <div ref={ref} className="why-band mt-12 lg:mt-16">
      {/* The top line and its one red indicator. A quarter of the rule wide, moved
          to the principle under it — so the line reports a position rather than
          filling up, and four columns never carry four accents. */}
      <div
        aria-hidden="true"
        className="relative hidden h-px w-full bg-white/15 lg:block"
      >
        <span
          className="principle-mark absolute inset-y-0 left-0 block bg-red"
          style={{
            width: `${100 / pillars.length}%`,
            transform: `translateX(${active * 100}%)`,
          }}
        />
        {/* A station per principle, so the columns are still marked on the line. */}
        {pillars.map((pillar, index) => (
          <span
            key={pillar.id}
            className="absolute top-0 block h-2 w-px bg-white/35"
            style={{ left: `${(index / pillars.length) * 100}%` }}
          />
        ))}
      </div>

      <ul className="why-stack grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
        {pillars.map((pillar, index) => {
          const Icon = icons[pillar.icon];
          const current = index === active;
          /** The card's own arrival, one beat behind the card before it. */
          const step = { transitionDelay: `${index * CARD_STEP}ms` };
          /**
           * The accent's delay, written per property rather than as one number.
           * Its transition is `transform` then `opacity`: the draw is the arrival
           * and takes the stagger, the brightening is the band's answer to being
           * pointed at and must not — a shared delay meant the fourth card's
           * accent took a third of a second to acknowledge the cursor.
           */
          const accentStep = { transitionDelay: `${index * CARD_STEP}ms, 0ms` };
          /**
           * The card's place in the stack, handed to the stylesheet as two plain
           * numbers: where its own climb starts and where the climb of the card
           * that will cover it starts. The first never climbs — it is already
           * standing when the stage pins — and the last is never covered, so both
           * are given a value outside the run rather than a special case.
           */
          const seat = {
            ...step,
            "--why-lead": index === 0 ? -1 : arrives(index),
            "--why-next": index === pillars.length - 1 ? 2 : arrives(index + 1),
            zIndex: index + 1,
          } as CSSProperties;

          return (
            <li
              key={pillar.id}
              /**
               * Focusable on purpose. Hover moves the indicator, and a principle
               * that can only be pointed at is a principle a keyboard cannot
               * reach — every word stays readable either way, so the tab stop
               * costs nothing and buys the same affordance.
               */
              tabIndex={0}
              onMouseEnter={() => setPicked(index)}
              onMouseLeave={() =>
                setPicked((value) => (value === index ? null : value))
              }
              onFocus={() => setPicked(index)}
              onBlur={() =>
                setPicked((value) => (value === index ? null : value))
              }
              style={seat}
              className="principle relative border-t border-white/15 pt-7 lg:border-l lg:border-t-0 lg:border-white/12 lg:px-7 lg:pt-8 lg:first:border-l-0 lg:first:pl-0 lg:last:pr-0"
              /* Stacked, the climb *is* the entrance — a second hidden state on
                 top of it would hold the first card at a quarter strength while it
                 is the only thing on the stage. */
              data-revealed={entered || stacked ? "true" : "false"}
            >
              {/* Each principle's own accent, drawn left to right as the sweep
                  reaches it — so the band establishes itself a station at a time
                  in the same direction the route above it runs.

                  It is held at 0.45 until the principle is the one being read,
                  and only then comes to full strength. That is what keeps it from
                  contradicting the single indicator on the rule above: four lines
                  at full red would be four answers to "which one am I reading",
                  where four faint lines and one bright one is a drawn structure
                  with a position marked on it. */}
              <span
                aria-hidden="true"
                style={accentStep}
                data-current={current ? "true" : "false"}
                className="principle-accent absolute left-0 top-0 block h-px w-full bg-red"
              />

              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "tabular-nums text-[0.6875rem] font-medium tracking-[0.2em] transition-colors duration-300",
                    current ? "text-red" : "text-white/60",
                  )}
                >
                  {`0${index + 1}`}
                </span>
                {/* The icon's whole response to being current: a shade brighter and
                    a hair larger. The indicator above already says which principle
                    is being read; anything more here would be a second answer to
                    the same question. */}
                <Icon
                  size={15}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className={cn(
                    "transition-[color,transform] duration-300 ease-out",
                    current
                      ? "text-white/85 motion-safe:scale-[1.12]"
                      : "text-white/55 motion-safe:scale-100",
                  )}
                />
              </div>

              <h3 className="mt-5 font-serif text-[1.45rem] uppercase leading-none tracking-[0.08em] text-white">
                {pillar.title}
              </h3>

              <p className="mt-4 max-w-[34ch] text-[0.95rem] leading-relaxed text-white/80">
                {pillar.body}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
