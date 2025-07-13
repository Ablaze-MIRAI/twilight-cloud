import { randomBytes } from "node:crypto";

import { describe, it, expect } from "vitest";

import { UnsafeDebugAuthService } from "@/services/AuthService";


describe("AuthService test", () => {
    const authService = new UnsafeDebugAuthService();

    it("App Tokenを正常に生成できる", () => {
        const uid = "DUMMY_USER_ID";
        const encrypted = authService.genAppToken(uid);
        const decrypted = authService.decryptAppToken(encrypted);
        expect(decrypted?.uid).toBe(uid);
    });

    it("App Tokenが改ざんされていたら検証に失敗する", () => {
        const uid = "DUMMY_USER_ID";
        const encrypted = authService.genAppToken(uid);

        const dataBuffer = Buffer.from(encrypted, "base64");

        // データの分割: authTag + iv + encryptedData
        const authTag = dataBuffer.subarray(0, 48); // 最初の48バイトはHMAC-SHA384
        const iv = dataBuffer.subarray(48, 64); // 次の16バイトはIV
        const encryptedText = dataBuffer.subarray(64); // 残りが暗号化データ

        const invalidAuthTagToken = Buffer.concat([randomBytes(48), iv, encryptedText]).toString("base64");
        expect(
            () => authService.decryptAppToken(invalidAuthTagToken),
            "authTagが偽装されている場合エラーになる"
        ).toThrow("Authentication failed: HMAC does not match");

        const invalidIvToken = Buffer.concat([authTag, randomBytes(16), encryptedText]).toString("base64");
        expect(
            () => authService.decryptAppToken(invalidIvToken),
            "ivが偽装されている場合エラーになる"
        ).toThrow("Authentication failed: HMAC does not match");

        const invalidEncryptedTextToken = Buffer.concat([authTag, iv, randomBytes(encryptedText.length)]).toString("base64");
        expect(
            () => authService.decryptAppToken(invalidEncryptedTextToken),
            "encryptedTextが不正な場合エラーになる"
        ).toThrow("Authentication failed: HMAC does not match");
    });

    it("App Tokenの有効期限が切れていたらnullを返す", () => {
        const uid = "DUMMY_USER_ID";
        const longLongAgo = new Date(0);
        const encrypted = authService.genAppToken(uid, longLongAgo);
        const decrypted = authService.decryptAppToken(encrypted);
        expect(decrypted).toBeNull();
    });

    it("Challenge Tokenを正常に生成できる", () => {
        const uid = "DUMMY_USER_ID";
        const challenge = "DUMMY_CHALLENGE";
        const encrypted = authService.genChallengeToken(uid, challenge);
        const decrypted = authService.decryptChallengeToken(encrypted);
        expect(decrypted?.uid).toBe(uid);
        expect(decrypted?.challenge).toBe(challenge);
    });

    it("Challenge Tokenが改ざんされていたら検証に失敗する", () => {
        const uid = "DUMMY_USER_ID";
        const challenge = "DUMMY_CHALLENGE";
        const encrypted = authService.genChallengeToken(uid, challenge);

        const dataBuffer = Buffer.from(encrypted, "base64");

        // データの分割: authTag + iv + encryptedData
        const authTag = dataBuffer.subarray(0, 48); // 最初の48バイトはHMAC-SHA384
        const iv = dataBuffer.subarray(48, 64); // 次の16バイトはIV
        const encryptedText = dataBuffer.subarray(64); // 残りが暗号化データ

        const invalidAuthTagToken = Buffer.concat([randomBytes(48), iv, encryptedText]).toString("base64");
        expect(
            () => authService.decryptAppToken(invalidAuthTagToken),
            "authTagが偽装されている場合エラーになる"
        ).toThrow("Authentication failed: HMAC does not match");

        const invalidIvToken = Buffer.concat([authTag, randomBytes(16), encryptedText]).toString("base64");
        expect(
            () => authService.decryptAppToken(invalidIvToken),
            "ivが偽装されている場合エラーになる"
        ).toThrow("Authentication failed: HMAC does not match");

        const invalidEncryptedTextToken = Buffer.concat([authTag, iv, randomBytes(encryptedText.length)]).toString("base64");
        expect(
            () => authService.decryptAppToken(invalidEncryptedTextToken),
            "encryptedTextが不正な場合エラーになる"
        ).toThrow("Authentication failed: HMAC does not match");
    });

    it("Challenge Tokenの有効期限が切れていたらnullを返す", () => {
        const uid = "DUMMY_USER_ID";
        const challenge = "DUMMY_CHALLENGE";
        const longLongAgo = new Date(0);
        const encrypted = authService.genChallengeToken(uid, challenge, longLongAgo);
        const decrypted = authService.decryptChallengeToken(encrypted);
        expect(decrypted).toBeNull();
    });

    it("App TokenをChallenge Tokenとして渡すとエラーになる", () => {
        const uid = "DUMMY_USER_ID";
        const encrypted = authService.genAppToken(uid);
        expect(() => authService.decryptChallengeToken(encrypted)).toThrow();
    });

    it("Challenge TokenをApp Tokenとして渡すとエラーになる", () => {
        const uid = "DUMMY_USER_ID";
        const challenge = "DUMMY_CHALLENGE";
        const encrypted = authService.genChallengeToken(uid, challenge);
        expect(() => authService.decryptAppToken(encrypted)).toThrow();
    });
});
