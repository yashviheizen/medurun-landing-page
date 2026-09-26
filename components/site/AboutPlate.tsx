"use client";

import { useEffect, useRef, useState } from "react";
import { Media } from "@/components/ui/Media";

/**
 * How much the photograph travels inside its own crop, as a share of the plate's
 * height. 2.4% — the whole point is that it is not noticed as movement, only as the
 * plate having depth. Anything past about 3% and the crop is visibly sliding.
 */
const DRIFT = 0.024;

/**
 * The overscale that gives the drift somewhere to go. It is a crop decision, not
 * motion: it is applied at every setting, including reduced motion, so the plate
 * shows the same framing to everybody.
 */
const SCALE = 1.05;

/**
 * The About photograph. Two things happen to it and no more: it is uncovered by a
 * clean horizontal mask when it is first reached, and thereafter it holds a couple
 * of percent of parallax inside its own crop as the band is read.
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
  const [run, setRun] = useState(false);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const still =
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    let frame = 0;

    /**
     * Where the plate sits in its own pass across the viewport, 0 to 1, turned into
     * a travel of ±DRIFT of its height. Measured off the live rect rather than
     * accumulated from scroll deltas, so it is correct after a resize, a jump to an
     * anchor, or a reload part-way down the page.
     */
    const measure = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const view = window.innerHeight || document.documentElement.clientHeight;
      const span = view + rect.height;
      if (span <= 0) return;
      const progress = Math.min(Math.max((view - rect.top) / span, 0), 1);
      setOffset((progress - 0.5) * 2 * DRIFT * rect.height);
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <figure
      ref={ref as never}
      className="plate"
      data-run={run ? "true" : "false"}
    >
      <div className="plate-clip relative overflow-hidden">
        <div style={{ transform: `translate3d(0, ${offset.toFixed(2)}px, 0) scale(${SCALE})` }}>
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
