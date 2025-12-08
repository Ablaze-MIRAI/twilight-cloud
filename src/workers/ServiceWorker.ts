/// <reference lib="webworker" />
import { generateCryptoKey } from "@/cipher/key";
import { createDecryptStream } from "@/cipher/stream";

declare const self: ServiceWorkerGlobalScope;

const VIRTUAL_PATH = "/virtual-dash/";

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith(VIRTUAL_PATH)) {
        event.respondWith(handleEncryptedStream(url));
    }
});

async function handleEncryptedStream(url: URL): Promise<Response> {
    try {
        // ファイル名抽出
        const filename = url.pathname.replace(VIRTUAL_PATH, "");

        const apiUrl = `/api/get-signed-url?filename=${filename}&method=GET`;
        const apiRes = await fetch(apiUrl);

        if (!apiRes.ok) {
            console.error(`Failed to get signed URL for ${filename}`);
            return new Response("Signed URL Error", { status: 500 });
        }

        const { url: downloadUrl } = await apiRes.json();

        const upstreamRes = await fetch(downloadUrl);

        if (!upstreamRes.ok || !upstreamRes.body) {
            return upstreamRes;
        }

        // 復号ストリームを作成
        const reader = upstreamRes.body.getReader();
        const decryptedStream = await createDecryptStream(await generateCryptoKey(), reader);

        const headers = new Headers(upstreamRes.headers);

        if (filename.endsWith(".mpd")) {
            headers.set("Content-Type", "application/dash+xml");
        } else if (filename.endsWith(".webm")) {
            headers.set("Content-Type", "video/webm");
        }

        headers.delete("Content-Length");

        return new Response(decryptedStream, {
            status: 200,
            headers: headers,
        });
    } catch (error) {
        console.error("Stream Decryption Error:", error);
        return new Response("Internal Decryption Error", { status: 500 });
    }
}

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});
