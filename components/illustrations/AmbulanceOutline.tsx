import type { CSSProperties } from "react";

/**
 * The ambulance as a drawn outline, laid over the photograph of it.
 *
 * This is the middle of the hero's departure: the centred copy leaves, and then
 * the vehicle the reader has been looking at is traced — light bar first, then the
 * body, the glass, the face, the bumper, the wheels — while the photograph behind
 * it loses its colour and the navy behind *that* turns into Positioning's paper.
 * What is left standing on the light is a technical drawing of the same vehicle,
 * which is then shrunk into the network below as its `Ambulance Assigned` node.
 * The point of the whole sequence is that it is one object throughout: a real
 * ambulance becoming the diagram the rest of the page is written in.
 *
 * The geometry is measured, not invented. The wrapper is placed over the
 * photograph by the same `object-cover` crop arithmetic `.hero-beacon` and
 * `.hero-lamp` use — see `.hero-outline` in globals.css — against a bounding box
 * read off the source frame at x 0.394–0.604 and y 0.560–0.845. The viewBox is
 * that box's own aspect ratio (1.309, constant at every viewport because the crop
 * preserves the source's 16:9), so `262 × 200` user units map onto the vehicle
 * itself rather than onto the frame around it. Everything below is symmetric about
 * `x = 131`, which is where the photograph's centreline falls.
 *
 * Every element is a `<path>` with `pathLength="1"`, which is the whole reason the
 * drawing needs no JavaScript: it normalises each path's length to 1 regardless of
 * how long it actually is, so one `stroke-dasharray: 1` and one
 * `stroke-dashoffset: calc(1 - <progress>)` draws a 500-unit silhouette and a
 * 16-unit lens at the same rate, from one scroll-driven custom property. `--amb-lead`
 * is each path's offset into the draw window — a share of it, not a duration — so
 * the order reads from the roof down and the last stroke lands exactly as the
 * window closes.
 *
 * Two inks. `amb-body` is the drawing proper and interpolates from white on the
 * photograph to navy on the paper as the ground changes underneath it; `amb-mark`
 * is the two light-bar lenses and the cross on the nose and stays red the whole
 * way, so the one thing that identifies the vehicle as an ambulance survives the
 * change of medium.
 */

type Stroke = {
  /** The path itself, in viewBox units. */
  d: string;
  /** Where this stroke starts inside the draw window, 0 to 1. */
  lead: number;
  /** Red rather than the interpolating body ink. */
  mark?: true;
  /** Held back a stop or two: ground shadow and glass, which are not bodywork. */
  soft?: true;
};

const STROKES: Stroke[] = [
  // The light bar, across the roof.
  { d: "M 86 19 L 86 9 Q 86 4 91 4 L 171 4 Q 176 4 176 9 L 176 19", lead: 0 },
  { d: "M 99 11 L 115 11", lead: 0.04, mark: true },
  { d: "M 147 11 L 163 11", lead: 0.04, mark: true },

  // The body, as one closed silhouette: roof, A-pillars, flanks, bumper line.
  {
    d: "M 38 30 Q 38 20 50 20 L 212 20 Q 224 20 224 30 L 231 96 L 236 148 L 236 166 L 26 166 L 26 148 L 31 96 Z",
    lead: 0.08,
  },

  // Mirrors, out on their arms.
  { d: "M 35 52 L 15 49 L 12 64 L 33 64", lead: 0.14 },
  { d: "M 227 52 L 247 49 L 250 64 L 229 64", lead: 0.14 },

  // Glass, and the cowl under it.
  { d: "M 62 34 L 200 34 L 206 84 L 56 84 Z", lead: 0.18, soft: true },
  { d: "M 33 88 L 229 88", lead: 0.24 },

  // The face: two headlight clusters either side of the grille.
  { d: "M 37 94 L 82 97 L 84 112 L 39 112 Z", lead: 0.28 },
  { d: "M 225 94 L 180 97 L 178 112 L 223 112 Z", lead: 0.28 },
  { d: "M 88 97 L 174 97", lead: 0.32 },
  { d: "M 88 105 L 174 105", lead: 0.35 },
  { d: "M 88 113 L 174 113", lead: 0.38 },
  { d: "M 122 105 A 9 9 0 0 1 140 105 A 9 9 0 0 1 122 105", lead: 0.4 },

  // The cross on the nose.
  { d: "M 131 120 L 131 134", lead: 0.46, mark: true },
  { d: "M 124 127 L 138 127", lead: 0.46, mark: true },

  // Bumper, lower intake, fog lamps.
  { d: "M 28 141 L 234 141", lead: 0.5 },
  { d: "M 96 147 L 166 147 L 166 159 L 96 159 Z", lead: 0.54 },
  { d: "M 48 152 L 68 152", lead: 0.58 },
  { d: "M 194 152 L 214 152", lead: 0.58 },

  // Wheels, and the ground they stand on.
  { d: "M 44 166 L 44 188 L 84 188 L 84 166", lead: 0.62 },
  { d: "M 178 166 L 178 188 L 218 188 L 218 166", lead: 0.62 },
  { d: "M 8 192 L 254 192", lead: 0.68, soft: true },
];

export function AmbulanceOutline() {
  return (
    <span aria-hidden="true" className="hero-outline">
      <svg
        className="amb-svg"
        viewBox="0 0 262 200"
        /* The wrapper is sized from the crop, so its aspect ratio differs from the
           viewBox's by six hundredths of a percent. `none` spends that on an
           imperceptible stretch rather than on a letterbox that would float the
           drawing off the bodywork it is tracing. */
        preserveAspectRatio="none"
        fill="none"
      >
        {STROKES.map((stroke) => (
          <path
            key={stroke.d}
            d={stroke.d}
            pathLength="1"
            /* The stroke keeps its authored weight while the drawing is scaled
               down into the network, so a 37px glyph is a fine line rather than a
               solid blob. Its width is still tapered from the stylesheet — see
               `--amb-go` — because a line that thin has to lose a little as the
               shape it describes loses nine tenths of its size. */
            vectorEffect="non-scaling-stroke"
            className={[
              stroke.mark ? "amb-mark" : "amb-body",
              stroke.soft && "amb-soft",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{ "--amb-lead": stroke.lead } as CSSProperties}
          />
        ))}
      </svg>
    </span>
  );
}
