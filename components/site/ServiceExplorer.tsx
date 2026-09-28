"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Ambulance,
  ArrowLeftRight,
  HeartPulse,
  Network,
  Route,
  type LucideIcon,
} from "lucide-react";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { type Service } from "@/data/site";

const icons: Record<Service["icon"], LucideIcon> = {
  ambulance: Ambulance,
  transfer: ArrowLeftRight,
  assistance: HeartPulse,
  logistics: Route,
  agency: Network,
};

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * One panel change, in milliseconds. Also the window inside which a second
 * selection counts as rapid, and the life of the outgoing panel's `data-leaving`
 * flag — so this one number and the 280ms in `.svc-panel` are the whole clock.
 */
const SWAP_MS = 320;

/**
 * Two presentations of the same five services, and only one is ever mounted to
 * the eye at a time:
 *
 *  - desktop: a numbered list on the left drives one large image and description
 *    on the right. Click, hover, or keyboard all select; nothing cycles on its own.
 *  - small screens: the cards become a native scroll-snap row with an `01 / 05`
 *    readout, so swiping works without a gesture handler — or any JS at all.
 *
 * The panels are stacked in a single grid cell (see `.svc-panel` in globals.css),
 * so the column is as tall as the largest panel and switching never reflows.
 *
 * Two things move on a change of service: one red indicator slides down the list to
 * the row being read, and the panels hand over. The indicator is a single element
 * measured against the live row rather than five that grow and shrink, so it
 * travels rather than jumping from one row to the next — which is the whole
 * difference between a list that reports a position and five rows that light up
 * independently.
 *
 * The hand-over is directional, and that is why the outgoing panel is tracked as
 * well as the incoming one: the one being left leaves upward (0 → -8px) while the
 * one being asked for arrives from below (8px → 0). Both carry their image and
 * their description together, so a service changes as one object rather than as a
 * picture and a paragraph moving separately.
 *
 * Selections arriving faster than a swap can finish are handled rather than
 * queued: only ever one panel holds `data-leaving`, and `data-quick` cuts the
 * panels being left behind instead of fading them, so a pointer swept down the
 * list never leaves four panels dissolving at once and the list still answers
 * every single selection immediately.
 */
export function ServiceExplorer({ items }: { items: Service[] }) {
  const [active, setActive] = useState(0);
  /** The panel being left, for the length of one swap. Null while at rest. */
  const [leaving, setLeaving] = useState<number | null>(null);
  const [visible, setVisible] = useState(0);
  /** Measured position of the active row. Null until the list has been read. */
  const [marker, setMarker] = useState<{ top: number; height: number } | null>(null);
  const [quick, setQuick] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const frame = useRef(0);
  const changedAt = useRef(0);
  const quickTimer = useRef(0);
  const leaveTimer = useRef(0);
  /** The selection as the handler sees it, so the comparison needs no re-render. */
  const activeRef = useRef(0);
  /**
   * Whether the panel stack is the presentation in use. It decides one thing only:
   * whether the five panel photographs are worth fetching. They are laid out from
   * the first paint, so a lazy image waits for the section to be scrolled to and
   * the first click after arriving can land on a frame that has not decoded — but
   * below `lg` the stack is `display: none`, where an eager image would be five
   * downloads for a layout nobody is looking at.
   */
  const [stacked, setStacked] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const read = () => setStacked(query.matches);
    read();
    query.addEventListener("change", read);
    return () => query.removeEventListener("change", read);
  }, []);

  /**
   * Every selection goes through here, whatever asked for it — click, hover, focus
   * or arrow key. It names the panel being left as well as the one being asked for,
   * and records how long ago the last change was, which is what tells the stack
   * whether it is being driven or swept.
   */
  const select = useCallback((index: number) => {
    if (activeRef.current === index) return;

    const previous = activeRef.current;
    activeRef.current = index;

    const now = performance.now();
    const rapid = now - changedAt.current < SWAP_MS;
    changedAt.current = now;

    setActive(index);
    setQuick(rapid);
    // Naming a new outgoing panel releases the last one, so there is never more
    // than one panel on its way out however fast the list is being swept.
    setLeaving(previous);

    window.clearTimeout(quickTimer.current);
    if (rapid) {
      quickTimer.current = window.setTimeout(() => setQuick(false), SWAP_MS + 20);
    }

    window.clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => setLeaving(null), SWAP_MS);
  }, []);

  // Where the indicator has to be. Re-read whenever the selection moves and
  // whenever the list changes size — a wrapped title or a late font both change a
  // row's height, and an indicator measured once would then sit off its row.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      // The rows are the buttons themselves, and they are offset against the list,
      // which is the positioned ancestor the indicator is placed in too.
      const row = list.querySelectorAll("button")[active];
      if (!row) return;
      setMarker({ top: row.offsetTop, height: row.offsetHeight });
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, [active]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: items.length - 1,
    };

    const next = moves[event.key];
    if (next === undefined) return;

    event.preventDefault();
    const bounded = Math.min(Math.max(next, 0), items.length - 1);
    select(bounded);
    listRef.current?.querySelectorAll("button")[bounded]?.focus();
  };

  // Which card the scroller has settled on. Measured against the live rects rather
  // than `offsetLeft`, which is relative to an offset parent that may not be the
  // scroller itself.
  const onScroll = () => {
    if (frame.current) return;
    frame.current = window.requestAnimationFrame(() => {
      frame.current = 0;
      const scroller = scrollerRef.current;
      if (!scroller) return;

      const bounds = scroller.getBoundingClientRect();
      const middle = bounds.left + bounds.width / 2;
      let nearest = 0;
      let shortest = Infinity;

      Array.from(scroller.children).forEach((child, index) => {
        const rect = child.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - middle);
        if (distance < shortest) {
          shortest = distance;
          nearest = index;
        }
      });

      setVisible(nearest);
    });
  };

  useEffect(
    () => () => {
      if (frame.current) window.cancelAnimationFrame(frame.current);
      window.clearTimeout(quickTimer.current);
      window.clearTimeout(leaveTimer.current);
    },
    [],
  );

  return (
    <>
      {/* ---------- Desktop: numbered list + one large panel ---------- */}
      {/* `items-start`, not `items-center`: the media has to begin on the same line
          as the first service row. Centred, the panel column — which is taller than
          the five rows — started above the list and the section read as two blocks
          that had missed each other. */}
      {/* `items`, so the host itself never dims: the entrance here is the plate's
          mask being drawn back, and a column of live tabs fading in behind it
          would only add a second thing happening. */}
      <Reveal
        items
        className="hidden lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-14"
      >
        <div
          ref={listRef}
          role="tablist"
          aria-orientation="vertical"
          aria-label="Services"
          className="relative"
        >
          {/* The red edge indicator: one element for the whole list, slid to the row
              being read. Held at zero opacity until the list has actually been
              measured, so it is never briefly drawn on the wrong row. */}
          <span
            aria-hidden="true"
            style={marker ? { height: marker.height, transform: `translateY(${marker.top}px)` } : undefined}
            className={cn(
              "absolute left-0 top-0 w-[3px] rounded-full bg-red transition-[transform,height,opacity] duration-[280ms] ease-out",
              marker ? "opacity-100" : "opacity-0",
            )}
          />

          {items.map((service, index) => {
            const Icon = icons[service.icon];
            const current = index === active;

            return (
              // The button is the row: the tablist owns its tabs directly, with no
              // wrapper in between, and the indicator measures the same box the
              // pointer and the keyboard land on. py-5 on a 34px content row puts
              // every target comfortably past 44px.
              <button
                key={service.id}
                type="button"
                role="tab"
                id={`service-tab-${service.id}`}
                aria-controls={`service-panel-${service.id}`}
                aria-selected={current}
                tabIndex={current ? 0 : -1}
                onClick={() => select(index)}
                onMouseEnter={() => select(index)}
                onFocus={() => select(index)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={cn(
                  "relative flex w-full items-center gap-5 border-t border-line py-5 pl-5 pr-4 text-left transition-colors duration-[280ms] ease-out last:border-b",
                  // Barely there on purpose: the row is named by its number, its
                  // title, its icon and the red edge, so the ground only has to
                  // confirm them. Anything stronger flashes as the pointer crosses.
                  current ? "bg-navy-tint/50" : "hover:bg-navy-tint/25",
                )}
              >
                <span
                  className={cn(
                    "font-sans text-[0.7rem] font-medium tracking-[0.18em] transition-colors duration-[280ms] ease-out",
                    current ? "text-red" : "text-muted",
                  )}
                >
                  {service.number}
                </span>

                <span
                  className={cn(
                    "font-serif text-[1.4rem] leading-snug transition-colors duration-[280ms] ease-out",
                    current ? "text-ink" : "text-muted",
                  )}
                >
                  {service.title}
                </span>

                <span
                  aria-hidden="true"
                  className={cn(
                    "ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-[280ms] ease-out",
                    current ? "bg-red-tint text-red" : "text-muted/50",
                  )}
                >
                  <Icon size={17} />
                </span>
              </button>
            );
          })}
        </div>

        <div className="svc-stack grid" data-quick={quick ? "true" : "false"}>
          {items.map((service, index) => (
            <div
              key={service.id}
              role="tabpanel"
              id={`service-panel-${service.id}`}
              aria-labelledby={`service-tab-${service.id}`}
              data-active={index === active ? "true" : "false"}
              data-leaving={index === leaving ? "true" : "false"}
              className="svc-panel"
            >
              {/* Fetched as soon as the stack is the layout in use rather than when
                  the section is scrolled to, so no click ever lands on a frame that
                  has not decoded. `eager` and not `priority`: they start early but
                  never outrank the hero photograph. */}
              <div className="clip-in-right">
                <Media
                  src={service.image.src}
                  alt={service.image.alt}
                  ratio="card"
                  eager={stacked}
                  parallax={10}
                  sizes="(min-width: 1024px) 52vw, 92vw"
                />
              </div>
              <p className="mt-6 max-w-xl text-[1.02rem] leading-relaxed text-muted">
                {service.body}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ---------- Small screens: scroll-snap cards ---------- */}
      <div className="lg:hidden">
        <ul
          ref={scrollerRef}
          onScroll={onScroll}
          className="svc-scroller -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8"
        >
          {items.map((service) => {
            const Icon = icons[service.icon];

            return (
              <li
                key={service.id}
                className="w-[82%] shrink-0 snap-center sm:w-[58%]"
                aria-label={`${service.number} of ${pad(items.length)}`}
              >
                {/* The card carries the radius and the clip; the photograph inside it
                    is square-framed so the two cannot disagree about the corner. */}
                <article className="flex h-full flex-col overflow-hidden rounded-[7px] border border-line bg-white">
                  <Media
                    src={service.image.src}
                    alt={service.image.alt}
                    ratio="card"
                    frame="square"
                    sizes="(min-width: 640px) 58vw, 82vw"
                  />

                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-tint text-red">
                        <Icon size={17} aria-hidden="true" />
                      </span>
                      <span className="font-sans text-[0.7rem] font-medium tracking-[0.18em] text-muted">
                        {service.number}
                      </span>
                    </div>

                    <h3 className="mt-4 text-[1.4rem] leading-snug text-ink">{service.title}</h3>
                    <p className="mt-2.5 text-[0.95rem] leading-relaxed text-muted">
                      {service.body}
                    </p>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        {/* Hidden without JS, where it could only ever report the first card. */}
        <p className="svc-counter mt-5 items-center gap-4" aria-live="polite">
          <span className="font-sans text-[0.72rem] font-medium tracking-[0.18em] text-muted">
            <span className="text-ink">{pad(visible + 1)}</span> / {pad(items.length)}
          </span>
          <span aria-hidden="true" className="h-px flex-1 overflow-hidden bg-line">
            <span
              className="block h-full rounded-full bg-red transition-[width] duration-300 ease-out"
              style={{ width: `${((visible + 1) / items.length) * 100}%` }}
            />
          </span>
        </p>
      </div>
    </>
  );
}
