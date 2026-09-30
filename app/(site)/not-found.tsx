import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-[640px] flex-col items-center gap-4 py-24 text-center">
      <span className="kicker text-xs text-accent">404</span>
      <h1 className="m-0 font-serif text-5xl leading-none font-medium">This page is out of stock.</h1>
      <p className="m-0 font-serif text-xl text-body">The story may have moved, or the link is mistyped.</p>
      <Link href="/" className="font-cond text-sm font-semibold tracking-[.06em] text-accent uppercase">
        Back to the front page →
      </Link>
    </main>
  );
}
