/** Single source for identity, contact and link facts. Public-safe values only. */
export const site = {
  name: 'Arnav Patnaik',
  title: "Arnav's Archive",
  description:
    "Hi, I'm Arnav Patnaik, a data analyst exploring how data, technology, and sustainability come together to shape decisions, systems, and real-world impact.",
  tagline: 'I turn complex environmental and business data into decisions, products, and stories people can use.',
  locale: 'en',
  /** Location per the CV (baseline). The earlier résumé said Pune; see docs/01-content-audit.md, item C1. */
  location: 'Brussels, Belgium',
  email: 'patnaikarnav3@gmail.com',
  links: {
    linkedin: 'https://www.linkedin.com/in/arnavpatnaik/',
    github: 'https://github.com/kuchbhiarnav',
    researchgate: 'https://www.researchgate.net/profile/Arnav-Patnaik',
  },
  cv: { href: '/cv/Arnav-Patnaik-CV.pdf', file: 'Arnav-Patnaik-CV.pdf', updated: 'October 2026', updatedIso: '2026-10-30' },
  /** Public GA4 measurement ID. Loaded only after the visitor consents (see components/ConsentBanner). */
  analyticsId: 'G-4C1Y2YKWNK',
} as const;

export type Status = 'verified' | 'owner-supplied' | 'needs-review';
