import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Newsroom sign in", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { next } = await searchParams;
  return (
    <main className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-[400px] border border-paper/20 bg-paper p-8">
        <div className="font-serif text-3xl leading-none font-medium">Ubukungu Talks</div>
        <div className="mt-1 mb-7 font-mono text-xs text-muted">Newsroom</div>
        <LoginForm next={typeof next === "string" ? next : "/admin"} />
      </div>
    </main>
  );
}
