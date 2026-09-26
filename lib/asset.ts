/**
 * Prefixes a path that lives in `public/`.
 *
 * `basePath` rewrites routes and the framework's own `_next/` assets, but not
 * the literal paths handed to `<Image>` for files in `public/`, so those are
 * prefixed here instead. The variable is only set for the GitHub Pages build —
 * everywhere else this is the identity function.
 */
export function asset(path: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${path}`;
}
