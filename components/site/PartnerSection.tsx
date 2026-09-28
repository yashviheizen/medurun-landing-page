import { ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Media } from "@/components/ui/Media";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { Reveal } from "@/components/ui/Reveal";
import { SignalRail } from "@/components/ui/Section";
import { cn } from "@/lib/cn";

/**
 * The beat between the lines of a partner column opening: label, headline,
 * sentence, points, action. The same 110ms `SectionHeading` uses — this column is
 * a section opening and should read as one, and with the metadata line no longer
 * taking beats of its own there is room for the full interval.
 */
const LINE_STEP = 110;

/**
 * The metadata line is a footnote to the sentence above it rather than a line of
 * its own, so it follows half a beat behind that sentence and all three conditions
 * travel together. They used to arrive one at a time, 60ms apart, which announced
 * three separate things where there is one fact in three parts.
 */
const META_DELAY = LINE_STEP * 2 + 55;

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
 * On entry each photograph is wiped in from its own outer edge with a clip mask, the
 * column's lines arrive in reading order 70ms apart, and the three metadata labels
 * type out 60ms apart behind the sentence they belong to. The body copy is not
 * animated line by line: it is the thing being read.
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
        {/* `items`: the column's own lines carry the entrance, so the label, the
            headline, the sentence and the action arrive in that order instead of
            the whole page of copy appearing at once. The host is the existing
            column — wrapping each line would put new margin-collapse boundaries
            through spacing that is tuned to the pixel. */}
        <Reveal items className={cn("lg:col-span-5", left ? "lg:col-start-8" : "lg:col-start-1")}>
          <p className={cn("stagger-up op-label", !left && "op-label--rail")}>
            {index ? <span className="tabular-nums text-red">{index}</span> : null}
            <span>{content.eyebrow}</span>
          </p>

          <h2
            style={{ transitionDelay: `${LINE_STEP}ms` }}
            className={cn(
              "stagger-up mt-6 text-[2rem] leading-[1.08] sm:text-[2.5rem] lg:text-[2.85rem]",
              dark ? "text-white" : "text-ink",
            )}
          >
            {content.heading}
          </h2>

          <p
            style={{ transitionDelay: `${LINE_STEP * 2}ms` }}
            className={cn(
              "stagger-up mt-5 max-w-lg text-base leading-relaxed sm:text-lg",
              dark ? "text-white/70" : "text-muted",
            )}
          >
            {content.body}
          </p>

          <ul
            style={{ transitionDelay: `${META_DELAY}ms` }}
            className={cn(
              "op-stagger mt-6 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-sans text-[0.625rem] font-medium uppercase leading-none tracking-[0.18em]",
              dark ? "text-white/65" : "text-muted",
            )}
          >
            {content.meta.map((item, position) => (
              <li key={item} className="flex items-center gap-3">
                {position > 0 ? (
                  <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-red" />
                ) : null}
                {item}
              </li>
            ))}
          </ul>

          <ul className="stagger-up mt-8" style={{ transitionDelay: `${LINE_STEP * 3}ms` }}>
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

          <div className="stagger-up mt-9" style={{ transitionDelay: `${LINE_STEP * 4}ms` }}>
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
            {/* Both plates open the same way — uncovered from the top edge as they
                rise — rather than mirroring each other left and right. The two
                bands sit one above the other on the page, so a reader meets them
                in sequence, not side by side: giving them opposite directions
                made the second one read as a correction of the first. */}
            <ImageReveal>
              <Media
                src={content.image.src}
                alt={content.image.alt}
                ratio="editorial"
                frame="square"
                parallax={10}
                sizes="(min-width: 1024px) 52vw, 92vw"
              />
            </ImageReveal>
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
