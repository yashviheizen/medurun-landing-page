"use client";

import { useEffect, useRef, useState } from "react";
import { clamp, onPinned, onScroll } from "@/lib/motion";
import { readingLine } from "@/lib/stations";

/**
 * The clock behind the pinned partner story.
 *
 * Everything the sequence does is a pure function of one number: how far the
 * track has been scrolled through. Nothing is chased towards a target and nothing
 * is accumulated from scroll deltas, which is the whole reason the story runs
 * backwards exactly as well as forwards — scrolling up is not an animation being
 * reversed, it is the same function being asked about a smaller number.
 *
 * The number is split in two at the point the navy band actually pins, and that
 * point is measured rather than assumed: the agency band's marker carries the
 * margin that sets it, so the act break in this file and the act break in the
 * stylesheet are the same line, at every viewport height, without either of them
 * having to know the other's arithmetic.
 *
 * The travelling window is the one thing not expressed as a custom property. Its
 * path runs between boxes that only the layout knows — a slot inside a line of
 * type that is itself being translated, and a photograph in a twelve-column grid
 * — so every frame it is read off those boxes live and written as four pixel
 * values. That keeps it correct through a resize, a font swap, a jump to an
 * anchor and a reload half-way down the track, none of which it has to be told
 * about.
 */

/** The ease every pinned sequence on this page scrubs with. */
const smooth = (t: number) => t * t * (3 - 2 * t);

/** A 0-to-1 window of a larger clock, clamped at both ends. */
const span = (at: number, from: number, to: number) =>
  clamp((at - from) / Math.max(to - from, 0.0001));

const ease = (at: number, from: number, to: number) => smooth(span(at, from, to));

/**
 * ACT ONE, as fractions of the driver band's own share of the track.
 *
 * The line of type is read across the first two thirds; the window leaves it for
 * the band's photograph; the column arrives underneath; the whole thing holds
 * still long enough to be read; and then the picture takes the screen as the
 * column clears, which is the frame the navy arrives on.
 */
const A = {
  bandTravel: [0, 0.54],
  bandIn: [0.02, 0.12],
  bandOut: [0.32, 0.44],
  /**
   * Window: slot → the band's own photograph, then a rest, then the swell.
   *
   * It leaves for the photograph only once the line of type it was standing in
   * has finished fading, because on its way it grows across the words it used to
   * sit between — a frame of a picture sliding over half of RESPOND is the one
   * thing in this sequence that reads as a mistake rather than a move.
   */
  toFigure: [0.44, 0.6],
  swell: [0.92, 1],
  /** The frame where the real photograph takes over from the window, and back. */
  handOn: [0.58, 0.68],
  handOff: [0.9, 0.96],
  colIn: [0.48, 0.7],
  colOut: [0.92, 1],
} as const;

/**
 * ACT TWO, as fractions of the agency band's share.
 *
 * The navy wipes in from the right while the window shrinks out of the middle of
 * the screen and slides the other way, crossfading to the agency ambulance as it
 * goes. It joins the agency line of type, rides it, leaves it for the band's
 * photograph, and hands over — leaving the last fifth of the track as stillness
 * with the finished band on it.
 */
const B = {
  wipe: [0, 0.2],
  /** Parked before the line of type arrives, for the same reason it leaves
   * before the line goes: on the way down it crosses the space SCALE is about
   * to occupy, and a word should not be born underneath a photograph. */
  toSlot: [0, 0.16],
  cross: [0.04, 0.18],
  bandTravel: [0, 0.56],
  bandIn: [0.18, 0.28],
  bandOut: [0.42, 0.54],
  /** Same rule as act one: the words are clear of it before it starts growing. */
  toFigure: [0.54, 0.7],
  handOn: [0.68, 0.78],
  colIn: [0.58, 0.8],
} as const;

/**
 * Where station 05 takes over from station 04, and where a jump to `#agencies`
 * lands — both as fractions of the whole track.
 *
 * The journey tracker asks which band the reader is in by looking for the last
 * anchor whose top has crossed the reading line, and an anchor sitting on the
 * act break would answer "the agency band" half a screen before any navy is on
 * it. So the anchor is placed where the navy has actually landed, and pulled the
 * rest of the way down by a negative scroll margin when it is jumped to, so that
 * arriving at the band and being counted as inside it can be two different
 * points without needing two ids.
 */
const NAV_AT = 0.58;

/**
 * Where a jump to each anchor lands: the frame that band's column is settled and
 * still on. Both markers are where the tracker needs them, so both are pulled to
 * where a reader needs them by a scroll margin written beside them.
 */
const DRIVE_ANCHOR = 0.4;
const AGENCY_ANCHOR = 0.93;

/** How far each line of type travels, as a share of the track's width. */
const DRIFT = 0.1;
/** The windows in the line move against it, at this share of its travel. */
const COUNTER = 0.4;

/** The swelled frame, as a share of the stage it is swelling inside. */
const BIG_W = 0.84;
const BIG_H = 0.78;

type Box = { x: number; y: number; w: number; h: number };

const boxOf = (el: Element): Box => {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
};

const mix = (a: Box, b: Box, t: number): Box => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
  w: a.w + (b.w - a.w) * t,
  h: a.h + (b.h - a.h) * t,
});

const named = <T extends readonly [number, number]>(at: number, range: T) =>
  ease(at, range[0], range[1]);

export function PartnerStage() {
  const host = useRef<HTMLSpanElement | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => onPinned(setPinned), []);

  useEffect(() => {
    if (!pinned) return;

    const anchor = host.current;
    if (!anchor) return;

    const track = anchor.closest<HTMLElement>(".pt-track");
    if (!track) return;

    const pick = <T extends HTMLElement>(root: ParentNode, sel: string) =>
      root.querySelector<T>(sel);

    const driver = pick<HTMLElement>(track, ".pt-act--driver");
    const agency = pick<HTMLElement>(track, ".pt-act--agency");
    const mark = pick<HTMLElement>(track, ".pt-mark--agency");
    const lens = pick<HTMLElement>(track, ".pt-lens");
    const win = pick<HTMLElement>(track, ".pt-win");
    if (!driver || !agency || !mark || !lens || !win) return;

    const slotD = pick<HTMLElement>(driver, ".pt-slot");
    const slotA = pick<HTMLElement>(agency, ".pt-slot");
    const figD = pick<HTMLElement>(driver, ".pt-fig");
    const figA = pick<HTMLElement>(agency, ".pt-fig");
    if (!slotD || !slotA || !figD || !figA) return;

    // Only write a property that has actually changed. Most frames move two or
    // three of these; invalidating all fourteen every time is work the browser
    // has to redo for nothing.
    const held = new Map<string, string>();
    const put = (name: string, value: string) => {
      if (held.get(name) === value) return;
      held.set(name, value);
      track.style.setProperty(name, value);
    };
    const num = (name: string, value: number) => put(name, value.toFixed(4));
    const px = (name: string, value: number) => put(name, `${value.toFixed(2)}px`);

    // The page keeps a scroll padding under the sticky header, and the browser
    // counts it on top of any scroll margin on the target. The margins below are
    // exact distances, so it has to come back out of them.
    const rest =
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;

    const off = onScroll(() => {
      const box = track.getBoundingClientRect();
      const stageH = driver.offsetHeight;
      const travel = Math.max(box.height - stageH, 1);
      const top = parseFloat(getComputedStyle(driver).top) || 0;
      const at = clamp((top - box.top) / travel);

      // Where the navy band's own flow position sits in that travel — the act
      // break, read off the layout rather than written down twice.
      const gap = parseFloat(getComputedStyle(mark).marginTop) || 0;
      const pin = clamp((stageH + gap) / travel);

      const first = at < pin;
      const a = pin > 0 ? clamp(at / pin) : 1;
      const b = pin < 1 ? clamp((at - pin) / (1 - pin)) : 0;

      const drift = box.width * DRIFT;

      // The navigation marker, placed in the track's own coordinates: far enough
      // in that the reading line reaches it exactly as the navy lands. Each
      // marker's scroll margin is then whatever carries a jump from where the
      // marker sits to the frame the band is readable on.
      const line = readingLine();
      px("--pt-nav", NAV_AT * travel - top + line);
      px("--pt-navpad", line - rest - (AGENCY_ANCHOR - NAV_AT) * travel);
      px("--pt-drivepad", top - rest - DRIVE_ANCHOR * travel);

      // ---- Act one: the line of type, read right to left ----------------
      const aRun = span(a, A.bandTravel[0], A.bandTravel[1]);
      const aX = (1 - 2 * aRun) * drift;
      px("--pt-bx-d", aX);
      px("--pt-bp-d", -aX * COUNTER);
      num(
        "--pt-bo-d",
        named(a, A.bandIn) * (1 - named(a, A.bandOut)),
      );

      // ---- Act two: the same line, read the other way -------------------
      const bRun = span(b, B.bandTravel[0], B.bandTravel[1]);
      const bX = (2 * bRun - 1) * drift;
      px("--pt-bx-a", bX);
      px("--pt-bp-a", -bX * COUNTER);
      num(
        "--pt-bo-a",
        first ? 0 : named(b, B.bandIn) * (1 - named(b, B.bandOut)),
      );

      // ---- The navy, arriving from the right ----------------------------
      num("--pt-wipe", first ? 0 : named(b, B.wipe));
      num("--pt-cross", first ? 0 : named(b, B.cross));

      // ---- The two columns ----------------------------------------------
      num("--pt-din", named(a, A.colIn));
      num("--pt-dout", first ? named(a, A.colOut) : 1);
      num("--pt-ain", first ? 0 : named(b, B.colIn));

      // ---- Who is holding the picture -----------------------------------
      const dFig = first
        ? named(a, A.handOn) * (1 - named(a, A.handOff))
        : 0;
      const aFig = first ? 0 : named(b, B.handOn);
      num("--pt-dfig", dFig);
      num("--pt-afig", aFig);

      // The window is only ever on screen because something is carrying it: the
      // line of type on its way in, or the photograph it is on its way to. Above
      // the track — where `at` is pinned at 0 and the line has not arrived — that
      // makes it absent, rather than a lone crop floating on an empty band.
      const carried = first
        ? Math.max(named(a, A.bandIn), named(a, A.toFigure))
        : 1;
      num("--pt-winop", carried * (1 - Math.max(dFig, aFig)));

      // ---- The travelling window ----------------------------------------
      const stage = boxOf(driver);
      const big: Box = {
        w: stage.w * BIG_W,
        h: stage.h * BIG_H,
        x: stage.x + (stage.w * (1 - BIG_W)) / 2,
        y: stage.y + (stage.h * (1 - BIG_H)) / 2,
      };

      let frame: Box;
      if (first) {
        const slot = boxOf(slotD);
        const fig = boxOf(figD);
        if (a <= A.toFigure[0]) frame = slot;
        else if (a <= A.toFigure[1]) frame = mix(slot, fig, named(a, A.toFigure));
        else if (a <= A.swell[0]) frame = fig;
        else frame = mix(fig, big, named(a, A.swell));
      } else {
        const slot = boxOf(slotA);
        const fig = boxOf(figA);
        if (b <= B.toSlot[1]) frame = mix(big, slot, named(b, B.toSlot));
        else if (b <= B.toFigure[0]) frame = slot;
        else frame = mix(slot, fig, named(b, B.toFigure));
      }

      const seat = lens.getBoundingClientRect();
      px("--pt-win-x", frame.x - seat.left);
      px("--pt-win-y", frame.y - seat.top);
      px("--pt-win-w", frame.w);
      px("--pt-win-h", frame.h);
    });

    return () => {
      off();
      for (const name of held.keys()) track.style.removeProperty(name);
    };
  }, [pinned]);

  return <span ref={host} aria-hidden="true" className="pt-clock" />;
}
