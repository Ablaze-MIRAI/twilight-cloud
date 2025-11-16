import type { Editor } from "@tiptap/react";
import { FaBold, FaItalic, FaStrikethrough, FaUnderline } from "react-icons/fa6";

type Props = {
    editor: Editor;
};

const activeColor = "#1B88FF";
const inactiveColor = "#181E26";

// Childrenを引き受ける
const ActionButton = ({ children }: { children: React.ReactNode }) => {
    return <div className="p-2 rounded hover:bg-gray-100 transition-colors">{children}</div>;
};

export function EditorBubbleMenu({ editor }: Props) {
    return (
        <div className="flex gap-1 rounded shadow-lg bg-white p-2">
            <ActionButton>
                <FaBold
                    color={editor.isActive("bold") ? activeColor : inactiveColor}
                    onClick={() => {
                        editor.chain().focus().toggleBold().run();
                    }}
                    size="12"
                />
            </ActionButton>

            <ActionButton>
                <FaItalic
                    color={editor.isActive("italic") ? activeColor : inactiveColor}
                    onClick={() => {
                        editor.chain().focus().toggleItalic().run();
                    }}
                    size="12"
                />
            </ActionButton>

            <ActionButton>
                <FaUnderline
                    color={editor.isActive("underline") ? activeColor : inactiveColor}
                    onClick={() => {
                        editor.chain().focus().toggleUnderline().run();
                    }}
                    size="12"
                />
            </ActionButton>

            <ActionButton>
                <FaStrikethrough
                    color={editor.isActive("strike") ? activeColor : inactiveColor}
                    onClick={() => {
                        editor.chain().focus().toggleStrike().run();
                    }}
                    size="12"
                />
            </ActionButton>
        </div>
    );
}
