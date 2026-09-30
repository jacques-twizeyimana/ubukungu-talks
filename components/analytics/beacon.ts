// First-party, cookie-less analytics. The visitor id is a random UUID in
// localStorage; no IP addresses or personal data are collected.

const ENDPOINT = "/api/track";

export type TrackPayload =
  | {
      kind: "pv";
      id: string;
      path: string;
      articleId: string | null;
      vid: string;
      sid: string;
      nv: boolean;
      ref: string | null;
      w: number;
    }
  | { kind: "eng"; id: string; depth: number; activeSec: number; read: boolean };

function uuid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function trackingAllowed(): boolean {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return nav.doNotTrack !== "1" && !nav.globalPrivacyControl && !/bot|crawl|spider|headless/i.test(nav.userAgent);
}

function storageGet(store: Storage, key: string) {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}
function storageSet(store: Storage, key: string, value: string) {
  try {
    store.setItem(key, value);
  } catch {
    /* private mode */
  }
}

export function identity() {
  let nv = false;
  let vid = storageGet(localStorage, "ut_vid");
  if (!vid) {
    vid = uuid();
    nv = true;
    storageSet(localStorage, "ut_vid", vid);
  }
  let sid = storageGet(sessionStorage, "ut_sid");
  let firstInSession = false;
  if (!sid) {
    sid = uuid();
    firstInSession = true;
    storageSet(sessionStorage, "ut_sid", sid);
  }
  return { vid, sid, nv, firstInSession };
}

export function send(payload: TrackPayload) {
  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
  } catch {
    /* fall through */
  }
  fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(
    () => {},
  );
}

export function sendPageview(path: string, articleId: string | null): string | null {
  if (!trackingAllowed()) return null;
  const { vid, sid, nv, firstInSession } = identity();
  let ref: string | null = null;
  if (firstInSession && document.referrer) {
    try {
      const host = new URL(document.referrer).host;
      if (host !== location.host) ref = host;
    } catch {
      /* ignore */
    }
  }
  const id = uuid();
  send({ kind: "pv", id, path, articleId, vid, sid, nv, ref, w: window.innerWidth });
  return id;
}
