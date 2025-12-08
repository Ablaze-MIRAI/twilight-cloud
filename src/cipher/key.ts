export async function generateCryptoKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: "AES-CTR",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"],
    );
}

export function generateRandomIV(): Uint8Array {
    const iv = new Uint8Array(16);
    // 前半8バイトをランダムなNonceにする
    // 後半8バイトはCounter (初期値0) として残す
    crypto.getRandomValues(iv.subarray(0, 8));
    return iv;
}
