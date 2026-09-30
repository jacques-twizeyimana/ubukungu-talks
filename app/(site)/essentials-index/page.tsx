import type { Metadata } from "next";
import Link from "next/link";
import { getEssentialsIndex } from "@/lib/essentials";
import { getIndexStories } from "@/lib/articles";
import { absoluteUrl } from "@/lib/site";
import { Sparkline } from "@/components/site/Sparkline";
import { JsonLd } from "@/components/site/JsonLd";
import { IndexTable } from "./IndexTable";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Essentials Index — what life costs in Kigali",
  description:
    "The Ubukungu Essentials Index: monthly market prices for beans, milk, rent, moto fares and other everyday essentials in Kigali, ranked by how much each has risen in a year.",
  alternates: { canonical: "/essentials-index" },
};

export default async function EssentialsIndexPage() {
  const [index, stories] = await Promise.all([getEssentialsIndex(), getIndexStories(4)]);
  if (!index) {
    return <main className="py-24 text-center font-serif text-2xl text-muted">The index is being compiled.</main>;
  }

  return (
    <main className="pt-[30px] pb-5">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Dataset",
          name: "Ubukungu Essentials Index",
          description: `Monthly median prices of ${index.items.length} household essentials in Kigali, Rwanda.`,
          url: absoluteUrl("/essentials-index"),
          temporalCoverage: `${index.firstMonth}/${index.lastMonth}`,
          spatialCoverage: "Kigali, Rwanda",
          variableMeasured: index.items.map((i) => `${i.name} price (RWF per ${i.unit})`),
        }}
      />
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,380px),1fr))] items-end gap-8 border-b border-ink pb-[26px]">
        <div className="flex flex-col gap-3.5">
          <span className="kicker text-xs text-accent">
            The Ubukungu Essentials Index · Updated {index.lastLabelLong}
          </span>
          <h1 className="balance m-0 font-serif text-[clamp(40px,5.5vw,72px)] leading-[.98] font-medium tracking-[-.03em]">
            What life costs in Kigali, item by item.
          </h1>
          <p className="pretty m-0 max-w-[560px] font-serif text-[19px] leading-[1.45] text-body">
            {index.items.length} essentials, priced every month at city markets, stations and clinics. Ranked by how
            much each has risen since {index.firstLabel}.
          </p>
        </div>
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap items-baseline gap-3.5">
            <span className="font-serif text-[88px] leading-[.9] font-medium tracking-[-.03em]">{index.valueF}</span>
            <div className="flex flex-col gap-1.5 font-mono text-sm leading-none font-medium text-accent">
              <span>{index.chg12} 12 mo</span>
              <span>{index.chg1} 1 mo</span>
            </div>
          </div>
          <Sparkline
            points={index.spark}
            width={2.5}
            baseline
            className="h-[110px] w-full border-b border-ink"
            label={`Index moved from 100 in ${index.firstLabel} to ${index.valueF} in ${index.lastLabel}`}
          />
          <div className="flex justify-between font-mono text-xs leading-none text-muted">
            <span>{index.firstLabel} = 100</span>
            <span>{index.lastLabel}</span>
          </div>
        </div>
      </div>

      <IndexTable items={index.items} firstLabel={index.firstLabel} lastLabel={index.lastLabel} />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,300px),1fr))] gap-8 pt-[30px] pb-2.5">
        <div className="flex flex-col gap-2">
          <h2 className="kicker m-0 text-xs">Methodology</h2>
          <p className="m-0 font-serif text-[15px] leading-normal text-body">
            Prices are the median of three quotes collected in the last week of each month. The index weights each
            item by its share of a typical Kigali young-adult household budget, with {index.firstLabel} set to 100.
          </p>
        </div>
        {stories.length > 0 && (
          <div className="flex flex-col">
            <h2 className="kicker m-0 pb-1.5 text-xs">Reporting from the index</h2>
            {stories.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${a.slug}`}
                className="border-b border-rule py-2.5 font-serif text-lg leading-[1.25] font-medium hover:text-accent"
              >
                {a.title}
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
