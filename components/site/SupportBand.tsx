import { SITE } from "@/lib/site";
import { NewsletterForm } from "./NewsletterForm";

export function SupportBand() {
  return (
    <section
      id="newsletter"
      className="my-9 grid scroll-mt-6 grid-cols-[repeat(auto-fit,minmax(min(100%,320px),1fr))] items-center gap-8 bg-ink p-[clamp(28px,5vw,52px)] text-paper"
    >
      <div>
        <h2 className="m-0 mb-3 font-serif text-[clamp(28px,3.4vw,42px)] leading-[1.05] font-medium tracking-[-.01em]">
          No paywall. No sponsors in the newsroom.
        </h2>
        <p className="m-0 font-serif text-lg leading-normal text-[#CFC7B8]">
          Funded by readers. The price of a coffee keeps one more cost-of-living story in print.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <NewsletterForm />
        <a
          href={SITE.coffeeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-accent px-[18px] py-[15px] text-center font-cond text-sm leading-none font-semibold tracking-[.06em] text-white uppercase hover:bg-accent-dark"
        >
          Support on Buy Me a Coffee
        </a>
      </div>
    </section>
  );
}
