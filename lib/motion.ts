/**
 * The page's one scroll clock.
 *
 * Five separate things on this page respond to the scroll position — the hero's
 * exit, the About plate's drift, the service and partner photographs' parallax,
 * the principles band's sweep — and before this they each owned a `scroll`
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
 * `HowItWorks` deliberately does not use this. Its pinned stage runs a chase
 * clamp that has to be able to schedule frames of its own between scroll events,
 * which is the one thing a shared bus cannot express.
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
