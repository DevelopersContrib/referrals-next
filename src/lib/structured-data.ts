/** Shared schema.org structured-data (JSON-LD) builders. */

export type Faq = { q: string; a: string };

/** Build a schema.org FAQPage object from a list of Q&A pairs. */
export function faqPageJsonLd(faqs: Faq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
