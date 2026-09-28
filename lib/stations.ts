/**
 * The page read as one route, and the one definition of where the reader is on it.
 *
 * Two things answer that question — the navigation's red tick and the journey
 * tracker in the left gutter — and before this only the navigation knew how it was
 * decided. Two independent answers to "which section is this" is the kind of thing
 * nobody notices until they disagree by one section, at which point the tracker is
 * pointing at Services while the nav says About and the page looks broken. So the
 * rule lives here and both of them call it.
 */

/** Where the reading line sits in the readable area, as a fraction of it. */
const LINE_RATIO = 0.5;
/** Air between the sticky header and the reading line on short viewports. */
const LINE_MIN_GAP = 8;

const viewport = () =>
  window.innerHeight || document.documentElement.clientHeight || 1;

/**
 * The reading line, in pixels from the top of the viewport: the horizontal a
 * section's top edge has to cross before that section is the one being read.
 *
 * Half of the readable area — the viewport below the sticky header — is the honest
 * answer: a section takes the page the moment it owns more of what the reader can
 * see than the one before it. Taken as a fraction of the whole viewport instead,
 * the header's own height pushes the line up and short viewports light a section
 * far too late.
 *
 * @param headerHeight measured height of the sticky header, if the caller already
 * has it. Measured here from the header element otherwise.
 */
export function readingLine(headerHeight?: number): number {
  const view = viewport();
  const header = Math.round(
    headerHeight ??
      document.querySelector("header")?.getBoundingClientRect().height ??
      72,
  );
  const floor = header + LINE_MIN_GAP;
  const line = Math.round(header + (view - header) * LINE_RATIO);
  return Math.min(Math.max(line, floor), Math.max(view - 2, 1));
}

/**
 * The last section in `ids` whose top edge has passed the line, as an index, or
 * -1 while everything is still below it.
 *
 * "The last one passed" rather than "the one on the line", because not every band
 * on the page is a station: the hero and the status strip are not, and an answer
 * taken from what is literally on the line would drop to nothing while one of
 * those is crossing it. The reader has not stopped being in a section because the
 * page put a strip in the middle of it.
 */
export function passedIndex(ids: readonly string[], line: number): number {
  let index = -1;
  for (let i = 0; i < ids.length; i += 1) {
    const node = document.getElementById(ids[i]);
    if (node && node.getBoundingClientRect().top <= line) index = i;
  }
  return index;
}

export type Station = {
  /** The section's own two-digit number, as printed in its operational label. */
  readonly index: string;
  /** The element id the station is anchored to. */
  readonly id: string;
  /** For assistive tech and for the tracker's own title. */
  readonly label: string;
};

/**
 * The nine numbered bands, in the order they are read, and with the numbers they
 * already print in their own headers — the tracker is a map of the page, so a stop
 * that called itself anything else would be a second numbering to reconcile.
 *
 * `positioning` is a station and is deliberately not in the navigation: it is the
 * statement the page opens on rather than somewhere a reader asks to be taken. The
 * hero, the credibility strip and the footer are not stations at all.
 */
export const STATIONS: readonly Station[] = [
  { index: "01", id: "positioning", label: "Positioning" },
  { index: "02", id: "about", label: "About us" },
  { index: "03", id: "services", label: "Services" },
  { index: "04", id: "drivers", label: "Driver partner" },
  { index: "05", id: "agencies", label: "Agency partner" },
  { index: "06", id: "why", label: "Why MEDURUN" },
  { index: "07", id: "how", label: "How it works" },
  { index: "08", id: "testimonials", label: "Voices" },
  { index: "09", id: "contact", label: "Contact" },
];
