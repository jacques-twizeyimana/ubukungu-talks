"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { send, sendPageview } from "./beacon";

const IDLE_AFTER_MS = 45_000;
const HEARTBEAT_MS = 15_000;

/**
 * Measures how a reader moves through one article:
 *  - depth: furthest point of the article body that reached the bottom of the viewport (0–1)
 *  - activeSec: seconds the tab was visible, focused and not idle
 *  - read: depth ≥ 80% and enough active time for a genuine read (not a fast scroll)
 * Values are sent as they grow and flushed when the page is hidden or left.
 */
export function ArticleReadTracker({
  articleId,
  readingMinutes,
  bodyId = "article-body",
}: {
  articleId: string;
  readingMinutes: number;
  bodyId?: string;
}) {
  const pathname = usePathname();

  useEffect(() => {
    const pvid = sendPageview(pathname, articleId);
    if (!pvid) return;

    const minActive = Math.max(20, readingMinutes * 60 * 0.35);
    let depth = 0;
    let activeSec = 0;
    let read = false;
    let lastInteraction = Date.now();
    let lastSent = { depth: 0, activeSec: 0, read: false };

    const measure = () => {
      const el = document.getElementById(bodyId);
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const seen = (window.innerHeight - rect.top) / Math.max(rect.height, 1);
      depth = Math.max(depth, Math.min(1, Math.max(0, seen)));
    };

    const flush = () => {
      read = read || (depth >= 0.8 && activeSec >= minActive);
      const rounded = Math.round(depth * 100) / 100;
      if (rounded === lastSent.depth && activeSec === lastSent.activeSec && read === lastSent.read) return;
      lastSent = { depth: rounded, activeSec, read };
      send({ kind: "eng", id: pvid, depth: rounded, activeSec, read });
    };

    const onActivity = () => {
      lastInteraction = Date.now();
    };
    const onScroll = () => {
      onActivity();
      measure();
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };

    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible" && document.hasFocus() && Date.now() - lastInteraction < IDLE_AFTER_MS) {
        activeSec += 1;
        if (!read && depth >= 0.8 && activeSec >= minActive) flush();
      }
    }, 1000);
    const heartbeat = window.setInterval(flush, HEARTBEAT_MS);

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    for (const e of ["mousemove", "keydown", "touchstart", "pointerdown"]) {
      window.addEventListener(e, onActivity, { passive: true });
    }
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);

    return () => {
      flush();
      window.clearInterval(tick);
      window.clearInterval(heartbeat);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      for (const e of ["mousemove", "keydown", "touchstart", "pointerdown"]) {
        window.removeEventListener(e, onActivity);
      }
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
    };
  }, [pathname, articleId, readingMinutes, bodyId]);

  return null;
}
