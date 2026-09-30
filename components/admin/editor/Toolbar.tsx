"use client";

import { useRef, useState } from "react";
import { useEditorState, type Editor } from "@tiptap/react";
import { uploadImage } from "./upload";

const TEXT_COLORS = [
  { name: "Ink", value: "#16140F" },
  { name: "Accent red", value: "#B8321F" },
  { name: "Green", value: "#2F5D3A" },
  { name: "Muted", value: "#5B554A" },
];
const HIGHLIGHTS = [
  { name: "Yellow", value: "#F6E3A1" },
  { name: "Rose", value: "#F3D9CF" },
  { name: "Sage", value: "#DDE7DA" },
];

type Prompt =
  | { kind: "link"; value: string }
  | { kind: "image"; url: string; value: string }
  | null;

export function Toolbar({ editor }: { editor: Editor }) {
  const [prompt, setPrompt] = useState<Prompt>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const s = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      block: e.isActive("heading", { level: 2 })
        ? "h2"
        : e.isActive("heading", { level: 3 })
          ? "h3"
          : e.isActive("heading", { level: 4 })
            ? "h4"
            : "p",
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      sup: e.isActive("superscript"),
      sub: e.isActive("subscript"),
      code: e.isActive("code"),
      link: e.isActive("link"),
      linkHref: (e.getAttributes("link").href as string | undefined) ?? "",
      color: (e.getAttributes("textStyle").color as string | undefined) ?? "",
      highlight: e.isActive("highlight"),
      align: (["left", "center", "right", "justify"] as const).find((a) => e.isActive({ textAlign: a })) ?? "left",
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote") && !e.isActive("blockquote", { class: "pullquote" }),
      pullquote: e.isActive("blockquote", { class: "pullquote" }),
      factbox: e.isActive("factbox"),
      codeBlock: e.isActive("codeBlock"),
      inTable: e.isActive("table"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  const setBlock = (v: string) => {
    if (v === "p") chain().setParagraph().run();
    else chain().toggleHeading({ level: Number(v.slice(1)) as 2 | 3 | 4 }).run();
  };

  const applyLink = () => {
    if (!prompt || prompt.kind !== "link") return;
    const href = prompt.value.trim();
    if (!href) chain().extendMarkRange("link").unsetLink().run();
    else chain().extendMarkRange("link").setLink({ href: /^(https?:|mailto:|\/)/.test(href) ? href : `https://${href}` }).run();
    setPrompt(null);
  };

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setPrompt({ kind: "image", url, value: "" });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const insertImage = () => {
    if (!prompt || prompt.kind !== "image" || !prompt.value.trim()) return;
    chain().setImage({ src: prompt.url, alt: prompt.value.trim() }).run();
    setPrompt(null);
  };

  return (
    <div className="sticky top-0 z-10 -mx-[clamp(18px,3vw,36px)] border-y border-ink bg-card px-[clamp(18px,3vw,36px)] py-2">
      <div className="flex flex-wrap items-center gap-1" role="toolbar" aria-label="Formatting">
        <Btn label="Undo (⌘Z)" onClick={() => chain().undo().run()} disabled={!s.canUndo}>
          ↶
        </Btn>
        <Btn label="Redo (⌘⇧Z)" onClick={() => chain().redo().run()} disabled={!s.canRedo}>
          ↷
        </Btn>
        <Sep />
        <select
          aria-label="Text style"
          value={s.block}
          onChange={(e) => setBlock(e.target.value)}
          className="h-8 border border-rule bg-paper px-1.5 font-cond text-[13px]"
        >
          <option value="p">Paragraph</option>
          <option value="h2">Heading</option>
          <option value="h3">Subheading</option>
          <option value="h4">Kicker</option>
        </select>
        <Sep />
        <Btn label="Bold (⌘B)" active={s.bold} onClick={() => chain().toggleBold().run()}>
          <b>B</b>
        </Btn>
        <Btn label="Italic (⌘I)" active={s.italic} onClick={() => chain().toggleItalic().run()}>
          <i className="font-serif">I</i>
        </Btn>
        <Btn label="Underline (⌘U)" active={s.underline} onClick={() => chain().toggleUnderline().run()}>
          <u>U</u>
        </Btn>
        <Btn label="Strikethrough" active={s.strike} onClick={() => chain().toggleStrike().run()}>
          <s>S</s>
        </Btn>
        <Btn label="Superscript" active={s.sup} onClick={() => chain().toggleSuperscript().run()}>
          x²
        </Btn>
        <Btn label="Subscript" active={s.sub} onClick={() => chain().toggleSubscript().run()}>
          x₂
        </Btn>
        <Btn label="Inline code" active={s.code} onClick={() => chain().toggleCode().run()}>
          <span className="font-mono text-xs">{"</>"}</span>
        </Btn>
        <Sep />
        <div className="flex items-center gap-0.5" aria-label="Text colour">
          {TEXT_COLORS.map((c) => (
            <Swatch
              key={c.value}
              label={`Text colour: ${c.name}`}
              color={c.value}
              active={s.color.toLowerCase() === c.value.toLowerCase()}
              onClick={() => (c.value === "#16140F" ? chain().unsetColor().run() : chain().setColor(c.value).run())}
              text
            />
          ))}
        </div>
        <div className="ml-1 flex items-center gap-0.5" aria-label="Highlight">
          {HIGHLIGHTS.map((c) => (
            <Swatch
              key={c.value}
              label={`Highlight: ${c.name}`}
              color={c.value}
              onClick={() => chain().toggleHighlight({ color: c.value }).run()}
            />
          ))}
        </div>
        <Sep />
        <Btn
          label="Link"
          active={s.link}
          onClick={() => setPrompt(prompt?.kind === "link" ? null : { kind: "link", value: s.linkHref })}
        >
          Link
        </Btn>
        <Sep />
        {(["left", "center", "right", "justify"] as const).map((a) => (
          <Btn key={a} label={`Align ${a}`} active={s.align === a} onClick={() => chain().setTextAlign(a).run()}>
            <AlignIcon kind={a} />
          </Btn>
        ))}
        <Sep />
        <Btn label="Bulleted list" active={s.bullet} onClick={() => chain().toggleBulletList().run()}>
          • List
        </Btn>
        <Btn label="Numbered list" active={s.ordered} onClick={() => chain().toggleOrderedList().run()}>
          1. List
        </Btn>
        <Sep />
        <Btn label="Quote" active={s.quote} onClick={() => chain().toggleBlockquote().run()}>
          “ ”
        </Btn>
        <Btn label="Pull quote" active={s.pullquote} onClick={() => chain().togglePullquote().run()}>
          <span className="text-accent">Pull quote</span>
        </Btn>
        <Btn label="Fact box" active={s.factbox} onClick={() => chain().toggleFactbox().run()}>
          Fact box
        </Btn>
        <Btn label="Code block" active={s.codeBlock} onClick={() => chain().toggleCodeBlock().run()}>
          <span className="font-mono text-xs">{"{ }"}</span>
        </Btn>
        <Btn label="Divider" onClick={() => chain().setHorizontalRule().run()}>
          ―
        </Btn>
        <Sep />
        <Btn label="Insert image" onClick={() => fileRef.current?.click()} disabled={uploading}>
          {uploading ? "Uploading…" : "Image"}
        </Btn>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
          className="hidden"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <Btn label="Insert table" onClick={() => chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
          Table
        </Btn>
        <Sep />
        <Btn label="Clear formatting" onClick={() => chain().unsetAllMarks().clearNodes().run()}>
          Clear
        </Btn>
      </div>

      {s.inTable && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1 border-t border-rule pt-1.5">
          <span className="label-cond mr-1 text-muted">Table</span>
          <Btn label="Add row above" onClick={() => chain().addRowBefore().run()}>+ Row ↑</Btn>
          <Btn label="Add row below" onClick={() => chain().addRowAfter().run()}>+ Row ↓</Btn>
          <Btn label="Add column left" onClick={() => chain().addColumnBefore().run()}>+ Col ←</Btn>
          <Btn label="Add column right" onClick={() => chain().addColumnAfter().run()}>+ Col →</Btn>
          <Btn label="Delete row" onClick={() => chain().deleteRow().run()}>− Row</Btn>
          <Btn label="Delete column" onClick={() => chain().deleteColumn().run()}>− Col</Btn>
          <Btn label="Toggle header row" onClick={() => chain().toggleHeaderRow().run()}>Header</Btn>
          <Btn label="Delete table" onClick={() => chain().deleteTable().run()}>
            <span className="text-accent">Delete table</span>
          </Btn>
        </div>
      )}

      {prompt && (
        <form
          className="mt-1.5 flex flex-wrap items-center gap-2 border-t border-rule pt-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            if (prompt.kind === "link") applyLink();
            else insertImage();
          }}
        >
          <label className="label-cond text-muted" htmlFor="tb-prompt">
            {prompt.kind === "link" ? "Link URL" : "Image alt text (required)"}
          </label>
          <input
            id="tb-prompt"
            autoFocus
            value={prompt.value}
            onChange={(e) => setPrompt({ ...prompt, value: e.target.value })}
            placeholder={prompt.kind === "link" ? "https://… (empty to remove)" : "Describe what the photo shows"}
            className="min-w-[240px] flex-1 border border-ink bg-paper px-2 py-1.5 font-cond text-sm outline-none"
            onKeyDown={(e) => e.key === "Escape" && setPrompt(null)}
          />
          <button type="submit" className="cursor-pointer border-0 bg-ink px-3 py-2 font-cond text-xs font-semibold tracking-[.06em] text-paper uppercase">
            {prompt.kind === "link" ? "Apply" : "Insert"}
          </button>
          <button type="button" onClick={() => setPrompt(null)} className="cursor-pointer border-0 bg-transparent font-cond text-xs text-muted underline">
            Cancel
          </button>
        </form>
      )}
      {error && <p className="m-0 mt-1 font-cond text-sm text-accent">{error}</p>}
    </div>
  );
}

function Btn({
  children,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`h-8 min-w-8 cursor-pointer border px-2 font-cond text-[13px] leading-none font-medium disabled:cursor-default disabled:opacity-35 ${
        active ? "border-ink bg-ink text-paper" : "border-transparent bg-transparent hover:border-rule hover:bg-paper"
      }`}
    >
      {children}
    </button>
  );
}

function Swatch({
  color,
  label,
  onClick,
  active = false,
  text = false,
}: {
  color: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  text?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`flex h-7 w-6 cursor-pointer items-center justify-center border p-0 ${active ? "border-ink" : "border-transparent hover:border-rule"}`}
    >
      {text ? (
        <span className="font-serif text-base leading-none font-bold" style={{ color, borderBottom: `3px solid ${color}` }}>
          A
        </span>
      ) : (
        <span className="block h-4 w-4 border border-rule" style={{ background: color }} />
      )}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 h-5 w-px bg-rule" aria-hidden />;
}

function AlignIcon({ kind }: { kind: "left" | "center" | "right" | "justify" }) {
  const lines = {
    left: [14, 9, 14, 9],
    center: [14, 9, 14, 9],
    right: [14, 9, 14, 9],
    justify: [14, 14, 14, 14],
  }[kind];
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" aria-hidden className="inline-block">
      {lines.map((w, i) => {
        const x = kind === "center" ? (14 - w) / 2 : kind === "right" ? 14 - w : 0;
        return <rect key={i} x={x} y={i * 3} width={w} height="1.6" fill="currentColor" />;
      })}
    </svg>
  );
}
