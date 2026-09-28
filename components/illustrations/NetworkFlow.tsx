"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/cn";
import {
  clamp,
  onPinned,
  onScroll,
  pinnedAt,
  stilled,
  viewport,
} from "@/lib/motion";
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
 * The route is drawn by the scroll position, not by a clock. `--flow-draw` runs 0
 * to 1 as the band crosses the viewport and the rail's clip follows it directly,
 * so the line is drawn at exactly the speed the reader is moving: slowly if they
 * are reading, quickly if they are not, and backwards if they scroll back up. A
 * timed entrance cannot do the last of those — it can only be replayed, which is
 * why scrolling back over a timed diagram either does nothing or starts it again
 * from the beginning.
 *
 * The five stages light in order behind that drawing edge, one per fifth of the
 * run, and each one pulses red as it is reached. Only when the route is complete
 * does the standing signal mount and begin its loop: the band establishes itself
 * once, and only then starts reporting traffic. Running the loop over a
 * half-drawn line would be a network routing calls through a route that does not
 * exist yet.
 *
 * Nothing here dims a label below 0.55, so every stage is readable at every point
 * of the sequence. The hidden states are scoped to `.js` (see globals.css), so a
 * reader with no JS gets the finished schematic, and under `prefers-reduced-motion`
 * the whole thing is armed on mount and arrives complete.
 */

/** Half a column: where the first and last nodes sit, as a percentage. */
const halfColumn = (count: number) => 100 / count / 2;

/** Where a stage sits along the run, 0 to 1 — the offset its ring is timed from. */
const along = (index: number, count: number) => index / Math.max(count - 1, 1);

/**
 * The scroll window the route is drawn across, as shares of the viewport height.
 *
 * `FROM` is where the band's top edge has to reach before the line starts — just
 * inside the fold, so the draw begins as the band is arriving rather than while it
 * is still below the screen. `TAIL` is the extra distance added to the band's own
 * height to finish it, which is what guarantees the route completes while the
 * schematic is still comfortably on screen instead of as it leaves the top.
 */
const FROM = 0.9;
const TAIL = 0.42;

/**
 * The pinned track's own window: the share of it spent before the line starts and
 * the share it is drawn over.
 *
 * The lead is the beat after the band settles under the header and before anything
 * happens to it — a pinned section that starts moving on the same frame it stops
 * moving reads as a glitch. The span closes well short of 1 so the finished
 * network is held, complete and lit, for the last fifth of the track: the section
 * gets to make its point before it is allowed to leave.
 */
const LEAD = 0.06;
const DRAW = 0.78;

/**
 * Where the whole network comes up together, and where it lets go again.
 *
 * Hysteresis for the same reason `LOOP_OFF` has it: the flare is a state change,
 * and a reader parked on the exact scroll position that triggers it must not be
 * able to strobe the diagram by breathing on the trackpad.
 */
const FLARE_ON = 0.94;
const FLARE_OFF = 0.86;

/**
 * The loop lets go a little before the route does. Hysteresis, so a reader parked
 * at the exact scroll position where the route completes cannot flicker the
 * standing signal on and off a frame at a time by breathing on the trackpad.
 */
const LOOP_OFF = 0.9;

export function NetworkFlow({ stages }: { stages: FlowStage[] }) {
  const inset = halfColumn(stages.length);
  const ref = useRef<HTMLDivElement>(null);
  /** How many stages the drawing edge has passed. An integer, so writing it re-renders at most five times across the whole band. */
  const [reached, setReached] = useState(0);
  /** True once the route is complete: what mounts the standing signal. */
  const [loop, setLoop] = useState(false);
  /** True for the beat at the end where every stage is lit at once. */
  const [flare, setFlare] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (stilled()) {
      // No appetite for motion: the schematic is simply complete, every stage
      // showing its status, and the standing signal never mounts at all.
      node.style.setProperty("--flow-draw", "1");
      setReached(stages.length);
      setFlare(true);
      return;
    }

    const track = node.closest<HTMLElement>(".pos-track");
    const stage = node.closest<HTMLElement>(".pos-stage");

    let pinned = false;
    let off: (() => void) | null = null;

    /** The band's own pass across the viewport: the unpinned reading. */
    const passing = () => {
      const rect = node.getBoundingClientRect();
      const view = viewport();
      const span = rect.height + view * TAIL;
      return span > 0 ? clamp((view * FROM - rect.top) / span) : 0;
    };

    const stop = onPinned((on) => {
      pinned = on && !!track && !!stage;

      off?.();
      off = onScroll(() => {
        const draw =
          pinned && track && stage
            ? clamp((pinnedAt(track, stage) - LEAD) / DRAW)
            : passing();

        // Straight to the element. This runs every frame the band is on screen,
        // and the rail's clip is the one thing that has to move at that rate —
        // putting it through React would re-render five stages and their labels
        // sixty times a second to slide one edge.
        node.style.setProperty("--flow-draw", draw.toFixed(4));

        // These are steps, not positions, so they cost a render only when they
        // actually change: a handful on the way down, the same on the way up.
        setReached(
          draw <= 0
            ? 0
            : Math.min(Math.floor(draw * stages.length) + 1, stages.length),
        );
        setFlare((on) =>
          draw >= FLARE_ON ? true : draw < FLARE_OFF ? false : on,
        );
        setLoop((on) => (draw >= 1 ? true : draw < LOOP_OFF ? false : on));
      });
    });

    return () => {
      stop();
      off?.();
    };
  }, [stages.length]);

  return (
    <div
      ref={ref}
      data-flare={flare ? "true" : "false"}
      className="flow relative"
    >
      {/* Desktop rail. Spans node to node, so the line never dangles past the
          outer stages, and sits on the markers' own centre line. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-2 hidden h-px lg:block"
      >
        <span
          className="absolute inset-y-0 block"
          style={{ left: `${inset}%`, right: `${inset}%` }}
        >
          <span className="flow-rail absolute inset-x-0 top-0 block border-t border-dashed border-navy/45" />

          {/* The travelling signal. The moving wrapper spans the rail exactly, so a
              100% translate lands the dot on the last node — and that overshoot has
              to be clipped, or the wrapper's far edge widens the page by most of the
              rail's length. The clip box is therefore the rail plus half a centimetre
              of air on every side: enough for the dot and its halo to sit whole on
              the first and last nodes, and nothing else. */}
          <span className="absolute -left-2 -top-2 block h-4 w-[calc(100%+1rem)] overflow-hidden">
            {/* The signal on the route as it is being established: one red point
                held at the drawing edge, so the line is not merely appearing —
                something is travelling down it and leaving it behind. It carries
                the same geometry as the standing signal below, transformed rather
                than positioned so it costs no layout, and it is transparent at
                both ends of the run: there is nothing on the rail before the route
                starts and nothing parked on it once the route is finished. */}
            <span className="flow-edge absolute inset-y-0 left-2 block w-[calc(100%-1rem)] motion-reduce:hidden">
              <span className="absolute left-0 top-1/2 block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red shadow-[0_0_0_4px_rgba(237,28,36,0.16),0_0_10px_3px_rgba(237,28,36,0.22)]" />
            </span>

            {loop ? (
              <span className="flow-signal absolute inset-y-0 left-2 block w-[calc(100%-1rem)] motion-reduce:hidden">
                <span className="absolute left-0 top-1/2 block h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red shadow-[0_0_0_4px_rgba(237,28,36,0.16),0_0_10px_3px_rgba(237,28,36,0.2)]" />
              </span>
            ) : null}
          </span>
        </span>
      </div>

      <ol className="relative flex flex-col gap-6 lg:grid lg:grid-cols-5 lg:gap-0">
        {stages.map((stage, index) => {
          const lit = index < reached;
          // The stage the drawing edge is standing on. Exactly one at a time, and
          // nothing at all once the route is finished — a schematic that keeps
          // pulsing after it is drawn is an alarm, not a diagram.
          const active =
            lit && index === reached - 1 && reached < stages.length;
          /**
           * What the stage is, in one word, for the stylesheet to read.
           *
           * `next` has not been drawn to. `current` is the one being described and
           * is the only one showing its status line. `done` has been established
           * and steps back — back, not away: its label holds at reading strength,
           * because a route whose earlier stages become unreadable is not a
           * diagram of anything. `full` is the closing beat where all five are
           * current at once.
           */
          const state = !lit
            ? "next"
            : flare
              ? "full"
              : index === reached - 1
                ? "current"
                : "done";
          // Handed to the rings as a custom property: the cycle in globals.css turns
          // it into this node's share of the run, and nothing here knows a duration.
          const at = {
            "--flow-at": along(index, stages.length).toFixed(4),
          } as CSSProperties;

          return (
            <li
              key={stage.id}
              data-lit={lit ? "true" : "false"}
              data-active={active ? "true" : "false"}
              data-state={state}
              className="flow-stage relative flex items-start gap-4 lg:flex-col lg:items-center lg:gap-0 lg:px-3 lg:text-center"
            >
              {/* The stacked rail, drawn one segment at a time so it ends exactly on
                  the last node. The segment runs from this marker's centre to the
                  next one, which is this row's height plus the list's 1.5rem gap. */}
              {index < stages.length - 1 ? (
                <span
                  aria-hidden="true"
                  className="flow-seg absolute left-[7px] top-2 block h-[calc(100%+1.5rem)] w-px border-l border-dashed border-navy/45 lg:hidden"
                />
              ) : null}

              <span
                className="relative flex h-4 w-4 shrink-0 items-center justify-center"
                style={at}
              >
                {/* The stage acknowledging the route reaching it: one ring out, once,
                    as the drawing edge arrives. This is the entrance pulse and it is
                    separate from the standing loop's ring below — the two never run
                    at the same time, because the loop does not exist until the route
                    is finished and the pulse does not fire once it is. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "flow-pulse absolute h-4 w-4 rounded-full motion-reduce:hidden",
                    stage.hub ? "bg-red/35" : "bg-red/25",
                  )}
                />

                {/* This stage acknowledging the standing signal: one ring out as the
                    run reaches it, and nothing at all in between. It is the same
                    animation on all five nodes, offset by `--flow-at`, which is what
                    makes them fire in order rather than merely near each other —
                    and it is what carries the sequence on the stacked mobile
                    column, where there is no rail for a dot to run along. */}
                {loop ? (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "flow-ping absolute h-4 w-4 rounded-full motion-reduce:hidden",
                      stage.hub ? "bg-red/30" : "bg-navy/20",
                    )}
                  />
                ) : null}

                {stage.hub ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="flow-node absolute h-4 w-4 rounded-full border border-red/45 bg-paper"
                    />
                    <span className="flow-node relative block h-[9px] w-[9px] rounded-full bg-red" />
                  </>
                ) : (
                  <span className="flow-node relative block h-2 w-2 rounded-full border border-navy/70 bg-paper" />
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
                    <span className="flow-node block h-px w-5 bg-red" />
                  </span>
                ) : null}

                <div className="flow-label">
                  <p
                    className={cn(
                      "font-sans text-[0.6875rem] font-medium uppercase leading-[1.5] tracking-[0.14em]",
                      stage.hub ? "text-navy-deep" : "text-navy-deep/85",
                    )}
                  >
                    {stage.label}
                  </p>
                  <p className="flow-status mt-1.5 font-sans text-[0.625rem] uppercase leading-[1.5] tracking-[0.16em] text-muted">
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
