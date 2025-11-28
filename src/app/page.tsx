import { TbUserCircle } from "react-icons/tb";

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
    return (
        <div className="flex min-h-screen flex-col bg-white font-sans dark:bg-black">
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
                    {/** biome-ignore lint/performance/noImgElement: ignore here */}
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
