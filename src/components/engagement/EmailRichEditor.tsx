"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect } from "react";

type Props = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  disabled?: boolean;
};

function Btn({
  onClick,
  active,
  title,
  children,
  disabled,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      className={`admin-rte-btn${active ? " active" : ""}`}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="admin-rte-sep" aria-hidden />;
}

/** TipTap WYSIWYG for engagement email bodies. */
export default function EmailRichEditor({
  content,
  onChange,
  placeholder = "Write the email…",
  minHeight = 220,
  disabled,
}: Props) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: false,
        underline: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "admin-rte-link" },
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: false,
        HTMLAttributes: { style: "max-width:100%;height:auto;" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || "",
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
    editorProps: {
      attributes: {
        class: "admin-rte-content",
        style: `min-height:${minHeight}px`,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content || "", { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href ?? "";
    const url = window.prompt("Link URL:", prev);
    if (url === null) return;
    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().setLink({ href: url }).run();
  }, [editor]);

  const insertToken = useCallback(
    (token: string) => {
      editor?.chain().focus().insertContent(token).run();
    },
    [editor]
  );

  if (!editor) {
    return <div className="admin-rte muted">Loading editor…</div>;
  }

  return (
    <div className={`admin-rte${disabled ? " disabled" : ""}`}>
      <div className="admin-rte-toolbar">
        <Btn
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </Btn>
        <Btn
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </Btn>
        <Btn
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span style={{ textDecoration: "underline" }}>U</span>
        </Btn>
        <Sep />
        <Btn
          title="Heading"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Btn>
        <Btn
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          • List
        </Btn>
        <Btn
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </Btn>
        <Sep />
        <Btn title="Link" active={editor.isActive("link")} onClick={setLink}>
          Link
        </Btn>
        <Sep />
        <Btn title="Insert first name" onClick={() => insertToken("{{firstname}}")}>
          {"{{firstname}}"}
        </Btn>
        <Btn title="Insert site URL" onClick={() => insertToken("{{siteUrl}}")}>
          {"{{siteUrl}}"}
        </Btn>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
