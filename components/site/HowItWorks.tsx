"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Section, SectionHeading } from "@/components/ui/Section";
import { RouteMap } from "@/components/illustrations/RouteMap";
import { StepRoute } from "@/components/illustrations/StepRoute";
import { steps } from "@/data/site";
import { cn } from "@/lib/cn";

/** Long enough that the travel between two steps reads as movement, not a jump. */
const ROUTE_MS = 800;

/**
 * Where the route's travel is finished, as a fraction of the stage. The last step
 * takes the highlight at this point with the ambulance already parked, so its own
 * quarter is Care's dwell: a screen's worth of scroll to read the handover before
 * the stage lets go of the page.
 */
const ARRIVAL = (steps.length - 1) / steps.length;

/**
 * A hair past a stage boundary. `floor` decides which step a scroll position is
 * in, so a click that targets a boundary exactly can land a sub-pixel short of it
 * and light the step before the one that was clicked.
 */
const INSIDE = 0.01;

/**
 * The most of the stage a single painted frame may cover, as a fraction of it.
 * A quarter of the stage is one step, so a flung wheel or a dragged scrollbar
 * crosses a step in about a dozen frames rather than in one: Dispatch and Track
 * are passed *through* at speed instead of being jumped over. Ordinary reading
 * never reaches the cap — at anything under about two screens a second the
 * diagram sits exactly on the scroll position rather than trailing it.
 */
const CHASE = 1 / steps.length / 12;

/**
 * Every step and its description are always rendered — interaction only moves the
 * highlight and the route progress. That keeps the section readable with JS off,
 * with animation disabled, and on touch devices where hover does not exist.
 *
 * On large screens the section is a stage: the steps and the route pin under the
 * header for two screens of scroll — half a screen a step — and the page's own
 * scrollbar is the clock. Scroll position maps to a fraction of the stage, the fraction maps to a
 * quarter — Request, Dispatch, Track, Care — and the highlighted card, the lit
 * route, the nodes behind the unit and the ambulance's position are all read off
 * that one fraction. So they cannot disagree, scrolling back up runs the whole
 * thing backwards exactly, and the stage releases the page after Care like any
 * other section. Nothing is on a timer and the scroll is never intercepted: the
 * page scrolls at its own speed and the diagram reads it.
 *
 * Below `lg`, and anywhere motion is not welcome, there is no stage at all — the
 * stylesheet simply does not pin it. The steps are an ordinary vertical list the
 * reader taps or keys through, and `active` is theirs to set.
 */
export function HowItWorks() {
  const [active, setActive] = useState(0);
  /** How far through the stage the page is: 0 as it pins, 1 as it releases. */
  const [progress, setProgress] = useState(0);
  /** True while the stage is pinned and the scrollbar owns the highlight. */
  const [driven, setDriven] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  /** Published by the effect while the stage is pinned; null while it is not. */
  const scrollToStep = useRef<((index: number) => void) | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const stage = stageRef.current;
    if (!track || !stage) return;

    /**
     * The same condition the stylesheet pins the stage under, so the two can never
     * disagree: a reader is never scrolling a stage that is not pinned, and never
     * tapping a list whose highlight the scrollbar has taken over.
     */
    const pinned = window.matchMedia(
      "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
    );

    let dead = false;
    let frame = 0;
    let listening = false;
    /** The sticky offset, read off the stage so the number only lives in the CSS. */
    let offset = 0;
    /** Where the page actually is in the stage. */
    let target = 0;
    /** What the diagram is showing. Equal to `target` except while catching up. */
    let shown = 0;

    /** The scroll the stage has while pinned: its track, less the screen it fills. */
    const travel = () => Math.max(track.getBoundingClientRect().height - stage.offsetHeight, 1);

    /** How far through the stage the page is: 0 as it pins, 1 as it releases. */
    const read = () => {
      const reached = offset - track.getBoundingClientRect().top;
      return Math.min(Math.max(reached / travel(), 0), 1);
    };

    /** The one place the fraction becomes a highlight, so they cannot disagree. */
    const draw = () => {
      setProgress(shown);
      // Four equal quarters. At exactly 1 the floor would run off the end.
      setActive(Math.min(Math.floor(shown * steps.length), steps.length - 1));
    };

    /**
     * Whether any part of the stage is on screen. Off screen there is nothing to
     * pass through — a nav link three sections down should not leave the diagram
     * quietly running a sequence nobody is looking at — so the chase is skipped
     * and the fraction snaps.
     */
    const onScreen = () => {
      const box = track.getBoundingClientRect();
      return box.bottom > 0 && box.top < window.innerHeight;
    };

    const paint = () => {
      frame = 0;
      const gap = target - shown;
      shown =
        Math.abs(gap) <= CHASE || !onScreen() ? target : shown + Math.sign(gap) * CHASE;

      draw();
      // Still behind the page: keep painting until it has caught up, with or
      // without further scrolling. This is what carries the sequence through a
      // fling, and it runs backwards for an upward one on the same arithmetic.
      if (shown !== target) frame = requestAnimationFrame(paint);
    };

    /** One read per frame at most: a scroll fires far more often than it paints. */
    const onScroll = () => {
      target = read();
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const listen = (on: boolean) => {
      if (on === listening) return;
      listening = on;
      if (on) window.addEventListener("scroll", onScroll, { passive: true });
      else window.removeEventListener("scroll", onScroll);
    };

    /**
     * Geometry, and then the diagram put straight onto it with no chase. Anything
     * that can move the section out from under the stage has to come through here
     * or the stage goes on mapping scroll positions onto a track that has since
     * moved: a resize, a rotation, a webfont swapping in and reflowing the cards,
     * a late image above the section pushing it down the page.
     */
    const measure = () => {
      offset = parseFloat(window.getComputedStyle(stage).top) || 0;
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      target = shown = read();
      draw();
    };

    const remeasure = () => {
      if (!dead && pinned.matches) measure();
    };

    const sync = () => {
      if (!pinned.matches) {
        scrollToStep.current = null;
        listen(false);
        setDriven(false);
        return;
      }

      /**
       * A step is a scroll position while the stage is pinned, so selecting one is
       * a scroll to it rather than a state change — the highlight then arrives the
       * same way it does under a finger on the wheel.
       */
      scrollToStep.current = (index) => {
        const top = track.getBoundingClientRect().top + window.scrollY - offset;
        const fraction = index / steps.length + INSIDE;
        window.scrollTo({ top: Math.round(top + fraction * travel()), behavior: "smooth" });
      };

      listen(true);
      setDriven(true);
      measure();
    };

    sync();
    window.addEventListener("resize", sync);
    window.addEventListener("orientationchange", sync);
    pinned.addEventListener("change", sync);

    /* The track and the stage are sized in viewport units, so the observer is not
       watching for them to change on their own — it is the cheapest way to hear
       about everything else that reflows them or the page above them, images and
       late fonts included, without polling. */
    const observer = new ResizeObserver(remeasure);
    observer.observe(track);
    observer.observe(stage);

    // Belt and braces for the two that can land after layout has settled once.
    window.addEventListener("load", remeasure);
    document.fonts?.ready.then(remeasure);

    return () => {
      dead = true;
      if (frame) cancelAnimationFrame(frame);
      listen(false);
      observer.disconnect();
      window.removeEventListener("resize", sync);
      window.removeEventListener("orientationchange", sync);
      window.removeEventListener("load", remeasure);
      pinned.removeEventListener("change", sync);
    };
  }, []);

  /** A deliberate selection: a scroll while the stage is pinned, a state change otherwise. */
  const select = useCallback((index: number) => {
    const scroll = scrollToStep.current;
    if (scroll) scroll(index);
    else setActive(index);
  }, []);

  /**
   * Focus alone only moves the highlight where the reader owns it. While the stage
   * is pinned the scroll position *is* the highlight, and tabbing into the list
   * should not throw the page to the first step.
   */
  const focus = useCallback((index: number) => {
    if (!scrollToStep.current) setActive(index);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowDown: index + 1,
      ArrowLeft: index - 1,
      ArrowUp: index - 1,
      Home: 0,
      End: steps.length - 1,
    };

    const next = moves[event.key];
    if (next === undefined) return;

    event.preventDefault();
    const bounded = Math.min(Math.max(next, 0), steps.length - 1);
    select(bounded);
    listRef.current?.querySelectorAll("button")[bounded]?.focus();
  };

  return (
    <Section id="how" tone="dark">
      <SectionHeading
        index="07"
        eyebrow="How it works"
        title="From request to handover, without the noise."
        tone="dark"
      />

      <div ref={trackRef} className="how-track mt-10 lg:mt-12">
        <div ref={stageRef} className="how-stage">
          {/* Small screens: a compact route above the cards, so the unit moving to
              the selected step stays on screen while the steps are being read. */}
          <div aria-hidden="true" className="mb-9 text-white lg:hidden">
            <StepRoute
              instanceId="how-step-route"
              total={steps.length}
              active={active}
              duration={ROUTE_MS}
            />
          </div>

          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:gap-14">
            <div aria-hidden="true" className="hidden text-white lg:block">
              {/* One route stop per step — the pin, the two waypoints, the hospital.
                  Pinned, the scroll fraction drives it and the unit travels between
                  stops with the page; tapped, it eases to the selected stop. */}
              <RouteMap
                instanceId="how-route"
                duration={ROUTE_MS}
                stop={active}
                progress={driven ? Math.min(progress, ARRIVAL) / ARRIVAL : undefined}
              />
            </div>

            <ol ref={listRef}>
              {steps.map((step, index) => {
                const current = index === active;

                return (
                  <li
                    key={step.id}
                    className={cn(
                      "relative border-t border-white/15 transition-colors duration-500 last:border-b",
                      current ? "bg-white/[0.05]" : "bg-transparent",
                    )}
                  >
                    {/* Red edge marker: the active step is obvious at a glance, even
                        before the colour shift in the text registers. */}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute left-0 top-0 w-[3px] rounded-full bg-red transition-all duration-300",
                        current ? "h-full opacity-100" : "h-0 opacity-0",
                      )}
                    />

                    <button
                      type="button"
                      onClick={() => select(index)}
                      onFocus={() => focus(index)}
                      onKeyDown={(event) => onKeyDown(event, index)}
                      aria-current={current ? "step" : undefined}
                      className="block w-full py-5 pl-4 pr-1 text-left sm:py-6 sm:pl-6"
                    >
                      {/* The 4px shift lives on the content, not the row: the row keeps
                          its full-width background and borders, and the focus ring is
                          never clipped by an overflow rule needed to contain the shift. */}
                      <span
                        className={cn(
                          "flex items-start gap-4 transition-transform duration-500 ease-out sm:gap-6",
                          current && "motion-safe:translate-x-1",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-1 inline-flex h-7 min-w-[1.75rem] shrink-0 items-center justify-center rounded-full px-2 font-sans text-[0.72rem] font-medium tracking-[0.14em] transition-colors duration-300",
                            current ? "bg-red text-white" : "border border-white/20 text-white/45",
                          )}
                        >
                          {step.number}
                        </span>

                        <span className="flex-1">
                          <span
                            className={cn(
                              "block font-serif text-[1.5rem] leading-tight transition-colors duration-300 sm:text-[1.9rem]",
                              current ? "text-white" : "text-white/60",
                            )}
                          >
                            {step.title}
                          </span>
                          <span
                            className={cn(
                              "mt-1.5 block text-[0.95rem] leading-relaxed transition-colors duration-300",
                              current ? "text-white/80" : "text-white/55",
                            )}
                          >
                            {step.body}
                          </span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </div>
    </Section>
  );
}
