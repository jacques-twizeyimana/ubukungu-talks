import Link from "next/link";
import { ALL_SECTIONS, SITE } from "@/lib/site";

export function Footer() {
  return (
    <footer className="mt-4 border-t border-ink pt-[26px] pb-16 font-cond text-[13px] leading-[1.4] font-medium text-muted">
      <div className="flex flex-wrap justify-between gap-4">
        <Link href="/" className="font-serif text-2xl leading-none text-ink">
          {SITE.name}
        </Link>
        <span>Independent reporting on Rwanda&apos;s economy · Kigali · Reader-funded</span>
      </div>
      <nav aria-label="Footer" className="mt-5 flex flex-wrap gap-x-5 gap-y-2 uppercase tracking-[.05em]">
        {ALL_SECTIONS.map((s) => (
          <Link key={s.slug} href={`/section/${s.slug}`} className="hover:text-accent">
            {s.name}
          </Link>
        ))}
        <Link href="/essentials-index" className="hover:text-accent">
          Essentials Index
        </Link>
        <a href="/feed.xml" className="hover:text-accent">
          RSS
        </a>
      </nav>
    </footer>
  );
}
