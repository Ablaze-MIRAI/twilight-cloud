import Elysia, { type MaybePromise } from "elysia";

import { AppModule } from "$lib/server/AppModule";
import { noteCategoryRepository, noteRepository, passkeyRepository, userRepository } from "$lib/server/prisma";
import { PasskeyAuthService } from "$lib/server/services/AuthService";
import { NoteService } from "$lib/server/services/NoteService";
import { UserService } from "$lib/server/services/UserService";

export function getServer(): (request: Request) => MaybePromise<Response> {
    const server = new Elysia();
    const app = new AppModule(
        server,
        new UserService(
            userRepository
        ),
        new NoteService(
            noteRepository,
            noteCategoryRepository
        ),
        new PasskeyAuthService(
            passkeyRepository
        )
    );

    app.configAuthRouter();
    app.configApiRouter();
    return server.fetch;
}
