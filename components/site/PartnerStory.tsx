import { Fragment } from "react";
import Image from "next/image";
import { PartnerSection } from "@/components/site/PartnerSection";
import { PartnerStage } from "@/components/site/PartnerStage";
import { agencyPartner, driverPartner, partnerActs } from "@/data/site";
import type { PartnerAct } from "@/data/site";
import { cn } from "@/lib/cn";

/**
 * The driver band and the agency band, read as one story.
 *
 * On a desktop the two are a single pinned sequence in two acts. Both bands are
 * sticky layers in one 360vh track — driver on white underneath, agency on navy
 * above it, clipped away to nothing until its turn — and one photographic window
 * travels the whole length of it: it starts as a slot in the driver act's line of
 * oversized type, settles into the driver band's own photograph, swells across
 * the screen as the navy wipes in from the right, slides to the other side of the
 * frame while the picture crossfades to the agency ambulance, joins the agency
 * act's line of type, and finally comes to rest exactly on the agency band's
 * photograph and hands over to it. One window, one path, no second animation.
 *
 * Nothing in either band is duplicated to make that work. The two `PartnerSection`
 * bands are the same component, with the same copy, points, metadata and actions
 * they render anywhere else; the sequence only adds a class, a line of type per
 * act, and the travelling window on top.
 *
 * The two anchor ids sit on zero-height markers in the track's own flow rather
 * than on the sticky bands. A sticky band reports its stuck position, so an anchor
 * on one is a no-op for a reader who is already inside the track and the journey
 * tracker cannot tell the two acts apart; a marker in flow is where the act really
 * begins, which is what both the navigation and the tracker are asking. The bands
 * are named by their own headings instead, so `#drivers` still lands on a labelled
 * region called Driver Partner.
 *
 * Below `lg`, under `prefers-reduced-motion` and with scripting off, none of this
 * exists: the track is a plain wrapper, the markers are zero-height, the lines of
 * type and the travelling window are not painted at all, and what is left is the
 * two stacked bands with the image reveals they have always had.
 */
export function PartnerStory() {
  return (
    <div className="pt-track">
      {/* The travelling window. A sticky layer of its own so it can pass over the
          navy band while the navy band passes over the driver band — the two
          orders cannot both come from document order, so the window takes its
          place with a z-index instead. Zero height, so it pins from the track's
          first frame rather than from its own. */}
      <div aria-hidden="true" className="pt-lens">
        <div className="pt-win">
          <span className="pt-win-layer pt-win-layer--drive">
            <Image
              src={driverPartner.image.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 70vw, 90vw"
              className="object-cover object-center saturate-[0.9] contrast-[1.04]"
            />
          </span>
          <span className="pt-win-layer pt-win-layer--agency">
            <Image
              src={agencyPartner.image.src}
              alt=""
              fill
              sizes="(min-width: 1024px) 70vw, 90vw"
              className="object-cover object-[50%_58%] saturate-[0.9] contrast-[1.04]"
            />
          </span>
          <span aria-hidden="true" className="pt-win-scrim" />
        </div>
      </div>

      <span id="drivers" className="pt-mark pt-mark--drive" />

      <PartnerSection
        index="04"
        content={driverPartner}
        imageSide="left"
        className="pt-act pt-act--driver"
        labelledBy="drivers-heading"
      >
        <PartnerLine
          act={partnerActs.driver}
          side="drive"
          src={driverPartner.image.src}
          crop="object-[18%_68%]"
        />
      </PartnerSection>

      {/* Two markers, because one point cannot answer both questions. The first
          is geometry: its margin is the act break, and `PartnerStage` reads the
          break back off it rather than keeping a second copy of the number. The
          second carries the anchor and the journey tracker's station, and sits
          where the navy has actually landed — a reader is still in the driver
          band for a good part of the scroll the break measures. It is taken out
          of flow on the pinned stage so that moving it cannot move the break. */}
      <span aria-hidden="true" className="pt-mark pt-mark--agency" />
      <span id="agencies" className="pt-mark pt-mark--nav" />

      <PartnerSection
        index="05"
        content={agencyPartner}
        imageSide="right"
        tone="dark"
        className="pt-act pt-act--agency"
        labelledBy="agencies-heading"
      >
        <PartnerLine
          act={partnerActs.agency}
          side="agency"
          src={agencyPartner.image.src}
          crop="object-[88%_34%]"
        />
      </PartnerSection>

      {/* The stretch of the track the navy band owns, declared as a band the
          journey tracker can read. While the two bands are pinned their own boxes
          are wherever the stage is standing, which is no answer to the question
          the tracker is asking: what tone is the page at this scroll depth. */}
      <div aria-hidden="true" data-band className="pt-shade on-dark" />

      <PartnerStage />
    </div>
  );
}

/**
 * The line of oversized type an act opens on, with an image window in each of the
 * two gaps between its words.
 *
 * One of the two windows is empty: it is the slot the travelling window flies to
 * and rests on, and the picture a reader sees in it is that window rather than a
 * second copy of it. The other is a real frame carrying a different crop of the
 * same photograph the band below already uses, so the line is made of the band's
 * own picture rather than of new imagery.
 *
 * Hidden from assistive technology in full. Three words in a decorative line are
 * not the band's content; the label, the heading and the sentence underneath are,
 * and they are untouched.
 */
function PartnerLine({
  act,
  side,
  src,
  crop,
}: {
  act: PartnerAct;
  side: "drive" | "agency";
  src: string;
  /** Where in the photograph this frame is cut from — deliberately not where the
   *  travelling window is cut from, so the line reads as two views of one scene
   *  rather than the same thumbnail printed twice. */
  crop: string;
}) {
  return (
    <div aria-hidden="true" className={cn("pt-band", `pt-band--${side}`)}>
      {act.words.map((word, gap) => (
        <Fragment key={word}>
          <span className="pt-word">{word}</span>
          {gap < act.words.length - 1 ? (
            <>
              <span className="pt-dot">·</span>
              {gap === act.lead ? (
                <span className="pt-slot" />
              ) : (
                <span className="pt-frame">
                  <Image
                    src={src}
                    alt=""
                    fill
                    sizes="22vw"
                    className={cn(
                      "object-cover scale-105 saturate-[0.9] contrast-[1.04]",
                      crop,
                    )}
                  />
                </span>
              )}
            </>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
