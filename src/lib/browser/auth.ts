import { startAuthentication } from "@simplewebauthn/browser";


export async function signIn(expectedUserId?: string): Promise<void> {
    document.cookie = "auth=passkey; SameSite=Strict; Secure";

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
}
