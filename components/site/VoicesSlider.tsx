"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { Testimonial } from "@/data/site";
import { voicesClose } from "@/data/site";
import { Reveal } from "@/components/ui/Reveal";
import { clamp, onPinned, onScroll, pinnedAt, stilled } from "@/lib/motion";

/**
 * How long a slide change takes in the unpinned row. The progress line is given
 * the same number so the line and the cards arrive together rather than one
 * chasing the other.
 */
const SLIDE_MS = 420;

const pad = (value: number) => String(value).padStart(2, "0");

/* ===========================================================================
   The pinned deck's clock.

   Every number below is a fraction of the stage's own travel, and every visible
   property is a pure function of that one fraction. Nothing is a target being
   chased, nothing accumulates, and no phase has a state of its own — which is
   the whole reason scrolling back up retraces the sequence exactly instead of
   approximating it.

     0.00 → 0.03   the label and the headline alone, held
     0.03 → 0.14   the headline lifts away and clears the space
     0.08 → 0.28   the four cards rise from below into the fan it has vacated
     0.28 → 0.72   the fan is walked through: card 01 centred → card 04 centred
     0.72 → 0.88   the fourth card opens out into the full-width closing panel
     0.88 → 1.00   the panel holds with its line on it, and hands over to Contact

   The headline and the deck occupy the same middle of the stage — that is the
   whole idea, the deck taking the room the headline gives up — so the two bands
   above overlap only where the headline is already down to a tenth of its ink
   and the cards are still low and nearly clear. Let them cross any earlier and
   the first card slides across a headline that is still being read.

   At 340vh over a one-screen stage that is ~248vh of travel, so the three card
   changes get about 44vh each — near enough to the pinned service list's step
   that crossing from one section to the other feels like one page rather than
   two effects.
   =========================================================================== */

/** The headline is still the only thing on screen until here. */
const HEAD_HOLD = 0.03;
/** ...and has gone by here. */
const HEAD_GONE = 0.14;
/** The deck's rise: begun once the headline is mostly spent, settled well after. */
const RISE_FROM = 0.08;
const RISE_TO = 0.27;
/** Where the fan starts being walked through, and where the last card lands. */
const DECK_FROM = 0.28;
const DECK_TO = 0.72;
/** Where the closing panel has finished opening out. */
const PANEL_TO = 0.88;

/**
 * The fan, per step away from the card being read. Small numbers on purpose: a
 * deck says depth with a few degrees and a little scale, and everything past
 * that is a spread hand of cards rather than a stack of them.
 */
const FAN_X = 0.5; // sideways, as a share of the card's own width
const FAN_Y = 26; // px lower per step, so the deck arcs rather than shears
const FAN_ROT = 5; // degrees per step
const FAN_SCALE = 0.08; // smaller per step
const FAN_FADE = 0.17; // more muted per step
/**
 * The share of each card's step the deck spends holding that card still, at
 * either end of it. The remaining middle is the crossing.
 */
const DWELL = 0.22;

/** How far the deck starts below its resting place when it rises in. */
const RISE = 300; // px the deck starts below its resting place, so it rises in from off-screen

/** Ease-out cubic — fast away, settled on arrival. No overshoot to read as a bounce. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;
/** Smoothstep. A curve, not a state: run it backwards and it retraces itself. */
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * Distance, compressed. Without this the fourth card sits four whole steps out
 * and is off the side of the screen; with it the far end of the deck tightens up
 * and the whole fan stays in frame, while the card being read still gets the
 * full first step of separation from its neighbour.
 */
const soften = (value: number) =>
  Math.sign(value) * Math.abs(value) ** 0.78;

/** The content edge a card rests against — the padding edge, not the scrollport. */
const restEdge = (track: HTMLElement) =>
  track.getBoundingClientRect().left + (parseFloat(getComputedStyle(track).paddingLeft) || 0);

/**
 * Where the row comes to rest with `card` read: against the content edge, the
 * same edge the heading and the disclosure start on, with the next card behind
 * it. Row mode only — the deck does not scroll, it transforms.
 */
const offsetFor = (track: HTMLElement, card: HTMLElement | null) => {
  if (!card) return track.scrollLeft;
  const target = track.scrollLeft + card.getBoundingClientRect().left - restEdge(track);
  return Math.max(0, Math.min(target, track.scrollWidth - track.clientWidth));
};

/**
 * One emergency, held up four times over.
 *
 * There are two presentations of the same four cards here, and which one runs is
 * decided by `PINNED` — one media query, shared with every other pinned sequence
 * on the page, so CSS and JavaScript can never disagree about it.
 *
 * **The row.** Phones, tablets, anyone who asked for less motion, and anyone with
 * scripting off get a native horizontal scroller: swipe, trackpad, snapping and
 * the scrollbar all belong to the browser, and the component only owns the 420ms
 * run the arrows perform and the index the counter reads. However the row is
 * moved, the index is recovered from where the cards actually are, so a swipe and
 * a click can never disagree.
 *
 * **The deck.** On a desktop the same four cards are a fanned deck on a pinned
 * stage, and the page's vertical scroll walks through it. Each card's position,
 * rotation, scale and opacity are computed from one fraction every frame and
 * written as custom properties; CSS composes them into a single transform. The
 * card being read comes straight and full size with its quote and its two
 * readings revealing as it arrives, its neighbours stay tilted, smaller and
 * muted, and when the fourth has been read the deck opens out into the closing
 * panel that hands over to the contact band below.
 *
 * Neither presentation animates towards anything. The row is a scroll position,
 * the deck is a function of one — so a reversal is simply the same numbers in the
 * other order, and there is no state anywhere to unwind.
 */
export function VoicesSlider({ items }: { items: Testimonial[] }) {
  const total = items.length;

  const [index, setIndex] = useState(0);
  /** True for the length of a row run. Dips the card being moved to. */
  const [moving, setMoving] = useState(false);
  const [reduced, setReduced] = useState(false);
  /** True while the page scroll owns the deck. Switches every clock in here. */
  const [decked, setDecked] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const frame = useRef(0);
  /** The index without the render delay, for handlers that fire faster than React. */
  const current = useRef(0);
  /**
   * Set only while the stage is pinned. Its presence is what tells the arrows and
   * the arrow keys that a deliberate choice is a vertical page scroll rather than
   * a horizontal one — exactly the convention the pinned step lists use.
   */
  const scrollToSlide = useRef<((slide: number) => void) | null>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  const goTo = useCallback(
    (requested: number) => {
      const track = trackRef.current;
      if (!track) return;

      const slide = Math.max(0, Math.min(requested, total - 1));
      current.current = slide;
      setIndex(slide);

      // A run already under way is abandoned where it stands rather than queued
      // behind: a second click retargets the same single animation from wherever
      // the row has got to, so rapid navigation can never stack two of them.
      cancelAnimationFrame(frame.current);
      frame.current = 0;

      const from = track.scrollLeft;
      const to = offsetFor(track, cards.current[slide]);

      if (reduced || Math.abs(to - from) < 1) {
        track.style.scrollSnapType = "";
        track.scrollLeft = to;
        setMoving(false);
        return;
      }

      // Snapping is suspended for the length of the run. Mandatory snap points
      // and a scrollLeft written every frame pull against each other; the run
      // ends exactly on a snap point, so there is nothing to lose by it.
      track.style.scrollSnapType = "none";
      setMoving(true);

      const start = performance.now();
      const step = (now: number) => {
        const progress = Math.min(1, (now - start) / SLIDE_MS);
        track.scrollLeft = from + (to - from) * easeOut(progress);
        if (progress < 1) {
          frame.current = requestAnimationFrame(step);
          return;
        }
        frame.current = 0;
        track.style.scrollSnapType = "";
        setMoving(false);
      };
      frame.current = requestAnimationFrame(step);
    },
    [reduced, total],
  );

  /**
   * Row mode only. Swipe, trackpad, or the scrollbar: the index is read back from
   * where the cards have ended up, so the counter, the line and the active marker
   * follow a gesture the component never handled. A run of its own is skipped —
   * it already knows — and so is the deck, which owns the index outright.
   */
  const syncFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || frame.current || scrollToSlide.current) return;

    let nearest = 0;
    let shortest = Infinity;
    cards.current.forEach((card, slide) => {
      if (!card) return;
      const distance = Math.abs(offsetFor(track, card) - track.scrollLeft);
      if (distance < shortest) {
        shortest = distance;
        nearest = slide;
      }
    });

    if (nearest === current.current) return;
    current.current = nearest;
    setIndex(nearest);
  }, []);

  // A reload restores the row's own scroll position before React has any say in
  // it, so the index is read back off the DOM once on mount rather than assumed
  // to be the first card.
  useEffect(() => {
    syncFromScroll();
  }, [syncFromScroll]);

  /* -------------------------------------------------------------------------
     The deck.

     One subscription to the page's shared scroll clock while the stage is held,
     and nothing at all when it is not. Everything below is measured live off
     rects in the same frame it is painted in, so a resize, a jump to an anchor,
     a reload part-way down the page or an image loading above the section are
     all simply the next frame's numbers.
     ------------------------------------------------------------------------- */
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const run = track.closest<HTMLElement>(".voices-run");
    const stage = track.closest<HTMLElement>(".voices-pin");
    if (!run || !stage) return;
    if (stilled()) return;

    let off: (() => void) | null = null;

    /** Everything this effect writes, taken back off in one place. */
    const clear = () => {
      for (const card of cards.current) {
        if (!card) continue;
        card.style.cssText = "";
        card.removeAttribute("data-deck");
      }
      for (const name of [
        "--vx-head",
        "--vx-p",
        "--vx-rail",
        "--vx-panel",
        "--vx-cta",
        "--vx-round",
        "--vx-ft",
        "--vx-fr",
        "--vx-fb",
        "--vx-fl",
        "--vx-pad",
      ]) {
        stage.style.removeProperty(name);
      }
      delete stage.dataset.open;
    };

    const stop = onPinned((on) => {
      off?.();
      off = null;

      if (!on) {
        scrollToSlide.current = null;
        setDecked(false);
        clear();
        return;
      }

      /**
       * A card is chosen by scrolling the page to the point where the deck has it
       * centred, because that is the only position the next scroll frame will
       * agree with. `DECK_FROM + reach * (DECK_TO - DECK_FROM)` is the exact
       * inverse of the mapping the frame below uses.
       */
      scrollToSlide.current = (slide) => {
        const offset = parseFloat(window.getComputedStyle(stage).top) || 0;
        const travel = Math.max(run.offsetHeight - stage.offsetHeight, 1);
        const reach = total > 1 ? slide / (total - 1) : 0;
        const top =
          run.getBoundingClientRect().top +
          window.scrollY -
          offset +
          (DECK_FROM + reach * (DECK_TO - DECK_FROM)) * travel;
        window.scrollTo({ top: Math.round(top), behavior: "smooth" });
      };

      setDecked(true);
      for (const card of cards.current) card?.setAttribute("data-deck", "true");

      off = onScroll(() => {
        const at = pinnedAt(run, stage);

        // ── The headline, and the deck rising into the space it leaves ───────
        const head = smooth(clamp((at - HEAD_HOLD) / (HEAD_GONE - HEAD_HOLD)));
        stage.style.setProperty("--vx-head", head.toFixed(4));

        // How far the deck itself has risen. The counter and the disclosure
        // belong to the deck rather than to the section, so they arrive with it
        // and leave with it: while the headline still has the screen to itself
        // there is nothing for a counter to count.
        const enter = clamp((at - RISE_FROM) / (RISE_TO - RISE_FROM));

        // ── Which card is being read, as a continuous position ───────────────
        const reach = clamp((at - DECK_FROM) / (DECK_TO - DECK_FROM));
        // Not a straight ride from the first card to the last. The deck dwells on
        // each card for the first and last fifth of its step and crosses to the
        // next one over the middle, so the position where two cards are equally
        // half-read — the one frame a fan of text cards has nothing legible on
        // it — is passed through at speed instead of lived in. Still one
        // expression of `at` with no state in it, so it reverses exactly.
        const ride = reach * (total - 1);
        const whole = Math.floor(Math.min(ride, total - 1.0001));
        const live = whole + smooth(clamp((ride - whole - DWELL) / (1 - DWELL * 2)));

        // ── The closing panel ────────────────────────────────────────────────
        const open = smooth(clamp((at - DECK_TO) / (PANEL_TO - DECK_TO)));
        // Its ground comes up over the first fifth, while it is still exactly the
        // size and place of the card underneath it. Any later and the navy would
        // arrive as a flash across a card that is already half a screen wide.
        const ground = clamp(open / 0.22);
        // Its line comes up as soon as its ground has finished arriving, so the
        // panel is never a navy rectangle with nothing in it.
        const line = smooth(clamp((open - 0.18) / 0.46));

        // Which of the two owns the pointer. The panel is the top layer in the
        // stage, so once its ground is up it must take the clicks the counter's
        // arrows were taking, and before that it must take none of them.
        stage.dataset.open = ground > 0.02 ? "true" : "false";

        stage.style.setProperty("--vx-panel", ground.toFixed(4));
        stage.style.setProperty("--vx-cta", line.toFixed(4));
        stage.style.setProperty("--vx-round", (1 - open).toFixed(4));
        // The counter and its line have nothing left to report once the deck has
        // been read through, so they go with it rather than sitting on the panel.
        stage.style.setProperty(
          "--vx-rail",
          Math.min(smooth(clamp(enter / 0.6)), 1 - clamp(open / 0.4)).toFixed(4),
        );
        stage.style.setProperty("--vx-p", (live / Math.max(total - 1, 1)).toFixed(4));

        // ── The fan ──────────────────────────────────────────────────────────
        const width = cards.current[0]?.offsetWidth || 1;
        // How far a card may be thrown sideways. The outermost card of a
        // four-card fan would otherwise run off the side of a narrow laptop and
        // give the page a horizontal scrollbar, so the spread is compressed to
        // whatever room there actually is rather than clipped after the fact.
        const room = Math.max(window.innerWidth / 2 - width / 2 - 16, width * 0.2);

        cards.current.forEach((card, slide) => {
          if (!card) return;

          const gap = slide - live;
          const away = Math.abs(gap);
          const step = soften(gap);

          // The deck arrives one card at a time, and is fully in frame by the
          // time the headline has gone.
          // `smooth`, not `easeOut`: a card must leave the ground slowly enough
          // to be nearly invisible while the headline still has ink in it.
          const own = smooth(clamp((enter - slide * 0.09) / 0.68));

          const x = Math.max(-room, Math.min(room, step * FAN_X * width));
          const y = Math.min(away, 2.4) * FAN_Y + (1 - own) * RISE;
          const rot = Math.max(-12, Math.min(12, step * FAN_ROT));
          const scale = Math.max(0.6, 1 - Math.min(away, 3) * FAN_SCALE);
          // Cards stay near enough to opaque to cover one another properly. A
          // deck of half-transparent cards is four sheets of text read through
          // each other, which is the one thing a fan must never look like; what
          // mutes an inactive card here is that it has put its words away, not
          // that you can see through it.
          const fade = Math.max(0.52, 1 - Math.min(away, 3) * FAN_FADE);

          // The quote is the card's face and comes up across most of a step; the
          // two readings under it only once the card is genuinely settled. That
          // ordering is the whole of "progressively" — nothing is timed, so it
          // runs backwards as readily as forwards.
          const near = clamp(1 - away);
          const face = 0.32 + 0.68 * smooth(clamp(1 - away / 0.9));
          const quote = smooth(clamp(1 - away / 0.68));
          const body = smooth(clamp(1 - away / 0.42));

          // Placement is written as an inline transform rather than handed to
          // CSS as custom properties, and deliberately so. The card also carries
          // the row's sideways entrance class, whose hidden state sets a
          // transform of its own at a specificity a stylesheet rule here would
          // have to out-argue; an inline transform simply outranks every rule in
          // the file, so the two presentations cannot fight over the property at
          // all. The same reasoning applies to opacity below.
          card.style.transform =
            `translate3d(calc(-50% + ${x.toFixed(1)}px), calc(-50% + ${y.toFixed(1)}px), 0)` +
            ` rotate(${rot.toFixed(2)}deg) scale(${scale.toFixed(4)})`;

          card.style.setProperty("--near", near.toFixed(4));
          card.style.setProperty("--face", face.toFixed(4));
          card.style.setProperty("--quote", quote.toFixed(4));
          card.style.setProperty("--body", body.toFixed(4));
          // Behind the panel the deck is gone; the fourth card goes with the
          // others, because by then the panel is opaque over the top of it.
          card.style.opacity = (fade * own * (1 - ground)).toFixed(4);
          card.style.zIndex = String(100 - Math.round(away * 10));
        });

        // ── Where the closing panel opens from, and to ───────────────────────
        // From: exactly the box the fourth card rests in, so its first frame is
        // the card and there is nothing to see in the handover. To: the stage's
        // own rect widened to the window. The stage is `position: sticky` at the
        // header's height with a screen's height of its own, so its rect *is* the
        // screen below the header — which makes "full width, full height" two
        // measured numbers rather than a guess at what the shell's padding is.
        const box = stage.getBoundingClientRect();
        const deck = track.getBoundingClientRect();
        const height = cards.current[total - 1]?.offsetHeight || 0;
        const midX = deck.left - box.left + deck.width / 2;
        const midY = deck.top - box.top + deck.height / 2;

        const from = {
          t: midY - height / 2,
          l: midX - width / 2,
          r: box.width - (midX + width / 2),
          b: box.height - (midY + height / 2),
        };
        const to = {
          t: 0,
          l: -box.left,
          r: -(window.innerWidth - box.right),
          b: 0,
        };

        stage.style.setProperty("--vx-ft", `${(from.t + (to.t - from.t) * open).toFixed(1)}px`);
        stage.style.setProperty("--vx-fl", `${(from.l + (to.l - from.l) * open).toFixed(1)}px`);
        stage.style.setProperty("--vx-fr", `${(from.r + (to.r - from.r) * open).toFixed(1)}px`);
        stage.style.setProperty("--vx-fb", `${(from.b + (to.b - from.b) * open).toFixed(1)}px`);
        // The panel's side padding travels with its edges, from the card's own
        // padding out to the page's left gutter — `box.left` is that gutter — so
        // the closing sentence lands on the same column the rest of the page
        // sets to rather than 80px inboard of it.
        const padFrom = parseFloat(getComputedStyle(cards.current[total - 1] ?? stage).paddingLeft) || 40;
        stage.style.setProperty(
          "--vx-pad",
          `${(padFrom + (box.left - padFrom) * open).toFixed(1)}px`,
        );

        // The counter follows the card nearest the centre, which is the one the
        // reader is actually reading — not the one a step boundary says it is.
        const shown = Math.max(0, Math.min(Math.round(live), total - 1));
        if (shown !== current.current) {
          current.current = shown;
          setIndex(shown);
        }
      });
    });

    return () => {
      stop();
      off?.();
      scrollToSlide.current = null;
      clear();
    };
  }, [total]);

  /**
   * A deliberate choice — an arrow, or an arrow key. In the deck the cards cannot
   * be moved without moving the page, or the next scroll frame would put them
   * straight back; so the page is scrolled to where that card is centred and the
   * sequence does the rest. In the row it is the ordinary 420ms slide.
   */
  const choose = useCallback(
    (requested: number) => {
      const slide = Math.max(0, Math.min(requested, total - 1));
      const scroll = scrollToSlide.current;
      if (scroll) scroll(slide);
      else goTo(slide);
    },
    [goTo, total],
  );

  // Card widths change at every breakpoint, so the resting offset does too. The
  // row is re-placed, never re-animated: a resize is not a slide change. The deck
  // needs nothing here — it re-measures every frame, and the shared clock already
  // fires on resize.
  useEffect(() => {
    const replace = () => {
      const track = trackRef.current;
      if (!track || frame.current || scrollToSlide.current) return;
      track.scrollLeft = offsetFor(track, cards.current[current.current]);
    };
    window.addEventListener("resize", replace);
    return () => window.removeEventListener("resize", replace);
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const keys: Record<string, number> = {
      ArrowRight: current.current + 1,
      ArrowLeft: current.current - 1,
      Home: 0,
      End: total - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    choose(keys[event.key]);
  };

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Voices across the network"
      className="vx-shell"
    >
      {/**
       * One element, two presentations. As a row it is a native scroll container
       * and the cards are flex items in it; as a deck it is a plain box and the
       * cards are absolutely placed inside it. Everything that makes it a
       * scroller is a base rule and everything that makes it a deck is scoped to
       * `.js` and to a desktop that welcomes motion, so with scripting off — or
       * at any width below a laptop — there is only ever the row.
       */}
      <Reveal className="vx-frame" items>
        <div
          ref={trackRef}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onScroll={syncFromScroll}
          data-moving={moving ? "true" : "false"}
          className="voices-track vx-deck -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:gap-[22px] lg:px-0"
        >
          {items.map((testimonial, slide) => (
            <figure
              key={testimonial.id}
              ref={(node) => {
                cards.current[slide] = node;
              }}
              role="group"
              aria-roledescription="slide"
              aria-label={`Slide ${slide + 1} of ${total}: ${testimonial.role}`}
              aria-current={slide === index ? "true" : undefined}
              data-current={slide === index ? "true" : "false"}
              /* Row mode only. Beyond the third card nothing is on screen to be
                 late, and a card holding a 700ms delay is a card still arriving
                 when it is finally swiped to. The deck writes its own entrance. */
              style={slide < 3 ? { transitionDelay: `${slide * 70}ms` } : undefined}
              className="voices-card vx-card voices-in group flex snap-start snap-always flex-col rounded-[7px] border border-line bg-white p-6 sm:p-8 lg:p-10"
            >
              {/* The card being read is the only red on the deck, and it is one
                  hairline along its top edge that draws itself in as the card
                  comes straight. Same signal the section headings hang off. */}
              <span aria-hidden="true" className="vx-accent" />

              <figcaption className="vx-face flex items-center gap-4">
                <span className="text-[0.72rem] font-medium tabular-nums tracking-[0.16em] text-muted transition-colors duration-[420ms] ease-out group-data-[current=true]:text-navy-deep">
                  {pad(slide + 1)}
                </span>
                <span
                  aria-hidden="true"
                  className="h-4 w-0.5 shrink-0 rounded-full bg-line transition-colors duration-[420ms] ease-out group-data-[current=true]:bg-red"
                />
                <span className="eyebrow text-navy-deep">{testimonial.role}</span>
              </figcaption>

              <blockquote className="vx-quote mb-9 mt-6 font-serif text-[1.4rem] leading-[1.28] text-ink sm:text-[1.7rem] lg:text-[2.05rem]">
                <p className="text-balance">&ldquo;{testimonial.quote}&rdquo;</p>
              </blockquote>

              {/* Pushed to the foot of the card, so the two readings sit on one
                  line across the whole set however long the quote above them
                  runs. Side by side in the row, stacked in the deck — the deck's
                  card is a tall one, and two columns in it would be two very
                  narrow columns. */}
              <dl className="vx-body mt-auto grid border-t border-line pt-6 md:grid-cols-2">
                <div className="vx-before border-b border-line pb-5 md:border-b-0 md:pb-0 md:pr-8">
                  <dt className="op-label">
                    <span>Before</span>
                  </dt>
                  <dd className="mt-3.5 text-[0.925rem] leading-relaxed text-muted">
                    {testimonial.problem}
                  </dd>
                </div>
                <div className="vx-after pt-5 md:border-l md:border-line md:pl-8 md:pt-0">
                  <dt className="op-label">
                    <span>With one shared request</span>
                  </dt>
                  <dd className="mt-3.5 text-[0.925rem] leading-relaxed text-ink">
                    {testimonial.shift}
                  </dd>
                </div>
              </dl>
            </figure>
          ))}

          {/* Row mode only: room behind the last card so it can come to rest on
              the same edge as the other three rather than stopping short against
              the end of the track. The deck has no scroll range to pad. */}
          <span aria-hidden="true" className="voices-tail" />
        </div>
      </Reveal>

      {/* One short sentence per change rather than the whole card read out again:
          the cards are all on screen and reachable, so what a change actually
          reports is which one is now being shown. */}
      <p aria-live="polite" className="sr-only">
        {`Slide ${index + 1} of ${total}: ${items[index].role}`}
      </p>

      <div className="voices-controls vx-rail mt-7 items-center gap-4 sm:gap-6">
        <p className="shrink-0 text-[0.72rem] font-medium tracking-[0.14em] text-muted tabular-nums">
          <span className="text-navy-deep">{pad(index + 1)}</span> / {pad(total)}
        </p>

        <div aria-hidden="true" className="h-[2px] flex-1 overflow-hidden rounded-full bg-line">
          {/* Two clocks, one line. In the row it is a width per slide, eased by
              CSS — four states, and the arrows step between them. In the deck it
              is the scroll position itself, so it moves with the cards instead of
              after them, and the width is handed to CSS as a custom property
              rather than as a width: an inline width beats any stylesheet rule,
              so setting it here would silently win over the rule meant to be
              driving it. The first card's share is passed in too, so the
              continuous line starts exactly where the stepped one's first state
              sat however many voices there are. */}
          <span
            className="voices-progress block h-full rounded-full bg-red"
            style={
              decked
                ? ({ "--voice-lead": `${100 / total}%` } as React.CSSProperties)
                : { width: `${((index + 1) / total) * 100}%` }
            }
          />
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => choose(current.current - 1)}
            disabled={index === 0}
            aria-label="Previous voice"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[7px] border border-line bg-white text-navy-deep transition-colors duration-200 hover:border-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-white disabled:text-muted/40"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => choose(current.current + 1)}
            disabled={index === total - 1}
            aria-label="Next voice"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[7px] border border-line bg-white text-navy-deep transition-colors duration-200 hover:border-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-white disabled:text-muted/40"
          >
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/**
       * The closing panel.
       *
       * In the deck it opens out of the fourth card and fills the screen, and its
       * navy is the contact band's navy, so the hand-off between the two is the
       * one thing on the page with no seam in it at all. Out of the deck it is
       * simply the band's closing statement, sitting after the cards where it
       * reads the same way — which is also what keeps its words on the page for a
       * reader with scripting off, rather than locking a line of copy inside an
       * effect that is not running.
       */}
      <div className="vx-final">
        <span aria-hidden="true" className="vx-final-rule" />
        <div className="vx-final-inner">
          <p className="op-label">
            <span>{voicesClose.eyebrow}</span>
          </p>
          <p className="vx-final-head mt-6 font-serif text-[1.9rem] leading-[1.08] text-white sm:text-[2.5rem] lg:text-[3.1rem]">
            {voicesClose.heading}
          </p>
          <p className="vx-final-body mt-5 max-w-[46ch] text-base leading-relaxed text-white/70">
            {voicesClose.body}
          </p>
          <a
            href="#contact"
            className="vx-final-action group mt-8 inline-flex items-center gap-2 bg-red px-5 py-3 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-white transition-colors duration-300 hover:bg-red-dark"
          >
            {voicesClose.action}
            <ArrowUpRight
              size={14}
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </a>
        </div>
      </div>
    </div>
  );
}
