"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/** Staggered delays are capped so a long row never trails far behind its first card. */
const MAX_DELAY = 120;

/**
 * Fades content in on first scroll into view. Renders visible immediately when
 * JS is unavailable or the visitor prefers reduced motion — the CSS hides it only
 * once this component has mounted.
 *
 * The observer uses a positive bottom root margin so the reveal starts before the
 * element reaches the viewport: content is already settled by the time it is read.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px 15% 0px", threshold: 0 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const staggered = Math.min(Math.max(delay, 0), MAX_DELAY);

  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", className)}
      data-visible={visible ? "true" : "false"}
      style={staggered ? { transitionDelay: `${staggered}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}
