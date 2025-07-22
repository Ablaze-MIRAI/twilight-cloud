import Elysia, { t } from "elysia";

import { generateCodeVerifier, generateState, Google } from "arctic";

// eslint-disable-next-line import/no-cycle
import { googleExternalAuthService, passkeyAuthService } from "./controller";


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

export const googleOAuth2Controller = new Elysia({prefix: "/google"})
    .get("", async ({ set, cookie: { state, linkAccountId, tokenForLinking } }) => {
        if (!googleClientId || !googleClientSecret) {
            throw new Error("AuthError: Google OAuth2 is not configured");
        }

        if (linkAccountId.value && !tokenForLinking.value) {
            throw new Error("AuthError: token is required for linking account");
        }
 
        const newState = googleExternalAuthService.generateLinkState(generateState(), linkAccountId.value, tokenForLinking.value);

        const url = googleOAuth2.createAuthorizationURL(newState, googleOAuth2CodeVerifier, ["openid", "profile"]);
        state.set({
            httpOnly: true,
            secure: true,
            maxAge: 60 * 10,
            path: "/auth/google/callback",
            value: newState
        });

        linkAccountId.set({
            value: "",
            maxAge: 0,
            secure: true,
        });

        set.status = 307;
        set.headers.location = url.toString();

        return;
    })

    .get("/callback", async ({ set, cookie: { oAuthToken, state }, query }) => {
        if (!state.value) {
            throw new Error("AuthError: state cookie is not set");
        }

        if (query.state !== state.value) {
            throw new Error("AuthError: state does not match");
        }
        
        const parsedState = googleExternalAuthService.validateLinkState(query.state);

        // Fetch Google API token
        const tokens = await googleOAuth2.validateAuthorizationCode(query.code, googleOAuth2CodeVerifier);
        const googleServiceToken = tokens.accessToken();

        if (parsedState.linkAccountId) {
            console.log("Linking account with Google OAuth2");
            if (!parsedState.token) {
                throw new Error("AuthError: token is not set");
            }

            const user = passkeyAuthService.decryptToken(parsedState.token, false);
            if (!user) {
                throw new Error("AuthError: Failed to linking account");
            }

            await googleExternalAuthService.linkAccount(googleServiceToken, user.uid);

            // clear related cookies
            state.set({
                value: "",
                httpOnly: true,
                secure: true,
                maxAge: 0,
                path: "/auth/google/callback",
            });

            return "Account linked successfully";
        }

        oAuthToken.set({
            value: await googleExternalAuthService.signIn(googleServiceToken),
            httpOnly: true,
            secure: true,
            sameSite: "strict",
            // expires: new Date(Date.now() + 30 * 60 * 1000), 
            path: "/api"
        });

        state.set({
            value: "",
            httpOnly: true,
            secure: true,
            maxAge: 0,
            path: "/auth/google/callback",
        });

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
