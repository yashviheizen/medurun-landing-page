import { Reveal } from "@/components/ui/Reveal";
import { SignalRail } from "@/components/ui/Section";
import { credibility } from "@/data/site";

/**
 * The operational status strip: one line of letter-spaced caps between the partner
 * spread and what follows, separated by red bullets. It replaced a three-column
 * availability row that took a full band to say three short things — at this size
 * the page reads it as a status bar, which is what it is, and the sections around
 * it get their emphasis back.
 *
 * No numbers are claimed. "24/7" is a schedule, not a metric.
 *
 * On phones the readings stack into a short ruled list rather than wrapping mid
 * phrase, and the bullets — which are decoration between items on one line, not
 * separators in a list — drop out with them.
 *
 * The strip opens on one slow red light. It is the page's only continuous motion,
 * and it is here because this is the one band that reports a live state: a status
 * bar that says "24/7 ACTIVE" in a completely static row is reporting a claim
 * rather than a state. One ring, 2.8 seconds, `motion-safe` only.
 */
export function CredibilityStrip() {
  return (
    <section id="stats" className="relative border-y border-line bg-white py-4 sm:py-6">
      {/* The rail continues through the strip: it is a thin band, but the page's
          signal line does not stop at it. */}
      <SignalRail tone="light" />

      <div className="shell relative">
        <h2 className="sr-only">MEDURUN network status</h2>

        <Reveal>
          <ul className="flex flex-col divide-y divide-line sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-5 sm:divide-y-0">
            {credibility.map((item, index) => (
              <li key={item.id} className="flex items-center gap-4 py-2 sm:py-0">
                {index === 0 ? (
                  // The live light. It leads the strip at every width, so the first
                  // reading starts on the indicator instead of on a rule.
                  <span aria-hidden="true" className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inset-0 rounded-full bg-red/70 motion-safe:animate-pulse-ring" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-red" />
                  </span>
                ) : (
                  <>
                    <span
                      aria-hidden="true"
                      className="hidden h-1 w-1 shrink-0 rounded-full bg-red sm:block"
                    />
                    {/* The rule stands in for the bullet in the stacked layout, so
                        each reading still starts on a marker rather than floating. */}
                    <span aria-hidden="true" className="h-px w-5 shrink-0 bg-red sm:hidden" />
                  </>
                )}
                <span className="font-sans text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-navy-deep">
                  {item.label}
                  <span className="sr-only"> — {item.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
