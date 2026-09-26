/**
 * The dispatch unit: a small ambulance seen from the side, drawn around its own
 * origin so it can be dropped at a point on any route without arithmetic at the
 * call site. Roughly 30 × 20 user units, which lands between 24 and 32 screen
 * pixels in both routes it is used in — small enough to read as a marker on a
 * map, large enough to read as a vehicle rather than a dot.
 *
 * Fixed brand colours rather than `currentColor`: it is always the live unit on a
 * navy ground, and the white details are what make the silhouette legible at this
 * size.
 */
export function UnitMark() {
  return (
    <>
      {/* Signal halo — the same vocabulary as the route's own markers. */}
      <circle r="13" fill="#ED1C24" fillOpacity="0.18" />

      {/* Patient compartment, then the cab stepped down in front of it. */}
      <rect x="-11.5" y="-6.5" width="15.5" height="12.5" rx="2" fill="#ED1C24" />
      <path d="M4 -2.5h4.4l3.6 3.2V6H4z" fill="#ED1C24" />

      {/* The cross on the box, and the windscreen on the cab. */}
      <path d="M-6.4 -0.3h4.2M-4.3 -2.4v4.2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.4 -1.2h2.6l1.9 1.8H5.4z" fill="#fff" fillOpacity="0.75" />

      {/* Wheels, sitting just under the body. */}
      <circle cx="-6.6" cy="6.4" r="1.9" fill="#fff" fillOpacity="0.9" />
      <circle cx="7" cy="6.4" r="1.9" fill="#fff" fillOpacity="0.9" />
    </>
  );
}
