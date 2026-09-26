import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

/**
 * Shared shell for the Privacy Policy and Terms pages so the footer links resolve
 * to real, readable documents rather than 404s.
 */
export function LegalPage({
  title,
  updated,
  paragraphs,
}: {
  title: string;
  updated?: string;
  paragraphs: string[];
}) {
  return (
    <>
      <Header />
      <main id="main">
        <div className="shell max-w-3xl py-16 sm:py-20 lg:py-24">
          <h1 className="text-[2.25rem] leading-tight sm:text-[3rem]">{title}</h1>
          {updated ? <p className="mt-4 text-sm text-muted">{updated}</p> : null}

          <div className="mt-10 space-y-5">
            {paragraphs.map((paragraph, index) => {
              // Short all-caps lines in the source documents are section headings.
              const isHeading =
                paragraph.length < 90 && paragraph === paragraph.toUpperCase() && /[A-Z]/.test(paragraph);

              return isHeading ? (
                <h2 key={index} className="pt-6 text-[1.5rem] leading-snug">
                  {paragraph}
                </h2>
              ) : (
                <p key={index} className="text-[0.95rem] leading-relaxed text-muted">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
