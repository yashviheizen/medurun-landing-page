import { cn } from "@/lib/cn";

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
 * Motion is one sequence, once, and then the section is finished:
 *
 *   820ms   the neutral line draws left to right (520ms)
 *   1340ms  REQUEST comes on line
 *   ~1626   the completed red segment reaches DISPATCH
 *   ~1972   … TRACK
 *   ~2319   … CARE, and it stops there
 *
 * The red segment and the signal dot are two elements running two keyframes, but
 * the keyframes share their percentage stops and their duration, so the dot is on
 * the segment's leading edge by construction rather than by two numbers being
 * kept in agreement. Each node rings once as the dot draws level with it, timed
 * off the same table.
 *
 * Every resting state is declared in the markup — line drawn, segment complete,
 * dot on CARE, all four nodes lit. The animations only supply the way in, so with
 * `prefers-reduced-motion`, or with no JS and no animation support at all, the
 * rail renders complete in its first frame.
 */

const STAGES = ["Request", "Dispatch", "Track", "Care"] as const;

/** One column per stage; a stop sits at its centre. */
const STEP = 100 / STAGES.length;
const centre = (index: number) => STEP * index + STEP / 2;

/**
 * The rail's clock, and the one place these numbers are written down. They are the
 * `rail-draw`, `rail-fill` and `rail-signal` values from the Tailwind config.
 *
 * The line does not leave until the entrance has: the CTAs finish arriving at
 * 740ms, so the label lands at 560ms and the line starts drawing at 820ms. The
 * whole route sequence — first pixel of line to the dot stopping on CARE — runs
 * 820ms to 2360ms, i.e. 1.54s.
 */
const LABEL_FROM = 560;
const LINE_FROM = 820;
const LINE_MS = 520;
const FILL_FROM = LINE_FROM + LINE_MS;
const FILL_MS = 1020;

/**
 * Where the signal is in the `rail-fill` / `rail-signal` keyframes when it draws
 * level with each stop. These are the keyframes' own percentage stops, so a node's
 * moment cannot drift out of step with the segment that reaches it.
 */
const ARRIVE = [0, 0.28, 0.62, 0.96] as const;

/** When the signal reaches a stop, in milliseconds after first paint. */
const arrivalAt = (index: number) => Math.round(FILL_FROM + ARRIVE[index] * FILL_MS);

export function DispatchRail({ className }: { className?: string }) {
  const first = centre(0);
  const span = centre(STAGES.length - 1) - first;

  return (
    <section aria-labelledby="dispatch-rail-label" className={cn("hero-rail", className)}>
      <p
        id="dispatch-rail-label"
        className="flex items-center gap-2.5 whitespace-nowrap text-[0.625rem] font-medium uppercase leading-none tracking-[0.18em] text-white/70 [text-shadow:0_1px_10px_rgba(10,17,41,0.9)] motion-safe:animate-rise-in sm:text-[0.6875rem] sm:tracking-[0.2em]"
        style={{ animationDelay: `${LABEL_FROM}ms` }}
      >
        {/* The live indicator: a red point with a soft halo around it, both static.
            The network is live, which is a state, not an event — a blinking light
            would keep asking for attention long after the rail has settled. */}
        <span aria-hidden="true" className="relative flex h-[7px] w-[7px] shrink-0">
          <span className="absolute inset-0 rounded-full bg-red/25 blur-[1px]" />
          <span className="relative h-full w-full rounded-full bg-red" />
        </span>
        Live dispatch across the network
      </p>

      <div aria-hidden="true" className="relative mt-4 h-[9px] w-full sm:mt-5">
        {/* The route itself: one thin neutral line, drawn left to right. */}
        <span
          className="absolute left-0 right-0 top-1/2 block h-px -translate-y-1/2 bg-white/25 motion-safe:animate-rail-draw"
          style={{ animationDelay: `${LINE_FROM}ms` }}
        />

        {/* The completed leg, and the unit running it. The wrapper spans the first
            stop to the last, so the segment's own 0 → 100% is REQUEST → CARE and
            the dot's translate lands exactly on the final node rather than at the
            end of the line. */}
        <span
          className="absolute top-1/2 block h-[2px] -translate-y-1/2"
          style={{ left: `${first}%`, width: `${span}%` }}
        >
          <span
            className="absolute inset-0 block bg-red motion-safe:animate-rail-fill"
            style={{ animationDelay: `${FILL_FROM}ms` }}
          />
          <span
            className="absolute inset-y-0 left-0 block w-full translate-x-full motion-safe:animate-rail-signal"
            style={{ animationDelay: `${FILL_FROM}ms` }}
          >
            <span className="absolute left-0 top-1/2 block h-[7px] w-[7px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red shadow-[0_0_0_5px_rgba(237,28,36,0.2)]" />
          </span>
        </span>

        {STAGES.map((stage, index) => {
          const moment = `${arrivalAt(index)}ms`;
          const last = index === STAGES.length - 1;

          return (
            <span
              key={stage}
              className="absolute top-1/2 block h-0 w-0"
              style={{ left: `${centre(index)}%` }}
            >
              {/* The stop acknowledging the signal as it passes: one ring, once.
                  Transparent at both ends of its keyframe, so it is invisible
                  before it fires, invisible after, and never painted at all when
                  motion is reduced. */}
              <span className="absolute left-0 top-0 block h-3 w-3 -translate-x-1/2 -translate-y-1/2">
                <span
                  style={{ animationDelay: moment }}
                  className="block h-full w-full rounded-full border border-red opacity-0 motion-safe:animate-node-ping"
                />
              </span>

              {/* Two dots, not one changing colour: the neutral stop is always on
                  the line, and the red one is laid over it as the route reaches
                  it. A cross-fade needs both layers anyway, and this way the
                  unreached part of the rail is never unmarked. */}
              <span className="absolute left-0 top-0 block h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/40" />
              <span className="absolute left-0 top-0 block -translate-x-1/2 -translate-y-1/2">
                <span
                  style={{ animationDelay: moment }}
                  className={cn(
                    "block h-[7px] w-[7px] rounded-full bg-red motion-safe:animate-node-in",
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
            style={{ animationDelay: `${arrivalAt(index)}ms` }}
            // The rail crosses the photograph as well as the navy, so each label
            // carries its own ground rather than relying on the bottom scrim.
            className="text-center text-[0.625rem] font-medium uppercase leading-none tracking-[0.12em] text-white/90 [text-shadow:0_1px_10px_rgba(10,17,41,0.9)] motion-safe:animate-fade-in sm:tracking-[0.18em]"
          >
            {stage}
          </li>
        ))}
      </ol>
    </section>
  );
}
