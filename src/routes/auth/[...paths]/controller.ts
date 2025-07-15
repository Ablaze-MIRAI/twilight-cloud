import Elysia, { t } from "elysia";

import { Prisma } from "@prisma/client";

// eslint-disable-next-line import/no-cycle
import { googleOAuth2Controller } from "./oauth";

import { oAuthAccountRepository, passkeyRepository, userRepository } from "@/prisma";
import { ExternalAuthService, PasskeyAuthService } from "@/services/AuthService";
import { UserService } from "@/services/UserService";
import { GoogleIdentService } from "@/services/internal/IdentService";


const userService = new UserService(userRepository);

export const googleExternalAuthService = new ExternalAuthService(oAuthAccountRepository, userRepository, new GoogleIdentService);
export const passkeyAuthService = new PasskeyAuthService(passkeyRepository);

export const authController = new Elysia({ prefix: "/auth", aot: false, precompile: true })
    .onError(({ code: code, error, set }) => {
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

    .use(googleOAuth2Controller)

    .post("/register-request", async ({ body, cookie: { challengeSession } }) => {
        if (process.env.DISABLE_REG === "1") {
            throw new Error("AuthError: Registration is disabled");
        }

        const user = await userService.createUser({ name: body.displayName });
        const res = await passkeyAuthService.genRegisterChallenge(user.id, body.displayName);

        challengeSession.value = res.encryptedChallenge;
        challengeSession.httpOnly = true;
        challengeSession.secure = true;
        challengeSession.sameSite = "strict";
        challengeSession.expires = new Date(Date.now() + 60 * 1000);
        challengeSession.path = "/auth/verify-registration";

        return res.options;
    }, {
        body: t.Object({
            displayName: t.String({
                error: "displayName must be a string"
            })
        })
    })

    .post("/verify-registration", async ({ body, cookie }) => {
        const encryptedChallenge = cookie.challengeSession.value;
        const ok = await passkeyAuthService.verifyRegistration(encryptedChallenge, body as unknown);
        if (!ok) {
            return new Response("Invalid challenge", { status: 400 });
        }
    }, {
        cookie: t.Object({
            challengeSession: t.String({
                error: "challengeSession must be a string"
            })
        })
    })

    .get("/login-request", async ({ cookie: { challengeSession } }) => {
        const res = await passkeyAuthService.genLoginChallenge();
        challengeSession.value = res.encryptedChallenge;
        challengeSession.httpOnly = true;
        challengeSession.secure = true;
        challengeSession.sameSite = "strict";
        challengeSession.expires = new Date(Date.now() + 60 * 1000);
        challengeSession.path = "/auth/verify-login";

        return res.options;
    })

    .post("/verify-login", async ({ body, cookie: { challengeSession, token, tokenForLinking } }) => {
        const encryptedChallenge = challengeSession.value;
        const result = await passkeyAuthService.verifyLogin(encryptedChallenge, body as unknown);

        token.set({
            value: result.token,
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            expires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            path: "/api"
        });

        tokenForLinking.set({
            value: result.token,
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            expires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            path: "/auth"
        });

        return result.uid;
    }, {
        cookie: t.Object({
            challengeSession: t.String({
                error: "challengeSession must be a string"
            }),
        })
    })

    .get("/logout", async ({ cookie: { tokenForLinking } }) => {
        tokenForLinking.set({
            value: "",
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            maxAge: 0,
            path: "/auth"
        });

        return {
            loggedOut: true
        };
    });