"use client";

import { useEffect, useRef } from "react";
import { clamp, onPinned, onScroll, pinnedAt, stilled } from "@/lib/motion";

/**
 * How much of the hero's own height the unpinned exit is spread over. Three
 * quarters, not all of it: the transition has to be finished by the time the hero
 * leaves rather than still running as its last pixels go, or the copy is caught
 * mid-fade at the exact moment the next section takes the screen.
 *
 * This is the tablet and phone number. On a desktop frame the hero is pinned and
 * the track's own length is the span — see `pinnedAt`.
 */
const SPAN = 0.75;

/**
 * The hero's departure — the first movement of the page's one journey.
 *
 * Everything it does is one custom property, `--hero-exit`, read 0 to 1. The rules
 * that consume it live beside the rest of the hero in globals.css, so the geometry
 * and the motion are not written down in two places, and adding a consumer costs a
 * declaration rather than a subscription.
 *
 * It is written to the document element rather than to the hero, and that is
 * deliberate: the last thing the departure does is send the dispatch route down
 * out of the frame, and the section that catches it is the next one. A property on
 * `:root` inherits everywhere, so the two halves of that line are driven by one
 * number without either section holding a reference to the other. The hero reads
 * it by inheritance like anything else.
 *
 * On a desktop frame the hero is pinned: it holds under the header while a 200vh
 * track scrolls past it, and the progress through that track is the clock — one
 * screen of pin, which the four beats of the light wipe are timed against. Below
 * `lg`, or for a reader who has asked for less motion, there is no track at all —
 * the hero occupies exactly the height it always did, the section below arrives at
 * exactly the scroll position it always did, and the exit is the shorter pass it
 * has always been. `onPinned` is the single query both this and the stylesheet are
 * gated on, so they cannot disagree about which of the two is happening.
 *
 * Both readings are taken live off the DOM every frame rather than accumulated, so
 * scrolling up runs the whole transition backwards exactly — there is no state
 * here to get out of step with the scrollbar.
 *
 * The component renders a marker rather than a wrapper so that `Hero` itself can
 * stay a server component — the hero is the page's largest subtree and the
 * heaviest image on it, and none of that needs to ship to the client to move a
 * photograph.
 */
export function HeroMotion() {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const canvas = ref.current?.closest<HTMLElement>(".hero-canvas");
    const track = canvas?.closest<HTMLElement>(".hero-track");
    if (!canvas || !track) return;

    const root = document.documentElement;
    const write = (value: number) =>
      root.style.setProperty("--hero-exit", value.toFixed(4));

    if (stilled()) {
      // Named explicitly rather than left to the stylesheet's default: under
      // reduced motion the hero holds its arrival state at every scroll position.
      write(0);
      return;
    }

    /**
     * How far the Positioning section is pulled up under the hero, in pixels,
     * negative.
     *
     * The light wipe erases the hero from the headlamps outwards and the section
     * underneath has to already be there to be erased *into*, so Positioning is
     * lapped back over the hero's own pinned screen — see `.pos-track` in
     * globals.css. The exact number is the canvas's height, and it has to be the
     * measured one rather than `100vh - header`: the canvas carries a
     * `min-height`, not a height, so a long line of copy at a narrow desktop
     * width can make it taller than a screen, and a lap that is short by even a
     * few pixels is a band of bare paper between the two sections.
     *
     * Written on mount, when the pinned query flips, and when the canvas changes
     * size — never per frame. It is a layout-affecting value, so recomputing it
     * on scroll would cost a reflow every frame to learn a number that cannot
     * have changed. The stylesheet's own fallback is the same figure expressed in
     * viewport units, so the first paint is already right and there is nothing to
     * shift.
     */
    const lap = () =>
      root.style.setProperty("--hero-lap", `${-canvas.offsetHeight}px`);

    lap();
    const sizing = new ResizeObserver(lap);
    sizing.observe(canvas);

    let pinned = false;
    let off: (() => void) | null = null;

    const read = () =>
      pinned
        ? pinnedAt(track, canvas)
        : clamp(
            -canvas.getBoundingClientRect().top /
              Math.max(canvas.offsetHeight * SPAN, 1),
          );

    const stop = onPinned((on) => {
      pinned = on;
      lap();
      // Resubscribing rather than branching inside the listener, so that the one
      // frame a breakpoint is crossed on is measured under the new geometry — the
      // track's height changes in the same layout pass the query flips in.
      off?.();
      off = onScroll(() => write(read()));
    });

    return () => {
      stop();
      off?.();
      sizing.disconnect();
      root.style.removeProperty("--hero-exit");
      root.style.removeProperty("--hero-lap");
    };
  }, []);

  return <span ref={ref} aria-hidden="true" className="hidden" />;
}
