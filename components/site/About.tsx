import { AboutStage } from "@/components/site/AboutStage";
import { ImageReveal } from "@/components/ui/ImageReveal";
import { Media } from "@/components/ui/Media";
import { Section, SectionHeading } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { about } from "@/data/site";

/**
 * One photograph opening.
 *
 * On a desktop the whole band is a short pinned sequence — `.ab-track` is the
 * track and `.ab-stage` the stage — and it is deliberately the calmest of the
 * page's pinned sequences: one gesture, not five. The label and the headline hold
 * the light ground on their own, and the headline arrives a line at a time; the
 * ambulance appears as a narrow vertical slice at the centre and the slice opens
 * sideways into a cinematic frame, drifting a percent and a half and settling from
 * 1.04 to 1 while it does. The two statements then take opposite sides of the
 * frame with a hairline of MEDURUN red drawn between them — the gap, and the
 * bridging of it, said with one line rather than a diagram — and the vision and
 * the mission come up last as two pieces of glass along the frame's lower edge.
 *
 * The end of the sequence *is* the section's ordinary composition: the frame at
 * the full content width, the panels resting on it, the statements beneath. So
 * there is nothing to unwind at the release — the stage simply stops being held
 * and scrolls away into What We Provide.
 *
 * At every other width, with scripting off, and under reduced motion, none of the
 * pinning exists: the same markup is a heading, a full-width photograph, its
 * caption, the two paragraphs, and the vision and mission, stacked in that order.
 * The crop, the pan and the panel float are declared only inside the pinned query,
 * so there is no state anywhere that a reader can be left holding — and `.ab-figure`
 * is `display: contents` there, which is what lets the photograph, its caption and
 * the two panels be separate rows of one stage grid while staying one figure.
 */
export function About() {
  const statements = [about.vision, about.mission];
  const [opening, closing] = about.body;

  return (
    <Section
      id="about"
      tone="light"
      className="ab-section pt-12 pb-12 sm:pt-14 sm:pb-14 lg:pt-16 lg:pb-16"
    >
      <AboutStage>
        <div className="ab-head">
          <SectionHeading
            index="02"
            eyebrow={about.eyebrow}
            title={
              <>
                <span className="ab-line" data-i="0">
                  Revolutionizing emergency healthcare
                </span>{" "}
                <span className="ab-line" data-i="1">
                  through technology
                </span>
              </>
            }
          />
        </div>

        <figure className="ab-figure">
          <div className="ab-frame">
            {/* The crop is the window and the zoom is the photograph, on two
                elements on purpose: `clip-path` resolves in the box's own
                coordinates, so a transform on the clipped element would drag the
                mask's edge along with the picture and the slice would zoom
                instead of opening. */}
            <ImageReveal className="ab-crop">
              <div className="ab-zoom">
                <Media
                  src={about.image.src}
                  alt={about.image.alt}
                  ratio="plate"
                  frame="square"
                  focus="vehicle"
                  sizes="(min-width: 1024px) 80vw, 96vw"
                />
              </div>
            </ImageReveal>
          </div>

          <figcaption className="ab-caption flex items-center gap-3 font-sans text-[0.625rem] font-medium uppercase leading-none tracking-[0.2em] text-muted">
            <span aria-hidden="true" className="h-px w-5 shrink-0 bg-red" />
            {about.caption}
          </figcaption>
        </figure>

        <Reveal className="ab-says" items>
          <p className="ab-say stagger-up" data-side="left">
            {opening}
          </p>

          {/* The gap, and the bridging of it. Two endpoints and the hairline
              between them — no second ambulance travelling along it. */}
          <span aria-hidden="true" className="ab-bridge">
            <span className="ab-bridge-dot" />
            <span className="ab-bridge-line" />
            <span className="ab-bridge-dot" />
          </span>

          <p className="ab-say stagger-up" data-side="right">
            {closing}
          </p>
        </Reveal>

        <dl className="ab-panels">
          {statements.map((item, index) => (
            <div key={item.title} className="ab-panel" data-i={index}>
              <dt className="op-label">
                <span>{item.title}</span>
              </dt>
              <dd className="ab-panel-body mt-2 leading-relaxed text-ink">{item.body}</dd>
            </div>
          ))}
        </dl>
      </AboutStage>
    </Section>
  );
}
