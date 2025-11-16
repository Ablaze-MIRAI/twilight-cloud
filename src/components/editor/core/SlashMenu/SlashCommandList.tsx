// SlashCommandList.tsx
import React, { type ForwardRefRenderFunction, forwardRef, useEffect, useImperativeHandle, useState } from "react";

import type { Editor, Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance, type Props as TippyProps } from "tippy.js";


interface CommandItem {
    title: string;
    icon: string;
    command: ({ editor, range }: { editor: Editor; range: Range }) => void;
}

interface SlashCommandListRef {
    onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

const getCommandItems = (): CommandItem[] => [
    {
        title: "Heading 1",
        icon: "H1",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
        },
    },
    {
        title: "Heading 2",
        icon: "H2",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
        },
    },
    {
        title: "Bullet List",
        icon: "List",
        command: ({ editor, range }) => {
            editor.chain().focus().deleteRange(range).toggleBulletList().run();
        },
    },
];

export const suggestionConfig: Omit<SuggestionOptions<CommandItem>, "editor"> = {
    // トリガーとなる文字
    char: "/",

    items: ({ query }: { query?: string }): CommandItem[] => {
        const commands = getCommandItems();
        if (!query) {
            return commands.slice(0, 10);
        }

        return commands.filter((item) => item.title.toLowerCase().startsWith(query.toLowerCase())).slice(0, 10);
    },

    render: () => {
        let reactRenderer: ReactRenderer<SlashCommandListRef>;
        let popup: TippyInstance<TippyProps>[];

        return {
            // サジェスト開始時
            onStart: (props: SuggestionProps<CommandItem>) => {
                reactRenderer = new ReactRenderer(SlashCommandList, {
                    props: props,
                    editor: props.editor,
                });

                if (!props.clientRect) {
                    return;
                }

                const instance = tippy(document.body, {
                    getReferenceClientRect: () => props.clientRect?.() || new DOMRect(),
                    appendTo: () => document.body,
                    content: reactRenderer.element,
                    showOnCreate: true,
                    interactive: true,
                    trigger: "manual",
                    placement: "bottom-start",
                });

                // Normalize to an array so the rest of the code can use popup[0]
                popup = Array.isArray(instance) ? instance : [instance];
            },

            // サジェスト内容更新時
            onUpdate(props: SuggestionProps<CommandItem>) {
                reactRenderer.updateProps(props);

                if (!props.clientRect) {
                    return;
                }

                popup[0].setProps({
                    //@ts-expect-error
                    getReferenceClientRect: props.clientRect,
                });
            },

            // キー入力時
            onKeyDown(props: { event: KeyboardEvent }) {
                if (props.event.key === "Escape") {
                    popup[0].hide();
                    return true;
                }

                // Reactコンポーネント側(SlashCommandList)のonKeyDownを呼び出す
                return reactRenderer.ref?.onKeyDown(props) || false;
            },

            // サジェスト終了時
            onExit() {
                if (popup) popup[0].destroy();
                if (reactRenderer) reactRenderer.destroy();
            },
        };
    },

    // アイテムが選択されたときのコマンド
    command: ({ editor, range, props }) => {
        // propsは CommandItem 型
        props.command({ editor, range });
    },
};

// このコンポーネントが受け取るPropsの型
// SuggestionProps を拡張
interface SlashCommandListProps extends SuggestionProps {
    // items は suggestionConfig の items() の戻り値の型
    items: {
        title: string;
        icon: string;
        // biome-ignore lint/suspicious/noExplicitAny: ignore types
        command: (props: any) => void;
    }[];
}

// スタイルの型定義
const styles: { [key: string]: React.CSSProperties } = {
    container: {
        background: "white",
        border: "1px solid #ddd",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        padding: "8px",
        minWidth: "200px",
    },
    item: {
        display: "block",
        width: "100%",
        textAlign: "left",
        background: "transparent",
        border: "none",
        padding: "4px 8px",
        borderRadius: "4px",
        cursor: "pointer",
    },
    selectedItem: {
        background: "#f0f0f0",
    },
};

const SlashCommandListComponent: ForwardRefRenderFunction<SlashCommandListRef, SlashCommandListProps> = (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    // アイテム選択（実行）
    const selectItem = (index: number) => {
        const item = props.items[index];
        if (item) {
            props.command(item); // suggestionConfigのcommandを実行
        }
    };

    // キーボード操作
    const upHandler = () => {
        setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    // 項目が変わったら選択をリセット
    // biome-ignore lint/correctness/useExhaustiveDependencies: とりあえず無視
    useEffect(() => setSelectedIndex(0), [props.items]);

    // Tiptap (suggestion.ts) 側からこのコンポーネントの関数を呼び出せるようにする
    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }: { event: KeyboardEvent }): boolean => {
            if (event.key === "ArrowUp") {
                upHandler();
                return true;
            }
            if (event.key === "ArrowDown") {
                downHandler();
                return true;
            }
            if (event.key === "Enter") {
                enterHandler();
                return true;
            }
            return false;
        },
    }));

    return (
        <div style={styles.container}>
            {props.items.length > 0 ? (
                props.items.map((item, index) => (
                    <button
                        type="button"
                        style={{
                            ...styles.item,
                            ...(index === selectedIndex ? styles.selectedItem : {}),
                        }}
                        key={`${index}-${item.title}`}
                        onClick={() => selectItem(index)}
                    >
                        {item.icon} {item.title}
                    </button>
                ))
            ) : (
                <div style={styles.item}>No results</div>
            )}
        </div>
    );
};

const SlashCommandList = forwardRef(SlashCommandListComponent);
export default SlashCommandList;
