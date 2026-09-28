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
 * On a desktop frame the hero is pinned: it holds under the header while a ~150vh
 * track scrolls past it, and the progress through that track is the clock. Below
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
      // Resubscribing rather than branching inside the listener, so that the one
      // frame a breakpoint is crossed on is measured under the new geometry — the
      // track's height changes in the same layout pass the query flips in.
      off?.();
      off = onScroll(() => write(read()));
    });

    return () => {
      stop();
      off?.();
      root.style.removeProperty("--hero-exit");
    };
  }, []);

  return <span ref={ref} aria-hidden="true" className="hidden" />;
}
