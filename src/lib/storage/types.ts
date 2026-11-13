/**
 * Storage and Media Types for Image Developments CMS
 */

export type MediaKind = "IMAGE" | "VIDEO" | "DOCUMENT";

export interface MediaUploadValidation {
  extension: string;
  kind: MediaKind;
  maxBytes: number;
  mimeType: string;
}

export interface StoredAsset {
  id: string;
  url: string;
  storageKey?: string | null;
  filename: string;
  mimeType: string;
  size: number;
  kind: MediaKind;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  posterUrl?: string | null;
  focalPoint?: string | null;
  altEn?: string | null;
  altAr?: string | null;
  captionEn?: string | null;
  captionAr?: string | null;
  status: string;
  createdAt: Date;
}

export interface StorageAdapter {
  name: string;
  put(
    key: string,
    buffer: Uint8Array,
    mimeType: string,
    options?: { filename?: string }
  ): Promise<{ url: string; storageKey: string }>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

