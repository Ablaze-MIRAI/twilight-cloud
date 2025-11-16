"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";

import { EditorBubbleMenu } from "./ui/EditorMenu";
import { SideMenu } from "./ui/SideMenu";


export function Editor() {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit],
    });

    return (
        <div className="">
            <style jsx global>{`
                [contenteditable] {
                    outline: 0px solid transparent;
                }

                .ProseMirror {
                    height: calc(100% - 20px);
                    padding: 10px;

                    line-height: 1.5;
                }

                .tiptap ul,
                .tiptap ol {
                    padding: 0 1rem;
                }

                .tiptap p.is-editor-empty:first-child::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }

                .tiptap p.is-empty::before {
                    color: #adb5bd;
                    content: attr(data-placeholder);
                    float: left;
                    height: 0;
                    pointer-events: none;
                }

                .ProseMirror h1 {
                    font-size: 3rem;
                }

                .ProseMirror h2 {
                    font-size: 2rem;
                }

                .ProseMirror h3 {
                    font-size: 1.5rem;
                }

                .drag-handle {
                    align-items: center;
                    border-radius: 0.25rem;
                    margin-right: 24px;
                    cursor: grab;
                    display: flex;
                    height: 1.5rem;
                    justify-content: center;
                    width: 1.5rem;

                    svg {
                        width: 1.25rem;
                        height: 1.25rem;
                    }
                }
            `}</style>
            <div className="mb-8">
                <input id="title" name="title" type="text" className="w-full border-0 border-b-2 border-gray-50 bg-transparent py-4 text-4xl font-bold outline-none placeholder-gray-400 focus:border-gray-600 transition-colors" placeholder="Title" />
            </div>
            {editor && (
                <>
                    <BubbleMenu editor={editor}>
                        <EditorBubbleMenu editor={editor} />
                    </BubbleMenu>
                    <SideMenu editor={editor} />
                </>
            )}
            <EditorContent className="w-full min-h-screen" editor={editor} />
        </div>
    );
}
