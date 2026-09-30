"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { saveArticle, deleteArticle, type SaveInput } from "@/app/admin/actions";
import { ALL_SECTIONS, SITE, slugify } from "@/lib/site";
import type { Article, ArticleStatus, LeadImage } from "@/lib/types";
import { StatusPill, btnGhost, btnPrimary, btnSecondary } from "@/components/admin/ui";
import { editorExtensions } from "./extensions";
import { Toolbar } from "./Toolbar";
import { imageSize, uploadImage } from "./upload";

type Intent = SaveInput["intent"];

const fieldLabel = "label-cond flex flex-col gap-1.5 text-muted";
const field =
  "border border-ink bg-paper px-2.5 py-2.5 font-cond text-[15px] leading-none font-medium tracking-normal normal-case text-ink outline-none focus:border-accent";

export function StoryEditor({ article }: { article: Article }) {
  const [title, setTitle] = useState(article.title);
  const [dek, setDek] = useState(article.dek);
  const [section, setSection] = useState(article.section);
  const [author, setAuthor] = useState(article.author);
  const [slug, setSlug] = useState(article.slug.startsWith("draft-") ? "" : article.slug);
  const [leadImage, setLeadImage] = useState<LeadImage | null>(article.leadImage);
  const [embedIndex, setEmbedIndex] = useState(article.embedIndex);
  const [featured, setFeatured] = useState(article.featured);
  const [status, setStatus] = useState<ArticleStatus>(article.status);
  const [publishedAt, setPublishedAt] = useState(article.publishedAt);
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);
  const [pending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);

  const editor = useEditor({
    extensions: editorExtensions(),
    content: article.bodyHtml,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "article-body min-h-[420px] outline-none",
        "aria-label": "Story body",
      },
    },
    onUpdate: () => setDirty(true),
  });

  const counts = useEditorState({
    editor,
    selector: ({ editor: e }) => ({ words: e?.storage.characterCount.words() ?? article.wordCount }),
  });
  const words = counts?.words ?? 0;

  const touch = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setDirty(true);
  };

  const save = useCallback(
    (intent: Intent, opts: { silent?: boolean } = {}) =>
      new Promise<boolean>((resolve) => {
        if (!editor) return resolve(false);
        startTransition(async () => {
          const res = await saveArticle({
            id: article.id,
            title,
            dek,
            bodyHtml: editor.getHTML(),
            section,
            author,
            slug,
            leadImage,
            embedIndex,
            featured,
            intent,
          });
          if (!res.ok) {
            setMessage({ text: res.error, error: true });
            return resolve(false);
          }
          setStatus(res.status);
          setPublishedAt(res.publishedAt);
          if (!res.slug.startsWith("draft-")) setSlug(res.slug);
          setDirty(false);
          const time = new Date(res.savedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
          const text =
            intent === "publish"
              ? status === "published"
                ? `Updated live · ${time}`
                : `Published · ${time}`
              : intent === "review"
                ? `Sent for review · ${time}`
                : intent === "unpublish"
                  ? `Unpublished · ${time}`
                  : opts.silent
                    ? `Autosaved · ${time}`
                    : `Saved · ${time}`;
          setMessage({ text });
          resolve(true);
        });
      }),
    [editor, article.id, title, dek, section, author, slug, leadImage, embedIndex, featured, status],
  );

  // ⌘S / Ctrl+S saves without publishing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save("save");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  // Autosave drafts (never a live story — that would publish half-finished edits).
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);
  useEffect(() => {
    if (!dirty || status === "published") return;
    const t = window.setTimeout(() => saveRef.current("save", { silent: true }), 15_000);
    return () => window.clearTimeout(t);
  }, [dirty, status, title, dek, words]);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const onLeadFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setMessage(null);
    try {
      const [url, size] = await Promise.all([uploadImage(file), imageSize(file)]);
      setLeadImage({ url, alt: leadImage?.alt ?? "", caption: leadImage?.caption, credit: leadImage?.credit, ...(size ?? {}) });
      setDirty(true);
    } catch (e) {
      setMessage({ text: (e as Error).message, error: true });
    } finally {
      setUploading(false);
    }
  };

  const preview = async () => {
    const win = window.open("about:blank", "_blank");
    const ok = await save("save");
    if (win) {
      if (ok) win.location.href = `/preview/${article.id}`;
      else win.close();
    }
  };

  const readMins = Math.max(1, Math.round(words / 220));
  const effectiveSlug = slug || slugify(title) || "…";
  const isLive = status === "published";

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/stories" className="font-cond text-[13px] leading-none font-semibold tracking-[.06em] text-muted uppercase hover:text-accent">
          ← All stories
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <span
            aria-live="polite"
            className={`font-mono text-[13px] leading-none ${message?.error ? "text-accent" : "text-green"}`}
          >
            {pending ? "Saving…" : message?.text ?? (dirty ? "Unsaved changes" : "")}
          </span>
          <button type="button" onClick={preview} className={btnGhost} disabled={pending}>
            Preview
          </button>
          <button type="button" onClick={() => save("save")} className={btnSecondary} disabled={pending}>
            {isLive ? "Save" : "Save draft"}
          </button>
          {status === "draft" && (
            <button type="button" onClick={() => save("review")} className={btnSecondary} disabled={pending}>
              Send for review
            </button>
          )}
          <button type="button" onClick={() => save("publish")} className={btnPrimary} disabled={pending}>
            {isLive ? "Update" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-3.5 border border-ink bg-card px-[clamp(18px,3vw,36px)] pt-[clamp(18px,3vw,36px)] pb-10">
          <textarea
            value={title}
            onChange={(e) => touch(setTitle)(e.target.value.replace(/\n/g, ""))}
            placeholder="Headline"
            aria-label="Headline"
            rows={1}
            className="resize-none border-0 bg-transparent p-0 font-serif text-[38px] leading-[1.1] font-medium tracking-[-.015em] outline-none [field-sizing:content]"
          />
          <textarea
            value={dek}
            onChange={(e) => touch(setDek)(e.target.value)}
            placeholder="Standfirst — one or two sentences"
            aria-label="Standfirst"
            rows={2}
            className="resize-none border-0 bg-transparent p-0 font-serif text-xl leading-[1.4] text-body italic outline-none [field-sizing:content]"
          />
          {editor ? (
            <>
              <Toolbar editor={editor} />
              <EditorContent editor={editor} className="story-editor pt-3" />
            </>
          ) : (
            <div className="min-h-[420px] animate-pulse bg-wash/50" />
          )}
        </div>

        <aside className="flex flex-col gap-4 border border-ink bg-card px-5 py-[18px] xl:sticky xl:top-6">
          <div className={fieldLabel}>
            Status
            <span className="flex items-center gap-2 normal-case">
              <StatusPill status={status} />
              {isLive && (
                <a href={`/articles/${slug}`} target="_blank" className="font-cond text-xs tracking-normal text-accent normal-case">
                  View live ↗
                </a>
              )}
            </span>
          </div>

          <label className={fieldLabel}>
            Section
            <select value={section} onChange={(e) => touch(setSection)(e.target.value)} className={field}>
              {ALL_SECTIONS.map((s) => (
                <option key={s.slug} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>

          <label className={fieldLabel}>
            Byline
            <input value={author} onChange={(e) => touch(setAuthor)(e.target.value)} className={field} />
          </label>

          <label className={fieldLabel}>
            URL
            <input
              value={slug}
              onChange={(e) => touch(setSlug)(e.target.value)}
              onBlur={() => slug && setSlug(slugify(slug))}
              placeholder={slugify(title) || "generated-from-headline"}
              className={`${field} font-mono text-[13px]`}
            />
            {isLive && <span className="font-cond text-xs tracking-normal text-accent normal-case">Changing a live URL breaks existing links.</span>}
          </label>

          <div className={fieldLabel}>
            Lead image
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onLeadFile(e.dataTransfer.files?.[0]);
              }}
              className="relative flex cursor-pointer items-center justify-center overflow-hidden border border-dashed border-muted bg-[repeating-linear-gradient(135deg,#F3EEE4_0_10px,#EAE3D5_10px_20px)] font-cond text-[13px] leading-none tracking-normal text-ink normal-case"
              style={{ aspectRatio: "16/10" }}
            >
              {leadImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={leadImage.url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span>{uploading ? "Uploading…" : "Drop photo or click to upload"}</span>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                onChange={(e) => onLeadFile(e.target.files?.[0])}
              />
            </label>
            {leadImage && (
              <div className="flex flex-col gap-2 tracking-normal normal-case">
                <input
                  value={leadImage.alt}
                  onChange={(e) => touch(setLeadImage)({ ...leadImage, alt: e.target.value })}
                  placeholder="Alt text (required)"
                  aria-label="Lead image alt text"
                  className={field}
                />
                <input
                  value={leadImage.caption ?? ""}
                  onChange={(e) => touch(setLeadImage)({ ...leadImage, caption: e.target.value })}
                  placeholder="Caption"
                  aria-label="Caption"
                  className={field}
                />
                <input
                  value={leadImage.credit ?? ""}
                  onChange={(e) => touch(setLeadImage)({ ...leadImage, credit: e.target.value })}
                  placeholder="Credit"
                  aria-label="Credit"
                  className={field}
                />
                <button
                  type="button"
                  onClick={() => touch(setLeadImage)(null)}
                  className="cursor-pointer self-start border-0 bg-transparent p-0 font-cond text-xs text-accent underline"
                >
                  Remove image
                </button>
              </div>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 font-cond text-sm leading-[1.3] font-medium">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => touch(setFeatured)(e.target.checked)}
              className="h-[18px] w-[18px] accent-accent"
            />
            Lead story on the front page
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 font-cond text-sm leading-[1.3] font-medium">
            <input
              type="checkbox"
              checked={embedIndex}
              onChange={(e) => touch(setEmbedIndex)(e.target.checked)}
              className="h-[18px] w-[18px] accent-accent"
            />
            Embed Essentials Index box
          </label>

          <div className="border-t border-rule pt-3 font-mono text-[13px] leading-[1.4] text-muted">
            {words.toLocaleString()} words · ~{readMins} min read
            {publishedAt && (
              <>
                <br />
                First published {new Date(publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
              </>
            )}
          </div>

          <div className="flex flex-col gap-1 border-t border-rule pt-3">
            <span className="label-cond text-muted">Search preview</span>
            <span className="truncate font-cond text-xs text-green">
              {SITE.url.replace(/^https?:\/\//, "")}/articles/{effectiveSlug}
            </span>
            <span className="font-cond text-[17px] leading-tight text-[#1a0dab]">
              {(title || "Headline").slice(0, 60)}
              {title.length > 60 && "…"} · {SITE.name}
            </span>
            <span className="font-cond text-[13px] leading-snug text-body">
              {(dek || "Add a standfirst — it is used as the search and social description.").slice(0, 155)}
            </span>
            {title.length > 70 && <span className="font-cond text-xs text-accent">Headline is long for search results.</span>}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-rule pt-3">
            {isLive && (
              <button
                type="button"
                onClick={() => confirm("Take this story off the site?") && save("unpublish")}
                className="cursor-pointer border-0 bg-transparent p-0 font-cond text-xs text-muted underline hover:text-accent"
              >
                Unpublish
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (!confirm("Delete this story permanently?")) return;
                setDirty(false);
                startTransition(() => deleteArticle(article.id));
              }}
              className="cursor-pointer border-0 bg-transparent p-0 font-cond text-xs text-muted underline hover:text-accent"
            >
              Delete story
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
