import Elysia, { t } from "elysia";

import { Prisma } from "@prisma/client";

import { noteCategoryRepository, noteRepository, oAuthAccountRepository, passkeyRepository, userRepository } from "@/prisma";
import { ExternalAuthService, PasskeyAuthService } from "@/services/AuthService";
import { NoteService } from "@/services/NoteService";
import { UserService } from "@/services/UserService";
import { GoogleIdentService } from "@/services/internal/IdentService";


const userService = new UserService(userRepository);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const googleExternalAuthService = new ExternalAuthService(oAuthAccountRepository, userRepository, new GoogleIdentService);
const passkeyAuthService = new PasskeyAuthService(passkeyRepository);

const noteService = new NoteService(noteRepository, noteCategoryRepository);    

export const apiController = new Elysia({ prefix: "/api", aot: false, precompile: true })
    .onError(({ code: code, error, set }) => {
        if (code == "NOT_FOUND") {
            set.status = 404;
            return "Not found";
        }

        if (code == "VALIDATION") {
            set.status = 400;
            return "Invalid request";
        }

        if (code == 401) {
            set.status = 401;
            return "Unauthorized";
        }

        // AuthErrorは401にする
        if (error instanceof Error && (error.message.startsWith("AuthError:") || error.message.startsWith("Authentication"))) {
            console.log("Authentication failed:", error.message);
            set.status = 401;
            return "Unauthorized";
        }

        // Prismaのエラーをハンドル
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === "P2002") {
                // Unique constraint failed
                set.status = 409;
                return "Conflict";
            }

            console.error(`UNEXPECTED PRISMA ERROR OCCURRED: ${error.code}`);
        }

        // 想定されないエラーは全部500
        console.error(`ERROR OCCURRED: ${error}`);
        console.error("===== STACK =====");
        // @ts-expect-error
        console.error(error.stack);
        console.error("=================");
        set.status = 500;
        return "An unexpected error occurred. The request was aborted.";
    })
    .derive(({ cookie: { token } }) => {
        // Auth middleware
        if (!token || !token.value) {
            throw new Error("AuthError: token not found");
        }

        const user = passkeyAuthService.decryptToken(token.value, false);
        if (!user) {
            throw new Error("AuthError: token is invalid");
        }

        return {
            uid: user.uid,
        };
    })
    .get("/me", async ({ uid }) => {
        return await userService.getUserById(uid);
    })

    .put("/me/quick-note", async ({ uid, body }) => {
        await userService.updateQuickNote(uid, body.content);
        return {
            saved: true
        };
    }, {
        body: t.Object({
            content: t.String({
                error: "content must be a string"
            })
        })
    })

    .get("/me/quick-note", async ({ uid }) => {
        const note = await userService.getQuickNote(uid);
        return {
            content: note
        };
    })

    .post("/me/promote-quick-note", async ({ uid, body }) => {
        const quickNoteContent = await userService.getQuickNote(uid);
        const created = await noteService.createNote(uid, body.title, quickNoteContent, body.categoryId);
        await userService.updateQuickNote(uid, "");
        return { created };
    }, {
        body: t.Object({
            categoryId: t.String({
                error: "id must be a string"
            }),
            title: t.String({
                error: "title must be a string"
            })
        })
    })

    .post("/note/create", async ({ uid, body }) => {
        const created = await noteService.createNote(uid, body.title, body.content, body.categoryId);
        return {
            id: created
        };
    }, {
        body: t.Object({
            title: t.String({
                error: "title must be a string"
            }),
            content: t.String({
                error: "content must be a string"
            }),
            categoryId: t.String({
                error: "categoryId must be a string"
            })
        })
    })

    .get("/note/tree", async ({ uid }) => {
        return await noteService.getNoteTreeByUserId(uid);
    })

    .post("/note/create-category", async ({ uid, body }) => {
        const categoryId = await noteService.createNoteCategory(uid, body.name, body.iconName);
        return {
            id: categoryId
        };
    }, {
        body: t.Object({
            name: t.String({
                error: "name must be a string"
            }),
            iconName: t.String({
                error: "iconName must be a string"
            })
        })
    })

    .get("/note/categories", async ({ uid }) => {
        return await noteService.getNoteCategoriesByUserId(uid);
    })

    // catch-allなので最後に置く
    .get("/note/:noteId", async ({ uid, params }) => {
        return await noteService.getNoteById(uid, params.noteId);
    }, {
        params: t.Object({
            noteId: t.String({
                error: "noteId must be a string"
            })
        })
    })

    .put("/note/:noteId", async ({ uid, params, body }) => {
        const updated = await noteService.updateNoteById(uid, params.noteId, body.title, body.content);
        return { ok: updated };
    }, {
        params: t.Object({
            noteId: t.String({
                error: "noteId must be a string"
            })
        }),
        body: t.Object({
            title: t.String({
                error: "title must be a string"
            }),
            content: t.String({
                error: "content must be a string"
            })
        })
    })

    .delete("/note/:noteId", async ({ uid, params }) => {
        const deleted = await noteService.deleteNoteById(uid, params.noteId);
        return { ok: deleted };
    }, {
        params: t.Object({
            noteId: t.String({
                error: "noteId must be a string"
            })
        })
    });