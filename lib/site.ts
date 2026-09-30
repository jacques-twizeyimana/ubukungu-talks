export const SITE = {
  name: "Ubukungu Talks",
  motto: "The economy, as it's lived — not as it's reported.",
  description:
    "Independent, reader-funded reporting on Rwanda's economy as people live it: inflation, the cost of living, jobs, rent and the price of beans — not GDP growth alone.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  coffeeUrl: process.env.NEXT_PUBLIC_COFFEE_URL ?? "https://www.buymeacoffee.com/ubukungutalks",
  locale: "en_RW",
  timeZone: "Africa/Kigali",
  /** First issue went out the week of this date; the masthead counts weekly issues from it. */
  firstIssue: new Date("2024-01-03T00:00:00+02:00"),
};

export const SECTIONS = [
  { name: "Cost of living", slug: "cost-of-living" },
  { name: "Jobs", slug: "jobs" },
  { name: "Agriculture", slug: "agriculture" },
  { name: "Health", slug: "health" },
  { name: "Transport", slug: "transport" },
  { name: "Policy", slug: "policy" },
] as const;

export const ALL_SECTIONS = [...SECTIONS, { name: "Opinion", slug: "opinion" }] as const;

export function sectionSlug(name: string): string {
  return ALL_SECTIONS.find((s) => s.name === name)?.slug ?? slugify(name);
}

export function sectionBySlug(slug: string) {
  return ALL_SECTIONS.find((s) => s.slug === slug);
}

export function slugify(input: string): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’'"“”]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return trimSlug(slug);
}

/** Keep slugs under 80 characters, cutting at a word boundary. */
function trimSlug(slug: string, max = 80): string {
  if (slug.length <= max) return slug;
  const cut = slug.slice(0, max + 1);
  const i = cut.lastIndexOf("-");
  return (i > 20 ? cut.slice(0, i) : slug.slice(0, max)).replace(/-+$/g, "");
}

export function absoluteUrl(path = "/"): string {
  return `${SITE.url}${path.startsWith("/") ? path : `/${path}`}`;
}
