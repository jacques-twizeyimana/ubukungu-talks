import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageviewTracker } from "@/components/analytics/PageviewTracker";
import { getEssentialsIndex } from "@/lib/essentials";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const index = await getEssentialsIndex();
  return (
    <div className="mx-auto max-w-[1320px] px-[clamp(16px,4vw,48px)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
      >
        Skip to content
      </a>
      <Header index={index} />
      <div id="main">{children}</div>
      <Footer />
      <PageviewTracker />
    </div>
  );
}
