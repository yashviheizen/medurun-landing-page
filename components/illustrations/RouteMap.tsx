import { UnitMark } from "@/components/illustrations/UnitMark";

/**
 * Decorative route diagram: a request pin, an ambulance travelling a curved route,
 * and a receiving hospital. Used beside the "how it works" steps on large screens.
 * Purely presentational — hidden from assistive tech.
 *
 * It has two drivers, and they are the same table of stops read two ways. Given a
 * `stop` index it moves to that stop and eases the way there, which is what a tap
 * on a step should look like. Given a continuous `progress` it sits exactly where
 * that fraction puts it with no easing at all, which is what a scroll should look
 * like: the scrollbar is the clock, and a transition on top of it would only make
 * the unit lag the page and refuse to reverse cleanly.
 *
 * Either way the diagram owns the stop table, because everything it has to say —
 * how much of the route is behind the unit, which leg is lit, which nodes have
 * been passed and where the ambulance parks — comes off that one table, and
 * splitting it between the diagram and its caller was how the unit ended up
 * beside a waypoint instead of on it.
 */
const ROUTE = "M44 168C104 168 108 96 168 96s70 -52 130 -52h58";

/**
 * Where the four steps park the unit, as fractions of the route's length
 * (`pathLength={1}` normalises it, so these are the dash offsets directly):
 * the request pin at the start, the two waypoint circles, and the hospital.
 *
 * The middle two are the arc lengths of the curve's segments — 148.77 and 143.02
 * of 349.79 — not even quarters, so they have to be measured rather than guessed
 * or the unit parks beside a waypoint instead of on it. The last one runs the line
 * up to the hospital rather than to the path's end underneath its tile.
 */
export const ROUTE_STOPS = [0, 0.4253, 0.8342, 0.94] as const;

/** The two intermediate nodes, in the same order as the stops they belong to. */
const WAYPOINTS = [
  [168, 96],
  [298, 44],
] as const;

/**
 * Where the ambulance itself stops, which is a little short of where the line
 * does. The hospital tile is painted after the unit — it has to be, or the route
 * would run over the top of it — so at the line's own end the tile would cut the
 * vehicle's nose off just as it arrived. At 0.905 it parks against the building
 * with its whole length visible, which is what arriving looks like.
 */
const UNIT_MAX = 0.905;

/** A node counts as passed a hair before the unit is on it, not a hair after. */
const REACHED = 0.002;

/**
 * How long a node takes to light while the scroll is driving. The unit's position
 * is the scroll's to own frame by frame, but a node lighting up is an event, not a
 * position, so it keeps a short fade in both directions.
 */
const NODE_MS = 200;

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

export function RouteMap({
  stop = 0,
  progress,
  instanceId = "route",
  duration = 450,
}: {
  /** Index of the selected step, into ROUTE_STOPS. Ignored when `progress` is set. */
  stop?: number;
  /**
   * Continuous position along the route: 0 at the first stop, 1 at the last. Set
   * this to hand the diagram to the scrollbar; leave it off to hand it to a tap.
   */
  progress?: number;
  /** Two route maps share one page, so the SVG defs need distinct ids. */
  instanceId?: string;
  /** How long the unit takes to travel to a new stop, in milliseconds. */
  duration?: number;
}) {
  const last = ROUTE_STOPS.length - 1;
  const driven = progress !== undefined;

  /**
   * `head` is how far along the route the unit has come; `from` is where the leg
   * it is currently running began. Scroll-driven, the head lands between two stops
   * and the lit leg grows out of the one behind it; stop-driven, the head is on a
   * stop and the lit leg is the whole leg that was just run.
   */
  let head: number;
  let from: number;

  if (driven) {
    const along = clamp(progress, 0, 1) * last;
    const leg = Math.min(Math.floor(along), last - 1);
    from = ROUTE_STOPS[leg];
    head = from + (ROUTE_STOPS[leg + 1] - from) * (along - leg);
  } else {
    const index = clamp(stop, 0, last);
    head = ROUTE_STOPS[index];
    from = index > 0 ? ROUTE_STOPS[index - 1] : 0;
  }

  const unitAt = Math.min(head, UNIT_MAX);

  const gridId = `${instanceId}-grid`;
  const fadeId = `${instanceId}-fade`;
  const easing = "cubic-bezier(0.22, 1, 0.36, 1)";

  /** Position is the scroll's to own; only a tap needs it eased. */
  const travel = (property: string) =>
    driven ? undefined : { transition: `${property} ${duration}ms ${easing}` };
  const nodeMs = driven ? NODE_MS : duration;
  const fade = `${nodeMs}ms ease-out`;
  const nodeFade = {
    transition: `fill ${fade}, fill-opacity ${fade}, opacity ${fade}`,
  };

  /**
   * A sub-length of a normalised path: the dash pattern starts at the offset, so
   * `${length} 1` with an offset of `-from` paints exactly from `from` to `head`
   * and nothing else. Both ends ease, so the lit leg slides rather than reappearing.
   */
  const leg =
    head - from > 0.001
      ? {
          strokeDasharray: `${head - from} 1`,
          strokeDashoffset: -from,
          style: driven
            ? undefined
            : {
                transition: `stroke-dasharray ${duration}ms ${easing}, stroke-dashoffset ${duration}ms ${easing}`,
              },
        }
      : null;

  return (
    <svg
      viewBox="0 0 400 220"
      fill="none"
      role="presentation"
      aria-hidden="true"
      className="h-full w-full"
    >
      <defs>
        <pattern id={gridId} width="28" height="28" patternUnits="userSpaceOnUse">
          <path d="M28 0H0v28" stroke="currentColor" strokeOpacity="0.12" strokeWidth="1" fill="none" />
        </pattern>
        <linearGradient id={fadeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ED1C24" />
          <stop offset="100%" stopColor="#233F8F" />
        </linearGradient>
      </defs>

      <rect width="400" height="220" fill={`url(#${gridId})`} />

      {/* Full route, then the travelled portion drawn over it. */}
      <path
        d={ROUTE}
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
        strokeDasharray="6 7"
        strokeLinecap="round"
      />
      <path
        d={ROUTE}
        stroke={`url(#${fadeId})`}
        strokeWidth="4"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - head}
        style={travel("stroke-dashoffset")}
      />

      {/* The leg being run, over the travelled line. */}
      {leg ? (
        <path d={ROUTE} stroke="#ED1C24" strokeWidth="4" strokeLinecap="round" pathLength={1} {...leg} />
      ) : null}

      {/* Origin: the request */}
      <circle cx="44" cy="168" r="14" fill="#ED1C24" fillOpacity="0.12" />
      <circle cx="44" cy="168" r="5.5" fill="#ED1C24" />

      {/* Waypoints. A node takes the request's own colour once the unit has reached
          it, so the stops behind the ambulance read as done rather than pending. */}
      {WAYPOINTS.map(([cx, cy], index) => {
        const reached = head >= ROUTE_STOPS[index + 1] - REACHED;

        return (
          <g key={`${cx}-${cy}`}>
            <circle
              cx={cx}
              cy={cy}
              r="12"
              fill="#ED1C24"
              fillOpacity="0.12"
              opacity={reached ? 1 : 0}
              style={nodeFade}
            />
            <circle
              cx={cx}
              cy={cy}
              r={4}
              fill={reached ? "#ED1C24" : "currentColor"}
              fillOpacity={reached ? 1 : 0.45}
              style={nodeFade}
            />
          </g>
        );
      })}

      {/* The ambulance, riding the route itself rather than a straight line between
          stops: `offset-path` carries it along the curve, `offset-rotate: 0deg`
          keeps it upright — a vehicle icon on a map reads as a vehicle, not as a
          compass needle — and the transition is what makes it travel. */}
      <g
        style={{
          offsetPath: `path("${ROUTE}")`,
          offsetDistance: `${unitAt * 100}%`,
          offsetRotate: "0deg",
          ...travel("offset-distance"),
        }}
      >
        <UnitMark />
      </g>

      {/* Destination: the receiving hospital */}
      <rect x="342" y="28" width="32" height="32" rx="9" fill="#233F8F" />
      <path d="M358 37v14M351 44h14" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
