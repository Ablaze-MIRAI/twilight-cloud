
import { FaArrowRotateLeft, FaArrowRotateRight } from "react-icons/fa6";
import { TbHomeFilled } from "react-icons/tb";

import { Editor } from "@/components/editor/Editor";

const HeaderButton = ({ children }: { children: React.ReactNode }) => {
    return (
        <button type="button" className="rounded-md p-2 hover:bg-gray-200">
            {children}
        </button>
    );
};

export default function Home() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-white font-sans dark:bg-black">
            <div className="fixed top-0 left-0 z-50">
                <div className="flex justify-between items-center h-12 w-screen bg-white/50 backdrop-blur-2xl">
                    <div className="mx-6">
                        <div className="flex items-center gap-4">
                            <span className="font-bold">Twilight Cloud</span>
                            <div>
                                <HeaderButton>
                                    <TbHomeFilled />
                                </HeaderButton>
                            </div>
                        </div>
                    </div>
                    <div className="mx-6">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <HeaderButton>
                                    <FaArrowRotateLeft />
                                </HeaderButton>
                                <HeaderButton>
                                    <FaArrowRotateRight />
                                </HeaderButton>
                            </div>
                            <span className="text-gray-500">65534 chars</span>
                        </div>
                    </div>
                </div>
            </div>
            <main className="flex min-h-screen w-full max-w-3xl flex-col items-center justify-between py-32 px-16 dark:bg-black sm:items-start">
                <Editor />
            </main>
        </div>
    );
}
