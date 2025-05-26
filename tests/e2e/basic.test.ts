import { test, expect } from "@playwright/test";

test.describe("Before login", () => {
    test("titleが設定されている", async ({page}) => {
        await page.goto("/");
        await expect(page).toHaveTitle(/Twilight/);
    });

    test("未ログインの場合Welcomeページが表示される", async ({page}) => {
        await page.goto("/");

        const h1Text = await page.locator("h1").textContent();
        expect(h1Text).toBe("Welcome back");
    });

    test("パスキー（WebAuthn）でサインアップ => サインインできる", async ({ browserName, page }, testInfo) => {
        test.skip(browserName !== "chromium", "This test runs only in Chromium");
        await page.goto("/");

        // Virtual Authenticatorを追加
        const cdpSession = await page.context().newCDPSession(page);
        await cdpSession.send("WebAuthn.enable");
        await cdpSession.send("WebAuthn.addVirtualAuthenticator", {
            options: {
                protocol: "ctap2",
                ctap2Version: "ctap2_1",
                hasUserVerification: true,
                transport: "internal",
                automaticPresenceSimulation: true,
                isUserVerified: true,
                hasResidentKey: true,
            }
        });

        cdpSession.on("WebAuthn.credentialAdded", () => {
            console.log("Credential Added!");
        });

        // サインアップする
        await page.click("#sign-up-button");
        await page.fill("#name", "Test User");
        await page.click("#terms");
        const beforeSignUpScreenshot = await page.screenshot();
        await testInfo.attach("Before sign-up", {
            body: beforeSignUpScreenshot,
            contentType: "image/png",
        });

        await page.click("#sign-up-submit-button");
        await page.waitForTimeout(10);
        const afterSignUpScreenshot = await page.screenshot();
        await testInfo.attach("After click sign-up button", {
            body: afterSignUpScreenshot,
            contentType: "image/png",
        });

        // やたら時間がかかることがある
        await page.waitForTimeout(8000);
        await page.reload();

        // サインインする
        await page.click("#button-sign-in-with-passkey");
        await page.waitForTimeout(500);
        const afterSignInScreenshot = await page.screenshot();
        await testInfo.attach("After click sign-in button", {
            body: afterSignInScreenshot,
            contentType: "image/png",
        });

        // 自動的にリダイレクトされるので待つ
        await page.waitForTimeout(8000);
        const appScreenshot = await page.screenshot();
        await testInfo.attach("After sign-in", {
            body: appScreenshot,
            contentType: "image/png",
        });

        // 成功していればサイドバーがあるはず
        expect(await page.locator("#myurion-app-sidebar").count()).toBeGreaterThan(0);
    });
});
