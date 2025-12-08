import { calculateCounter } from "./counter";

export async function createCryptoTransformStream(key: CryptoKey, baseIv: Uint8Array, startOffset = 0) {
    let currentOffset = startOffset;
    let buffer = new Uint8Array(0);

    return new TransformStream({
        async transform(chunk, controller) {
            // バッファに結合
            const newBuffer = new Uint8Array(buffer.length + chunk.byteLength);
            newBuffer.set(buffer);
            newBuffer.set(chunk, buffer.length);
            buffer = newBuffer;

            // 16バイト(1ブロック)以上溜まったら送り出す
            if (buffer.length >= 16) {
                // 処理可能な最大バイト数 (16の倍数)
                const processLength = Math.floor(buffer.length / 16) * 16;

                const chunkToProcess = buffer.slice(0, processLength);
                buffer = buffer.slice(processLength); // 残りをバッファに戻す

                // 暗号化
                const counter = calculateCounter(baseIv, currentOffset);
                const processed = await crypto.subtle.encrypt({ name: "AES-CTR", counter: counter as BufferSource, length: 64 }, key, chunkToProcess);

                // オフセット更新
                currentOffset += chunkToProcess.byteLength;
                controller.enqueue(new Uint8Array(processed));
            }
        },

        async flush(controller) {
            // バッファに残った端数（16バイト未満）を処理
            if (buffer.length > 0) {
                const counter = calculateCounter(baseIv, currentOffset);
                const processed = await crypto.subtle.encrypt({ name: "AES-CTR", counter: counter as BufferSource, length: 64 }, key, buffer);

                // 残りを出力
                controller.enqueue(new Uint8Array(processed));
            }
        },
    });
}

export async function createDecryptStream(key: CryptoKey, sourceReader: ReadableStreamDefaultReader<Uint8Array>) {
    return new ReadableStream({
        async start(controller) {
            let buffer = new Uint8Array(0);
            let baseIv: Uint8Array | null = null;
            let currentOffset = 0; // 復号済みデータのバイト数 (IV除く)

            const appendBuffer = (newData: Uint8Array) => {
                const newBuffer = new Uint8Array(buffer.length + newData.length);
                newBuffer.set(buffer);
                newBuffer.set(newData, buffer.length);
                buffer = newBuffer;
            };

            while (true) {
                const { value, done } = await sourceReader.read();

                if (done) {
                    // ストリーム終了時
                    if (!baseIv) {
                        // IVを読み切れずに終わった場合
                        controller.close();
                        return;
                    }

                    // バッファに残っている端数を処理
                    if (buffer.length > 0) {
                        const counter = calculateCounter(baseIv, currentOffset);
                        const decrypted = await crypto.subtle.decrypt({ name: "AES-CTR", counter: counter as BufferSource, length: 64 }, key, buffer);
                        controller.enqueue(new Uint8Array(decrypted));
                    }
                    controller.close();
                    break;
                }

                appendBuffer(value);

                // IV未取得の場合
                if (!baseIv) {
                    if (buffer.length < 16) {
                        continue; // IVが揃うまで待つ
                    }
                    // IVを取り出す
                    baseIv = buffer.slice(0, 16);

                    // バッファからIVを削除
                    buffer = buffer.slice(16);
                }

                // バッファに16バイト以上のデータがあれば、16の倍数分だけ切り出して処理する
                if (buffer.length >= 16) {
                    const processLength = Math.floor(buffer.length / 16) * 16;
                    const chunkToProcess = buffer.slice(0, processLength);

                    // 残りをバッファに残す
                    buffer = buffer.slice(processLength);

                    const counter = calculateCounter(baseIv, currentOffset);
                    const decrypted = await crypto.subtle.decrypt({ name: "AES-CTR", counter: counter as BufferSource, length: 64 }, key, chunkToProcess);

                    currentOffset += chunkToProcess.byteLength;
                    controller.enqueue(new Uint8Array(decrypted));
                }
            }
        },
        cancel() {
            sourceReader.cancel();
        },
    });
}
