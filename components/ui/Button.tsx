import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost";
/** `square` is the editorial default of this art direction; `pill` stays available. */
type Shape = "square" | "pill";

// One explicit transition-property list: `transition-colors` followed by
// `transition-transform` used to emit two competing declarations, and the
// transform one won — so the hover colour change snapped instead of easing.
const base =
  "inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-[0.8125rem] font-medium uppercase tracking-[0.12em] transition-[transform,box-shadow,background-color,border-color,color] duration-200 ease-out motion-safe:hover:-translate-y-[2px] motion-safe:active:translate-y-0";

const shapes: Record<Shape, string> = {
  square: "rounded-none",
  pill: "rounded-full",
};

// Every hover state has a `focus-visible` twin: keyboard users get the same
// change of contrast the pointer does, on top of the global focus ring.
const variants: Record<Variant, string> = {
  primary: "bg-red text-white hover:bg-red-dark focus-visible:bg-red-dark",
  secondary:
    "border border-navy/25 bg-white text-navy-deep hover:border-navy hover:bg-navy-tint focus-visible:border-navy focus-visible:bg-navy-tint",
  ghost:
    "border border-white/35 text-white hover:border-white hover:bg-white/[0.14] focus-visible:border-white focus-visible:bg-white/[0.14]",
};

export function Button({
  href,
  variant = "primary",
  shape = "square",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  shape?: Shape;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, shapes[shape], variants[variant], className)}>
      {children}
    </Link>
  );
}
