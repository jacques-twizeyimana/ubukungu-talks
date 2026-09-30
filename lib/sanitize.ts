import "server-only";
import sanitizeHtml from "sanitize-html";

const colorValue = [/^#[0-9a-f]{3,8}$/i, /^rgba?\([\d\s.,%]+\)$/i, /^var\(--[\w-]+\)$/i];

/**
 * Whitelist for the article body. Mirrors what the Tiptap editor can produce;
 * anything else (scripts, event handlers, arbitrary styles) is dropped.
 */
export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: [
      "p", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "sub", "sup", "mark", "span",
      "a", "ul", "ol", "li", "blockquote", "hr", "br", "code", "pre",
      "figure", "figcaption", "img",
      "table", "thead", "tbody", "tr", "th", "td", "colgroup", "col",
      "aside",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height", "loading", "decoding"],
      blockquote: ["class"],
      aside: ["class"],
      p: ["style"],
      h2: ["style"],
      h3: ["style"],
      h4: ["style"],
      mark: ["style", "data-color"],
      span: ["style"],
      th: ["colspan", "rowspan", "colwidth", "style"],
      td: ["colspan", "rowspan", "colwidth", "style"],
      col: ["style"],
      figure: ["class"],
    },
    allowedClasses: {
      blockquote: ["pullquote"],
      aside: ["factbox"],
      figure: ["wide"],
    },
    allowedStyles: {
      "*": {
        "text-align": [/^(left|right|center|justify)$/],
        color: colorValue,
        "background-color": colorValue,
      },
      col: { width: [/^\d+(px|%)$/], "min-width": [/^\d+(px|%)$/] },
      td: { width: [/^\d+(px|%)$/] },
      th: { width: [/^\d+(px|%)$/] },
    },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesByTag: { img: ["http", "https"] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => {
        const href = attribs.href ?? "#";
        const external = /^https?:\/\//.test(href);
        const attrs: sanitizeHtml.Attributes = external ? { href, target: "_blank", rel: "noopener noreferrer" } : { href };
        return { tagName, attribs: attrs };
      },
      img: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, loading: "lazy", decoding: "async" },
      }),
    },
    // Root-relative image paths (our own /api/media/...) are allowed.
    exclusiveFilter: (frame) =>
      frame.tag === "img" && !/^(https?:\/\/|\/api\/media\/)/.test(frame.attribs.src ?? ""),
  });
}

/** Plain text with paragraph breaks, used for search snippets, word counts and JSON-LD. */
export function htmlToText(html: string): string {
  return sanitizeHtml(
    html
      .replace(/<\/(p|h[1-6]|li|blockquote|figcaption|tr|aside)>/gi, "\n\n")
      .replace(/<br\s*\/?>/gi, "\n"),
    { allowedTags: [], allowedAttributes: {} },
  )
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*/g, "\n\n")
    .trim();
}
