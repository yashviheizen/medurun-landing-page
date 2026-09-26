import { ArrowUpRight, Phone } from "lucide-react";
import { Section } from "@/components/ui/Section";
import { Reveal } from "@/components/ui/Reveal";
import { company, contact, emails } from "@/data/site";

const mailboxes = [emails.support, emails.business, emails.operations];

/**
 * The closing band. One action is dominant — the helpline, set as the largest type
 * on the page after the hero headline — with the mailboxes and website underneath it
 * as plain secondary links. The address and the legal entity keep their own ruled
 * row so they are still easy to find rather than pushed into the footer.
 *
 * The only motion here is two rings around the helpline icon, played once when the
 * band is first read, and the mailbox arrow's half-step on hover or keyboard focus.
 * A closing band that keeps moving is a closing band nobody closes on.
 */
export function Contact() {
  return (
    <Section id="contact" tone="deep" texture>
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-0">
        <Reveal className="lg:col-span-5">
          <p className="op-label op-label--rail">
            <span className="tabular-nums text-red">09</span>
            <span>{contact.eyebrow}</span>
          </p>

          <h2 className="mt-6 text-[2.1rem] leading-[1.06] text-white sm:text-[2.7rem] lg:text-[3.1rem]">
            {contact.heading}
          </h2>

          <p className="mt-5 max-w-md text-base leading-relaxed text-white/70 sm:text-lg">
            {contact.body}
          </p>
        </Reveal>

        <div className="lg:col-span-6 lg:col-start-7">
          <Reveal>
            <p className="op-label">
              <span>Helpline</span>
            </p>

            {/* The primary action. A text link rather than a button: at this size the
                type is the button. */}
            <a
              href={company.helplineHref}
              className="group mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 font-serif text-[2.1rem] leading-none text-white transition-colors duration-300 hover:text-red sm:text-[2.9rem]"
            >
              <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center border border-white/25 text-red transition-colors duration-300 group-hover:border-red">
                {/* Two rings, once, when the band is first read: the helpline
                    answering rather than an indicator blinking for attention.
                    Non-interactive, so the whole plate stays clickable. */}
                <span
                  aria-hidden="true"
                  className="phone-ring pointer-events-none absolute inset-0 rounded-full border border-red/45"
                />
                <span
                  aria-hidden="true"
                  className="phone-ring phone-ring--second pointer-events-none absolute inset-0 rounded-full border border-red/30"
                />
                <Phone size={17} aria-hidden="true" className="relative" />
              </span>
              {company.helpline}
            </a>
          </Reveal>

          <Reveal delay={60}>
            <ul className="mt-11">
              {mailboxes.map((mailbox) => (
                <li key={mailbox.address} className="border-t border-white/15 last:border-b">
                  <a
                    href={`mailto:${mailbox.address}`}
                    className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-4 transition-colors duration-300 hover:text-red"
                  >
                    <span className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-white/50 transition-colors duration-300 group-hover:text-red">
                      {mailbox.label}
                    </span>
                    <span className="inline-flex items-center gap-2 text-[0.95rem] text-white transition-colors duration-300 group-hover:text-red">
                      {mailbox.address}
                      <ArrowUpRight
                        size={14}
                        aria-hidden="true"
                        className="shrink-0 transition-transform duration-300 motion-safe:group-hover:translate-x-0.5 motion-safe:group-focus-visible:translate-x-0.5"
                      />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={90}>
            <div className="mt-10 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="op-label">
                  <span>Registered office</span>
                </p>
                <address className="mt-3 max-w-[34ch] not-italic text-[0.9rem] leading-relaxed text-white/65">
                  {company.address}
                </address>
              </div>

              <div>
                <p className="op-label">
                  <span>Entity &amp; website</span>
                </p>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-white/65">
                  {company.legalName}
                </p>
                <a
                  href={company.websiteHref}
                  className="mt-2 inline-flex items-center gap-2 text-[0.9rem] text-white underline decoration-white/30 underline-offset-4 transition-colors duration-300 hover:text-red hover:decoration-red"
                >
                  {company.website}
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
