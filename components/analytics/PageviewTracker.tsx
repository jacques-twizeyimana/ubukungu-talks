"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { sendPageview } from "./beacon";

/** Records a pageview on every client-side navigation. Article pages are handled by ArticleReadTracker. */
export function PageviewTracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname || pathname.startsWith("/articles/")) return;
    sendPageview(pathname, null);
  }, [pathname]);
  return null;
}
