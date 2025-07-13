import { PrismockClient } from "prismock";
import { describe, it, expect, afterAll } from "vitest";

import { UserService } from "@/services/UserService";

describe("UserService test", async () => {
    const prismock = new PrismockClient();
    const userService = new UserService(prismock.user);

    afterAll(() => {
        //@ts-ignore
        prismock.reset();
    });

    it("正常にユーザーを作成できる", async () => {
        const dummyUserName = "Raiden Mei";
        const created = await userService.createUser({
            name: dummyUserName
        });
        const fetched = await userService.getUserById(created.id);
        expect(fetched?.name).toBe(dummyUserName);
    });

    it("正常にクイックノートを作成できる", async () => {
        const dummyUserName = "Robin";
        const dummyNoteContent = "Birds are born with no shackles, Then what fetters my fate?";

        const user = await userService.createUser({
            name: dummyUserName
        });
        await userService.updateQuickNote(user.id, dummyNoteContent);

        const fetched = await userService.getQuickNote(user.id);
        expect(fetched).toBe(dummyNoteContent);
    });

    it("正常にユーザー情報を更新できる", async () => {
        const dummyUserName = "Robin";
        const created = await userService.createUser({
            name: dummyUserName
        });

        const newUserName = "Workday";
        await userService.updateUser(created.id, {
            name: newUserName
        });

        const fetched = await userService.getUserById(created.id);
        expect(fetched?.name).toBe(newUserName);
    });
});
