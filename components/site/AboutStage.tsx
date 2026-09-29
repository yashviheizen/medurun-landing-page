"use client";

import { useEffect, useRef, useState } from "react";
import { clamp, onPinned, onScroll, pinnedAt, viewport } from "@/lib/motion";

/**
 * Every custom property this stage writes, so switching out of the pinned layout
 * can hand the element back exactly as the stylesheet found it. A stale
 * `--ab-open` left on the node would otherwise keep a narrow crop on a reader who
 * has just turned reduced motion on, or resized down to a tablet.
 */
const STAGE_VARS = [
  "--ab-l1",
  "--ab-l2",
  "--ab-shot",
  "--ab-open",
  "--ab-scale",
  "--ab-pan",
  "--ab-says",
  "--ab-bridge",
  "--ab-panel-a",
  "--ab-panel-b",
] as const;

/** The same ease the rest of the page's pinned sequences scrub with. */
const smooth = (t: number) => t * t * (3 - 2 * t);

/**
 * The About sequence's two clocks, and why there are two.
 *
 * `pinnedAt` is 0 at the instant the stage sticks — but the heading has been on
 * screen for most of a viewport's worth of scrolling by then, so a headline whose
 * reveal started at 0 would sit blank in plain sight for 800px. The approach is
 * its own reading: how far the track's top edge has travelled up the screen, which
 * reaches 1 exactly as the pinning begins. So the headline and the photograph's
 * arrival ride `lead`, and the expansion, the statements, the bridge and the two
 * panels ride `at`. Both are read live from one rect per frame, and both are pure
 * functions of scroll position — which is the whole of "reverses correctly".
 */
const LEAD_SPAN = 0.9;

/**
 * The stage is a wrapper, not a component with content: everything inside it is
 * server-rendered by `About`. All this owns is the track, the sticky stage, and
 * the one subscription that writes the sequence onto it.
 */
export function AboutStage({ children }: { children: React.ReactNode }) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [pinned, setPinned] = useState(false);

  useEffect(() => onPinned(setPinned), []);

  useEffect(() => {
    if (!pinned) return;

    const stage = stageRef.current;
    if (!stage) return;

    const track = stage.parentElement;
    if (!track) return;

    const off = onScroll(() => {
      const view = viewport();
      const box = track.getBoundingClientRect();

      // The approach. 0 with the track's top edge at the bottom of the screen,
      // 1 by the time it has climbed a viewport's worth — which is the moment the
      // stage stops moving and `at` takes over.
      const lead = clamp((view - box.top) / Math.max(view * LEAD_SPAN, 1));
      const at = pinnedAt(track, stage);

      // Two lines of headline, then the photograph, all before the stage pins.
      const l1 = smooth(clamp((lead - 0.3) / 0.26));
      const l2 = smooth(clamp((lead - 0.52) / 0.26));
      const shot = smooth(clamp((lead - 0.74) / 0.26));

      // The crop opening. Half the pinned scroll, and nothing else moves with it:
      // the expansion is the sequence's one large gesture.
      const open = smooth(clamp((at - 0.05) / 0.5));

      // The statements, the line that bridges them, then the two panels — each
      // overlapping the one before rather than queueing behind it.
      const says = smooth(clamp((at - 0.44) / 0.22));
      const bridge = smooth(clamp((at - 0.58) / 0.18));
      const panelA = smooth(clamp((at - 0.7) / 0.16));
      const panelB = smooth(clamp((at - 0.76) / 0.16));

      stage.style.setProperty("--ab-l1", l1.toFixed(4));
      stage.style.setProperty("--ab-l2", l2.toFixed(4));
      stage.style.setProperty("--ab-shot", shot.toFixed(4));
      stage.style.setProperty("--ab-open", open.toFixed(4));

      // The pan and the settle. 1.04 → 1 leaves 2% of slack on each side at the
      // start and none at the end, and the pan is held inside it at 1.4% — so the
      // photograph can drift while the crop opens without ever reaching an edge
      // and showing the frame's ground behind it.
      stage.style.setProperty("--ab-scale", (1.04 - 0.04 * open).toFixed(4));
      stage.style.setProperty("--ab-pan", `${((1 - open) * 1.4).toFixed(3)}%`);

      stage.style.setProperty("--ab-says", says.toFixed(4));
      stage.style.setProperty("--ab-bridge", bridge.toFixed(4));
      stage.style.setProperty("--ab-panel-a", panelA.toFixed(4));
      stage.style.setProperty("--ab-panel-b", panelB.toFixed(4));
    });

    return () => {
      off();
      for (const name of STAGE_VARS) stage.style.removeProperty(name);
    };
  }, [pinned]);

  return (
    <div className="ab-track">
      <div ref={stageRef} className="ab-stage">
        {children}
      </div>
    </div>
  );
}
