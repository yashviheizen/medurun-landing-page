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
           as elastic. Its delay is `--rail-line` — the rail's whole clock lives on
           `.hero-rail` in globals.css. */
        "rail-draw": {
          from: { clipPath: "inset(0 100% 0 0)" },
          to: { clipPath: "inset(0)" },
        },
        /* The hero rail's red segment, its travelling signal and its per-stop rings
           are in globals.css instead of here, alongside the positioning schematic's:
           each set is timed off a single custom property — `--rail-cycle` there,
           `--flow-cycle` here — and an `animate-*` utility's fixed duration cannot
           express that. */
        /* The positioning schematic's travelling signal and its per-node rings are in
           globals.css instead of here: both are timed off one `--flow-cycle` custom
           property, and an `animate-*` utility's fixed duration cannot express that. */
        /* The hero photograph kept alive: a 5% swell, out and back, over half a
           minute. Scale rather than the horizontal drift the old masked plate
           carried, because this photograph is full-bleed and centred head-on —
           a sideways shift would slide the vehicle off the frame's axis, where a
           slow push in reads as the camera still running. It is deliberately
           anchored above 1 at both ends: the scale is on the whole stage, veil
           and lamps included, and anything under 1 would show the section's navy
           at the edges. */
        "bg-drift": {
          "0%, 100%": { transform: "scale(1.035)" },
          "50%": { transform: "scale(1.085)" },
        },
      },
      /* The hero entrance, from the moment the section paints. Everything is on
         the frame inside 1.12s, in the order the eye would take it:
           logo mark         0ms + 420ms → 420ms
           eyebrow          90ms + 420ms → 510ms
           headline line 1 170ms + 520ms → 690ms   (80ms stagger)
           headline line 2 250ms + 520ms → 770ms
           the sentence    340ms + 420ms → 760ms
           the actions     410ms + 420ms → 830ms   → everything usable by 830ms
           rail label      560ms + 420ms → 980ms
           rail line draw  700ms + 420ms → 1120ms
           dispatch signal starts at     1120ms
         The entrance is therefore over at 1.12s, which is also the lead the rail's
         standing loop is timed from — the signal leaves REQUEST on the frame the
         route finishes drawing. The photograph itself is not in that table: it
         fades up over 900ms from the first frame, underneath all of it, because it
         is the ground the sequence happens on rather than a step in it.

         What runs after 1.12s is continuous and never finishes: the rail's 4s
         cycle, the two roof lamps' 4.4s breath, and the stage's 32s swell. The
         rail's clock is `--rail-cycle` and friends on `.hero-rail` in globals.css,
         not here: a looping sequence whose stops are fractions of one cycle cannot
         be written as fixed durations. */
      animation: {
        "line-rise": "line-rise 0.52s cubic-bezier(0.22, 1, 0.36, 1) both",
        "rise-in": "rise-in 0.42s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.28s ease-out both",
        "node-in": "node-in 0.2s cubic-bezier(0.22, 1, 0.36, 1) both",
        "pulse-ring": "pulse-ring 2.8s cubic-bezier(0.22, 1, 0.36, 1) infinite",
        "rail-draw": "rail-draw 0.42s cubic-bezier(0.22, 1, 0.36, 1) both",
        "bg-drift": "bg-drift 32s cubic-bezier(0.37, 0, 0.63, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
