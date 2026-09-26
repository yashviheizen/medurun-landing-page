import { AboutPlate } from "@/components/site/AboutPlate";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { about } from "@/data/site";

/**
 * Vision and mission are set as side notes in the right margin — hairline-ruled,
 * aligned to the body text's first line — rather than as two cards. The photograph
 * runs the full content width underneath, squared off like a plate on a page.
 *
 * The plate sits close to the copy above it and to the band below on purpose: it
 * is the closing image of this section rather than a separate exhibit, so it gets
 * a normal paragraph's distance, not a moat. Its ratio opens up with the column
 * instead of holding one crop — see `plate` in Media.
 */
export function About() {
  const statements = [about.vision, about.mission];

  return (
    <Section id="about" tone="light" className="pt-12 pb-12 sm:pt-14 sm:pb-14 lg:pt-16 lg:pb-16">
      <SectionHeading index="02" eyebrow={about.eyebrow} title={about.heading} />

      <div className="mt-9 grid gap-9 lg:mt-11 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-0">
        <Reveal className="lg:col-span-6">
          <div className="space-y-5 text-base leading-relaxed text-muted sm:text-lg">
            {about.body.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={60} className="lg:col-span-5 lg:col-start-8">
          <dl className="space-y-7">
            {statements.map((item) => (
              <div key={item.title} className="border-t border-line pt-4">
                <dt className="op-label">
                  <span>{item.title}</span>
                </dt>
                <dd className="mt-3 text-[0.98rem] leading-relaxed text-ink">{item.body}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <div className="mt-9 lg:mt-10">
        {/* The plate carries its own reveal — a horizontal mask and a couple of
            percent of parallax — rather than riding the page's generic fade, so it
            is uncovered at full contrast instead of arriving faint. */}
        <AboutPlate
          src={about.image.src}
          alt={about.image.alt}
          caption={about.caption}
          sizes="(min-width: 1024px) 80vw, 96vw"
        />
      </div>
    </Section>
  );
}
