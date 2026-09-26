"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { company, nav } from "@/data/site";
import { cn } from "@/lib/cn";

/**
 * The desktop navigation carries a red tick under the section currently being read,
 * so the nav doubles as a position readout on a single-page site.
 *
 * Which section that is comes off one horizontal reading line, and an
 * IntersectionObserver watching the nav sections cross it. The line sits at 38% of
 * the viewport but never closer to the top than the sticky header plus a little air,
 * so on a short viewport it still lands on content the reader can actually see
 * rather than under the header — and the observer's root margin collapses the root
 * to that single line, which is why exactly one contiguous section can be on it.
 *
 * The observer is the trigger, not the answer: every crossing re-reads the live
 * section boundaries and takes the last section whose top has passed the line. That
 * distinction matters because two bands — the status strip and the hero — are not in
 * the nav at all, and an answer taken from `isIntersecting` alone would drop the
 * indicator to nothing while one of those is on the line. Taking the last section to
 * have passed keeps the previous entry lit across them, which is what a reader sees,
 * and it cannot go stale: the previous behaviour only updated once a section's top
 * reached the header itself, which left "How it works" lit well into Voices.
 *
 * Rebuilt on resize, because the root margin is computed from the viewport height.
 */
/** Fraction of the viewport height the reading line sits at. */
const LINE_RATIO = 0.38;
/** Air between the sticky header and the reading line on short viewports. */
const LINE_MIN_GAP = 8;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  /** Id of the section under the header, or "" while the hero is still in front. */
  const [current, setCurrent] = useState("");
  const headerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const ids = nav.filter((item) => item.href.startsWith("#")).map((item) => item.href.slice(1));
    let frame = 0;

    const onScroll = () => {
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          setScrolled(window.scrollY > 8);
        });
      }
    };

    setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });

    if (typeof IntersectionObserver === "undefined") {
      return () => {
        if (frame) cancelAnimationFrame(frame);
        window.removeEventListener("scroll", onScroll);
      };
    }

    const viewport = () => window.innerHeight || document.documentElement.clientHeight || 1;

    /** Where the reading line sits, in pixels from the top of the viewport. */
    const readingLine = () => {
      const view = viewport();
      const header = Math.round(headerRef.current?.getBoundingClientRect().height ?? 72);
      const floor = header + LINE_MIN_GAP;
      return Math.min(Math.max(Math.round(view * LINE_RATIO), floor), Math.max(view - 2, 1));
    };

    /**
     * The last nav section whose top edge has passed the line. With contiguous
     * bands that is the section on the line; where the line is over a band that is
     * not in the nav, it is the entry the reader last passed, which is the honest
     * answer. Empty means the hero is still in front of everything.
     */
    const resolve = () => {
      const line = readingLine();
      let active = "";
      for (const id of ids) {
        const node = document.getElementById(id);
        if (node && node.getBoundingClientRect().top <= line) active = id;
      }
      setCurrent(active);
    };

    let observer: IntersectionObserver | null = null;

    const build = () => {
      observer?.disconnect();
      const view = viewport();
      const line = readingLine();
      observer = new IntersectionObserver(resolve, {
        // Collapse the root to the reading line itself, so a section crossing it is
        // the only thing that can change the answer.
        rootMargin: `${-line}px 0px ${-Math.max(view - line - 1, 0)}px 0px`,
        threshold: 0,
      });

      for (const id of ids) {
        const node = document.getElementById(id);
        if (node) observer.observe(node);
      }
    };

    let rebuild = 0;

    const onResize = () => {
      window.clearTimeout(rebuild);
      rebuild = window.setTimeout(build, 120);
    };

    build();
    window.addEventListener("resize", onResize);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(rebuild);
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // While the sheet is open: lock the page, trap Escape, and keep focus inside it.
  useEffect(() => {
    if (!open) return;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        toggleRef.current?.focus();
        return;
      }

      if (event.key !== "Tab") return;

      const focusables = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button");
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  return (
    <header
      ref={headerRef}
      className={cn(
        "sticky top-0 z-50 border-b transition-colors duration-300",
        scrolled || open ? "border-line bg-white/90 backdrop-blur-md" : "border-transparent bg-white",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-navy-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <div className="shell flex h-[4.5rem] items-center justify-between gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2.5" onClick={close}>
          <Image
            src="/brand/medurun-logo.png"
            alt={`${company.name} logo`}
            width={36}
            height={36}
            priority
            className="h-9 w-9"
          />
          <span className="font-sans text-[0.95rem] font-semibold tracking-[0.14em] text-navy-deep">
            {company.name}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              const active = item.href === `#${current}`;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "location" : undefined}
                    className={cn(
                      "relative block px-3 py-2 text-[0.83rem] transition-colors duration-300",
                      active ? "text-ink" : "text-muted hover:text-ink",
                    )}
                  >
                    {item.label}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute inset-x-3 bottom-1 block h-px bg-red transition-opacity duration-300",
                        active ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="#contact"
            className="hidden bg-red px-5 py-2.5 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-white transition-colors duration-300 hover:bg-red-dark sm:inline-flex"
          >
            Get in touch
          </Link>

          <button
            ref={toggleRef}
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="inline-flex h-10 w-10 items-center justify-center border border-line text-navy-deep transition-colors duration-300 hover:border-navy-deep lg:hidden"
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!open}
        className="border-t border-line bg-white lg:hidden"
      >
        <nav aria-label="Mobile" className="shell py-5">
          <ul className="flex flex-col">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={close}
                  aria-current={item.href === `#${current}` ? "location" : undefined}
                  className="flex items-center gap-3 border-b border-line/70 py-3.5 text-[0.95rem] text-ink"
                >
                  {/* The same readout in the sheet: a red tick beside the section
                      the page is currently on. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-px w-4 shrink-0 bg-red transition-opacity duration-300",
                      item.href === `#${current}` ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="#contact"
            onClick={close}
            className="mt-6 inline-flex w-full items-center justify-center bg-red px-5 py-3.5 text-[0.75rem] font-medium uppercase tracking-[0.14em] text-white"
          >
            Get in touch
          </Link>
        </nav>
      </div>
    </header>
  );
}
