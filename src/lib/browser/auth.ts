import { startAuthentication } from "@simplewebauthn/browser";

import { signOut } from "$lib/browser/signout";

const oAuthStatus = localStorage.getItem("oAuth");
const oAuthTryCount = Number(localStorage.getItem("oAuthTryCount")) || 0;
const lastOAuthTime = localStorage.getItem("lastOAuthTime");

export async function signIn(expectedUserId?: string): Promise<void> {
    if (oAuthStatus === "google") {
        // サーバー側のバグなどでoAuthで無限リダイレクトすることがあるのでその対策
        if (lastOAuthTime && new Date(lastOAuthTime).getTime() > Date.now() - 10 * 1000 && oAuthTryCount >= 3) {
            localStorage.removeItem("isLoggedIn");
            alert("Google OAuth authentication failed multiple times. Logging out.");
            signOut();

            return;
        }

        // 前回の試行から10秒以上経過していればカウントをリセット
        if (lastOAuthTime && new Date(lastOAuthTime).getTime() < Date.now() + 10 * 1000) {
            localStorage.removeItem("oAuthTryCount");
            localStorage.removeItem("lastOAuthTime");
        }

        localStorage.setItem("oAuthTryCount", (oAuthTryCount + 1).toString());
        localStorage.setItem("lastOAuthTime", new Date().toISOString());

        document.cookie = "auth=oAuthGoogle; SameSite=Strict; Secure";

        
        location.href = "/auth/google";

        // DO NOT REMOVE THIS
        await new Promise(resolve => setTimeout(resolve, 10 * 1000));

        return;
    } else {
        document.cookie = "auth=passkey; SameSite=Strict; Secure";
    }

    const response = await fetch("/auth/login-request");
    const loginOptions = await response.json();

    let asseResp;
    try {
        // Pass the options to the authenticator and wait for a response
        asseResp = await startAuthentication({ optionsJSON: loginOptions });
    } catch (error) {
        // Some basic error handling
        console.log("Error during authentication: " + error);
        throw error;
    }

    const verificationResp = await fetch("/auth/verify-login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(asseResp),
    });

    if (!verificationResp.ok) {
        throw new Error("Authentication failed");
    }

    if (expectedUserId && expectedUserId !== await verificationResp.text()) {
        throw new Error("User ID mismatch");
    }

    localStorage.setItem("isLoggedIn", "true");

    // 15分後に再認証
    // 実際のトークンの有効期限は60分だが、編集中にトークンが切れて保存できなくなることを防止するために15分おきに再認証させる
    localStorage.setItem(
        "nextAuthenticationTime",
        (Date.now() + 15 * 60 * 1000).toString(),
    );
}
