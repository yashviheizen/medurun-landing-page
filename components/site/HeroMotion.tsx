"use client";

import { useEffect, useRef } from "react";
import { clamp, onPinned, onScroll, pinnedAt, stilled } from "@/lib/motion";

/**
 * How much of the hero's own height the unpinned exit is spread over. Three
 * quarters, not all of it: the transition has to be finished by the time the hero
 * leaves rather than still running as its last pixels go, or the copy is caught
 * mid-fade at the exact moment the next section takes the screen.
 *
 * This is the tablet and phone number. On a desktop frame the hero is pinned and
 * the track's own length is the span — see `pinnedAt`.
 */
const SPAN = 0.75;

/**
 * How far Positioning's pinned band is pulled up *beyond* the hero's own screen, as
 * a share of the hero's travel.
 *
 * The lap below already slides the band back by one canvas so the hero has something
 * real underneath it to dissolve into. This is the extra, and it buys one thing: the
 * hero's ambulance drawing is flown down onto the network's `Ambulance Assigned`
 * node, and a target that is still scrolling up the screen while something is being
 * aimed at it is a target that is never hit — the transform moves the drawing, the
 * scroll moves the node, and the two chase each other. At 0.42 the band locks under
 * the header at 58% of the hero's clock, which is two beats before the travel starts
 * at 60%, so from then on the node is standing still and the flight is a straight
 * line to a fixed point.
 *
 * It is also what removes the last of the dead scroll between the two sections: the
 * page is 0.42 of a hero screen shorter for it and nothing is cut.
 */
const EARLY = 0.42;

/**
 * How far above the node's centre the drawing comes to rest, in CSS pixels.
 *
 * Not on the node: `.pos-drop` is the thin red thread that connects the two, and a
 * thread needs somewhere to be drawn. Forty pixels is the schematic's own top gap
 * (2rem) plus the 8px from the top of its box down to the centre of its first row,
 * which is exactly the length that stroke is given in globals.css.
 */
const LAND = 40;

/**
 * The window on the hero's clock over which the aim is taken.
 *
 * Two rectangles a frame, and only over the stretch that uses them. The travel does
 * not begin until 0.60 and 0.40 leaves the numbers settled well before then; by 0.90
 * the drawing has faded out and the canvas is clipped away, so the pair after that
 * would be measuring where to put something nobody can see — and `--hero-exit` sits
 * at 1 for the whole rest of the page, so without the far edge it would be two
 * rectangles a frame forever. Leaving the last written value in place is exactly
 * right: it is where the drawing came to rest, and scrolling back up picks the
 * measurement up again at the same point.
 */
const AIM_FROM = 0.4;
const AIM_TO = 0.9;

/**
 * The hero's departure — the first movement of the page's one journey.
 *
 * Everything it does is one custom property, `--hero-exit`, read 0 to 1. The rules
 * that consume it live beside the rest of the hero in globals.css, so the geometry
 * and the motion are not written down in two places, and adding a consumer costs a
 * declaration rather than a subscription.
 *
 * It is written to the document element rather than to the hero, and that is
 * deliberate: the last thing the departure does happens in the section below it —
 * the ambulance drawing arrives, a red thread drops into the node, and the label and
 * the statement come up. A property on `:root` inherits everywhere, so both halves of
 * that sequence are driven by one number without either section holding a reference
 * to the other. The hero reads it by inheritance like anything else.
 *
 * Three more properties are written from here, and all three are measurements rather
 * than clocks — numbers the stylesheet cannot obtain for itself. `--hero-lap` and
 * `--pos-early` are how far the section below is pulled up under the hero; `--amb-dx`
 * and `--amb-dy` are how far the ambulance drawing has to travel to reach its node in
 * that section. The ramps that spend them are all in globals.css.
 *
 * On a desktop frame the hero is pinned: it holds under the header while a 200vh
 * track scrolls past it, and the progress through that track is the clock — one
 * screen of pin, which the four beats of the morph are timed against. Below
 * `lg`, or for a reader who has asked for less motion, there is no track at all —
 * the hero occupies exactly the height it always did, the section below arrives at
 * exactly the scroll position it always did, and the exit is the shorter pass it
 * has always been. `onPinned` is the single query both this and the stylesheet are
 * gated on, so they cannot disagree about which of the two is happening.
 *
 * Both readings are taken live off the DOM every frame rather than accumulated, so
 * scrolling up runs the whole transition backwards exactly — there is no state
 * here to get out of step with the scrollbar.
 *
 * The component renders a marker rather than a wrapper so that `Hero` itself can
 * stay a server component — the hero is the page's largest subtree and the
 * heaviest image on it, and none of that needs to ship to the client to move a
 * photograph.
 */
export function HeroMotion() {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const canvas = ref.current?.closest<HTMLElement>(".hero-canvas");
    const track = canvas?.closest<HTMLElement>(".hero-track");
    if (!canvas || !track) return;

    const root = document.documentElement;
    const write = (value: number) =>
      root.style.setProperty("--hero-exit", value.toFixed(4));

    if (stilled()) {
      // Named explicitly rather than left to the stylesheet's default: under
      // reduced motion the hero holds its arrival state at every scroll position.
      write(0);
      return;
    }

    /**
     * How far the Positioning section is pulled up under the hero, in pixels,
     * negative.
     *
     * The hero's navy fades to transparent rather than to paper, so the section
     * underneath has to already be there to be revealed, and the network has to be
     * on screen for the drawing to fly into. Positioning is therefore lapped back
     * over the hero's own pinned screen — see `.pos-track` in globals.css. The exact number is the canvas's height, and it has to be the
     * measured one rather than `100vh - header`: the canvas carries a
     * `min-height`, not a height, so a long line of copy at a narrow desktop
     * width can make it taller than a screen, and a lap that is short by even a
     * few pixels is a band of bare paper between the two sections.
     *
     * Written on mount, when the pinned query flips, and when the canvas changes
     * size — never per frame. It is a layout-affecting value, so recomputing it
     * on scroll would cost a reflow every frame to learn a number that cannot
     * have changed. The stylesheet's own fallback is the same figure expressed in
     * viewport units, so the first paint is already right and there is nothing to
     * shift.
     */
    let pinned = false;

    /**
     * The drawing's resting box, and the network node it is flown onto.
     *
     * Looked up lazily rather than on mount: `NetworkFlow` is a client component in
     * the section below and there is no ordering guarantee between the two effects.
     * Once found they are kept, because neither is ever replaced.
     */
    let anchor: HTMLElement | null = null;
    let mark: HTMLElement | null = null;

    /**
     * The anchor's *layout* width, which is the one thing about the aim that cannot
     * be read per frame.
     *
     * Everything the aim measures is read through `getBoundingClientRect`, which is
     * a screen rectangle: it has the hero stage's standing drift and its exit swell
     * baked into it. The travel written back has to be in the stage's own
     * coordinates, because that is where the drawing's `translate` is resolved — so
     * it has to be divided by the scale between the two, and the rectangle's width
     * over the untransformed width is exactly that scale. `getComputedStyle` rather
     * than `offsetWidth` so it is not rounded to a whole pixel, and only on resize,
     * because it is a layout read of a value that only layout can change.
     */
    let plan = 0;

    const measure = () => {
      root.style.setProperty("--hero-lap", `${-canvas.offsetHeight}px`);

      // The lapped band's extra pull-up, in pixels off the same travel the clock is
      // measured over, so the two cannot drift apart at an odd viewport ratio.
      const travel = Math.max(track.offsetHeight - canvas.offsetHeight, 1);
      root.style.setProperty(
        "--pos-early",
        pinned ? `${Math.round(EARLY * travel)}px` : "0px",
      );

      anchor ??= canvas.querySelector<HTMLElement>(".amb-anchor");
      plan = anchor ? parseFloat(getComputedStyle(anchor).width) || 0 : 0;
    };

    measure();
    const sizing = new ResizeObserver(measure);
    sizing.observe(canvas);

    /**
     * How far the drawing has to travel to land above its node, in the hero stage's
     * own coordinates, written as two pixel properties the stylesheet ramps.
     *
     * Live off the DOM every frame, and off the *anchor* rather than off the drawing
     * itself. The drawing carries the transform being derived here, so measuring it
     * would be measuring a thing through its own answer — the classic feedback loop,
     * which settles on the wrong number or on none. The anchor is the same rectangle
     * with nothing applied to it, so what comes out is a distance rather than a
     * correction to a distance.
     */
    const aim = (exit: number) => {
      if (!pinned || exit < AIM_FROM || exit > AIM_TO) return;

      anchor ??= canvas.querySelector<HTMLElement>(".amb-anchor");
      mark ??= document.querySelector<HTMLElement>(
        '.flow-stage[data-stage="assigned"] .flow-mark',
      );
      if (!anchor || !mark || !plan) return;

      const from = anchor.getBoundingClientRect();
      const to = mark.getBoundingClientRect();
      const scale = from.width / plan;
      if (!scale) return;

      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - LAND - (from.top + from.height / 2);
      root.style.setProperty("--amb-dx", `${(dx / scale).toFixed(2)}px`);
      root.style.setProperty("--amb-dy", `${(dy / scale).toFixed(2)}px`);
    };

    let off: (() => void) | null = null;

    const read = () =>
      pinned
        ? pinnedAt(track, canvas)
        : clamp(
            -canvas.getBoundingClientRect().top /
              Math.max(canvas.offsetHeight * SPAN, 1),
          );

    const stop = onPinned((on) => {
      pinned = on;
      measure();
      // Resubscribing rather than branching inside the listener, so that the one
      // frame a breakpoint is crossed on is measured under the new geometry — the
      // track's height changes in the same layout pass the query flips in.
      off?.();
      off = onScroll(() => {
        const exit = read();
        write(exit);
        aim(exit);
      });
    });

    return () => {
      stop();
      off?.();
      sizing.disconnect();
      root.style.removeProperty("--hero-exit");
      root.style.removeProperty("--hero-lap");
      root.style.removeProperty("--pos-early");
      root.style.removeProperty("--amb-dx");
      root.style.removeProperty("--amb-dy");
    };
  }, []);

  return <span ref={ref} aria-hidden="true" className="hidden" />;
}
