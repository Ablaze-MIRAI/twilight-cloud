import Elysia, { t } from "elysia";

import { errorHandler } from "@/middlewares/ErrorHandler";
import { oAuthAccountRepository, passkeyRepository, userRepository } from "@/prisma";
import { ExternalAuthService, PasskeyAuthService } from "@/services/AuthService";
import { UserService } from "@/services/UserService";
import { GoogleIdentService } from "@/services/internal/IdentService";


const userService = new UserService(userRepository);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const googleExternalAuthService = new ExternalAuthService(oAuthAccountRepository, userRepository, new GoogleIdentService);
const passkeyAuthService = new PasskeyAuthService(passkeyRepository);

export const authController = new Elysia({ prefix: "/auth", aot: false, precompile: true })
    .use(errorHandler)
    .post("/register-request", async ({ body, cookie: { challengeSession } }) => {
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

    .post("/verify-login", async ({ body, cookie: { challengeSession, token } }) => {
        const encryptedChallenge = challengeSession.value;
        const result = await passkeyAuthService.verifyLogin(encryptedChallenge, body as unknown);

        token.value = result.token;
        token.httpOnly = true;
        token.secure = true;
        token.sameSite = "strict";
        token.expires = new Date(Date.now() + 30 * 60 * 1000);
        token.path = "/api";

        return result.uid;
    }, {
        cookie: t.Object({
            challengeSession: t.String({
                error: "challengeSession must be a string"
            }),
        })
    })

    .get("/logout", async ({ cookie: { token } }) => {
        token.value = "";
        token.httpOnly = true;
        token.secure = true;
        token.sameSite = "strict";
        token.expires = new Date(0);
        token.path = "/api";

        return {
            loggedOut: true
        };
    });