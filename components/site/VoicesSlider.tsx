"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Testimonial } from "@/data/site";
import { Reveal } from "@/components/ui/Reveal";

/**
 * How long a slide change takes. The progress line is given the same number so the
 * line and the cards arrive together rather than one chasing the other.
 */
const SLIDE_MS = 420;

const pad = (value: number) => String(value).padStart(2, "0");

/** Ease-out cubic — fast away, settled on arrival. No overshoot to read as a bounce. */
const easeOut = (t: number) => 1 - (1 - t) ** 3;

/** The content edge a card rests against — the padding edge, not the scrollport. */
const restEdge = (track: HTMLElement) =>
  track.getBoundingClientRect().left + (parseFloat(getComputedStyle(track).paddingLeft) || 0);

/**
 * Where the track comes to rest with `card` read: against the content edge, the same
 * edge the heading and the disclosure start on, with the next card behind it.
 *
 * This is the single answer to "where does this card sit", and both the arrows and
 * the read-back below ask it, which is what stops a click and a swipe disagreeing.
 */
const offsetFor = (track: HTMLElement, card: HTMLElement | null) => {
  if (!card) return track.scrollLeft;
  const target = track.scrollLeft + card.getBoundingClientRect().left - restEdge(track);
  return Math.max(0, Math.min(target, track.scrollWidth - track.clientWidth));
};

/**
 * One side of the network at a time, with the next one already in view.
 *
 * The track is a real scroll container, not a transformed strip. That is the whole
 * design: swipe, trackpad and scrollbar are the browser's, snapping is the
 * browser's, and the component only has to own the two things the browser cannot
 * time — the 420ms ease-out run the arrows and the arrow keys perform, and the
 * index that the counter, the progress line and the active card all read from.
 * However the track is moved, the index is recovered from where the cards actually
 * are, so a swipe and a click can never disagree.
 *
 * Each card carries that role's view of the same emergency: the line it would say,
 * then the two states either side of a shared request — what the moment used to be,
 * and what it becomes. Two ruled columns rather than a before/after graphic, because
 * the difference here is what everybody can see, not a number that got smaller.
 *
 * The carousel does not advance on its own. There is nothing here that expires, and
 * a panel that moves while it is being read is a panel that has to be caught up with.
 *
 * Visitors who prefer reduced motion get the same carousel with the run taken out:
 * the track is placed rather than travelled, and every control keeps its state.
 */
export function VoicesSlider({ items }: { items: Testimonial[] }) {
  const total = items.length;

  const [index, setIndex] = useState(0);
  /** True for the length of a run. Dips the active card a touch while it travels. */
  const [moving, setMoving] = useState(false);
  const [reduced, setReduced] = useState(false);

  const trackRef = useRef<HTMLDivElement | null>(null);
  const cards = useRef<(HTMLElement | null)[]>([]);
  const frame = useRef(0);
  /** The index without the render delay, for handlers that fire faster than React. */
  const current = useRef(0);

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
      // the track has got to, so rapid navigation can never stack two of them.
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

      // Snapping is suspended for the length of the run. Mandatory snap points and
      // a scrollLeft written every frame pull against each other; the run ends
      // exactly on a snap point, so there is nothing to lose by turning it off.
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
   * Swipe, trackpad, or the scrollbar: the index is read back from where the cards
   * have ended up, so the counter, the line and the active marker follow a gesture
   * the component never handled. A run of its own is skipped — it already knows.
   */
  const syncFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track || frame.current) return;

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

  // A reload restores the track's own scroll position before React has any say in
  // it, so the index is read back off the DOM once on mount rather than assumed to
  // be the first card.
  useEffect(() => {
    syncFromScroll();
  }, [syncFromScroll]);

  // Card widths change at every breakpoint, so the resting offset does too. The
  // track is re-placed, never re-animated: a resize is not a slide change.
  useEffect(() => {
    const replace = () => {
      const track = trackRef.current;
      if (!track || frame.current) return;
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
    goTo(keys[event.key]);
  };

  return (
    /**
     * The carousel arrives sideways, which is the one direction that says what it
     * is: a row you move along rather than a stack you scroll past. The entrance is
     * on the cards, not on the track — the track is a native scroll container, and
     * translating that would move a scrollport against the page. Transforms do not
     * contribute to scroll area, so cards entering from 28px to the right cannot
     * widen the document or hand the page a horizontal scrollbar.
     */
    <Reveal items>
      <div role="group" aria-roledescription="carousel" aria-label="Voices across the network">
      <div
        ref={trackRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onScroll={syncFromScroll}
        data-moving={moving ? "true" : "false"}
        className="voices-track -mx-5 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8 lg:mx-0 lg:gap-[22px] lg:px-0"
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
            /* Only the first few are staggered. Beyond the third card nothing is on
               screen to be late, and a tenth card holding a 700ms delay is a card
               that is still arriving when it is finally swiped to. */
            style={slide < 3 ? { transitionDelay: `${slide * 70}ms` } : undefined}
            className="voices-card voices-in group flex snap-start snap-always flex-col rounded-[7px] border border-line bg-white p-6 sm:p-8 lg:p-10"
          >
            <figcaption className="flex items-center gap-4">
              <span className="text-[0.72rem] font-medium tabular-nums tracking-[0.16em] text-muted transition-colors duration-[420ms] ease-out group-data-[current=true]:text-navy-deep">
                {pad(slide + 1)}
              </span>
              {/* The rule beside the role is the only thing that goes red, and only
                  on the card being read. It is the same signal the section headings
                  hang off, at the size of a caption. */}
              <span
                aria-hidden="true"
                className="h-4 w-0.5 shrink-0 rounded-full bg-line transition-colors duration-[420ms] ease-out group-data-[current=true]:bg-red"
              />
              <span className="eyebrow text-navy-deep">{testimonial.role}</span>
            </figcaption>

            <blockquote className="mb-9 mt-6 font-serif text-[1.4rem] leading-[1.28] text-ink sm:text-[1.7rem] lg:text-[2.05rem]">
              <p className="text-balance">&ldquo;{testimonial.quote}&rdquo;</p>
            </blockquote>

            {/* Pushed to the foot of the card, so the two readings sit on one line
                across the whole carousel however long the quote above them runs. */}
            <dl className="mt-auto grid border-t border-line pt-6 md:grid-cols-2">
              <div className="border-b border-line pb-5 md:border-b-0 md:pb-0 md:pr-8">
                <dt className="op-label">
                  <span>Before</span>
                </dt>
                <dd className="mt-3.5 text-[0.925rem] leading-relaxed text-muted">
                  {testimonial.problem}
                </dd>
              </div>
              <div className="pt-5 md:border-l md:border-line md:pl-8 md:pt-0">
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

        {/* Trailing room, so the last card comes to rest on the same edge as the
            other three. Ending it flush right instead would fill the frame with the
            card just left — but read from its far edge, a quote arriving tail first,
            which is a worse thing to show than the end of the set plainly reached. */}
        <span aria-hidden="true" className="voices-tail" />
      </div>

      {/* One short sentence per change, rather than the whole card read out again:
          the cards are all on screen and reachable, so what a change actually
          reports is which one is now being shown. */}
      <p aria-live="polite" className="sr-only">
        {`Slide ${index + 1} of ${total}: ${items[index].role}`}
      </p>

      <div className="voices-controls mt-7 items-center gap-4 sm:gap-6">
        <p className="shrink-0 text-[0.72rem] font-medium tracking-[0.14em] text-muted tabular-nums">
          <span className="text-navy-deep">{pad(index + 1)}</span> / {pad(total)}
        </p>

        <div aria-hidden="true" className="h-[2px] flex-1 overflow-hidden rounded-full bg-line">
          <span
            className="voices-progress block h-full rounded-full bg-red"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => goTo(current.current - 1)}
            disabled={index === 0}
            aria-label="Previous voice"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[7px] border border-line bg-white text-navy-deep transition-colors duration-200 hover:border-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-white disabled:text-muted/40"
          >
            <ArrowLeft size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => goTo(current.current + 1)}
            disabled={index === total - 1}
            aria-label="Next voice"
            className="inline-flex h-11 w-11 items-center justify-center rounded-[7px] border border-line bg-white text-navy-deep transition-colors duration-200 hover:border-navy hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:bg-white disabled:text-muted/40"
          >
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
    </Reveal>
  );
}
