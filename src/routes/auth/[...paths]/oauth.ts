import Elysia, { t } from "elysia";

import { generateCodeVerifier, generateState, Google } from "arctic";

import { oAuthAccountRepository, passkeyRepository, userRepository } from "@/prisma";
import { ExternalAuthService, PasskeyAuthService } from "@/services/AuthService";
import { GoogleIdentService } from "@/services/internal/IdentService";


const googleExternalAuthService = new ExternalAuthService(oAuthAccountRepository, userRepository, new GoogleIdentService);
export const passkeyAuthService = new PasskeyAuthService(passkeyRepository);


const appUrl = process.env.APP_URL || "http://localhost:5173";
const googleClientId = process.env.OAUTH2_GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.OAUTH2_GOOGLE_CLIENT_SECRET || "";

const googleOAuth2RedirectUrl = `${appUrl}/auth/google/callback`;
const googleOAuth2CodeVerifier = generateCodeVerifier();
const googleOAuth2 = new Google(
    googleClientId,
    googleClientSecret,
    googleOAuth2RedirectUrl
);

export const googleOAuth2Controller = new Elysia({prefix: "/auth/google"})
    .get("", async ({ set, cookie: { state } }) => {
        if (!googleClientId || !googleClientSecret) {
            throw new Error("AuthError: Google OAuth2 is not configured");
        }

        const newState = generateState();

        const url = googleOAuth2.createAuthorizationURL(newState, googleOAuth2CodeVerifier, ["openid", "profile"]);
        state.set({
            httpOnly: true,
            secure: true,
            maxAge: 60 * 10,
            path: "/",
            value: newState
        });

        set.status = 307;
        set.headers.location = url.toString();

        return;
    })

    .get("/callback", async ({ set, cookie: { oAuthToken, state, token, linkAccountId }, query }) => {
        if (query.state !== state.value) {
            throw new Error("AuthError: state does not match");
        }

        // Fetch Google API token
        const tokens = await googleOAuth2.validateAuthorizationCode(query.code, googleOAuth2CodeVerifier);
        const googleServiceToken = tokens.accessToken();

        if (linkAccountId.value && token.value) {
            const user = passkeyAuthService.decryptToken(token.value, false);
            if (!user || user.uid !== linkAccountId.value) {
                throw new Error("AuthError: User ID does not match on linking account");
            }

            await googleExternalAuthService.linkAccount(googleServiceToken, user.uid);

            // clear the linkAccountId cookie
            linkAccountId.value = "";
            linkAccountId.httpOnly = true;
            linkAccountId.secure = true;
            linkAccountId.sameSite = "strict";
            linkAccountId.expires = new Date(0);
            linkAccountId.path = "/auth/google/callback";
        }

        oAuthToken.value = await googleExternalAuthService.signIn(googleServiceToken);
        oAuthToken.httpOnly = true;
        oAuthToken.secure = true;
        oAuthToken.sameSite = "strict";
        oAuthToken.expires = new Date(Date.now() + 30 * 60 * 1000);
        oAuthToken.path = "/api";

        set.status = 302;
        set.headers.location = "/";

        return "OK";
    }, {
        cookie: t.Object({
            state: t.String({
                error: "state must be a string"
            }),
        }),
        query: t.Object({
            code: t.String({
                error: "code must be a string"
            }),
            state: t.String({
                error: "state must be a string"
            }),
            scope: t.String({
                error: "scope must be a string"
            }),
            prompt: t.String({
                error: "prompt must be a string"
            }),
            authuser: t.Number({
                error: "authuser must be a number"
            })
        })
    });
