import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Media } from "@/components/ui/Media";
import { Reveal } from "@/components/ui/Reveal";
import { SignalRail } from "@/components/ui/Section";
import { cn } from "@/lib/cn";

/** Stagger between the three operational metadata labels. */
const META_STEP = 60;

export type PartnerContent = {
  eyebrow: string;
  heading: string;
  body: string;
  points: readonly string[];
  /** Three operational conditions, set as one metadata line under the body. */
  meta: readonly string[];
  /** Label on the band's action. The action itself is always the contact email. */
  cta: string;
  contact: { label: string; address: string };
  image: { src: string; alt: string };
};

/**
 * The two partner bands are one spread read as two facing pages: the driver side on
 * white, the agency side on navy, each with its photograph bled off the outer edge
 * of the screen. No card, no radius — the tonal switch and the bleed do the work.
 *
 * Under the body each side carries one line of operational metadata — the three
 * conditions of working this way, set in the same letter-spaced caps as the page's
 * station labels. It is a readout, not a claim: no numbers, nothing to verify.
 *
 * Points are ruled rows rather than a bulleted list. Each band closes on one solid
 * action — the only filled shape besides the photograph — with the address kept
 * underneath it in plain text, so the mailbox is still readable, copyable and
 * usable by anyone who would rather not hand the click to their mail client.
 *
 * Both bands carry that action. They are a facing spread, and an action on only one
 * page does not read as emphasis, it reads as the other page being unfinished.
 *
 * On entry each photograph is wiped in from its own outer edge with a clip mask, and
 * the three metadata labels arrive 60ms apart, left to right, like a line being
 * typed. The body copy is not animated line by line: it is the thing being read.
 */
export function PartnerSection({
  id,
  index,
  content,
  imageSide = "right",
  tone = "light",
}: {
  id: string;
  /** Station number on the page's signal line, e.g. "04". */
  index?: string;
  content: PartnerContent;
  imageSide?: "left" | "right";
  tone?: "light" | "dark";
}) {
  const dark = tone === "dark";
  const left = imageSide === "left";

  return (
    <section
      id={id}
      className={cn(
        "relative overflow-hidden py-16 sm:py-20 lg:py-24",
        dark ? "on-dark bg-navy-ink text-white" : "bg-white text-ink",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0",
          dark ? "grid-field" : "grid-field grid-field-light",
        )}
      />
      <SignalRail tone={dark ? "dark" : "light"} />

      <div className="shell relative grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-x-12 lg:gap-y-0">
        <Reveal className={cn("lg:col-span-5", left ? "lg:col-start-8" : "lg:col-start-1")}>
          <p className={cn("op-label", !left && "op-label--rail")}>
            {index ? <span className="tabular-nums text-red">{index}</span> : null}
            <span>{content.eyebrow}</span>
          </p>

          <h2
            className={cn(
              "mt-6 text-[2rem] leading-[1.08] sm:text-[2.5rem] lg:text-[2.85rem]",
              dark ? "text-white" : "text-ink",
            )}
          >
            {content.heading}
          </h2>

          <p
            className={cn(
              "mt-5 max-w-lg text-base leading-relaxed sm:text-lg",
              dark ? "text-white/70" : "text-muted",
            )}
          >
            {content.body}
          </p>

          <ul
            className={cn(
              "mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-sans text-[0.625rem] font-medium uppercase leading-none tracking-[0.18em]",
              dark ? "text-white/65" : "text-muted",
            )}
          >
            {content.meta.map((item, position) => (
              <li
                key={item}
                style={{ transitionDelay: `${position * META_STEP}ms` }}
                className="op-stagger flex items-center gap-3"
              >
                {position > 0 ? (
                  <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-red" />
                ) : null}
                {item}
              </li>
            ))}
          </ul>

          <ul className="mt-8">
            {content.points.map((point) => (
              <li
                key={point}
                className={cn(
                  "flex items-start gap-3.5 border-t py-4 last:border-b",
                  dark ? "border-white/15" : "border-line",
                )}
              >
                <Check
                  size={14}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-red"
                />
                <span className={cn("text-[0.95rem] leading-relaxed", dark ? "text-white/85" : "text-ink")}>
                  {point}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <Button href={`mailto:${content.contact.address}`} variant={dark ? "ghost" : "primary"}>
              {content.cta}
              <ArrowUpRight size={15} strokeWidth={2} aria-hidden="true" className="shrink-0" />
            </Button>

            <p className={cn("mt-5 text-[0.9rem]", dark ? "text-white/60" : "text-muted")}>
              <span className="uppercase tracking-[0.16em] text-[0.7rem]">
                {content.contact.label}
              </span>{" "}
              <a
                href={`mailto:${content.contact.address}`}
                className={cn(
                  "border-b transition-colors duration-300 hover:border-red hover:text-red",
                  dark ? "border-white/30 text-white/85" : "border-navy/25 text-navy-deep",
                )}
              >
                {content.contact.address}
              </a>
            </p>
          </div>
        </Reveal>

        <Reveal
          delay={60}
          className={cn(
            "lg:col-span-6",
            // Only the right-hand plate bleeds: on the left the signal rail runs
            // down the gutter, and a photograph crossing it breaks the line.
            left ? "lg:col-start-1 lg:row-start-1" : "lg:col-start-7 lg:-mr-10 xl:-mr-14",
          )}
        >
          <figure className="relative">
            {/* The two bands open from their own outer edge — the driver plate from the
                left, the agency plate from the right — so the spread reads as two
                pages opening outward rather than two copies of one effect. */}
            <div className={left ? "clip-in-right" : "clip-in-left"}>
              <Media
                src={content.image.src}
                alt={content.image.alt}
                ratio="editorial"
                frame="square"
                sizes="(min-width: 1024px) 52vw, 92vw"
              />
            </div>
            {/* A single corner tick: the operational marker that replaces the card
                border the frame used to carry. */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute h-6 w-px bg-red",
                left ? "-bottom-3 right-0" : "-top-3 left-0",
              )}
            />
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
