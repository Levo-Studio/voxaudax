/**
 * The width and height of an upload, read from the bytes themselves. The
 * database wants both, and a value the browser reports is a value a caller
 * chooses — which would put whatever it liked in the row that sizes the image
 * on the public page.
 *
 * Only the four types the uploads accept are read, and anything unreadable
 * answers null rather than a guess.
 */
export type Dimensions = { readonly width: number; readonly height: number };

const png = (bytes: Uint8Array): Dimensions | null => {
  if (bytes.length < 24) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
};

const gif = (bytes: Uint8Array): Dimensions | null => {
  if (bytes.length < 10) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
};

/** The VP8, VP8L and VP8X chunks each write the size differently. */
const webp = (bytes: Uint8Array): Dimensions | null => {
  if (bytes.length < 30) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const chunk = String.fromCharCode(...bytes.subarray(12, 16));

  if (chunk === "VP8 ") {
    return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
  }

  if (chunk === "VP8L") {
    const bits = view.getUint32(21, true);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }

  if (chunk === "VP8X") {
    const read = (at: number) => bytes[at]! | (bytes[at + 1]! << 8) | (bytes[at + 2]! << 16);
    return { width: read(24) + 1, height: read(27) + 1 };
  }

  return null;
};

/** JPEG carries the size in the first SOF segment, which is not at a fixed offset. */
const jpeg = (bytes: Uint8Array): Dimensions | null => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let at = 2;

  while (at + 9 < bytes.length) {
    if (bytes[at] !== 0xff) return null;

    const marker = bytes[at + 1]!;
    const length = view.getUint16(at + 2);

    // Every SOF marker but the four that are not frame headers at all.
    const isFrameHeader =
      marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);

    if (isFrameHeader) {
      return { width: view.getUint16(at + 7), height: view.getUint16(at + 5) };
    }

    at += 2 + length;
  }

  return null;
};

export const readDimensions = (bytes: Uint8Array, mime: string): Dimensions | null => {
  const measured =
    mime === "image/png"
      ? png(bytes)
      : mime === "image/gif"
        ? gif(bytes)
        : mime === "image/webp"
          ? webp(bytes)
          : mime === "image/jpeg"
            ? jpeg(bytes)
            : null;

  if (measured === null) return null;
  if (measured.width <= 0 || measured.height <= 0) return null;
  return measured;
};
