import { Reveal } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";

const tones = {
  light: "bg-white text-ink",
  paper: "bg-paper text-ink",
  deep: "on-dark bg-navy-deep text-white",
  dark: "on-dark bg-navy-ink text-white",
} as const;

export type SectionTone = keyof typeof tones;

/**
 * The red signal line. One hairline in the left gutter, at the same offset in
 * every band, so the sections read as stations on a single line rather than a
 * stack of unrelated blocks. It sits inside a nested shell so it tracks the
 * content column exactly, and spans the section's full height — padding included
 * — so there is no break where one band meets the next.
 *
 * Gutter-only, from large screens up: at narrow widths there is no room beside
 * the text, and the tick on each operational label carries the same idea.
 */
export function SignalRail({ tone = "light" }: { tone?: SectionTone }) {
  const dark = tone === "dark" || tone === "deep";

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
      <div className="shell relative h-full">
        <span
          className={cn(
            "absolute inset-y-0 left-1.5 w-px",
            dark ? "bg-red/40" : "bg-red/25",
          )}
        />
      </div>
    </div>
  );
}

export function Section({
  id,
  className,
  children,
  tone = "light",
  rail = true,
  texture = false,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
  tone?: SectionTone;
  /** Off for bands that are their own closing statement and end the line. */
  rail?: boolean;
  /** Lays the control-room plotting grid under the band. */
  texture?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn("relative py-16 sm:py-20 lg:py-24", tones[tone], className)}
    >
      {texture ? (
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0",
            tone === "dark" || tone === "deep" ? "grid-field" : "grid-field grid-field-light",
          )}
        />
      ) : null}
      {rail ? <SignalRail tone={tone} /> : null}
      <div className="shell relative">{children}</div>
    </section>
  );
}

/**
 * The beat between one line of a section opening and the next. At 90ms the order
 * was there but only just; 110ms is the point where a reader actually sees the
 * number land before the headline does, and three lines still put the whole header
 * on the frame inside its own 720ms transition rather than turning into a queue.
 */
const STEP = 110;

/**
 * Every band opens the same way: a numbered operational label hung off the signal
 * rail, then an editorial headline. No container, no card — the rules and the
 * whitespace do the separating.
 *
 * The header is itself the reveal host and its three lines carry the stagger, so
 * every section on the page opens the same way for the same reason it looks the
 * same: there is one of it, here.
 */
export function SectionHeading({
  index,
  eyebrow,
  title,
  body,
  align = "left",
  tone = "light",
  className,
}: {
  /** Two-digit station number, e.g. "03". */
  index?: string;
  eyebrow: string;
  title: React.ReactNode;
  body?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
}) {
  return (
    <Reveal
      as="header"
      items
      className={cn("max-w-3xl", align === "center" && "mx-auto text-center", className)}
    >
      <p
        className={cn("stagger-up op-label", align === "left" && "op-label--rail")}
      >
        {index ? <span className="tabular-nums text-red">{index}</span> : null}
        <span>{eyebrow}</span>
      </p>

      <h2
        style={{ transitionDelay: `${STEP}ms` }}
        className={cn(
          "stagger-up mt-6 text-[2.1rem] leading-[1.08] sm:text-[2.7rem] lg:text-[3.15rem]",
          tone === "dark" ? "text-white" : "text-ink",
        )}
      >
        {title}
      </h2>

      {body ? (
        <p
          style={{ transitionDelay: `${STEP * 2}ms` }}
          className={cn(
            "stagger-up mt-5 max-w-xl text-base leading-relaxed sm:text-lg",
            tone === "dark" ? "text-white/70" : "text-muted",
          )}
        >
          {body}
        </p>
      ) : null}
    </Reveal>
  );
}
