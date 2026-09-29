/**
 * Content integrity checks for the landing page.
 *
 * These guard the things that silently rot: nav anchors pointing at sections that
 * no longer exist, contact details drifting from the published ones, images losing
 * their alt text, and invented metrics creeping into the copy.
 *
 * Run with `npm test` (node:test — no test-runner dependency).
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const siteData = read("data/site.ts");
const pageSource = read("app/page.tsx");
const componentSources = fs
  .readdirSync(path.join(root, "components/site"))
  .map((file) => read(path.join("components/site", file)))
  .join("\n");

/** Pulls string literals out of the `nav` array in data/site.ts. */
function navHrefs() {
  const block = siteData.match(/export const nav: NavItem\[\] = \[([\s\S]*?)\n\];/);
  assert.ok(block, "nav array not found in data/site.ts");
  return [...block[1].matchAll(/href: "(#[^"]+)"/g)].map((match) => match[1].slice(1));
}

/** Section ids actually rendered on the page, from `id="..."` / `id={"..."}` props. */
function renderedSectionIds() {
  const ids = new Set();
  const sources = `${pageSource}\n${componentSources}`;
  for (const match of sources.matchAll(/\bid="([a-z-]+)"/g)) ids.add(match[1]);
  return ids;
}

test("every nav anchor points at a section rendered on the page", () => {
  const ids = renderedSectionIds();
  for (const href of navHrefs()) {
    assert.ok(ids.has(href), `nav links to #${href} but no element renders id="${href}"`);
  }
});

test("all ten required sections are present on the page", () => {
  const required = [
    "Hero",
    "Positioning",
    "About",
    "Services",
    "PartnerStory",
    "WhyMedurun",
    "HowItWorks",
    "CredibilityStrip",
    "Testimonials",
    "Contact",
    "Footer",
  ];
  for (const component of required) {
    assert.match(pageSource, new RegExp(`<${component}[\\s/>]`), `${component} is not rendered`);
  }
});

test("published contact details are preserved verbatim", () => {
  const expected = [
    "EMEXPRESS Healthtech Private Limited",
    "+91 8770875949",
    "tel:+918770875949",
    "tech.support@medurun.com",
    "business@medurun.com",
    "operations@medurun.com",
    "Bhilai, Durg, Chhattisgarh, India, 490023",
    "Fusion of Trust & Speed",
    "© 2026 EMEXPRESS Healthtech Private Limited. All Rights Reserved.",
  ];
  for (const value of expected) {
    assert.ok(siteData.includes(value), `missing contact detail: ${value}`);
  }
});

test("privacy and terms links are present and have pages behind them", () => {
  assert.ok(siteData.includes('href: "/privacy"'));
  assert.ok(siteData.includes('href: "/terms"'));
  assert.ok(fs.existsSync(path.join(root, "app/privacy/page.tsx")));
  assert.ok(fs.existsSync(path.join(root, "app/terms/page.tsx")));
});

test("every image in the content data has descriptive alt text", () => {
  const images = [...siteData.matchAll(/src: "(https:[^"]+)",\s*\n\s*alt: "([^"]*)"/g)];
  assert.ok(images.length >= 8, `expected the content data to define images, found ${images.length}`);

  for (const [, src, alt] of images) {
    assert.ok(alt.length > 20, `alt text for ${src} is too short to be descriptive: "${alt}"`);
    assert.doesNotMatch(alt, /^(image|photo|picture)\b/i, `alt text for ${src} starts with a filler word`);
  }
});

test("the credibility strip carries no invented numbers", () => {
  const block = siteData.match(/export const credibility: Credibility\[\] = \[([\s\S]*?)\n\];/);
  assert.ok(block, "credibility array not found");
  assert.doesNotMatch(
    block[1],
    /\d[\d,.]*\s*(\+|%|k\b|lakh|crore|million)/i,
    "credibility strip must not state performance figures",
  );
});

test("no fabricated metrics, certifications, or app-store CTAs in the copy", () => {
  const banned = [
    /\b\d[\d,]*\+?\s*(lives saved|patients|hospitals served|partners|cities)\b/i,
    /\bISO\s?\d{4,}/i,
    /\b(download on the app store|get it on google play)\b/i,
    /\b\d+\s*(minute|min|second|sec)s?\s*(average\s*)?response\s*time\b/i,
    /\b\d{2,}(\.\d+)?%\s*(uptime|satisfaction|success)\b/i,
  ];

  for (const pattern of banned) {
    assert.doesNotMatch(siteData, pattern, `unsupported claim matching ${pattern} found in content data`);
  }
});

test("testimonials are attributed by role only, with no invented names", () => {
  const block = siteData.match(/export const testimonials: Testimonial\[\] = \[([\s\S]*?)\n\];/);
  assert.ok(block, "testimonials array not found");
  const roles = [...block[1].matchAll(/role: "([^"]+)"/g)].map((match) => match[1]);
  assert.ok(
    roles.length >= 4 && roles.length <= 6,
    `expected 4-6 testimonials so the grid stays scannable, found ${roles.length}`,
  );

  for (const role of roles) {
    assert.doesNotMatch(role, /\b(Dr\.|Mr\.|Ms\.|Mrs\.)/, `testimonial role "${role}" looks like a person's name`);
  }
});

test("no fake forms are rendered anywhere on the site", () => {
  assert.doesNotMatch(componentSources, /<form\b/, "the site must not present a non-functional form");
  assert.doesNotMatch(componentSources, /<input\b/, "the site must not present non-functional inputs");
});

test("reduced-motion preferences are respected in the global stylesheet", () => {
  const css = read("app/globals.css");
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
});
