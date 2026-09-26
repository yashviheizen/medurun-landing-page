import { UnitMark } from "@/components/illustrations/UnitMark";

/**
 * Compact horizontal progress route for the "how it works" steps on small screens,
 * where the full RouteMap is far too tall to sit beside the list. Same vocabulary
 * as RouteMap — a red request pin, station waypoints, a navy hospital, and the
 * ambulance riding the line — flattened into a single strip that fits above the
 * cards, so the travel stays on screen while the reader is looking at the steps.
 *
 * Purely presentational; the steps themselves carry the meaning.
 */
const START = 16;
const HOSPITAL_X = 272;
const HOSPITAL_R = 13;
/**
 * The line stops a vehicle's length short of the hospital, so the last step parks
 * the ambulance against the building with all of it visible — the navy tile is
 * painted after the unit, so a line running under it would cut the nose off on
 * arrival.
 */
const END = HOSPITAL_X - HOSPITAL_R - 16;
const LINE = `M${START} 26H${END}`;

export function StepRoute({
  total,
  active,
  instanceId = "step-route",
  duration = 800,
}: {
  total: number;
  active: number;
  /** Route maps share a page, so the SVG defs need distinct ids. */
  instanceId?: string;
  /** How long the dot takes to travel to the selected step, in milliseconds. */
  duration?: number;
}) {
  const fadeId = `${instanceId}-fade`;
  const span = Math.max(total - 1, 1);
  const bounded = Math.min(Math.max(active, 0), span);
  // Stations sit at even fractions of the line, so the unit lands exactly on one.
  const progress = bounded / span;
  const ease = { transition: `stroke-dashoffset ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)` };
  // The line is straight here, so the unit is simply placed at the station: no
  // motion path needed, and the travel between two stations is exact.
  const unitX = START + progress * (END - START);
  /**
   * The leg just run: from the previous station to the selected one. The dash
   * pattern starts at the offset, so `${length} 1` at `-from` paints that stretch
   * and nothing else. The first step has no leg behind it.
   */
  const legFrom = Math.max(bounded - 1, 0) / span;
  const legEase = {
    transition: `stroke-dasharray ${duration}ms cubic-bezier(0.22, 1, 0.36, 1), stroke-dashoffset ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
  };

  return (
    <svg
      viewBox="0 0 300 52"
      fill="none"
      role="presentation"
      aria-hidden="true"
      className="h-auto w-full"
    >
      <defs>
        <linearGradient id={fadeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ED1C24" />
          <stop offset="100%" stopColor="#233F8F" />
        </linearGradient>
      </defs>

      {/* Full route, then the travelled portion drawn over it. */}
      <path
        d={LINE}
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
        strokeDasharray="5 6"
        strokeLinecap="round"
      />
      <path
        d={LINE}
        stroke={`url(#${fadeId})`}
        strokeWidth="3"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        style={ease}
        strokeDashoffset={1 - progress}
      />

      {/* The leg being run, in solid red over the travelled line. */}
      {progress - legFrom > 0.001 ? (
        <path
          d={LINE}
          stroke="#ED1C24"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`${progress - legFrom} 1`}
          strokeDashoffset={-legFrom}
          style={legEase}
        />
      ) : null}

      {/* Intermediate stations. The first and last are the pin and the hospital. */}
      {Array.from({ length: total }, (_, index) => index)
        .slice(1, -1)
        .map((index) => (
          <circle
            key={index}
            cx={START + (index / span) * (END - START)}
            cy={26}
            r={3.5}
            fill="currentColor"
            fillOpacity="0.45"
          />
        ))}

      {/* Origin: the request */}
      <circle cx={START} cy={26} r="11" fill="#ED1C24" fillOpacity="0.12" />
      <circle cx={START} cy={26} r="4.5" fill="#ED1C24" />

      {/* The ambulance, parked at the head of the travelled portion. */}
      <g
        style={{
          transform: `translate(${unitX}px, 26px)`,
          transition: `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1)`,
        }}
      >
        <UnitMark />
      </g>

      {/* Destination: the receiving hospital */}
      <rect x={HOSPITAL_X - 13} y="13" width="26" height="26" rx="8" fill="#233F8F" />
      <path
        d={`M${HOSPITAL_X} 20v12M${HOSPITAL_X - 6} 26h12`}
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
