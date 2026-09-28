"use client";

import { useEffect, useRef, useState } from "react";
import { Media } from "@/components/ui/Media";
import { onScroll, pass, stilled, viewport } from "@/lib/motion";

/**
 * Total distance the photograph travels inside its own crop, top of its pass to
 * bottom — so ±6px either side of centre. The same 12px every other plate on the
 * page drifts (see `ParallaxLayer`): a fixed number rather than a share of the
 * plate's height, because a share makes the tallest photograph drift the furthest,
 * which is exactly backwards — the biggest plate is the one where movement shows.
 */
const TRAVEL = 12;

/**
 * The About photograph. Two things happen to it and no more: it is uncovered by a
 * clean horizontal mask when it is first reached, and thereafter — on desktop only —
 * it holds a few pixels of parallax inside its own crop as the band is read.
 *
 * The caption follows rather than accompanies — it names what the photograph is a
 * picture of, and a name that arrives with the thing it names is not read.
 */
export function AboutPlate({
  src,
  alt,
  caption,
  sizes,
}: {
  src: string;
  alt: string;
  caption: string;
  sizes: string;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const shift = useRef<HTMLDivElement | null>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const still = typeof IntersectionObserver === "undefined" || stilled();

    if (still) {
      // Uncovered outright, and pinned: no mask animation, no parallax.
      setRun(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setRun(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(node);

    /**
     * Where the plate sits in its own pass across the viewport, 0 to 1, turned into
     * a travel of ±TRAVEL/2. Measured off the live rect rather than accumulated from
     * scroll deltas, so it is correct after a resize, a jump to an anchor, or a
     * reload part-way down the page.
     *
     * Written straight to the node as a custom property. This runs every frame the
     * plate is on screen, and re-rendering a React subtree sixty times a second to
     * move a photograph six pixels is work the compositor will do for free.
     */
    const measure = () => {
      const travel = (pass(node.getBoundingClientRect(), viewport()) - 0.5) * TRAVEL;
      shift.current?.style.setProperty("--shift", `${travel.toFixed(2)}px`);
    };

    /**
     * Desktop only, and bound to the query rather than read once — the same gate
     * `ParallaxLayer` uses, so every photograph on the page starts and stops
     * drifting at the same width. A touch screen is scrolled in long flicks where
     * parallax reads as the crop lagging, and it is the one place the mask reveal
     * has to carry the plate on its own.
     */
    const wide = window.matchMedia("(min-width: 1024px)");
    let off: (() => void) | null = null;

    const sync = () => {
      off?.();
      off = null;
      if (!wide.matches) {
        shift.current?.style.setProperty("--shift", "0px");
        return;
      }
      off = onScroll(measure);
    };

    sync();
    wide.addEventListener("change", sync);

    return () => {
      observer.disconnect();
      off?.();
      wide.removeEventListener("change", sync);
    };
  }, []);

  return (
    <figure
      ref={ref as never}
      className="plate"
      data-run={run ? "true" : "false"}
    >
      <div className="plate-clip relative overflow-hidden">
        <div ref={shift} className="plate-shift">
          <Media
            src={src}
            alt={alt}
            ratio="plate"
            frame="square"
            focus="vehicle"
            sizes={sizes}
          />
        </div>
      </div>

      {/* The plate's one line of caption, ruled off the same red tick every
          operational label on the page uses. It says what the photograph is a
          picture of; it does not claim anything the page cannot support. */}
      <figcaption className="plate-caption mt-3 flex items-center gap-3 font-sans text-[0.625rem] font-medium uppercase leading-none tracking-[0.2em] text-muted">
        <span aria-hidden="true" className="h-px w-5 shrink-0 bg-red" />
        {caption}
      </figcaption>
    </figure>
  );
}
