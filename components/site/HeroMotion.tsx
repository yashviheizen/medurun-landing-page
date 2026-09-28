"use client";

import { useEffect, useRef } from "react";
import { onScroll, stilled } from "@/lib/motion";

/**
 * How much of the hero's own height the exit is spread over. Three quarters, not
 * all of it: the transition has to be finished by the time the hero leaves rather
 * than still running as its last pixels go, or the copy is caught mid-fade at the
 * exact moment the next section takes the screen.
 */
const SPAN = 0.75;

/**
 * The hero's departure.
 *
 * As the page scrolls off the hero the photograph swells very slightly and the
 * centred copy lifts and softens — the section recedes rather than simply
 * scrolling away. Everything it does is one custom property, `--hero-exit`, read
 * from 0 to 1; the rules that consume it live beside the rest of the hero in
 * globals.css, so the geometry and the motion are not written down in two places.
 *
 * Nothing here is sticky and nothing is pinned. The hero occupies exactly the
 * height it always did and the section below it arrives at exactly the scroll
 * position it always did: the brief's "do not delay access to the next section"
 * is not a thing to be careful about here, it is a property of driving the effect
 * from a transform rather than from scroll distance.
 *
 * The component renders a marker rather than a wrapper so that `Hero` itself can
 * stay a server component — the hero is the page's largest subtree and the
 * heaviest image on it, and none of that needs to ship to the client to move a
 * photograph four percent.
 */
export function HeroMotion() {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const canvas = ref.current?.closest<HTMLElement>(".hero-canvas");
    if (!canvas) return;

    if (stilled()) {
      // Named explicitly rather than left to the stylesheet's default: under
      // reduced motion the hero holds its arrival state at every scroll position.
      canvas.style.setProperty("--hero-exit", "0");
      return;
    }

    return onScroll(() => {
      const rect = canvas.getBoundingClientRect();
      const span = rect.height * SPAN;
      const exit = span > 0 ? Math.min(Math.max(-rect.top / span, 0), 1) : 0;
      canvas.style.setProperty("--hero-exit", exit.toFixed(4));
    });
  }, []);

  return <span ref={ref} aria-hidden="true" className="hidden" />;
}
