import { cn } from "@/lib/cn";

import type { CSSProperties } from "react";

/**
 * The hero's Live Dispatch Rail.
 *
 * This replaces the diagonal route that used to be plotted across the whole navy
 * canvas. That composition had the curve crossing the ambulance and CARE parked
 * in the top-right corner, which meant the four stages were read in a scatter
 * rather than in order, and every stop's position was a compromise between the
 * photograph, the copy column and the fold. The rail is the opposite bargain: one
 * straight line in normal flow under the actions, spanning the full shell — text
 * column and ambulance column alike — with four evenly spaced stops on it.
 *
 * Geometry is a quarter per stage, so a stop sits at the centre of its own
 * column (12.5%, 37.5%, 62.5%, 87.5%). That is what lets the label row be a plain
 * four-column grid that lines up with the nodes at any width, and it keeps the
 * first and last labels from overhanging the container the way edge-anchored
 * stops would.
 *
 * The rail does not finish. A signal runs REQUEST → DISPATCH → TRACK → CARE,
 * ringing each stop as it draws level with it, then rests at CARE and goes again.
 * Its first run is also the entrance: that run is what draws the red segment, and
 * the segment then stays — the network does not un-establish itself between calls.
 *
 * None of that timing is written here. The rail's whole clock is four custom
 * properties on `.hero-rail` in globals.css — one cycle, the share of it spent
 * moving, the lead before the first run, and a per-stop position along it — and
 * every moving part derives its own delay from them. The only thing this component
 * contributes is `--rail-at`: where each stop sits along the run, 0 to 1. A stop
 * cannot drift out of step with the signal that reaches it, because neither of
 * them knows a duration in milliseconds.
 *
 * That 4s cycle is the rail's clock at rest. Inside the pinned hero on a desktop
 * viewport the stylesheet takes the clock away — every one of those animations is
 * set to `none` — and drives the same parts from `--hero-exit` instead, so the
 * signal's single walk to CARE is the reader's own scroll rather than a loop
 * running beside it. `--rail-at` is what both clocks share: it is a position, not
 * a time, which is why neither had to be written twice.
 *
 * `.hero-drop` is the last of those stops' continuation: a short red line under
 * CARE that extends as the signal arrives there, aimed at `.route-drop` at the
 * top of Positioning and sitting at the same 87.5% of the shell, so the route
 * appears to carry on into the network below rather than ending with the section.
 *
 * Every resting state is still declared in the markup — line drawn, segment
 * complete, dot on CARE, all four stops lit. The animations only supply the way
 * in and the standing signal, so with `prefers-reduced-motion`, or with no JS and
 * no animation support at all, the rail renders complete in its first frame and
 * holds there.
 */

const STAGES = ["Request", "Dispatch", "Track", "Care"] as const;

/** One column per stage; a stop sits at its centre. */
const STEP = 100 / STAGES.length;
const centre = (index: number) => STEP * index + STEP / 2;

/**
 * Where the route hands over to the Positioning network, as a percentage of the
 * shell.
 *
 * The network below is five columns wide and its first node — PATIENT REQUEST —
 * stands at the centre of the first one, which is `100 / 5 / 2`. Both rails live
 * inside the same `.shell`, so writing that number here puts the handover in the
 * same column of the page as the node it hands to. It is a literal rather than an
 * import because the network's geometry lives in a client component and its stage
 * count comes from the content file; five is the shape of the schematic, not a
 * value that varies.
 */
const HANDOVER = 100 / 5 / 2;

/**
 * Where the signal is along its run when it draws level with each stop, 0 to 1.
 * These are `rail-run`'s own stops in the fraction notation `calc()` can use: the
 * signal advances for 28% of the run, holds for 6% at the stop it has reached, and
 * goes again, so each stage is arrived at rather than passed through.
 */
const ARRIVE = [0, 0.28, 0.62, 0.96] as const;

/**
 * The stop's own position, handed to the CSS clock as `--rail-at`, plus whether it
 * is lit before the signal has moved at all.
 *
 * Only REQUEST is. On a desktop frame the signal is driven by the scroll rather
 * than by a loop (see `--rail-t` in globals.css), so at rest the run has not
 * started — and a run that has not started is one that is standing on its first
 * stop, not one with no stops lit. `--rail-on` is that floor, and it is zero
 * everywhere else because those stages genuinely have not happened yet.
 */
const at = (index: number) =>
  ({
    "--rail-at": ARRIVE[index],
    "--rail-on": index === 0 ? 1 : 0,
  }) as CSSProperties;

export function DispatchRail({
  align = "start",
  className,
}: {
  /**
   * Where the rail's own label sits. The line, its stops and the four stage names
   * are a full-width grid and are unaffected — this is only the caption above
   * them, which follows the section it is placed in: hung on the left in a
   * left-aligned composition, over the middle in a centred one.
   */
  align?: "start" | "center";
  className?: string;
}) {
  const first = centre(0);
  const span = centre(STAGES.length - 1) - first;

  return (
    <section
      aria-labelledby="dispatch-rail-label"
      className={cn("hero-rail", className)}
    >
      <p
        id="dispatch-rail-label"
        className={cn(
          "flex items-center gap-2.5 whitespace-nowrap text-[0.625rem] font-medium uppercase leading-none tracking-[0.18em] text-white/70 [text-shadow:0_1px_10px_rgba(10,17,41,0.9)] motion-safe:animate-rise-in motion-safe:[animation-delay:560ms] sm:text-[0.6875rem] sm:tracking-[0.2em]",
          align === "center" && "justify-center",
        )}
      >
        {/* The live indicator: a red point with a soft halo around it, both static.
            The network is live, which is a state, not an event — a blinking light
            here would compete with the signal running the rail below it. */}
        <span
          aria-hidden="true"
          className="relative flex h-[7px] w-[7px] shrink-0"
        >
          <span className="absolute inset-0 rounded-full bg-red/25 blur-[1px]" />
          <span className="relative h-full w-full rounded-full bg-red" />
        </span>
        Live dispatch across the network
      </p>

      <div aria-hidden="true" className="relative mt-4 h-[9px] w-full sm:mt-5">
        {/* The route itself: one thin neutral line, drawn left to right. */}
        <span className="absolute left-0 right-0 top-1/2 block h-px -translate-y-1/2 bg-white/25 motion-safe:animate-rail-draw motion-safe:[animation-delay:var(--rail-line)]" />

        {/* The completed leg, and the unit running it. The wrapper spans the first
            stop to the last, so the segment's own 0 → 100% is REQUEST → CARE and
            the dot's translate lands exactly on the final node rather than at the
            end of the line. */}
        <span
          className="absolute top-1/2 block h-[2px] -translate-y-1/2"
          style={{ left: `${first}%`, width: `${span}%` }}
        >
          <span className="rail-fill absolute inset-0 block bg-red" />
          <span className="rail-run absolute inset-y-0 left-0 block w-full translate-x-full">
            <span className="absolute left-0 top-1/2 block h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red shadow-[0_0_0_5px_rgba(237,28,36,0.2),0_0_14px_5px_rgba(237,28,36,0.4)]" />
          </span>
        </span>

        {/* The route leaving the frame, in three strokes: down out of CARE, left
            across the foot of the photograph to the column the next section's
            first node stands in, and then down out of the frame. Positioning
            picks it up there — see `.pos-drop` — so what crosses the light wipe
            is one line that has moved from the hero's last stop to the network's
            first one, rather than two sections that happen to both have red in
            them. All three exist only where the hero is pinned; see `.hero-drop`. */}
        <span
          className="hero-drop absolute"
          style={{ left: `${centre(STAGES.length - 1)}%` }}
        />
        <span
          className="hero-carry absolute"
          style={{
            left: `${HANDOVER}%`,
            width: `${centre(STAGES.length - 1) - HANDOVER}%`,
          }}
        />
        <span className="hero-lead absolute" style={{ left: `${HANDOVER}%` }} />

        {STAGES.map((stage, index) => {
          const last = index === STAGES.length - 1;

          return (
            <span
              key={stage}
              className="hero-rail-stop absolute top-1/2 block h-0 w-0"
              style={{ left: `${centre(index)}%`, ...at(index) }}
            >
              {/* The stop lighting up as the signal draws level with it: one ring
                  out, every pass. Transparent at both ends of its keyframe, so it
                  is invisible before it fires, invisible after, and never painted
                  at all when motion is reduced. */}
              <span className="absolute left-0 top-0 block h-3 w-3 -translate-x-1/2 -translate-y-1/2">
                <span className="rail-ping block h-full w-full rounded-full border border-red/80 bg-red/25 opacity-0" />
              </span>

              {/* Two dots, not one changing colour: the neutral stop is always on
                  the line, and the red one is laid over it as the route reaches
                  it. A cross-fade needs both layers anyway, and this way the
                  unreached part of the rail is never unmarked. */}
              <span className="absolute left-0 top-0 block h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40" />
              <span className="absolute left-0 top-0 block -translate-x-1/2 -translate-y-1/2">
                <span
                  className={cn(
                    "rail-lit block h-[7px] w-[7px] rounded-full bg-red motion-safe:animate-node-in motion-safe:[animation-delay:var(--rail-moment)]",
                    // CARE is where the request comes to rest, so it keeps a soft
                    // static halo. A resting state, held — not a pulse.
                    last && "shadow-[0_0_0_6px_rgba(237,28,36,0.16)]",
                  )}
                />
              </span>
            </span>
          );
        })}
      </div>

      {/* The stages as an ordered list, which is what they are: the labels carry
          the section's meaning, so they are real text in reading order rather than
          decoration hung off the line above them. */}
      <ol className="mt-3.5 grid grid-cols-4">
        {STAGES.map((stage, index) => (
          <li
            key={stage}
            // The rail crosses the photograph as well as the navy, so each label
            // carries its own ground rather than relying on the bottom scrim.
            //
            // All four arrive together with the drawn line, not with the signal
            // that reaches them: these are the section's words, and words that
            // trickle in over three seconds are a reader waiting, not a sequence.
            // The stops themselves still light as the signal gets to them.
            className="text-center text-[0.625rem] font-medium uppercase leading-none tracking-[0.12em] text-white/90 [text-shadow:0_1px_10px_rgba(10,17,41,0.9)] motion-safe:animate-fade-in motion-safe:[animation-delay:var(--rail-lead)] sm:tracking-[0.18em]"
          >
            {stage}
          </li>
        ))}
      </ol>
    </section>
  );
}
