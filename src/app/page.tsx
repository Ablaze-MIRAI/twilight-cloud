"use client";

import { useState } from "react";

import { TbCpu, TbKey, TbUserCircle } from "react-icons/tb";

const notes = [
    {
        id: "1",
        title: "First Note",
        content: "This is the content of the first note.",
        updatedAt: new Date(),
    },
    {
        id: "2",
        title: "Second Note",
        content: "This is the content of the second note.",
        updatedAt: new Date(),
    },
];

const FullScreenModal = ({ children }: { children: React.ReactNode }) => {
    return (
        <div className="fixed inset-0 bg-white/10 backdrop-blur-md bg-opacity-50 flex items-center justify-center z-50">
            <div className="p-6 max-w-3xl w-full">{children}</div>
        </div>
    );
};

const NoteCard = ({ title, content, updatedAt }: { title: string; content: string; updatedAt: Date }) => {
    return (
        <div className="bg-white shadow-md rounded-md p-4 hover:shadow-lg transition-shadow duration-300 hover:cursor-pointer">
            <h2 className="text-lg font-semibold mb-2">{title}</h2>
            <p className="text-gray-600 mb-4">{content}</p>
            <span className="text-sm text-gray-400">Last updated: {updatedAt.toLocaleDateString()}</span>
        </div>
    );
};

export default function Home() {
    const [useHardwareSecurityModule, setUseHardwareSecurityModule] = useState(true);

    return (
        <div className="flex min-h-screen flex-col bg-white font-sans dark:bg-black">
            <FullScreenModal>
                <h2 className="text-2xl font-bold mb-4">Decrypt Documents</h2>
                <p className="mb-6">Please enter your encryption password or use device's hardware security module to decrypt your documents.</p>
                <div>
                    <div>
                        {!useHardwareSecurityModule ? (
                            <input type="password" placeholder="Enter your password" className="w-full p-3 border border-gray-300 rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-gray-400" />
                        ) : (
                            <div className="flex flex-col justify-center items-center p-4">
                                <div className="flex gap-4">
                                    <TbCpu size={32} />
                                    <div className="flex space-x-2 justify-center items-center">
                                        <span className="sr-only">Loading...</span>
                                        <div className="h-1.5 w-1.5  bg-black rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="h-1.5 w-1.5 bg-black rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="h-1.5 w-1.5 bg-black rounded-full animate-bounce"></div>
                                    </div>
                                    <TbKey size={32} />
                                </div>
                                <p className="mt-3 mb-4">Waiting for WebAuthn...</p>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 justify-end">
                        <button type="button" className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors" onClick={() => setUseHardwareSecurityModule(!useHardwareSecurityModule)}>
                            {useHardwareSecurityModule ? "Use encryption passowrd" : "Use Hardware Security Module"}
                        </button>
                        {!useHardwareSecurityModule && (
                            <button type="button" className="bg-gray-200 text-white px-4 py-2 rounded-md hover:bg-gray-300 transition-colors">
                                Decrypt
                            </button>
                        )}
                    </div>
                </div>
            </FullScreenModal>
            <div className="flex-1">
                <div className="fixed top-0 left-0 z-50">
                    <div className="flex justify-between items-center h-12 w-screen xbg-white/50 xbackdrop-blur-2xl">
                        <div className="mx-6">
                            <div className="flex items-center gap-4">
                                <span className="font hidden">Twilight Cloud</span>
                            </div>
                        </div>
                        <div className="mx-6">
                            <div className="flex items-center gap-4 hover:cursor-pointer hover:bg-neutral-50/50 p-2 rounded-md">
                                <div className="flex gap-2 items-center">
                                    <TbUserCircle size={20} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between bg-[#f7f7f7] bg-no-repeat bg-center w-full h-64">
                    <div className="flex items-center ml-16">
                        <div className="flex flex-col gap-4">
                            <h1 className="text-2xl font-bold">My Documents</h1>
                            <p>{notes.length} Notes</p>
                        </div>
                    </div>
                    <img src="/eve-M-rtWw1OlnQ-unsplash.jpg" alt="bg" className="h-64 w-auto object-cover" />
                </div>

                <div className="px-16">
                    <div className="max-w-7xl mx-auto px-6 py-12 grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {notes.map((note) => (
                            <NoteCard key={note.id} title={note.title} content={note.content} updatedAt={note.updatedAt} />
                        ))}
                    </div>
                </div>
            </div>
            <footer className="mt-32 h-24 px-6 flex md:flex-row flex-col justify-between items-center w-full">
                <div>
                    <p className="text-sm text-muted-foreground">&copy;{new Date().getFullYear()} nexryai All rights reserved.</p>
                </div>
                <div className="md:mb-0 mb-24">
                    <p className="text-sm text-muted-foreground">Project of Ablaze</p>
                </div>
            </footer>
        </div>
    );
}
