"use client";

import { useEffect, useRef, useState } from "react";
import { UnitMark } from "@/components/illustrations/UnitMark";
import { clamp, onScroll, stilled, viewport } from "@/lib/motion";
import { STATIONS, passedIndex, readingLine } from "@/lib/stations";

/**
 * The whole page read as one call-out: a route down the left gutter with a stop for
 * each numbered section, and the dispatch unit driving down it as the reader scrolls.
 *
 * It is not a new rail. Every section already draws a hairline of red in its left
 * gutter, and this sits at exactly the same offset — 6px inside the shell, the same
 * `left-1.5` as `SignalRail` — so what the reader sees is the line they have been
 * looking at all along, now with a route drawn on it. The fixed layer contributes
 * only a very faint continuity line of its own, enough to carry the route across the
 * hero and the footer where there is no section rail, and far too faint to read as a
 * second line where it doubles one.
 *
 * Which stop is current is not decided here. It is asked of `lib/stations`, which is
 * the same question the navigation asks, in the same words — so the ambulance reaches
 * a marker on precisely the scroll position that lights that entry in the nav. They
 * cannot drift apart because there is only one answer.
 *
 * The route ends where the journey does: the destination node is the Contact band, at
 * the very bottom of the rail, so progress reads 100% exactly as Contact takes the
 * page. The footer is after the arrival, and the unit waits at the hospital through it.
 *
 * Desktop only, and only where the gutter exists: below `lg` the rail is 6px from the
 * edge of the screen with the content hard against it, so there is nowhere for a
 * vehicle and a number to go, and the stylesheet hides the layer outright. A reader
 * who has asked for less motion is given the finished route — filled, arrived, no
 * travel and no pulsing — rather than one that jumps.
 */

/** The gutter only exists at this width; below it the layer is hidden entirely. */
const DESKTOP = "(min-width: 1024px)";
/**
 * How hard a stop holds the unit as it passes. The unit's speed through a stop is
 * `1 - DWELL` of the scroll's, so this is the brake — below 1 or the route would
 * stall and then lurch, which is the one thing a scroll-linked position must not do.
 */
const DWELL = 0.62;
/** Widest a stop's hold may reach, as a fraction of the whole route. */
const DWELL_MAX = 0.032;
/** Time spent re-measuring is wasted while a drag-resize is still in flight. */
const SETTLE = 140;

const IDS = STATIONS.map((station) => station.id);

/** The arrival: a hospital cross, drawn in the same white-on-red as the unit. */
function DestinationMark() {
  return (
    <svg viewBox="0 0 12 12" className="journey-cross" aria-hidden="true">
      <rect x="0.5" y="0.5" width="11" height="11" rx="2.5" />
      <path d="M6 3.1v5.8M3.1 6h5.8" />
    </svg>
  );
}

export function JourneyTracker() {
  const rootRef = useRef<HTMLDivElement>(null);
  /**
   * Where each stop sits on the rail, 0 to 1. Unknowable until the page has been
   * laid out, so the layer stays invisible until the first measurement lands rather
   * than showing nine markers stacked at the top for a frame.
   */
  const [stops, setStops] = useState<readonly number[]>(() =>
    STATIONS.map(() => 0),
  );
  const [passed, setPassed] = useState(-1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const wide = window.matchMedia?.(DESKTOP) ?? null;
    const calm =
      window.matchMedia?.("(prefers-reduced-motion: reduce)") ?? null;

    /** Fraction of the rail each stop sits at, index-aligned with `STATIONS`. */
    let ats: number[] = [];
    /** Every band on the page in document coordinates, with its tone. */
    let bands: { top: number; bottom: number; dark: boolean }[] = [];
    /** Scroll distance the route spans: the top of the page to Contact's arrival. */
    let span = 1;
    let hold = DWELL_MAX;
    let railTop = 0;
    let railHeight = 1;
    let marks: HTMLElement[] = [];
    let unit: HTMLElement | null = null;
    let shown = -2;
    let release: (() => void) | null = null;
    let settle = 0;

    const measure = () => {
      const view = viewport();
      const line = readingLine();
      const top = window.scrollY;

      const tops = STATIONS.map((station) => {
        const node = document.getElementById(station.id);
        return node ? node.getBoundingClientRect().top + top : 0;
      });

      // The route is the scroll it takes to bring Contact to the reading line, so the
      // last stop lands on 1 by construction. Capped at the scroll that actually
      // exists, so a short page can still reach the end of its own route.
      const reach = Math.max(document.documentElement.scrollHeight - view, 1);
      span = Math.max(Math.min(tops[tops.length - 1] - line, reach), 1);
      ats = tops.map((at) => clamp((at - line) / span));

      // Hold windows must not touch, or two stops would pull at once and the unit
      // would drift backwards between them. Half the closest gap, at most.
      let gap = 1;
      for (let i = 1; i < ats.length; i += 1)
        gap = Math.min(gap, ats[i] - ats[i - 1]);
      hold = Math.max(Math.min(DWELL_MAX, gap * 0.45), 0.001);

      bands = Array.from(
        document.querySelectorAll<HTMLElement>("#main > *, footer"),
      ).map((band) => {
        const rect = band.getBoundingClientRect();
        return {
          top: rect.top + top,
          bottom: rect.bottom + top,
          // `on-dark` is what `Section` stamps on its navy tones, so the rail can
          // read the page's own tone rather than keeping a list of section names.
          dark: band.classList.contains("on-dark"),
        };
      });

      const rail = root
        .querySelector<HTMLElement>(".journey-rail")
        ?.getBoundingClientRect();
      // The CSS insets every position by `--journey-pad` so the unit and the
      // destination node never hang off the top or bottom of the screen. The
      // tone lookup has to walk the same inset track or it reads the wrong band.
      const pad =
        parseFloat(getComputedStyle(root).getPropertyValue("--journey-pad")) ||
        0;
      railTop = (rail?.top ?? 0) + pad;
      railHeight = Math.max((rail?.height ?? 1) - pad * 2, 1);
      marks = Array.from(root.querySelectorAll<HTMLElement>(".journey-stop"));
      unit = root.querySelector<HTMLElement>(".journey-unit");

      setStops(ats);
      setReady(true);
    };

    /** True where the rail crosses one of the navy bands. */
    const shaded = (at: number) => {
      for (let i = bands.length - 1; i >= 0; i -= 1) {
        if (at >= bands[i].top && at < bands[i].bottom) return bands[i].dark;
      }
      return false;
    };

    /**
     * Scroll progress, with a stop's pull folded in: near a marker the unit is drawn
     * towards it and slows to `1 - DWELL` of the scroll's pace, then releases.
     *
     * Every term is a function of the scroll position alone — no easing towards a
     * target, no accumulated velocity — which is what makes the journey reverse
     * exactly. Scrolling back up retraces the same curve rather than approximating it.
     */
    const along = (progress: number) => {
      let at = progress;
      for (const stop of ats) {
        const away = Math.abs(progress - stop);
        if (away >= hold) continue;
        const pull = 1 - away / hold;
        at += (stop - progress) * DWELL * pull * pull;
      }
      return clamp(at);
    };

    const tone = (node: HTMLElement, at: number) => {
      const want = shaded(at) ? "dark" : "light";
      if (node.dataset.on !== want) node.dataset.on = want;
    };

    const frame = () => {
      const progress = clamp(window.scrollY / span);
      const at = along(progress);
      root.style.setProperty("--journey-at", at.toFixed(5));

      const here = passedIndex(IDS, readingLine());
      if (here !== shown) {
        shown = here;
        setPassed(here);
      }

      const origin = window.scrollY + railTop;
      for (let i = 0; i < marks.length; i += 1)
        tone(marks[i], origin + ats[i] * railHeight);

      // The base line runs the whole height, so it takes its tone from the band the
      // unit is over — the one place on the rail the eye is actually resting.
      tone(root, origin + at * railHeight);

      if (unit) {
        tone(unit, origin + at * railHeight);
        const near = ats.some((stop) => Math.abs(progress - stop) < hold * 0.7);
        const want = near ? "true" : "false";
        if (unit.dataset.near !== want) unit.dataset.near = want;
      }
    };

    const stop = () => {
      release?.();
      release = null;
    };

    const sync = () => {
      stop();

      if (wide && !wide.matches) {
        setReady(false);
        return;
      }

      measure();

      if (stilled()) {
        // The finished route, held: filled to the destination, everything behind it
        // complete, nothing travelling and nothing pulsing. Nothing reads the scroll
        // either, so the markers cannot follow the bands they are over — the
        // stylesheet draws the whole route at one strength that reads on both grounds.
        root.dataset.still = "true";
        root.style.setProperty("--journey-at", "1");
        shown = STATIONS.length - 1;
        setPassed(shown);
        return;
      }

      root.dataset.still = "false";
      release = onScroll(frame);
    };

    const resettle = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(sync, SETTLE);
    };

    sync();

    // Everything measured here is document geometry, so it moves when the viewport
    // changes and again when an image or a webfont above the fold lands and pushes
    // the sections down. The observer catches the second kind, which no resize
    // event reports.
    const grows =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(resettle)
        : null;
    const main = document.getElementById("main");
    if (grows && main) grows.observe(main);

    window.addEventListener("resize", resettle);
    window.addEventListener("orientationchange", resettle);
    wide?.addEventListener("change", sync);
    calm?.addEventListener("change", sync);

    return () => {
      stop();
      window.clearTimeout(settle);
      grows?.disconnect();
      window.removeEventListener("resize", resettle);
      window.removeEventListener("orientationchange", resettle);
      wide?.removeEventListener("change", sync);
      calm?.removeEventListener("change", sync);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="journey"
      data-ready={ready ? "true" : "false"}
    >
      <div className="shell journey-shell">
        <div className="journey-rail">
          <span className="journey-base" />
          <span className="journey-fill" />

          {STATIONS.map((station, index) => {
            const last = index === STATIONS.length - 1;
            return (
              <span
                key={station.id}
                className="journey-stop"
                data-state={
                  index === passed
                    ? "current"
                    : index < passed
                      ? "done"
                      : "next"
                }
                data-dest={last ? "true" : undefined}
                style={
                  { "--journey-stop": stops[index] } as React.CSSProperties
                }
              >
                <span className="journey-pulse" />
                {last ? <DestinationMark /> : <span className="journey-mark" />}
                <span className="journey-index">{station.index}</span>
              </span>
            );
          })}

          <span className="journey-unit" data-near="false">
            <svg viewBox="-13 -13 26 26" aria-hidden="true">
              <UnitMark />
            </svg>
          </span>
        </div>
      </div>
    </div>
  );
}
