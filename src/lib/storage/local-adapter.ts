import fs from "fs/promises";
import path from "path";
import type { StorageAdapter } from "./types";

export class LocalStorageAdapter implements StorageAdapter {
  name = "local";
  private baseDir: string;
  private urlPrefix: string;

  constructor(baseDir?: string, urlPrefix: string = "/uploads") {
    this.baseDir = baseDir || path.join(process.cwd(), "public", "uploads");
    this.urlPrefix = urlPrefix;
  }

  async put(
    key: string,
    buffer: Uint8Array,
    _mimeType: string
  ): Promise<{ url: string; storageKey: string }> {
    await fs.mkdir(this.baseDir, { recursive: true });
    const targetPath = path.join(this.baseDir, key);
    await fs.writeFile(targetPath, buffer);
    const url = `${this.urlPrefix}/${key}`;
    return { url, storageKey: key };
  }

  async delete(key: string): Promise<void> {
    const targetPath = path.join(this.baseDir, key);
    try {
      await fs.unlink(targetPath);
    } catch (err: any) {
      if (err.code !== "ENOENT") {
        console.error(`Failed to delete local file: ${targetPath}`, err);
      }
    }
  }

  async exists(key: string): Promise<boolean> {
    const targetPath = path.join(this.baseDir, key);
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }
}

