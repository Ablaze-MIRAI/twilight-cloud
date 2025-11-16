import { Extension } from "@tiptap/core";
import { Suggestion, type SuggestionOptions } from "@tiptap/suggestion";

import { suggestionConfig } from "./SlashCommandList";


type SlashCommandOptions = {
    suggestion: Partial<SuggestionOptions>;
};

export const SlashCommand = Extension.create<SlashCommandOptions>({
    name: "me.nexryai.twilight-cloud/slashCommand",
    addOptions() {
        return {
            suggestion: suggestionConfig,
        };
    },
    addProseMirrorPlugins() {
        return [
            Suggestion({
                editor: this.editor,
                ...this.options.suggestion,
            }),
        ];
    },
});
