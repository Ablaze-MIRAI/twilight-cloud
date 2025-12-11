import { describe, expect, it } from "vitest";

import { generateCryptoKey, generateRandomIV } from "@/cipher/key";
import { createCryptoTransformStream, createDecryptStream } from "@/cipher/stream";

const testKey = await generateCryptoKey();
const testIV = await generateRandomIV();

// 全データを結合してUint8Arrayにする
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalLength += value.byteLength;
    }

    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return result;
}

// 配列を指定したサイズごとに分割してストリームとして流す (断片化のシミュレーション)
function createChunkedStream(data: Uint8Array, chunkSize: number): ReadableStream<Uint8Array> {
    let offset = 0;
    return new ReadableStream({
        pull(controller) {
            if (offset >= data.length) {
                controller.close();
                return;
            }
            const end = Math.min(offset + chunkSize, data.length);
            controller.enqueue(data.slice(offset, end));
            offset = end;
        },
    });
}

function generateRandomBytes(size: number): Uint8Array {
    const buf = new Uint8Array(size);
    crypto.getRandomValues(buf);
    return buf;
}

describe("Crypto Streams", () => {
    const IV_SIZE = 16;

    it("should encrypt and decrypt correctly (Round Trip)", async () => {
        const originalData = new TextEncoder().encode("Hello World, AES-CTR Stream!");

        // 暗号化
        const encryptStream = await createCryptoTransformStream(testKey, testIV);
        const inputStream = new ReadableStream({
            start(c) {
                c.enqueue(originalData);
                c.close();
            },
        });
        const encryptedStream = inputStream.pipeThrough(encryptStream);
        const encryptedData = await streamToBuffer(encryptedStream);

        // ストレージ形式をシミュレート (IV + EncryptedData)
        const storedData = new Uint8Array(IV_SIZE + encryptedData.length);
        storedData.set(testIV, 0);
        storedData.set(encryptedData, IV_SIZE);

        // 復号化
        const sourceStream = new ReadableStream({
            start(c) {
                c.enqueue(storedData);
                c.close();
            },
        });

        // 復号ストリームの作成 (sourceReaderを渡す)
        const decryptStream = await createDecryptStream(testKey, sourceStream.getReader());
        const decryptedData = await streamToBuffer(decryptStream);

        // 検証
        expect(new TextDecoder().decode(decryptedData)).toBe("Hello World, AES-CTR Stream!");
    });

    it("should handle small chunks (Fragmentation Test)", async () => {
        // IVの読み込みループ (while ivBytesRead < 16) をテスト
        // 1バイトずつデータを流し込む
        const originalData = generateRandomBytes(100);

        // 暗号化
        const encStream = await createCryptoTransformStream(testKey, testIV);
        const writer = encStream.writable.getWriter();
        writer.write(originalData);
        writer.close();
        const encryptedData = await streamToBuffer(encStream.readable);

        // データ結合: [IV] + [Encrypted]
        const storedData = new Uint8Array(IV_SIZE + encryptedData.length);
        storedData.set(testIV, 0);
        storedData.set(encryptedData, IV_SIZE);

        // 1バイトごとのストリームを作成
        const chunkedSource = createChunkedStream(storedData, 1);

        const decryptStream = await createDecryptStream(testKey, chunkedSource.getReader());
        const result = await streamToBuffer(decryptStream);

        expect(result).toEqual(originalData);
    });

    it("should handle boundary crossing (Split IV)", async () => {
        // IVが 10バイト + 10バイト(残りIV6バイト+データ本体4バイト) のように分かれるケース
        // if (available < needed) と else ブロックの両方を通過するパス

        const originalData = generateRandomBytes(50);

        // 暗号化
        const encStream = await createCryptoTransformStream(testKey, testIV);
        const writer = encStream.writable.getWriter();
        writer.write(originalData);
        writer.close();
        const encryptedData = await streamToBuffer(encStream.readable);

        const storedData = new Uint8Array(IV_SIZE + encryptedData.length);
        storedData.set(testIV, 0);
        storedData.set(encryptedData, IV_SIZE);

        // 10バイト単位で分割
        // 1chunk目: IVの前半10バイト (不足 -> バッファへ)
        // 2chunk目: IVの後半6バイト + データ本体4バイト (充足 -> remainder処理へ)
        const chunkedSource = createChunkedStream(storedData, 10);

        const decryptStream = await createDecryptStream(testKey, chunkedSource.getReader());
        const result = await streamToBuffer(decryptStream);

        expect(result).toEqual(originalData);
    });

    it("should handle large chunks (IV and Data in one chunk)", async () => {
        const originalData = generateRandomBytes(50);

        // 暗号化
        const encStream = await createCryptoTransformStream(testKey, testIV);
        const writer = encStream.writable.getWriter();
        writer.write(originalData);
        writer.close();
        const encryptedData = await streamToBuffer(encStream.readable);

        const storedData = new Uint8Array(IV_SIZE + encryptedData.length);
        storedData.set(testIV, 0);
        storedData.set(encryptedData, IV_SIZE);

        // 全体を1つのチャンクとして渡す
        const singleChunkStream = createChunkedStream(storedData, storedData.length);

        const decryptStream = await createDecryptStream(testKey, singleChunkStream.getReader());
        const result = await streamToBuffer(decryptStream);

        expect(result).toEqual(originalData);
    });

    it("should close correctly if stream ends before full IV", async () => {
        // 16バイト未満で終わる壊れたファイルのケース
        const brokenData = new Uint8Array([1, 2, 3]); // 3バイトしかない

        const sourceStream = new ReadableStream({
            start(c) {
                c.enqueue(brokenData);
                c.close();
            },
        });

        const decryptStream = await createDecryptStream(testKey, sourceStream.getReader());
        const result = await streamToBuffer(decryptStream);

        // 結果は空
        expect(result.length).toBe(0);
    });
});

describe("Encryption Stream Buffering Logic", () => {
    const createExpectedEncryption = async (data: Uint8Array) => {
        const stream = await createCryptoTransformStream(testKey, testIV);
        const writer = stream.writable.getWriter();
        writer.write(data);
        writer.close();
        return await streamToBuffer(stream.readable);
    };

    it("should encrypt correctly when input is fragmented into 1-byte chunks", async () => {
        const inputData = new Uint8Array(32).map((_, i) => i);

        const expected = await createExpectedEncryption(inputData);

        // 1バイトずつ流し込む
        const fragmentedSource = createChunkedStream(inputData, 1);
        const encryptStream = await createCryptoTransformStream(testKey, testIV);

        const outputStream = fragmentedSource.pipeThrough(encryptStream);
        const result = await streamToBuffer(outputStream);

        // 検証
        expect(result).toEqual(expected);
        expect(result.length).toBe(32);
    });

    it("should encrypt correctly with irregular chunk sizes (e.g., 10 bytes)", async () => {
        // 50バイトのデータ
        const inputData = new Uint8Array(50).fill(123);
        const expected = await createExpectedEncryption(inputData);

        // 10バイトずつ流す
        // 1回目(10): buffer=10 (出力なし)
        // 2回目(10): buffer=20 -> 16処理して出力, buffer=4残る
        const chunkedSource = createChunkedStream(inputData, 10);
        const encryptStream = await createCryptoTransformStream(testKey, testIV);

        const outputStream = chunkedSource.pipeThrough(encryptStream);
        const result = await streamToBuffer(outputStream);

        expect(result).toEqual(expected);
    });

    it("should handle flush correctly (data length is not multiple of 16)", async () => {
        // 17バイトのデータ (16バイト + 1バイト余り)
        // 最後の1バイトが flush() で処理されるか確認
        const inputData = new Uint8Array(17).fill(255);
        const expected = await createExpectedEncryption(inputData);

        const chunkedSource = createChunkedStream(inputData, 5); // 5バイトずつ (5, 5, 5, 2)
        const encryptStream = await createCryptoTransformStream(testKey, testIV);

        const outputStream = chunkedSource.pipeThrough(encryptStream);
        const result = await streamToBuffer(outputStream);

        expect(result).toEqual(expected);
    });
});
