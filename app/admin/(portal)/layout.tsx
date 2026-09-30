import type { Metadata } from "next";
import Link from "next/link";
import { requireEditor } from "@/lib/auth";
import { logout } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  title: { default: "Newsroom", template: "%s · Newsroom" },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireEditor();
  return (
    <div className="flex min-h-screen flex-col bg-paper font-cond md:flex-row">
      <aside className="flex flex-none flex-col gap-1 bg-ink px-3.5 py-[22px] text-paper md:sticky md:top-0 md:h-screen md:w-[220px]">
        <Link href="/admin" className="px-2.5 pb-1 font-serif text-2xl leading-none font-medium">
          Ubukungu Talks
        </Link>
        <div className="px-2.5 pb-4 font-mono text-[11px] leading-none font-medium text-faint md:pb-[22px]">Newsroom</div>
        <AdminNav />
        <div className="mt-4 flex items-end justify-between gap-2 border-t border-body px-2.5 pt-3.5 font-cond text-[13px] leading-[1.4] text-faint md:mt-auto">
          <span>
            Signed in as
            <br />
            <span className="text-paper">{session.name}</span>
          </span>
          <form action={logout}>
            <button className="cursor-pointer border-0 bg-transparent p-0 text-faint underline hover:text-paper">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-[clamp(18px,3vw,40px)] pt-7 pb-24">{children}</main>
    </div>
  );
}
