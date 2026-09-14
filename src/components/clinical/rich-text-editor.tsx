"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Link2Off,
  AlignStartVertical,
  Undo2,
  Redo2,
  Eraser,
} from "lucide-react";
import { isRichHtml } from "./rich-text-view";

function toInitialHtml(value: string): string {
  if (!value) return "";
  if (isRichHtml(value)) return value;
  return value
    .split("\n\n")
    .filter(Boolean)
    .map(
      (p) =>
        `<p>${p.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`,
    )
    .join("");
}

function ToolBtn({
  label,
  active,
  disabled,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-md p-2 transition-colors hover:bg-surface-container disabled:pointer-events-none disabled:opacity-40 ${
        active ? "bg-primary/10 text-primary" : "text-on-surface-variant"
      }`}
    >
      {children}
    </button>
  );
}

const BTN = "size-4";

export function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "",
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const [html, setHtml] = useState(() => toInitialHtml(defaultValue));
  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions: [
        StarterKit,
        Underline,
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Link.configure({ openOnClick: false, autolink: true }),
      ],
      content: toInitialHtml(defaultValue),
      editorProps: { attributes: { dir: "auto", class: "tiptap-editor" } },
      onUpdate: ({ editor: e }) => setHtml(e.getHTML()),
    },
    [],
  );

  if (!editor) {
    return (
      <div className="block w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm text-muted-foreground">
        <input type="hidden" name={name} value={html} />
        …
      </div>
    );
  }

  const toggleLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("URL", "https://");
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="block w-full overflow-hidden rounded-lg border border-input bg-transparent outline-none focus-within:ring-2 focus-within:ring-primary/30">
      <input type="hidden" name={name} value={html} />
      <div dir="ltr" className="flex flex-wrap items-center gap-0.5 border-b border-input p-1.5">
        <ToolBtn label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Underline" active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Subheading" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Align" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().toggleTextAlign("center").run()}>
          <AlignStartVertical className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Link" active={editor.isActive("link")} onClick={toggleLink}>
          {editor.isActive("link") ? (
            <Link2Off className={BTN} aria-hidden="true" />
          ) : (
            <LinkIcon className={BTN} aria-hidden="true" />
          )}
        </ToolBtn>
        <ToolBtn label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
          <Eraser className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className={BTN} aria-hidden="true" />
        </ToolBtn>
        <ToolBtn label="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className={BTN} aria-hidden="true" />
        </ToolBtn>
      </div>
      <EditorContent
        editor={editor}
        placeholder={placeholder}
        className="min-h-32 px-2.5 py-1.5 text-base outline-none md:text-sm [&_.tiptap-editor]:min-h-32 [&_.tiptap-editor]:outline-none [&_.tiptap-editor_h2]:text-lg [&_.tiptap-editor_h2]:font-bold [&_.tiptap-editor_h3]:text-base [&_.tiptap-editor_h3]:font-bold [&_.tiptap-editor_ul]:list-disc [&_.tiptap-editor_ul]:ps-5 [&_.tiptap-editor_ol]:list-decimal [&_.tiptap-editor_ol]:ps-5 [&_.tiptap-editor_a]:text-primary [&_.tiptap-editor_a]:underline [&_.tiptap-editor_blockquote]:border-s-2 [&_.tiptap-editor_blockquote]:border-primary/40 [&_.tiptap-editor_blockquote]:ps-3 [&_.tiptap-editor_p.is-editor-empty:first-child::before]:text-muted-foreground [&_.tiptap-editor_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap-editor_p.is-editor-empty:first-child::before]:float-start [&_.tiptap-editor_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  );
}
