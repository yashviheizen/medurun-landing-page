/**
 * GitHub Pages serves static files only, and serves them from a repository
 * sub-path (`/medurun-landing-page/`). Both facts are true only there, so the
 * Pages workflow sets these two variables and nothing else does: `npm run dev`
 * and a plain `npm run build` keep the Next server runtime and the image
 * optimiser exactly as they were.
 */
const isPages = process.env.GITHUB_PAGES === "true";
const basePath = isPages ? process.env.PAGES_BASE_PATH || "" : "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // The Medurun site already serves its photography from Unsplash's CDN.
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
    // A static export has no server to resize through, so next/image points at
    // the source URL instead. Unsplash is already a CDN; nothing is lost.
    unoptimized: isPages,
  },
  ...(isPages && {
    output: "export",
    basePath,
    assetPrefix: basePath,
    // Emit `privacy/index.html` rather than `privacy.html`, which is the shape
    // a plain file host resolves without guessing at extensions.
    trailingSlash: true,
  }),
};

export default nextConfig;
