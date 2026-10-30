import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import AdmZip from "adm-zip";

export interface TourProcessResult {
  success: boolean;
  error?: string;
  tourId?: string;
  extractedPrefix?: string;
  entryFilePath?: string;
  htmlCandidates?: string[];
  uploadedSize?: number;
  extractedSize?: number;
  assetCount?: number;
  sourceType?: "HTML" | "ZIP";
  originalFilename?: string;
  warnings?: string[];
}

const MAX_ZIP_UPLOAD_SIZE = 100 * 1024 * 1024; // 100 MB
const MAX_HTML_UPLOAD_SIZE = 15 * 1024 * 1024;  // 15 MB
const MAX_EXTRACTED_SIZE = 250 * 1024 * 1024;   // 250 MB (zip bomb guard)
const MAX_FILE_COUNT = 1500;                    // Max files inside archive
const MAX_DIR_DEPTH = 10;

// Dangerous executable file extensions forbidden in visual tours
const FORBIDDEN_EXTENSIONS = new Set([
  ".php", ".phtml", ".php3", ".php4", ".php5", ".phps",
  ".exe", ".bat", ".cmd", ".com", ".msi", ".vbs", ".ps1",
  ".sh", ".bash", ".bin",
  ".py", ".rb", ".cgi", ".pl",
  ".jsp", ".asp", ".aspx", ".cer", ".csr",
]);

/**
 * Validates and processes an uploaded visual tour file (either standalone HTML or ZIP archive).
 */
export async function processVisualTourUpload(
  file: File,
  customTourId?: string
): Promise<TourProcessResult> {
  const originalFilename = file.name;
  const ext = path.extname(originalFilename).toLowerCase();
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploadedSize = buffer.length;

  if (ext !== ".zip" && ext !== ".html" && ext !== ".htm") {
    return {
      success: false,
      error: "Unsupported file format. Please upload a self-contained HTML file (.html, .htm) or a complete ZIP package (.zip).",
    };
  }

  const tourId = customTourId || crypto.randomUUID();
  const toursBaseDir = path.join(process.cwd(), "public", "tours");
  const tourDir = path.join(toursBaseDir, tourId);

  // Clean previous directory if re-processing
  await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
  await fs.mkdir(tourDir, { recursive: true });

  // 1. Process Standalone HTML File
  if (ext === ".html" || ext === ".htm") {
    if (uploadedSize > MAX_HTML_UPLOAD_SIZE) {
      await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
      return {
        success: false,
        error: `HTML file is too large (${(uploadedSize / (1024 * 1024)).toFixed(1)} MB). Maximum allowed HTML size is 15 MB.`,
      };
    }

    const htmlContent = buffer.toString("utf-8");
    const warnings: string[] = [];

    // Check for references to external local files (e.g. css/js/images) that won't exist in a standalone upload
    const localAssetRegex = /(?:src|href)=["'](?!(?:https?:\/\/|\/\/|data:|blob:|mailto:|tel:|#))([^"']+)["']/gi;
    let match;
    const missingAssets: string[] = [];
    while ((match = localAssetRegex.exec(htmlContent)) !== null) {
      const assetRef = match[1];
      if (assetRef && !assetRef.startsWith("data:") && !missingAssets.includes(assetRef)) {
        missingAssets.push(assetRef);
      }
    }

    if (missingAssets.length > 0) {
      // If there are relative asset links, alert the editor
      await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
      return {
        success: false,
        error: `This HTML file references external local assets (${missingAssets.slice(0, 3).join(", ")}${missingAssets.length > 3 ? ` and ${missingAssets.length - 3} more` : ""}) that are missing. Please package your HTML file and all supporting folders/assets into a single ZIP archive before uploading.`,
      };
    }

    const targetFilePath = path.join(tourDir, "index.html");
    await fs.writeFile(targetFilePath, buffer);

    return {
      success: true,
      tourId,
      sourceType: "HTML",
      originalFilename,
      extractedPrefix: `/tours/${tourId}`,
      entryFilePath: "index.html",
      htmlCandidates: ["index.html"],
      uploadedSize,
      extractedSize: uploadedSize,
      assetCount: 1,
      warnings,
    };
  }

  // 2. Process ZIP Archive
  if (uploadedSize > MAX_ZIP_UPLOAD_SIZE) {
    await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
    return {
      success: false,
      error: `ZIP package is too large (${(uploadedSize / (1024 * 1024)).toFixed(1)} MB). Maximum allowed ZIP upload size is 100 MB.`,
    };
  }

  try {
    const zip = new AdmZip(buffer);
    const zipEntries = zip.getEntries();

    if (zipEntries.length === 0) {
      await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
      return {
        success: false,
        error: "The uploaded ZIP archive is empty.",
      };
    }

    if (zipEntries.length > MAX_FILE_COUNT) {
      await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
      return {
        success: false,
        error: `The ZIP archive contains too many files (${zipEntries.length}). Maximum allowed file count is ${MAX_FILE_COUNT}.`,
      };
    }

    let totalExtractedSize = 0;
    const htmlCandidates: string[] = [];

    // Pre-validation pass: check security, path traversal, dangerous extensions, and total size
    for (const entry of zipEntries) {
      if (entry.isDirectory) continue;

      // Zip-Slip security check: ensure destination path resolves safely inside tourDir
      const entryName = entry.entryName.replace(/\\/g, "/");
      if (entryName.includes("..") || path.isAbsolute(entryName)) {
        await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
        return {
          success: false,
          error: `Unsafe path detected in archive: "${entry.entryName}". ZIP path traversal is strictly prohibited.`,
        };
      }
      const resolvedDest = path.resolve(tourDir, entryName);

      if (!resolvedDest.startsWith(tourDir + path.sep) && resolvedDest !== tourDir) {
        await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
        return {
          success: false,
          error: `Unsafe path detected in archive: "${entry.entryName}". ZIP path traversal is strictly prohibited.`,
        };
      }

      // Check directory depth
      const depth = entryName.split("/").length;
      if (depth > MAX_DIR_DEPTH) {
        await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
        return {
          success: false,
          error: `Directory depth exceeds the limit of ${MAX_DIR_DEPTH} levels in archive path: "${entryName}".`,
        };
      }

      // Check forbidden executable file extensions
      const entryExt = path.extname(entryName).toLowerCase();
      if (FORBIDDEN_EXTENSIONS.has(entryExt)) {
        await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
        return {
          success: false,
          error: `Forbidden executable file type detected in archive: "${entryName}". Server-executable scripts are not permitted.`,
        };
      }

      // Zip-bomb size accumulation check
      totalExtractedSize += entry.header.size;
      if (totalExtractedSize > MAX_EXTRACTED_SIZE) {
        await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
        return {
          success: false,
          error: `Extracted package size exceeds the safe limit of 250 MB (${(totalExtractedSize / (1024 * 1024)).toFixed(1)} MB).`,
        };
      }

      if (entryExt === ".html" || entryExt === ".htm") {
        htmlCandidates.push(entryName);
      }
    }

    if (htmlCandidates.length === 0) {
      await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
      return {
        success: false,
        error: "No HTML entry file found in the ZIP archive. Please include an index.html or main .html file.",
      };
    }

    // Extraction pass
    zip.extractAllTo(tourDir, true);

    // Determine default entry HTML file
    // Prioritize root index.html, then any index.html, then the shallowest HTML file
    let defaultEntry = htmlCandidates.find(
      (p) => p.toLowerCase() === "index.html" || p.toLowerCase() === "index.htm"
    );

    if (!defaultEntry) {
      defaultEntry = htmlCandidates.find((p) => p.toLowerCase().endsWith("/index.html"));
    }

    if (!defaultEntry) {
      // Sort by shallowest depth
      defaultEntry = [...htmlCandidates].sort(
        (a, b) => a.split("/").length - b.split("/").length
      )[0];
    }

    return {
      success: true,
      tourId,
      sourceType: "ZIP",
      originalFilename,
      extractedPrefix: `/tours/${tourId}`,
      entryFilePath: defaultEntry,
      htmlCandidates,
      uploadedSize,
      extractedSize: totalExtractedSize,
      assetCount: zipEntries.filter((e) => !e.isDirectory).length,
    };
  } catch (err: any) {
    await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
    return {
      success: false,
      error: `Failed to process ZIP package: ${err.message || "Invalid archive format"}`,
    };
  }
}

/**
 * Safely removes a visual tour's extracted directory from disk.
 */
export async function deleteVisualTourAssets(tourId: string): Promise<void> {
  const tourDir = path.join(process.cwd(), "public", "tours", tourId);
  await fs.rm(tourDir, { recursive: true, force: true }).catch(() => undefined);
}
