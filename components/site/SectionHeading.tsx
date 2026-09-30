import Link from "next/link";

export function SectionHeading({ title, href, as: Tag = "h2" }: { title: string; href?: string; as?: "h1" | "h2" }) {
  return (
    <div className="mb-[18px] flex items-baseline gap-3.5">
      <Tag className="m-0 font-serif text-[30px] leading-none font-medium tracking-[-.01em]">{title}</Tag>
      <span className="h-px flex-1 bg-ink" />
      {href && (
        <Link
          href={href}
          className="font-cond text-xs leading-none font-semibold tracking-[.06em] uppercase hover:text-accent"
        >
          More →
        </Link>
      )}
    </div>
  );
}
