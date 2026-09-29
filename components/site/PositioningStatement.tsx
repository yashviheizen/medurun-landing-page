"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { clamp, onPinned, onScroll, pinnedAt } from "@/lib/motion";
import { positioningPhrases } from "@/data/site";

/**
 * The positioning statement, read to the reader by the scroll.
 *
 * The whole sentence is on screen from the first frame in a muted warm grey — it
 * is the argument of the page and a reader who lands mid-band must not find a
 * blank column — and the scroll then walks a full-contrast copy of it across the
 * sentence a phrase at a time, left to right. Nothing flies in, nothing is typed,
 * no letter moves on its own: the reveal is a colour arriving, which is the one
 * kind of text animation that still reads as a sentence while it is happening.
 *
 * Two layers per phrase, and only two. The phrase's own text is the muted layer
 * and is the real, selectable, findable, announced copy; over it sits one
 * `aria-hidden` duplicate in ink and red, clipped from the left by the phrase's
 * progress. A dark duplicate over a light original is the arrangement that hides
 * its own seam — the reverse leaves the darker original bleeding through the
 * lighter overlay's antialiasing — and by the settle both layers have been driven
 * to the same colour anyway, so there is nothing left to see through.
 *
 * Everything below is a pure function of `pinnedAt`: no chased targets and no
 * accumulated state, which is the whole of why scrolling back up returns each
 * phrase to grey along exactly the path it left by.
 *
 * Below `lg`, under `prefers-reduced-motion`, and with scripting off, none of this
 * runs and none of the pinned rules in globals.css exist: the markup is the
 * paragraph it has always been, fading in once with `Reveal`, complete and at full
 * contrast from the moment it arrives.
 */

/** The same ease the rest of the page's pinned sequences scrub with. */
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * The band's clock, in the shares the brief sets out.
 *
 * `REVEAL_FROM` sits clear of the hero's departure: the hero's own transition is
 * still finishing over the top of this band for the first eighth of the track, and
 * a statement that started colouring in while the photograph above was still
 * leaving would be two sequences asking for the same pair of eyes.
 *
 * `PHRASE_SPAN` is longer than the gap between two phrases' starts, so each phrase
 * is still finishing as the next begins. Without that overlap the reveal is four
 * separate events with three stops in them; with it, it is one edge travelling
 * down the sentence.
 */
const REVEAL_FROM = 0.15;
const REVEAL_TO = 0.65;
const PHRASE_SPAN = 0.17;

/**
 * The beat between the sentence and the schematic: the last of the deep navy goes
 * to full ink, the rule under the statement draws across, and the network's label
 * arrives — so the ten hundredths the brief reserves for the statement settling
 * are ten hundredths of something moving, and the route begins the frame they end.
 */
const SETTLE_FROM = 0.65;
const SETTLE_TO = 0.75;

type Rgb = readonly [number, number, number];

/** Warm grey on warm paper: muted, and still comfortably readable. */
const MUTED: Rgb = [140, 131, 120];
/** The deep navy a phrase is revealed into. */
const DEEP: Rgb = [16, 27, 60];
/** Full contrast, where the settled statement ends up. */
const INK: Rgb = [11, 11, 11];

const blend = (from: Rgb, to: Rgb, t: number) =>
  `rgb(${from.map((c, i) => Math.round(c + (to[i] - c) * t)).join(" ")})`;

/**
 * Every custom property this component writes, so leaving the pinned layout —
 * a resize down to a tablet, or reduced motion switched on mid-session — hands the
 * stage back exactly as the stylesheet found it rather than with a half-revealed
 * sentence frozen on it.
 */
const STAGE_VARS = [
  ...positioningPhrases.map((_, index) => `--pos-p${index}`),
  "--pos-settle",
  "--pos-under",
  "--pos-over",
];

export function PositioningStatement({ className }: { className?: string }) {
  const ref = useRef<HTMLParagraphElement | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => onPinned(setPinned), []);

  useEffect(() => {
    if (!pinned) return;

    const line = ref.current;
    if (!line) return;

    const track = line.closest<HTMLElement>(".pos-track");
    const stage = line.closest<HTMLElement>(".pos-stage");
    if (!track || !stage) return;

    const count = positioningPhrases.length;
    // Evenly spaced starts whose last phrase finishes exactly on `REVEAL_TO`.
    const step = (REVEAL_TO - REVEAL_FROM - PHRASE_SPAN) / Math.max(count - 1, 1);

    const off = onScroll(() => {
      const at = pinnedAt(track, stage);

      for (let index = 0; index < count; index += 1) {
        const from = REVEAL_FROM + index * step;
        stage.style.setProperty(
          `--pos-p${index}`,
          smooth(clamp((at - from) / PHRASE_SPAN)).toFixed(4),
        );
      }

      const settle = smooth(
        clamp((at - SETTLE_FROM) / (SETTLE_TO - SETTLE_FROM)),
      );
      stage.style.setProperty("--pos-settle", settle.toFixed(4));
      // Both layers are driven, not just the visible one: the muted copy
      // underneath has to arrive at the same ink the overlay does, or the last
      // hundredths of the settle would be a dark sentence with a grey shadow
      // stitched to every glyph.
      stage.style.setProperty("--pos-under", blend(MUTED, INK, settle));
      stage.style.setProperty("--pos-over", blend(DEEP, INK, settle));
    });

    return () => {
      off();
      for (const name of STAGE_VARS) stage.style.removeProperty(name);
    };
  }, [pinned]);

  return (
    <p ref={ref} className={className}>
      {positioningPhrases.map((runs, index) => (
        <Fragment key={index}>
          {/* A real space between phrases, so the unpinned paragraph is the
              original sentence and not four clauses run together. The pinned
              layout makes each phrase a block, where whitespace between blocks
              is dropped by the layout itself. */}
          {index > 0 ? " " : null}
          <span className="pos-phrase" data-i={index}>
            {runs.map((run, at) =>
              run.accent ? (
                <span key={at} className="pos-em">
                  {run.text}
                </span>
              ) : (
                <Fragment key={at}>{run.text}</Fragment>
              ),
            )}

            {/* The revealed copy. Hidden from assistive technology and from the
                pointer: the text above it is the one that is read, selected and
                found, and this is only its colour. */}
            <span aria-hidden="true" className="pos-lit">
              {runs.map((run, at) =>
                run.accent ? (
                  <span key={at} className="pos-em">
                    {run.text}
                  </span>
                ) : (
                  <Fragment key={at}>{run.text}</Fragment>
                ),
              )}
            </span>
          </span>
        </Fragment>
      ))}
    </p>
  );
}
