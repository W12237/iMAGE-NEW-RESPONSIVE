import { prisma } from "@/lib/prisma";
import { LocalStorageAdapter } from "./local-adapter";
import { S3StorageAdapter } from "./s3-adapter";
import { ALLOWED_MEDIA_TYPES, hasValidSignature, extractImageDimensions, createStorageKey, normalizeMimeType } from "./metadata";
import type { StorageAdapter, StoredAsset, MediaKind } from "./types";

export * from "./types";
export * from "./metadata";

let globalStorageAdapter: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (globalStorageAdapter) return globalStorageAdapter;

  const driver = process.env.STORAGE_DRIVER || "local";

  if (driver === "s3" && process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    globalStorageAdapter = new S3StorageAdapter({
      bucket: process.env.S3_BUCKET,
      region: process.env.S3_REGION || "us-east-1",
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      publicUrlPrefix: process.env.S3_PUBLIC_URL_PREFIX,
    });
  } else {
    globalStorageAdapter = new LocalStorageAdapter();
  }

  return globalStorageAdapter;
}

export interface StoreMediaResult {
  asset?: StoredAsset;
  error?: string;
}

/**
 * Validates, processes, persists file to storage adapter, and creates a database MediaAsset record.
 */
export async function processAndStoreMedia(
  file: File,
  expectedKind?: MediaKind,
  metadata?: {
    altEn?: string;
    altAr?: string;
    captionEn?: string;
    captionAr?: string;
    posterUrl?: string;
    focalPoint?: string;
  }
): Promise<StoreMediaResult> {
  const normalizedType = normalizeMimeType(file.name || "", file.type);

  if (normalizedType === "image/heic") {
    return {
      error: "Apple HEIC/HEIF photo format is not supported directly by web browsers. Please convert or export your photo to JPEG, PNG, or WebP before uploading.",
    };
  }

  const rule = ALLOWED_MEDIA_TYPES[normalizedType];

  if (!rule) {
    if (expectedKind === "VIDEO") {
      return { error: "Unsupported video format. Choose an MP4 or WebM video file." };
    }
    if (expectedKind === "IMAGE") {
      return { error: "Unsupported image format. Choose a JPEG, PNG, WebP, or AVIF image." };
    }
    if (expectedKind === "DOCUMENT") {
      return { error: "Unsupported document format. Choose a PDF file." };
    }
    return { error: "Unsupported format. Supported: JPEG, PNG, WebP, AVIF, MP4, WebM, PDF." };
  }

  if (expectedKind && rule.kind !== expectedKind) {
    const label =
      expectedKind === "IMAGE"
        ? "an image"
        : expectedKind === "VIDEO"
          ? "a video"
          : "a PDF document";
    return { error: `Invalid media kind. Please select ${label} for this field.` };
  }

  if (file.size > rule.maxBytes) {
    const maxMb = Math.round(rule.maxBytes / (1024 * 1024));
    return { error: `File exceeds the maximum size limit of ${maxMb} MB.` };
  }

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Magic bytes signature verification
  if (!hasValidSignature(bytes, normalizedType)) {
    return { error: "The file content does not match its reported format. Please select a valid file." };
  }

  const { storageKey, sanitizedName } = createStorageKey(file.name || "upload", rule.extension);
  const storage = getStorageAdapter();

  let stored: { url: string; storageKey: string };
  try {
    stored = await storage.put(storageKey, bytes, normalizedType);
  } catch (err: any) {
    console.error("Storage put error:", err);
    return { error: "Storage failure. Unable to persist the file to storage." };
  }

  // Extract dimensions for images
  const dimensions = rule.kind === "IMAGE" ? extractImageDimensions(bytes, normalizedType) : {};

  try {
    const asset = await prisma.mediaAsset.create({
      data: {
        url: stored.url,
        storageKey: stored.storageKey,
        filename: file.name || sanitizedName,
        mimeType: normalizedType,
        size: file.size,
        kind: rule.kind,
        width: dimensions.width ?? null,
        height: dimensions.height ?? null,
        posterUrl: metadata?.posterUrl || null,
        focalPoint: metadata?.focalPoint || "center",
        altEn: metadata?.altEn || null,
        altAr: metadata?.altAr || null,
        captionEn: metadata?.captionEn || null,
        captionAr: metadata?.captionAr || null,
        status: "READY",
      },
    });

    return {
      asset: {
        id: asset.id,
        url: asset.url,
        storageKey: asset.storageKey,
        filename: asset.filename,
        mimeType: asset.mimeType,
        size: asset.size,
        kind: asset.kind as MediaKind,
        width: asset.width,
        height: asset.height,
        duration: asset.duration,
        posterUrl: asset.posterUrl,
        focalPoint: asset.focalPoint,
        altEn: asset.altEn,
        altAr: asset.altAr,
        captionEn: asset.captionEn,
        captionAr: asset.captionAr,
        status: asset.status,
        createdAt: asset.createdAt,
      },
    };
  } catch (err: any) {
    console.error("MediaAsset DB error:", err);
    // Cleanup stored file if DB insertion failed
    await storage.delete(stored.storageKey).catch(() => undefined);
    return { error: "Failed to register uploaded asset in the database." };
  }
}

