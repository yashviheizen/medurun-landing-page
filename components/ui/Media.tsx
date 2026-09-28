import Image from "next/image";
import { ParallaxLayer } from "@/components/ui/ParallaxLayer";
import { cn } from "@/lib/cn";

/**
 * The single photo frame used across the page. Every photograph goes through
 * here so radius, crop, and colour treatment stay identical everywhere.
 *
 * Ratios are a fixed set, one per role:
 *   editorial — hero, about, partner panels
 *   card      — the service card grid
 *   plate     — the full-width About photograph
 */
const ratios = {
  editorial: "aspect-[4/3]",
  card: "aspect-[16/10]",
  /**
   * The full-bleed plate. It opens up as the column widens rather than holding
   * one ratio: at phone width a 21/9 slice of a street scene is a letterbox with
   * nothing in it, and at desktop width a 4/3 plate is a wall. Three steps keep
   * the subject roughly the same size on the page at every breakpoint — 3/2 while
   * the column is a phone's width, 16/9 once it is a tablet's, and the full
   * cinematic slice only where the column is wide enough to carry it.
   *
   * 3/2 rather than 4/3 at the narrow end because that is the native ratio of the
   * photography this frame carries: across the full width of a phone's column the
   * plate then shows the whole frame the photographer composed, cropped by nothing
   * but the plate's own couple of percent of parallax overscale. A 4/3 box at the
   * same width has to cut a third of the scene away to fill itself, and what it
   * cuts is the sides — which on a street photograph is the street.
   */
  plate: "aspect-[3/2] sm:aspect-[16/9] lg:aspect-[21/9]",
} as const;

export type MediaRatio = keyof typeof ratios;

/**
 * Frames come in two kinds. `square` is the editorial default for the page's big
 * photographs — a cut edge reads as a plate on a page rather than one more card;
 * `soft` is the service explorer's frame, and it is only just rounded. 7px is a
 * cut corner rather than a radius: it reads as a printed plate whose edge has been
 * eased, where the old 16px read as an app card sitting on the page. The same
 * number carries the mobile service cards, so the section has one edge language.
 */
const frames = {
  soft: "rounded-[7px]",
  square: "rounded-none",
} as const;

export type MediaFrame = keyof typeof frames;

/**
 * Where the crop holds as the frame's ratio changes. A named set rather than an
 * arbitrary class, because `cn` is a plain join: two object-position utilities
 * layered on the same element would both be emitted and the later one in the
 * stylesheet — not the later one in the class list — would win.
 */
const focals = {
  center: "object-center",
  /** Keeps a vehicle's body in frame when the plate flattens to a wide slice. */
  vehicle: "object-[50%_58%]",
  upper: "object-[50%_35%]",
} as const;

export type MediaFocus = keyof typeof focals;

export function Media({
  src,
  alt,
  ratio = "editorial",
  frame = "soft",
  focus = "center",
  sizes,
  priority = false,
  eager = false,
  parallax = 0,
  zoom = false,
  className,
  children,
}: {
  src: string;
  alt: string;
  ratio?: MediaRatio;
  frame?: MediaFrame;
  focus?: MediaFocus;
  sizes: string;
  priority?: boolean;
  /**
   * Fetch on load rather than on approach, without claiming the priority the hero
   * photograph holds. For photographs that are already laid out but not yet shown —
   * the service explorer's five stacked panels — where waiting for the viewport
   * means the first click after arriving lands on a frame that has not decoded yet.
   */
  eager?: boolean;
  /**
   * Drift the photograph a few pixels against the page as its frame is read,
   * desktop only. The number is the total travel across the whole pass; the
   * overscale that gives it somewhere to go is applied at every setting, reduced
   * motion included, so the crop everybody sees is the same one.
   */
  parallax?: number;
  zoom?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const photo = (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      loading={priority ? undefined : eager ? "eager" : "lazy"}
      // One colour treatment for every photo: slightly pulled-back saturation
      // and a touch of contrast, so warm and cool stock sits together.
      className={cn(
        "object-cover saturate-[0.9] contrast-[1.04]",
        focals[focus],
        zoom && "transition-transform duration-500 motion-safe:group-hover:scale-[1.03]",
      )}
    />
  );

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-navy-tint",
        frames[frame],
        ratios[ratio],
        className,
      )}
    >
      {parallax > 0 ? (
        <ParallaxLayer travel={parallax} className="media-shift absolute inset-0">
          {photo}
        </ParallaxLayer>
      ) : (
        photo
      )}
      {/* Shared unifying scrim — navy, and light enough to leave the photo readable. */}
      <div aria-hidden="true" className="absolute inset-0 bg-navy-ink/[0.06]" />
      {children}
    </div>
  );
}
