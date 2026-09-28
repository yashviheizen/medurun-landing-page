"use client";

import { useEffect, useRef } from "react";
import { onScroll, pass, stilled, viewport } from "@/lib/motion";

/**
 * The image layer inside a photographic frame, drifting a few pixels against the
 * page as the frame is read.
 *
 * It sits inside `Media`'s frame rather than around it, which is the whole trick:
 * the frame keeps its own radius, aspect box and scrim and does not move, and the
 * photograph moves within it. A parallax applied to the frame instead would slide
 * the plate's edge against the text beside it, which reads as a layout bug.
 *
 * Desktop only, and only where motion is welcome. On a phone the frames are small,
 * the scroll is a flick rather than a read, and a few pixels of counter-movement
 * costs a compositor layer per photograph to buy something nobody can see.
 *
 * The travel is written to a custom property on the node rather than held in React
 * state. A `setState` per photograph per frame would re-render a tree sixty times a
 * second to move something ten pixels; one property write on the element does the
 * same job on the compositor and never touches React at all.
 */
export function ParallaxLayer({
  travel = 10,
  className,
  children,
}: {
  /** Total distance the photograph covers across its whole pass, in pixels. */
  travel?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const wide = window.matchMedia("(min-width: 1024px)");

    let off: (() => void) | null = null;

    const measure = () => {
      // `pass` is 0 as the frame's top edge touches the bottom of the screen and 1
      // as its bottom edge leaves the top; centred on 0 it becomes a drift from
      // half the travel above to half below, passing through zero — its authored
      // crop — at the moment the frame is centred in the viewport and being read.
      const shift = (pass(node.getBoundingClientRect(), viewport()) - 0.5) * travel;
      node.style.setProperty("--shift", `${shift.toFixed(2)}px`);
    };

    const sync = () => {
      off?.();
      off = null;

      if (!wide.matches || stilled()) {
        // Parked on its authored crop, not on wherever the last frame left it.
        node.style.setProperty("--shift", "0px");
        return;
      }

      off = onScroll(measure);
    };

    sync();
    wide.addEventListener("change", sync);

    return () => {
      off?.();
      wide.removeEventListener("change", sync);
    };
  }, [travel]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
