import crypto from "crypto";
import type { MediaKind, MediaUploadValidation } from "./types";

export const ALLOWED_MEDIA_TYPES: Record<string, MediaUploadValidation> = {
  "image/jpeg": { extension: "jpg", kind: "IMAGE", maxBytes: 12 * 1024 * 1024, mimeType: "image/jpeg" },
  "image/png": { extension: "png", kind: "IMAGE", maxBytes: 12 * 1024 * 1024, mimeType: "image/png" },
  "image/webp": { extension: "webp", kind: "IMAGE", maxBytes: 12 * 1024 * 1024, mimeType: "image/webp" },
  "image/avif": { extension: "avif", kind: "IMAGE", maxBytes: 12 * 1024 * 1024, mimeType: "image/avif" },
  "video/mp4": { extension: "mp4", kind: "VIDEO", maxBytes: 100 * 1024 * 1024, mimeType: "video/mp4" },
  "video/webm": { extension: "webm", kind: "VIDEO", maxBytes: 100 * 1024 * 1024, mimeType: "video/webm" },
  "application/pdf": { extension: "pdf", kind: "DOCUMENT", maxBytes: 40 * 1024 * 1024, mimeType: "application/pdf" },
};

/**
 * Normalizes file MIME types across operating systems and browsers.
 */
export function normalizeMimeType(filename: string, reportedMime?: string): string {
  const ext = (filename.split(".").pop() || "").toLowerCase();
  const rawMime = (reportedMime || "").toLowerCase().trim();

  // HEIC / HEIF detection
  if (ext === "heic" || ext === "heif" || rawMime === "image/heic" || rawMime === "image/heif") {
    return "image/heic";
  }

  // Handle common browser alias MIME types
  if (rawMime === "image/pjpeg" || rawMime === "image/jpg") return "image/jpeg";
  if (rawMime === "image/x-png") return "image/png";

  // If reported MIME is recognized, use it
  if (ALLOWED_MEDIA_TYPES[rawMime]) return rawMime;

  // Fallback to extension matching for missing or generic MIME types
  if (ext === "jpg" || ext === "jpeg" || ext === "jpe") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "avif") return "image/avif";
  if (ext === "mp4" || ext === "m4v") return "video/mp4";
  if (ext === "webm") return "video/webm";
  if (ext === "pdf") return "application/pdf";

  return rawMime || "application/octet-stream";
}

/**
 * Validates actual file signature/magic bytes against reported MIME type.
 */
export function hasValidSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (bytes.length < 4) return false;

  const ascii = (start: number, length: number) =>
    String.fromCharCode(...bytes.slice(start, start + length));

  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    if (bytes.length < 8) return false;
    const pngSig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return pngSig.every((b, i) => bytes[i] === b);
  }

  if (mimeType === "image/webp") {
    if (bytes.length < 12) return false;
    return ascii(0, 4) === "RIFF" && ascii(8, 4) === "WEBP";
  }

  if (mimeType === "image/avif") {
    if (bytes.length < 12) return false;
    return ascii(4, 4) === "ftyp" && ["avif", "avis"].includes(ascii(8, 4));
  }

  if (mimeType === "video/mp4") {
    if (bytes.length < 12) return false;
    return ascii(4, 4) === "ftyp";
  }

  if (mimeType === "video/webm") {
    return bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3;
  }

  if (mimeType === "application/pdf") {
    // %PDF-
    return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
  }

  return false;
}

/**
 * Extracts width and height for common web image formats in pure JS without native libraries.
 */
export function extractImageDimensions(
  bytes: Uint8Array,
  mimeType: string
): { width?: number; height?: number } {
  try {
    if (mimeType === "image/png" && bytes.length >= 24) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const width = view.getUint32(16, false);
      const height = view.getUint32(20, false);
      if (width > 0 && height > 0) return { width, height };
    }

    if (mimeType === "image/jpeg" && bytes.length > 2) {
      let offset = 2;
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      while (offset < bytes.length - 8) {
        if (bytes[offset] !== 0xff) {
          offset++;
          continue;
        }
        const marker = bytes[offset + 1];
        // SOF markers: 0xC0 to 0xC3, 0xC5 to 0xC7, 0xC9 to 0xCB, 0xCD to 0xCF
        const isSof =
          (marker >= 0xc0 && marker <= 0xc3) ||
          (marker >= 0xc5 && marker <= 0xc7) ||
          (marker >= 0xc9 && marker <= 0xcb) ||
          (marker >= 0xcd && marker <= 0xcf);
        if (isSof && offset + 8 < bytes.length) {
          const height = view.getUint16(offset + 5, false);
          const width = view.getUint16(offset + 7, false);
          if (width > 0 && height > 0) return { width, height };
          break;
        }
        const segmentLength = view.getUint16(offset + 2, false);
        offset += 2 + segmentLength;
      }
    }

    if (mimeType === "image/webp" && bytes.length >= 30) {
      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const format = String.fromCharCode(...bytes.slice(12, 16));
      if (format === "VP8 " && bytes.length >= 30) {
        const width = view.getUint16(26, true) & 0x3fff;
        const height = view.getUint16(28, true) & 0x3fff;
        if (width > 0 && height > 0) return { width, height };
      } else if (format === "VP8L" && bytes.length >= 25) {
        const b1 = bytes[21];
        const b2 = bytes[22];
        const b3 = bytes[23];
        const b4 = bytes[24];
        const width = 1 + (((b2 & 0x3f) << 8) | b1);
        const height = 1 + (((b4 & 0xf) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
        if (width > 0 && height > 0) return { width, height };
      } else if (format === "VP8X" && bytes.length >= 30) {
        const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16));
        const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16));
        if (width > 0 && height > 0) return { width, height };
      }
    }
  } catch {
    // Ignore dimension extraction errors and return undefined
  }
  return {};
}

/**
 * Creates a unique safe storage key for persistent uploads.
 */
export function createStorageKey(originalFilename: string, extension: string): {
  storageKey: string;
  sanitizedName: string;
} {
  const base = originalFilename
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "asset";

  const randomHash = crypto.randomUUID().slice(0, 8);
  const timestamp = Date.now();
  const storageKey = `${timestamp}-${base}-${randomHash}.${extension}`;
  return { storageKey, sanitizedName: `${base}.${extension}` };
}

