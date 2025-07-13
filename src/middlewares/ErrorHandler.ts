import Elysia from "elysia";

import { Prisma } from "@prisma/client";

export const errorHandler = new Elysia({ aot: false, precompile: true })
    .onError(({ code, error, set }) => {
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
    });