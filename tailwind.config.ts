import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./data/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Brand: red accent + navy sampled from the MEDURUN logo mark.
        red: {
          DEFAULT: "#ED1C24",
          dark: "#C4141B",
          tint: "#FDECEC",
        },
        navy: {
          DEFAULT: "#233F8F",
          deep: "#101B3C",
          ink: "#0A1129",
          tint: "#EEF1F9",
        },
        ink: "#0B0B0B",
        muted: "#5B6172",
        line: "#E4E6ED",
        // Warm gray ground. The cool navy tint reads as another shade of the brand
        // blue on a full page of it; paper puts warmth under the editorial type and
        // lets the navy bands land as deliberate, separate territory.
        paper: {
          DEFAULT: "#F5F2EE",
          line: "#E2DCD3",
        },
      },
      fontFamily: {
        sans: ["var(--font-dm-sans)", "system-ui", "-apple-system", "sans-serif"],
        serif: ["var(--font-instrument-serif)", "ui-serif", "Georgia", "serif"],
      },
      maxWidth: {
        shell: "78rem",
      },
      keyframes: {
        "pulse-ring": {
          "0%": { transform: "scale(0.7)", opacity: "0.65" },
          "100%": { transform: "scale(2.1)", opacity: "0" },
        },
        /* The network hub's resting beat. Slower, wider and fainter than the status
           strip's live light: once the positioning schematic has finished routing its
           one request, this is the only thing still moving on the band, so it has to
           read as a network idling rather than as an indicator demanding attention. */
        "hub-pulse": {
          "0%": { transform: "scale(0.8)", opacity: "0.34" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
        /* Hero headline, revealed a line at a time. The text itself never drops
           below full opacity — each line simply rises out from behind a mask, so
           nothing is left sitting faintly on screen while the page settles.
           125% clears the mask's descender padding as well as the line box. */
        "line-rise": {
          from: { transform: "translateY(125%)" },
          to: { transform: "translateY(0)" },
        },
        /* The rest of the hero entrance. It starts at 0.4 rather than 0 so the
           paragraph, buttons, and image are legible from the first frame. */
        "rise-in": {
          from: { opacity: "0.4", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        /* A plain fade, for the things that only need to arrive in sequence and
           must not move: route labels, captions, metadata rows. */
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        /* A route node coming on line. Scale is kept on the marker itself, which is
           why the markers are wrapped: their centring translate lives on the parent,
           so nothing here has to reproduce it. */
        "node-in": {
          from: { opacity: "0", transform: "scale(0.4)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        /* The hero rail's neutral route line, drawn once from left to right. A clip
           rather than a scaled transform: the line is a 1px box, and scaling it
           along its own axis is the one thing that would make a straight rule read
           as elastic. It does not start until 820ms, once the actions are on the
           page — see the entrance table below. */
        "rail-draw": {
          from: { clipPath: "inset(0 100% 0 0)" },
          to: { clipPath: "inset(0)" },
        },
        /* The completed red segment, extending REQUEST → DISPATCH → TRACK → CARE.
           The percentage stops are the route's own timetable: it advances for 28%
           of the run, holds for 6% at the stop it has reached, and goes again, so
           each stage is arrived at rather than passed through. The element spans
           the first node to the last, which is why the three legs are thirds. */
        "rail-fill": {
          "0%": { clipPath: "inset(0 100% 0 0)" },
          "28%": { clipPath: "inset(0 66.667% 0 0)" },
          "34%": { clipPath: "inset(0 66.667% 0 0)" },
          "62%": { clipPath: "inset(0 33.333% 0 0)" },
          "68%": { clipPath: "inset(0 33.333% 0 0)" },
          "96%": { clipPath: "inset(0)" },
          "100%": { clipPath: "inset(0)" },
        },
        /* The signal running that segment. Same stops and same duration as
           `rail-fill`, so the dot sits on the segment's leading edge by
           construction instead of by two sets of numbers being kept in agreement.
           Its wrapper spans first node to last, so translateX(100%) is exactly
           CARE — where it stops, and where it is already placed with motion off. */
        "rail-signal": {
          "0%": { transform: "translateX(0)", opacity: "0" },
          "6%": { opacity: "1" },
          "28%": { transform: "translateX(33.333%)" },
          "34%": { transform: "translateX(33.333%)" },
          "62%": { transform: "translateX(66.667%)" },
          "68%": { transform: "translateX(66.667%)" },
          "96%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(100%)", opacity: "1" },
        },
        /* A stop acknowledging the signal as it passes: one ring out, once. Both
           ends are transparent, so with backwards and forwards fill the ring is
           invisible except during its own half-second. */
        "node-ping": {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "22%": { opacity: "0.55" },
          "100%": { transform: "scale(2.6)", opacity: "0" },
        },
        /* The positioning schematic's travelling signal: one soft red dot running the
           network rail from the request to the receiving hospital, once, when the band
           is first read. It fades in and out at the ends so it reads as a signal
           passing rather than an object arriving and parking. Its wrapper spans the
           rail, so 100% lands it exactly on the last node. */
        "flow-run": {
          "0%": { transform: "translateX(0)", opacity: "0" },
          "10%": { opacity: "1" },
          "88%": { opacity: "1" },
          "100%": { transform: "translateX(100%)", opacity: "0" },
        },
        /* The ambulance uncovered from the right edge inwards — the edge it is
           already bleeding off — rather than faded up. A plate that is wiped in
           keeps its own full contrast from the first frame, where a plate that
           fades looks like a loading state. */
        "plate-wipe": {
          from: { clipPath: "inset(0 0 0 100%)" },
          to: { clipPath: "inset(0)" },
        },
        /* The hero photograph's one slow settle: 1.2% over eight seconds, and then
           it stops for good. Long enough that it is never caught moving, and well
           short of the threshold where it would read as a zoom or a pull on the
           framing. */
        "plate-drift": {
          from: { transform: "scale(1)" },
          to: { transform: "scale(1.012)" },
        },
      },
      /* The hero entrance, from the moment the section paints. The headline and
         the actions are usable well inside 900ms; the dispatch rail is deliberately
         after them, and may finish later.
           eyebrow          0ms + 420ms  → 420ms
           headline line 1  90ms + 520ms → 610ms   (80ms stagger)
           headline line 2 170ms + 520ms → 690ms
           ambulance wipe  180ms + 780ms → 960ms
           rule / copy / CTAs           → 740ms
           rail label      560ms + 420ms → 980ms
           rail line draw  820ms + 520ms → 1340ms
           rail fill + signal 1340ms + 1020ms → 2360ms   (REQUEST → CARE, once)
         The route sequence is therefore 820ms → 2360ms, 1.54s end to end, and the
         canvas is completely static from there. The only other thing outside the
         entrance budget is the eight-second plate settle, and nothing waits for it.
         Every delay is stated in DispatchRail, which is where the stop table lives. */
      animation: {
        "line-rise": "line-rise 0.52s cubic-bezier(0.22, 1, 0.36, 1) both",
        "rise-in": "rise-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.28s ease-out both",
        "node-in": "node-in 0.2s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-ring": "pulse-ring 2.8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "hub-pulse": "hub-pulse 3.4s cubic-bezier(0.22, 1, 0.36, 1) 2s infinite",
        "rail-draw": "rail-draw 0.52s cubic-bezier(0.22, 1, 0.36, 1) both",
        "rail-fill": "rail-fill 1.02s cubic-bezier(0.4, 0, 0.2, 1) both",
        "rail-signal": "rail-signal 1.02s cubic-bezier(0.4, 0, 0.2, 1) both",
        "node-ping": "node-ping 0.5s cubic-bezier(0.22, 1, 0.36, 1) both",
        "flow-run": "flow-run 1.7s cubic-bezier(0.4, 0, 0.5, 1) 0.26s both",
        "plate-wipe": "plate-wipe 0.78s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both",
        "plate-drift": "plate-drift 8s cubic-bezier(0.33, 0, 0.67, 1) 0.9s both",
      },
    },
  },
  plugins: [],
};

export default config;
