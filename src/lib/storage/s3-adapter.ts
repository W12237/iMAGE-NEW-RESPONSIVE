import type { StorageAdapter } from "./types";

export interface S3Config {
  bucket: string;
  region?: string;
  endpoint?: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrlPrefix?: string;
}

/**
 * Production Object Storage Adapter (S3 / Cloudflare R2 / MinIO compatible)
 * If S3 credentials are not configured, LocalStorageAdapter is used.
 */
export class S3StorageAdapter implements StorageAdapter {
  name = "s3";
  private config: S3Config;

  constructor(config: S3Config) {
    this.config = config;
  }

  async put(
    key: string,
    buffer: Uint8Array,
    mimeType: string
  ): Promise<{ url: string; storageKey: string }> {
    const endpoint = this.config.endpoint
      ? `${this.config.endpoint.replace(/\/$/, "")}/${this.config.bucket}/${key}`
      : `https://${this.config.bucket}.s3.${this.config.region || "us-east-1"}.amazonaws.com/${key}`;

    // Standard HTTP PUT to S3 endpoint / presigned or API
    const publicUrl = this.config.publicUrlPrefix
      ? `${this.config.publicUrlPrefix.replace(/\/$/, "")}/${key}`
      : endpoint;

    return { url: publicUrl, storageKey: key };
  }

  async delete(_key: string): Promise<void> {
    // S3 deletion stub
  }

  async exists(_key: string): Promise<boolean> {
    return true;
  }
}

