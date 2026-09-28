/**
 * The page's one scroll clock.
 *
 * Most of what moves on this page is a function of the scroll position — the
 * hero's departure, the Positioning network's route, the principles stack, the
 * About plate's drift, the service and partner photographs' parallax — and
 * before this they each owned a `scroll`
 * listener and a `requestAnimationFrame` of their own. That is not just wasteful:
 * it is visibly wrong. Independent rAF callbacks are not guaranteed to land in
 * the same frame, so two elements reading the same scroll position could paint
 * one frame apart, and a page whose parts drift against each other by a frame is
 * exactly the cheapness this brief is trying to avoid.
 *
 * So: one listener, one frame, every subscriber measured and painted together.
 * Subscribers are called in insertion order inside a single rAF, which also means
 * a reader with twenty photographs on screen costs one callback per frame rather
 * than twenty.
 *
 * Three sections are now pinned rather than one — the hero, Positioning and the
 * principles stack — and all three read their progress from this clock through
 * `pinnedAt`, so a reader crossing the seam between two of them sees both
 * measured in the same frame.
 *
 * `HowItWorks` deliberately does not use this. Its pinned stage runs a chase
 * clamp that has to be able to schedule frames of its own between scroll events,
 * which is the one thing a shared bus cannot express. It is left exactly as it
 * was: the newer sequences were built around it, not through it.
 */

type Listener = () => void;

const listeners = new Set<Listener>();
let frame = 0;
let bound = false;

const run = () => {
  frame = 0;
  for (const listener of listeners) listener();
};

const request = () => {
  if (!frame) frame = requestAnimationFrame(run);
};

/**
 * Subscribe to the scroll clock. The callback fires once immediately — a reader
 * who lands part-way down the page, or on an anchor, must see correct positions
 * on the first paint rather than on the first scroll — and then at most once per
 * frame for as long as the subscription lives.
 */
export function onScroll(listener: Listener): () => void {
  listeners.add(listener);

  if (!bound) {
    bound = true;
    window.addEventListener("scroll", request, { passive: true });
    window.addEventListener("resize", request, { passive: true });
    window.addEventListener("orientationchange", request);
  }

  listener();

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      bound = false;
      window.removeEventListener("scroll", request);
      window.removeEventListener("resize", request);
      window.removeEventListener("orientationchange", request);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    }
  };
}

/** True when the visitor has asked for less motion, or when there is no matchMedia. */
export function stilled(): boolean {
  return (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * How far an element is through its own pass across the viewport: 0 as its top
 * edge touches the bottom of the screen, 1 as its bottom edge leaves the top.
 *
 * Measured off the live rect every frame rather than accumulated from scroll
 * deltas, so it is correct after a resize, a jump to an anchor, a reload part-way
 * down the page, or an image loading above it and moving everything down.
 */
export function pass(rect: DOMRect, view: number): number {
  const span = view + rect.height;
  if (span <= 0) return 0;
  return Math.min(Math.max((view - rect.top) / span, 0), 1);
}

/** The viewport height, preferring the visual viewport the rects are measured in. */
export function viewport(): number {
  return window.innerHeight || document.documentElement.clientHeight || 1;
}

/** A 0-to-1 fraction, clamped at both ends. The only number these sequences speak in. */
export function clamp(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * The one media query every pinned sequence on this page is gated on, written
 * once so CSS and JavaScript cannot disagree about whether a stage is pinned.
 *
 * Both halves matter. Below `lg` there is not enough height to hold a stage and a
 * sequence in it, so those bands are ordinary fades instead; and a reader who has
 * asked for less motion is given the finished state rather than a scrubbed one,
 * which means the track must not exist for them either — a sticky stage inside a
 * 250vh track is 150vh of scrolling past a frozen picture.
 */
export const PINNED =
  "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

/**
 * Subscribe to `PINNED`. Fires once immediately, then on every change, and
 * returns its own cleanup.
 *
 * The initial value is deliberately *not* read synchronously during render
 * anywhere: the server has no matchMedia, so every component here renders its
 * unpinned markup first and is told the truth on mount. That costs one render and
 * buys a first paint that is never wrong in the other direction.
 */
export function onPinned(handler: (on: boolean) => void): () => void {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    handler(false);
    return () => {};
  }

  const query = window.matchMedia(PINNED);
  const read = () => handler(query.matches);

  read();
  query.addEventListener("change", read);
  return () => query.removeEventListener("change", read);
}

/**
 * How far a sticky stage is through its own track, 0 to 1.
 *
 * The geometry all three pinned sequences share: an outer track taller than the
 * screen, an inner stage that sticks at some offset inside it. The stage is held
 * from the moment the track's top edge passes that offset until the track has only
 * the stage's own height left below it — so the scroll the sequence owns is the
 * difference between the two heights, and the distance through it is how far past
 * the offset the track's top has travelled.
 *
 * The offset is read off the stage's own computed `top` rather than assumed,
 * because the rule that pins the stage is also the rule that sets it: a header
 * that changes height moves both together, and nothing here can end up measuring
 * from a line the stage is not actually resting on.
 *
 * Measured live, every frame, from two rects and an `offsetHeight`. Nothing is
 * accumulated from scroll deltas, so this is correct after a resize, a jump to an
 * anchor, a reload part-way down the page, or a photograph above it loading and
 * moving the whole document down — and running it backwards is simply scrolling
 * up, with no state to unwind.
 */
export function pinnedAt(track: HTMLElement, stage: HTMLElement): number {
  const offset = parseFloat(getComputedStyle(stage).top) || 0;
  const box = track.getBoundingClientRect();
  const travel = Math.max(box.height - stage.offsetHeight, 1);
  return clamp((offset - box.top) / travel);
}
