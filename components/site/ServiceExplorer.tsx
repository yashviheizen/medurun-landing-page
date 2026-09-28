"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Ambulance,
  ArrowLeftRight,
  HeartPulse,
  Network,
  Route,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Media } from "@/components/ui/Media";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { clamp, onPinned, onScroll, pinnedAt } from "@/lib/motion";
import { servicesClose, type Service } from "@/data/site";

const icons: Record<Service["icon"], LucideIcon> = {
  ambulance: Ambulance,
  transfer: ArrowLeftRight,
  assistance: HeartPulse,
  logistics: Route,
  agency: Network,
};

const pad = (value: number) => String(value).padStart(2, "0");

/* ---------------------------------------------------------------------------
   The pinned gallery's timetable, in shares of the track's travel.

     0.00 → 0.07   the ground darkens and the split-screen assembles
     0.07 → 0.74   the five services, one after the other
     0.74 → 0.96   the dark gallery opens back out into the light layout
     0.96 → 1.00   the light layout holds while the stage lets go

   380vh of track against a 100vh stage is 280vh of travel, so the walk is a little
   under 38vh per service — close to the Voices deck's step, which is the one other
   sequence on this page a reader crosses in the same session.

   Nothing here is a duration. Every number below is a position on the track, which
   is what makes scrolling back up the same function read in the other direction
   rather than an animation replayed backwards.
   --------------------------------------------------------------------------- */
const LEAD = 0.07;
const WALK_TO = 0.74;
const OPEN_TO = 0.96;

/**
 * The share of each service's step spent holding it still. Without it the gallery
 * is always between two services and never on one; with it each service is squarely
 * on screen for the first and last fifth of its turn and the change happens quickly
 * in between — which is also what keeps the wipe reading as one edge crossing the
 * frame rather than as a permanent dissolve.
 */
const DWELL = 0.2;

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Where on the track a given service is exactly centred. */
const spotOf = (index: number, count: number) =>
  LEAD + (WALK_TO - LEAD) * (index / Math.max(count - 1, 1));

/* ---------------------------------------------------------------------------
   The two grounds, and the four colours that cross between them.

   The gallery is the same markup on navy as it is on paper: one set of rows, one
   heading, one paragraph. What changes is four colours, and they are interpolated
   per frame rather than switched, because the ground behind them is itself a fade —
   a hard swap anywhere in the middle of it is the one frame a reader would notice.
   --------------------------------------------------------------------------- */
type Ink = readonly [number, number, number, number];

const INK: Ink = [11, 11, 11, 1];
const WHITE: Ink = [255, 255, 255, 1];
const MUTED: Ink = [91, 97, 114, 1];
const WHITE_DIM: Ink = [255, 255, 255, 0.66];
const LINE: Ink = [228, 230, 237, 1];
const LINE_DARK: Ink = [255, 255, 255, 0.16];
const FACE: Ink = [255, 255, 255, 0];
const FACE_DARK: Ink = [255, 255, 255, 0.05];

const blend = (a: Ink, b: Ink, t: number) =>
  `rgba(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(
    a[1] + (b[1] - a[1]) * t,
  )}, ${Math.round(a[2] + (b[2] - a[2]) * t)}, ${(a[3] + (b[3] - a[3]) * t).toFixed(3)})`;

/** Custom properties the stage carries only while the gallery is running. */
const STAGE_VARS = [
  "--svc-enter",
  "--svc-open",
  "--svc-dark",
  "--svc-p",
  "--svc-fg",
  "--svc-dim",
  "--svc-line",
  "--svc-face",
  "--svc-bleed-l",
  "--svc-bleed-r",
] as const;

/**
 * Two presentations of the same five services, and only one of them is ever mounted.
 *
 *  - On a desktop frame wide enough to pin, and for a reader who has not asked for
 *    less motion, the section is a split-screen gallery: one large photograph on the
 *    left, a vertical track of five previews on the right, and the page's own scroll
 *    position walking both through the five services. The active preview is held in
 *    the middle of its window, lit in MEDURUN red and scaled a little up; the ones
 *    either side of it are dimmed and scaled a little down. The photograph changes
 *    by being uncovered rather than by being replaced — a vertical clip opens the
 *    incoming frame downward over the outgoing one while a shorter crossfade and a
 *    1.04 → 1 settle run underneath it, so there is never a frame with no picture on
 *    it and never a cut.
 *
 *    After the fifth service the gallery gives the screen back: the navy drains out
 *    of the ground, the preview track eases from "one centred" to "all five", the
 *    thumbnails fold away and what is left is the page's ordinary light layout — the
 *    photograph still on the left, the five service names as a list on the right with
 *    the open one's description and a link under it. The stage then simply unpins
 *    into Driver Partner, on paper, with nothing to hand over.
 *
 *  - Everywhere else — phones, tablets, `prefers-reduced-motion`, and with scripting
 *    off at any width — the section is a native scroll-snap row of five cards, each
 *    carrying its own number, title, description and photograph. No gesture handler,
 *    no pinning, and nothing in it needs JavaScript except the `01 / 05` readout,
 *    which is the only thing hidden without it.
 *
 * The gallery's photographs are mounted only for the presentation that uses them:
 * `pinned` is false on the server and on first paint, so a phone never downloads the
 * five large plates and the five thumbnails for a layout it will not be shown.
 *
 * While the stage is pinned the scroll position *is* the selection, so choosing a
 * service is a scroll to its place on the track rather than a state change — the same
 * thing `HowItWorks` and the Voices deck do, and for the same reason: two authors of
 * one highlight is a highlight that fights the wheel.
 */
export function ServiceExplorer({ items }: { items: Service[] }) {
  const total = items.length;

  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(0);
  /** Whether the pinned gallery is the presentation in use. False until mount. */
  const [pinned, setPinned] = useState(false);
  /**
   * The closing light layout has begun. It gates one thing only — whether the
   * closing link is in the document — because a link faded to nothing is still a
   * tab stop, and a tab stop that scrolls the reader to Contact from the middle of
   * a gallery is worse than one that is not there yet.
   */
  const [closing, setClosing] = useState(false);

  const galleryRef = useRef<HTMLDivElement>(null);
  const winRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const shots = useRef<(HTMLDivElement | null)[]>([]);
  const zooms = useRef<(HTMLDivElement | null)[]>([]);
  const rows = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const frame = useRef(0);
  /** The selection as the scroll handler sees it, so comparing costs no render. */
  const current = useRef(0);
  const closingRef = useRef(false);
  /**
   * Set while the stage is pinned: scroll to a service's place on the track. Null
   * otherwise, which is also how `choose` knows which of the two kinds of selection
   * it is making, so there is one source of truth for it rather than two.
   */
  const scrollToService = useRef<((index: number) => void) | null>(null);

  useEffect(() => onPinned(setPinned), []);

  /**
   * The scroll story, and the whole of the desktop sequence.
   *
   * One subscription on the page's shared clock. Everything it writes is a function
   * of `pinnedAt` — no accumulation, no chased targets, no timers — which is what
   * makes the reverse exact: scrolling up is the same arithmetic read backwards, and
   * a resize, an anchor jump or a reload halfway down the track all land on the same
   * frame the wheel would have.
   *
   * It runs only once the gallery is mounted, because the gallery is only mounted
   * once the media query says it is the layout in use.
   */
  useEffect(() => {
    if (!pinned) return;

    const gallery = galleryRef.current;
    const win = winRef.current;
    const rail = railRef.current;
    if (!gallery || !win || !rail) return;

    const track = gallery.closest<HTMLElement>(".svc-track");
    const stage = gallery.closest<HTMLElement>(".svc-stage");
    if (!track || !stage) return;

    // The three node lists this effect writes inline styles on, held as the arrays
    // themselves rather than as `.current` reads. Each ref keeps one array for the
    // gallery's whole life and the element callbacks fill it by index, so holding it
    // here is the same list the cleanup has to wipe — and it is a value the cleanup
    // closed over rather than a ref it reaches into after the fact.
    const painted: (HTMLElement | null)[][] = [shots.current, zooms.current, rows.current];

    /**
     * A service is a scroll position while the stage is pinned, so selecting one is
     * a scroll to the point on the track where it is exactly centred. Measured at
     * the moment of the click rather than cached: the offset is the stage's own
     * `top` and the travel is the track's height less the stage's, both of which a
     * resize changes.
     */
    scrollToService.current = (index) => {
      const offset = parseFloat(window.getComputedStyle(stage).top) || 0;
      const travel = Math.max(track.offsetHeight - stage.offsetHeight, 1);
      const top =
        track.getBoundingClientRect().top +
        window.scrollY -
        offset +
        spotOf(index, total) * travel;
      window.scrollTo({ top: Math.round(top), behavior: "smooth" });
    };

    const off = onScroll(() => {
      const at = pinnedAt(track, stage);

      // The gallery arriving, the five services, and the gallery leaving. The three
      // phases are read separately and only meet in `dark`, which is the ground.
      const enter = smooth(clamp(at / LEAD));
      const open = smooth(clamp((at - WALK_TO) / (OPEN_TO - WALK_TO)));
      const dark = Math.min(enter, 1 - open);

      // Dwell-and-cross: hold each service still for DWELL at either end of its
      // step, and cross quickly through the middle.
      const reach = clamp((at - LEAD) / (WALK_TO - LEAD));
      const ride = reach * (total - 1);
      const whole = Math.floor(Math.min(ride, total - 1.0001));
      const live = whole + smooth(clamp((ride - whole - DWELL) / (1 - DWELL * 2)));

      stage.dataset.open = open > 0.02 ? "true" : "false";
      stage.style.setProperty("--svc-enter", enter.toFixed(4));
      stage.style.setProperty("--svc-open", open.toFixed(4));
      stage.style.setProperty("--svc-dark", dark.toFixed(4));
      stage.style.setProperty("--svc-p", (live / Math.max(total - 1, 1)).toFixed(4));
      stage.style.setProperty("--svc-fg", blend(INK, WHITE, dark));
      stage.style.setProperty("--svc-dim", blend(MUTED, WHITE_DIM, dark));
      stage.style.setProperty("--svc-line", blend(LINE, LINE_DARK, dark));
      stage.style.setProperty("--svc-face", blend(FACE, FACE_DARK, dark));

      // The ground, stretched from the content column out to the window's own
      // edges. A sticky stage's rect *is* the screen below the header, so the two
      // insets below are exactly the shell's gutters, whatever the shell is doing.
      const box = stage.getBoundingClientRect();
      stage.style.setProperty("--svc-bleed-l", `${(-box.left).toFixed(1)}px`);
      stage.style.setProperty(
        "--svc-bleed-r",
        `${(box.right - window.innerWidth).toFixed(1)}px`,
      );

      /* The photograph. Every frame is uncovered downward over the one before it and
         the stack is drawn in order, so whatever is above is what is seen and there
         is always a finished picture underneath — which is the whole of "no abrupt
         switching and no visible flash". The first frame is never clipped: it is the
         floor the other four are drawn on.

         The wipe, the fade and the settle deliberately run on three different
         curves. The crossfade is done while the mask is still travelling, so what
         the eye follows is the edge crossing the frame rather than a dissolve. */
      shots.current.forEach((shot, index) => {
        if (!shot) return;
        const t = index === 0 ? 1 : clamp(live - (index - 1));
        shot.style.clipPath = `inset(0 0 ${((1 - smooth(t)) * 100).toFixed(2)}% 0)`;
        shot.style.opacity = smooth(clamp(t / 0.7)).toFixed(4);
        const zoom = zooms.current[index];
        if (zoom) {
          zoom.style.transform = `scale(${(1.04 - 0.04 * smooth(clamp(t / 0.85))).toFixed(4)})`;
        }
      });

      /* The previews. Emphasis is a function of distance from the live service and
         of how far the closing layout has come: at the end every row is upright,
         unscaled and fully lit, because the light layout is a list of five services
         rather than a gallery with one of them open. */
      rows.current.forEach((row, index) => {
        if (!row) return;
        const away = Math.abs(index - live);
        const near = clamp(1 - away);
        const lift = (0.03 * near - 0.05 * Math.min(away, 2)) * (1 - open);
        const base = Math.max(0.3, 1 - Math.min(away, 3) * 0.34);
        row.style.transform = `scale(${(1 + lift).toFixed(4)})`;
        row.style.opacity = (base + (1 - base) * open).toFixed(4);
        row.style.setProperty("--near", near.toFixed(4));
        row.style.zIndex = String(10 + Math.round(near * 10));
      });

      /* Where the track has to sit. Two answers, crossfaded by `open`: the live
         service centred in its window, and — once the gallery is giving the screen
         back — the whole list centred in it. Both are measured off the rows
         themselves rather than computed from a row height, because the rows close
         their gaps as the list forms and a number would have to know that. */
      const lo = Math.max(0, Math.min(Math.floor(live), total - 1));
      const hi = Math.min(lo + 1, total - 1);
      const mid = (el: HTMLElement | null) =>
        el ? el.offsetTop + el.offsetHeight / 2 : 0;
      const aim = mid(rows.current[lo]) + (mid(rows.current[hi]) - mid(rows.current[lo])) * (live - lo);
      const centred = win.clientHeight / 2 - aim;
      const listed = (win.clientHeight - rail.offsetHeight) / 2;
      rail.style.transform = `translate3d(0, ${(centred + (listed - centred) * open).toFixed(1)}px, 0)`;

      const shown = Math.max(0, Math.min(Math.round(live), total - 1));
      if (shown !== current.current) {
        current.current = shown;
        setActive(shown);
      }

      const near = open > 0.01;
      if (near !== closingRef.current) {
        closingRef.current = near;
        setClosing(near);
      }
    });

    return () => {
      off();
      scrollToService.current = null;
      delete stage.dataset.open;
      for (const name of STAGE_VARS) stage.style.removeProperty(name);
      for (const list of painted) {
        for (const node of list) if (node) node.style.cssText = "";
      }
      rail.style.transform = "";
    };
  }, [pinned, total]);

  /**
   * A deliberate selection — a click, or an arrow key. A scroll to the service's
   * place on the track while the stage is pinned, and a plain state change wherever
   * it is not.
   */
  const choose = useCallback((index: number) => {
    const scroll = scrollToService.current;
    if (scroll) scroll(index);
    else setActive(index);
  }, []);

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const moves: Record<string, number> = {
      ArrowDown: index + 1,
      ArrowRight: index + 1,
      ArrowUp: index - 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: total - 1,
    };

    const next = moves[event.key];
    if (next === undefined) return;

    event.preventDefault();
    const bounded = Math.min(Math.max(next, 0), total - 1);
    choose(bounded);
    // The scroll is `choose`'s to make. Letting the browser also bring the row into
    // view would fight it on the same frame.
    rows.current[bounded]?.focus({ preventScroll: true });
  };

  // Which card the scroller has settled on. Measured against the live rects rather
  // than `offsetLeft`, which is relative to an offset parent that may not be the
  // scroller itself.
  const onCardScroll = () => {
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
    },
    [],
  );

  const open = items[active] ?? items[0];

  return (
    <>
      {/* ---------- Desktop: the pinned split-screen gallery ---------- */}
      {pinned ? (
        <div ref={galleryRef} className="svc-gallery">
          {/* Left: one photograph, five frames deep. They are stacked in one box and
              drawn in order — the frame being asked for is uncovered downward over
              the one before it, so the picture is never absent and never cut. */}
          <div className="svc-plate">
            {items.map((service, index) => (
              <div
                key={service.id}
                ref={(node) => {
                  shots.current[index] = node;
                }}
                aria-hidden={index !== active}
                className="svc-shot"
                style={{ zIndex: index }}
              >
                {/* The settle rides on its own element: `clip-path` is resolved in
                    the box's own coordinates and a transform on the same element
                    would drag the mask's edge along with the picture. */}
                <div
                  ref={(node) => {
                    zooms.current[index] = node;
                  }}
                  className="svc-zoom"
                >
                  <Image
                    src={service.image.src}
                    alt={service.image.alt}
                    fill
                    sizes="58vw"
                    loading="eager"
                    className="object-cover saturate-[0.9] contrast-[1.04]"
                  />
                </div>
              </div>
            ))}

            {/* Binds the photograph to the navy while there is navy to bind it to,
                and is gone by the time the ground is paper again. */}
            <span aria-hidden="true" className="svc-veil" />
          </div>

          {/* Right: the preview track, and under it whichever service it is on. */}
          <div className="svc-side">
            <div ref={winRef} className="svc-win">
              {/* The progress of the walk, as a height rather than a transition, so
                  it follows the finger exactly and retraces on the way back up. It
                  belongs to the gallery and fades with it: the light list that
                  replaces it carries its own red edge. */}
              <span aria-hidden="true" className="svc-meter">
                <span className="svc-fill" />
              </span>

              <div
                ref={railRef}
                role="tablist"
                aria-orientation="vertical"
                aria-label="Services"
                className="svc-rail"
              >
                {items.map((service, index) => {
                  const Icon = icons[service.icon];
                  const live = index === active;

                  return (
                    <button
                      key={service.id}
                      type="button"
                      role="tab"
                      id={`service-tab-${service.id}`}
                      aria-controls="service-detail"
                      aria-selected={live}
                      tabIndex={live ? 0 : -1}
                      ref={(node) => {
                        rows.current[index] = node;
                      }}
                      onClick={() => choose(index)}
                      onKeyDown={(event) => onKeyDown(event, index)}
                      data-live={live ? "true" : "false"}
                      className="svc-row"
                    >
                      <span aria-hidden="true" className="svc-edge" />

                      <span aria-hidden="true" className="svc-thumb">
                        <Image
                          src={service.image.src}
                          alt=""
                          fill
                          sizes="120px"
                          loading="eager"
                          className="object-cover saturate-[0.9] contrast-[1.04]"
                        />
                      </span>

                      <span className="svc-num">{service.number}</span>
                      <span className="svc-name">{service.title}</span>

                      <span aria-hidden="true" className="svc-ico">
                        <Icon size={16} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* The open service, directly under its preview. One element, not five:
                the paragraph is the panel the five tabs above control, and it is the
                same paragraph in the gallery and in the light list the gallery ends
                as — which is why the closing layout needs no second copy of it. */}
            <div
              id="service-detail"
              role="tabpanel"
              aria-labelledby={`service-tab-${open.id}`}
              aria-live="polite"
              className="svc-say"
            >
              <p key={open.id} className="svc-say-body">
                {open.body}
              </p>

              {closing ? (
                <p className="svc-cta">
                  <Button href={servicesClose.cta.href}>{servicesClose.cta.label}</Button>
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------- Everywhere else: scroll-snap cards ---------- */}
      <Reveal className="svc-cards">
        <ul
          ref={scrollerRef}
          onScroll={onCardScroll}
          className="svc-scroller -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-1 sm:-mx-8 sm:px-8"
        >
          {items.map((service) => {
            const Icon = icons[service.icon];

            return (
              <li
                key={service.id}
                className="w-[82%] shrink-0 snap-center sm:w-[58%] lg:w-[44%]"
                aria-label={`${service.number} of ${pad(total)}`}
              >
                {/* The card carries the radius and the clip; the photograph inside it
                    is square-framed so the two cannot disagree about the corner. */}
                <article className="flex h-full flex-col overflow-hidden rounded-[7px] border border-line bg-white">
                  <ImageReveal>
                    <Media
                      src={service.image.src}
                      alt={service.image.alt}
                      ratio="card"
                      frame="square"
                      sizes="(min-width: 1024px) 44vw, (min-width: 640px) 58vw, 82vw"
                    />
                  </ImageReveal>

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
        <p className={cn("svc-counter mt-5 items-center gap-4")} aria-live="polite">
          <span className="font-sans text-[0.72rem] font-medium tracking-[0.18em] text-muted">
            <span className="text-ink">{pad(visible + 1)}</span> / {pad(total)}
          </span>
          <span aria-hidden="true" className="h-px flex-1 overflow-hidden bg-line">
            <span
              className="block h-full rounded-full bg-red transition-[width] duration-300 ease-out"
              style={{ width: `${((visible + 1) / total) * 100}%` }}
            />
          </span>
        </p>
      </Reveal>
    </>
  );
}
