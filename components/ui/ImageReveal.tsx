"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * A photograph arriving.
 *
 * The plate is uncovered from its own top edge — `inset(12% 0 0 0)` opening to
 * `inset(0)` — while it rises the last 20px into place and comes up to full
 * strength. One mask, one lift, one fade, all on the same 860ms curve, so the
 * three read as a single movement rather than as three effects stacked on one
 * element. The rule itself lives in globals.css beside the rest of the page's
 * entrances; all this component owns is when it fires.
 *
 * It owns its own observer rather than riding the section's. A section's `Reveal`
 * trips as soon as any part of a long band crosses the fold, which on the partner
 * rows is the headline — a photograph two thirds of the way down the band would
 * then have already played its entrance by the time it is looked at. A quarter of
 * the image itself is the honest trigger: the reveal starts when there is enough
 * of the plate on screen to see it happen.
 *
 * The observed element is deliberately NOT the masked one. `clip-path` shrinks an
 * element's intersection rectangle, so when the mask and the observer sat on the
 * same div the start state ate into its own trigger: the top 12% the mask hides is
 * exactly the strip that enters the viewport first, so `intersectionRatio` ran a
 * flat 0.12 behind the truth and a 0.25 threshold waited for 37% of the plate. The
 * outer div is unstyled and unclipped, so the ratio means what it says. It showed
 * up as a real defect — landing directly on `/#about` put a fifth of that plate on
 * screen and left it blank, because the observer thought it was 0.201 in.
 *
 * Once only. The observer disconnects on the first intersection, so scrolling
 * back up and down a band does not replay four photographs at the reader.
 *
 * `data-shown` starts false and the hidden state is scoped to `.js`, which an
 * inline script in the layout sets. With no JavaScript the attribute is still
 * false and the stylesheet still cannot act on it, so the plate renders complete.
 */
export function ImageReveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setShown(true);
          observer.disconnect();
        }
      },
      // A quarter of the plate, which is the middle of the brief's 20–30% band.
      // No root margin: the threshold is the trigger, and a margin on top of it
      // would mean the reveal starting before the share it names is really there.
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <div className={cn("img-reveal", className)} data-shown={shown ? "true" : "false"}>
        {children}
      </div>
    </div>
  );
}
