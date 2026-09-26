"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import type { FlowStage } from "@/data/site";

/**
 * The MEDURUN emergency network as an operational schematic: the five stages a
 * single emergency passes through, on one line, with the state of each stage
 * written underneath it.
 *
 * Built from HTML on a hairline rail rather than an SVG with `<text>`, for the
 * same reason the hero's route is: the labels then use the page's real type and
 * the layout can wrap, so nothing is ever clipped or letterboxed at a width the
 * diagram was not drawn for.
 *
 * MEDURUN is the one red node — the hub every other stage passes through — and it
 * keeps the journey's own order rather than being pushed to the geometric middle,
 * because a network diagram that reorders the operation to look symmetrical is
 * describing a different operation.
 *
 * The band routes one request when it is first read, and then stops. The rail draws
 * left to right, the five stages come on in order behind the drawing edge, and a
 * single red signal runs the length of it — once. After that the only thing left
 * moving is a slow, faint ring on the hub: a network idling, not an indicator
 * demanding attention.
 *
 * Nothing here dims a label below 0.55, so every stage is readable at every point
 * of the sequence. The hidden states are scoped to `.js .flow[data-run="false"]`
 * (see globals.css), so a reader with no JS gets the finished schematic, and under
 * `prefers-reduced-motion` the whole thing is armed on mount and arrives complete.
 */

/** Half a column: where the first and last nodes sit, as a percentage. */
const halfColumn = (count: number) => 100 / count / 2;

/** Behind the rail's own draw, then one stage every 130ms. */
const STAGE_FROM = 120;
const STAGE_STEP = 130;

export function NetworkFlow({ stages }: { stages: FlowStage[] }) {
  const inset = halfColumn(stages.length);
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    // No observer, or no appetite for motion: the schematic is simply complete.
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setRun(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setRun(true);
          // Once routed, it stays routed — leaving and coming back does not replay
          // it. A diagram that re-runs every time it is scrolled past is a loop
          // with extra steps.
          observer.disconnect();
        }
      },
      { threshold: 0.35, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="flow relative" data-run={run ? "true" : "false"}>
      {/* Desktop rail. Spans node to node, so the line never dangles past the
          outer stages, and sits on the markers' own centre line. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-2 hidden h-px lg:block">
        <span
          className="absolute inset-y-0 block"
          style={{ left: `${inset}%`, right: `${inset}%` }}
        >
          <span className="flow-rail absolute inset-x-0 top-0 block border-t border-dashed border-navy/30" />

          {/* The travelling signal. The moving wrapper spans the rail exactly, so a
              100% translate lands the dot on the last node — and that overshoot has
              to be clipped, or the wrapper's far edge widens the page by most of the
              rail's length. The clip box is therefore the rail plus half a centimetre
              of air on every side: enough for the dot and its halo to sit whole on
              the first and last nodes, and nothing else. */}
          <span className="absolute -left-2 -top-2 block h-4 w-[calc(100%+1rem)] overflow-hidden">
            {run ? (
              <span className="absolute inset-y-0 left-2 block w-[calc(100%-1rem)] motion-safe:animate-flow-run motion-reduce:hidden">
                <span className="absolute left-0 top-1/2 block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red shadow-[0_0_0_4px_rgba(237,28,36,0.14)]" />
              </span>
            ) : null}
          </span>
        </span>
      </div>

      <ol className="relative flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:gap-0">
        {stages.map((stage, index) => {
          const delay = `${STAGE_FROM + index * STAGE_STEP}ms`;

          return (
            <li
              key={stage.id}
              className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:gap-0 lg:px-3 lg:text-center"
            >
              {/* The stacked rail, drawn one segment at a time so it ends exactly on
                  the last node. The segment runs from this marker's centre to the
                  next one, which is this row's height plus the list's 1.5rem gap. */}
              {index < stages.length - 1 ? (
                <span
                  aria-hidden="true"
                  style={{ transitionDelay: delay }}
                  className="flow-seg absolute left-[7px] top-2 block h-[calc(100%+1.5rem)] w-px border-l border-dashed border-navy/30 lg:hidden"
                />
              ) : null}

              <span className="relative flex h-4 w-4 shrink-0 items-center justify-center">
                {stage.hub ? (
                  <>
                    {/* The network's resting beat, and the only thing on this band
                        still moving once the request has been routed. It waits out
                        the sequence before it starts — see `hub-pulse`. */}
                    <span
                      aria-hidden="true"
                      className="absolute h-4 w-4 rounded-full bg-red/25 motion-safe:animate-hub-pulse"
                    />
                    <span
                      aria-hidden="true"
                      style={{ transitionDelay: delay }}
                      className="flow-node absolute h-4 w-4 rounded-full border border-red/30 bg-paper"
                    />
                    <span
                      style={{ transitionDelay: delay }}
                      className="flow-node relative block h-[9px] w-[9px] rounded-full bg-red"
                    />
                  </>
                ) : (
                  <span
                    style={{ transitionDelay: delay }}
                    className="flow-node block h-[7px] w-[7px] rounded-full border border-navy/50 bg-paper"
                  />
                )}
              </span>

              <div className="relative min-w-0 lg:mt-5">
                {/* The hub's own rule: the only other red on the schematic, and what
                    marks the active node once the travelling signal has passed. It
                    hangs off the label block rather than sitting in it, so the five
                    labels keep one baseline and the hub is marked without the row
                    going ragged. */}
                {stage.hub ? (
                  <span
                    aria-hidden="true"
                    className="absolute -top-3 left-1/2 hidden -translate-x-1/2 lg:block"
                  >
                    {/* The centring translate stays on the wrapper: the rule itself
                        carries the scale it comes on with, and nothing has to
                        restate a position in a keyframe. */}
                    <span
                      style={{ transitionDelay: delay }}
                      className="flow-node block h-px w-5 bg-red"
                    />
                  </span>
                ) : null}

                <div className="flow-label" style={{ transitionDelay: delay }}>
                  <p
                    className={cn(
                      "font-sans text-[0.6875rem] font-medium uppercase leading-[1.5] tracking-[0.14em]",
                      stage.hub ? "text-navy-deep" : "text-navy-deep/85",
                    )}
                  >
                    {stage.label}
                  </p>
                  <p className="mt-1.5 font-sans text-[0.625rem] uppercase leading-[1.5] tracking-[0.16em] text-muted">
                    {stage.status}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
