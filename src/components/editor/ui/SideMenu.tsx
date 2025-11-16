import { offset } from "@floating-ui/dom";
import DragHandle from "@tiptap/extension-drag-handle-react";
import type { Editor } from "@tiptap/react";

type Props = {
    editor: Editor;
};

const ActionButton = ({ children, isAction }: { children: React.ReactNode; isAction?: boolean }) => {
    return <div className={`p-0.5 rounded hover:bg-gray-100 transition-colors ${isAction ? "cursor-pointer" : "cursor-grab"}`}>{children}</div>;
};

export function SideMenu({ editor }: Props) {
    return (
        <>
            <style jsx global>{`
                .drag-handle {
                    color: #8b8b8b;
                    align-items: center;
                    border-radius: 0.25rem;
                    margin-right: 24px;
                    cursor: grab;
                    display: flex;
                    height: 1.5rem;
                    justify-content: center;
                    width: 1.5rem;

                    svg {
                        width:  18px;
                        height:  18px;
                    }
                }
            `}</style>
            <DragHandle
                editor={editor}
                computePositionConfig={{
                    placement: "left-end",
                    strategy: "fixed",
                    middleware: [offset(32)],
                }}
            >
                <div className="flex gap-1">
                    <ActionButton isAction>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.0" stroke="currentColor">
                            <title>Insert Content</title>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                    </ActionButton>
                    <ActionButton>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.0" stroke="currentColor">
                            <title>Drag Handle</title>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9h16.5m-16.5 6.75h16.5" />
                        </svg>
                    </ActionButton>
                </div>
            </DragHandle>
        </>
    );
}
