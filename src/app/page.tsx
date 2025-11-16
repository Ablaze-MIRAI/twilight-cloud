import { Editor } from "@/components/editor/Editor";

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans dark:bg-black">
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 dark:bg-black sm:items-start">
                <Editor />
            </main>
        </div>
    );
}
