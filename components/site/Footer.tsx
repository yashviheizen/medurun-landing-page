import Image from "next/image";
import Link from "next/link";
import { company, legalLinks, nav } from "@/data/site";

export function Footer() {
  const footerNav = [{ label: "Home", href: "/" }, ...nav];

  return (
    <footer className="on-dark bg-navy-ink pb-10 pt-16 text-white sm:pt-20">
      <div className="shell">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/brand/medurun-logo.png"
                alt={`${company.name} logo`}
                width={40}
                height={40}
                className="h-10 w-10 rounded-full bg-white p-1"
              />
              <span className="font-sans text-[0.95rem] font-semibold tracking-[0.14em]">
                {company.name}
              </span>
            </Link>

            <p className="mt-6 font-serif text-[1.75rem] leading-tight text-white">
              {company.tagline}
            </p>
            <p className="mt-4 text-[0.9rem] leading-relaxed text-white/60">
              Powered by {company.legalName}
              <br />
              {company.descriptor}
            </p>
          </div>

          <nav aria-label="Footer">
            <ul className="grid grid-cols-2 gap-x-6 gap-y-3.5 sm:grid-cols-3">
              {footerNav.map((item) => (
                <li key={`${item.label}-${item.href}`}>
                  <Link
                    href={item.href}
                    className="text-[0.9rem] text-white/60 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/12 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.82rem] text-white/50">{company.copyright}</p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legalLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-[0.82rem] text-white/60 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
