import { Node, mergeAttributes, type Extensions } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Blockquote from "@tiptap/extension-blockquote";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Color, TextStyle } from "@tiptap/extension-text-style";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { CharacterCount, Placeholder } from "@tiptap/extensions";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pullquote: { togglePullquote: () => ReturnType };
    factbox: { toggleFactbox: () => ReturnType };
  }
}

/** Blockquote with an optional `pullquote` class — the large red quote from the design. */
const StyledBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: (el) => (el.classList.contains("pullquote") ? "pullquote" : null),
        renderHTML: (attrs) => (attrs.class ? { class: attrs.class } : {}),
      },
    };
  },
  addCommands() {
    return {
      ...this.parent?.(),
      togglePullquote:
        () =>
        ({ editor, commands, chain }) => {
          if (editor.isActive("blockquote", { class: "pullquote" })) return commands.lift("blockquote");
          if (editor.isActive("blockquote")) return commands.updateAttributes("blockquote", { class: "pullquote" });
          return chain().wrapIn("blockquote", { class: "pullquote" }).run();
        },
    };
  },
});

/** A boxed aside for key figures, definitions or "what this means for you" notes. */
const FactBox = Node.create({
  name: "factbox",
  group: "block",
  content: "block+",
  defining: true,
  parseHTML() {
    return [{ tag: "aside.factbox" }];
  },
  renderHTML({ HTMLAttributes }) {
    return ["aside", mergeAttributes(HTMLAttributes, { class: "factbox" }), 0];
  },
  addCommands() {
    return {
      toggleFactbox:
        () =>
        ({ commands }) =>
          commands.toggleWrap(this.name),
    };
  },
});

export function editorExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3, 4] },
      blockquote: false,
      link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
    }),
    StyledBlockquote,
    FactBox,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
    TextStyle,
    Color,
    Highlight.configure({ multicolor: true }),
    Subscript,
    Superscript,
    Image.configure({ inline: false, allowBase64: false }),
    TableKit.configure({ table: { resizable: false } }),
    CharacterCount,
    Placeholder.configure({ placeholder: "Write the story. Start with the person, not the percentage." }),
  ];
}
