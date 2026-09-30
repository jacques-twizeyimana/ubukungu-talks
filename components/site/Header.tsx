import Link from "next/link";
import { SECTIONS, SITE } from "@/lib/site";
import { mastheadDate } from "@/lib/format";
import type { EssentialsIndex } from "@/lib/essentials";

export function Header({ index }: { index: EssentialsIndex | null }) {
  const { date, issue } = mastheadDate();
  return (
    <header className="pt-4">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 font-cond text-xs leading-none font-medium tracking-[.06em] text-muted uppercase">
        <span>
          {date} · Kigali · Issue No. {issue}
        </span>
        <div className="flex items-center gap-[18px]">
          {index && (
            <Link href="/essentials-index" className="text-ink hover:text-accent">
              Essentials Index{" "}
              <span className="text-accent">
                {index.valueF} {index.chg12}
              </span>
            </Link>
          )}
          <Link href="/#newsletter" className="hover:text-ink">
            Newsletter
          </Link>
          <a
            href={SITE.coffeeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ink px-3 py-2 text-paper hover:bg-accent"
          >
            Buy us a coffee
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 items-center gap-5 border-y border-ink pt-5 pb-4 md:grid-cols-[1fr_auto_1fr]">
        <p className="m-0 hidden max-w-[220px] font-serif text-[15px] leading-[1.35] text-muted italic md:block">
          “{SITE.motto}”
        </p>
        <Link
          href="/"
          className="text-center font-serif text-[clamp(44px,8vw,104px)] leading-[.9] font-medium tracking-[-.035em] whitespace-nowrap"
          aria-label={`${SITE.name} — front page`}
        >
          {SITE.name}
        </Link>
        <div className="hidden justify-self-end text-right font-cond text-xs leading-normal font-medium tracking-[.05em] text-muted uppercase md:block">
          Independent · Reader-funded
          <br />
          Est. Kigali
        </div>
      </div>

      <nav
        aria-label="Sections"
        className="flex flex-wrap justify-center gap-x-[26px] gap-y-1.5 border-b-[3px] border-double border-ink py-[11px] font-cond text-sm leading-none font-semibold tracking-[.04em] uppercase"
      >
        <Link href="/" className="py-1 hover:text-accent">
          Front page
        </Link>
        {SECTIONS.map((s) => (
          <Link key={s.slug} href={`/section/${s.slug}`} className="py-1 hover:text-accent">
            {s.name}
          </Link>
        ))}
        <Link href="/essentials-index" className="bg-accent px-2 py-1 text-white hover:bg-accent-dark">
          Essentials Index
        </Link>
      </nav>
    </header>
  );
}
