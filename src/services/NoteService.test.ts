import { PrismockClient } from "prismock";
import { describe, it, expect, afterEach } from "vitest";

import { NoteService } from "@/services/NoteService";

describe("NoteService test", async () => {
    const prismock = new PrismockClient();
    const noteService = new NoteService(prismock.note, prismock.noteCategory);

    afterEach(async () => {
        //@ts-ignore
        await prismock.reset();
    });

    const createUser = async (name: string): Promise<string> => {
        const created = await prismock.user.create({
            data: {
                name: name
            }
        });

        return created.id;
    };

    it("正常にノートを作成できる", async () => {
        const dummyUserName = "Raiden Mei";
        const uid = await createUser(dummyUserName);

        const categoryId = await noteService.createNoteCategory(uid, "General", "book");
        const created = await noteService.createNote(uid, "The Song of the Wind", "The wind is singing a song of freedom", categoryId);

        expect(typeof created).toBe("string");
    });

    it("正常にノートを取得できる", async () => {
        const dummyUserName = "Robin";
        const uid = await createUser(dummyUserName);

        const categoryId = await noteService.createNoteCategory(uid, "Songs", "book");
        const created = await noteService.createNote(uid, "If I can stop one heart from breaking", "Birds are born with no shackles...", categoryId);

        const fetched = await noteService.getNoteById(uid, created);
        expect(fetched!.title).toBe("If I can stop one heart from breaking");
    });

    it("他人のノートは取得できない", async () => {
        const dummyUserName = "Robin";
        const uid = await createUser(dummyUserName);

        const categoryId = await noteService.createNoteCategory(uid, "Songs", "book");
        const created = await noteService.createNote(uid, "If I can stop one heart from breaking", "Birds are born with no shackles...", categoryId);

        const otherUid = await createUser("Sunday");
        const fetched = await noteService.getNoteById(otherUid, created);
        expect(fetched).toBeNull();
    });

    it("getNoteByIdの引数がundefinedになっても他人のノートは取得できない", async () => {
        const dummyUserName = "Raiden Mei";
        const uid = await createUser(dummyUserName);

        const categoryId = await noteService.createNoteCategory(uid, "Books", "book");
        const created = await noteService.createNote(uid, "Script", "<color=\"red\">Raiden Bosenmori Mei</color>", categoryId);

        await expect((async () => {
            // @ts-expect-error
            await noteService.getNoteById(undefined, created);
        })()).rejects.toThrowError("Integrity check failed: may be caused by bug(s) or leak of credentials");
    });

    it("NoteTreeが正常に取得できる", async () => {
        const dummyUserName = "Stelle";
        const uid = await createUser(dummyUserName);

        const categoryId = await noteService.createNoteCategory(uid, "Books", "book");
        await noteService.createNote(uid, "Script", "Mommy, look! I'm on TV!", categoryId);

        const noteTree = await noteService.getNoteTreeByUserId(uid);
        expect(noteTree.length).toBe(1);
        expect(noteTree[0].notes.length).toBe(1);
        expect(noteTree[0].notes[0].title).toBe("Script");
    });


    it("getNoteTreeByUserIdの引数がundefinedでも他人のノートは取得できない", async () => {
        const dummyUserName = "r_ca";
        const uid = await createUser(dummyUserName);

        const categoryId = await noteService.createNoteCategory(uid, "Notes", "book");
        await noteService.createNote(uid, "December", "#今月まだ来てない", categoryId);

        await expect((async () => {
            // @ts-expect-error
            await noteService.getNoteTreeByUserId(undefined);
        })()).rejects.toThrowError("Integrity check failed: may be caused by bug(s) or leak of credentials");
    });
});
