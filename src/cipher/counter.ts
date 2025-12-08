export function calculateCounter(baseIv: Uint8Array, byteOffset: number): Uint8Array {
    const counterBlock = new Uint8Array(baseIv);
    const dataView = new DataView(counterBlock.buffer);

    // AESブロックサイズ (16バイト) 単位のブロック数を計算
    const blockIndex = BigInt(Math.floor(byteOffset / 16));

    // IVの後半8バイト(64bit)をBigIntとして読み出し、ブロック数を加算
    const lowBits = dataView.getBigUint64(8, false);
    dataView.setBigUint64(8, lowBits + blockIndex, false);

    return counterBlock;
}
