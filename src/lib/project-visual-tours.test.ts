import { describe, it, expect, afterEach } from "vitest";
import { processVisualTourUpload, deleteVisualTourAssets } from "./tours";
import AdmZip from "adm-zip";
import fs from "fs/promises";
import path from "path";

describe("HTML Visual Tours Processing & Security", () => {
  const createdTourIds: string[] = [];

  afterEach(async () => {
    for (const tourId of createdTourIds) {
      await deleteVisualTourAssets(tourId).catch(() => undefined);
    }
    createdTourIds.length = 0;
  });

  it("successfully processes a self-contained HTML visual tour file", async () => {
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>Solaya 360 Walkthrough</title>
  <style>body { margin: 0; background: #000; color: #fff; }</style>
</head>
<body>
  <h1>Interactive Architectural Walkthrough</h1>
  <script>console.log("Tour initialized");</script>
</body>
</html>`;

    const file = new File([Buffer.from(htmlContent)], "solaya-tour.html", {
      type: "text/html",
    });

    const result = await processVisualTourUpload(file);
    if (result.tourId) createdTourIds.push(result.tourId);

    expect(result.success).toBe(true);
    expect(result.sourceType).toBe("HTML");
    expect(result.entryFilePath).toBe("index.html");
    expect(result.extractedPrefix).toMatch(/^\/tours\//);
    expect(result.assetCount).toBe(1);

    // Verify file actually exists in public/tours/[tourId]/index.html
    const diskPath = path.join(process.cwd(), "public", result.extractedPrefix!.slice(1), "index.html");
    const exists = await fs.access(diskPath).then(() => true).catch(() => false);
    expect(exists).toBe(true);
  });

  it("detects missing local external assets in HTML file and returns descriptive error", async () => {
    const htmlContentWithExternalAssets = `<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="css/panorama.css">
  <script src="js/tour-engine.js"></script>
</head>
<body>
  <img src="panoramas/living-room.jpg" />
</body>
</html>`;

    const file = new File([Buffer.from(htmlContentWithExternalAssets)], "incomplete.html", {
      type: "text/html",
    });

    const result = await processVisualTourUpload(file);
    if (result.tourId) createdTourIds.push(result.tourId);

    expect(result.success).toBe(false);
    expect(result.error).toContain("references external local assets");
    expect(result.error).toContain("ZIP archive");
  });

  it("successfully extracts a complete ZIP archive with nested assets and detects index.html", async () => {
    const zip = new AdmZip();
    zip.addFile("index.html", Buffer.from("<!DOCTYPE html><html><body><h1>Root Tour</h1></body></html>"));
    zip.addFile("assets/style.css", Buffer.from("body { color: red; }"));
    zip.addFile("assets/script.js", Buffer.from("console.log('ready');"));
    zip.addFile("images/pano.jpg", Buffer.from([0xff, 0xd8, 0xff, 0xe0]));

    const zipBuffer = zip.toBuffer();
    const file = new File([new Uint8Array(zipBuffer)], "solaya-package.zip", {
      type: "application/zip",
    });

    const result = await processVisualTourUpload(file);
    if (result.tourId) createdTourIds.push(result.tourId);

    expect(result.success).toBe(true);
    expect(result.sourceType).toBe("ZIP");
    expect(result.entryFilePath).toBe("index.html");
    expect(result.htmlCandidates).toContain("index.html");
    expect(result.assetCount).toBe(4);

    // Verify extracted files exist
    const diskDir = path.join(process.cwd(), "public", result.extractedPrefix!.slice(1));
    const indexExists = await fs.access(path.join(diskDir, "index.html")).then(() => true).catch(() => false);
    const cssExists = await fs.access(path.join(diskDir, "assets", "style.css")).then(() => true).catch(() => false);
    expect(indexExists).toBe(true);
    expect(cssExists).toBe(true);
  });

  it("blocks and rejects ZIP files with path traversal attacks (Zip-Slip defense)", async () => {
    const zip = new AdmZip();
    zip.addFile("test.txt", Buffer.from("malicious payload"));
    zip.getEntries()[0].entryName = "../evil.txt";
    zip.addFile("index.html", Buffer.from("<html><body>Safe</body></html>"));

    const zipBuffer = zip.toBuffer();
    const file = new File([new Uint8Array(zipBuffer)], "malicious.zip", {
      type: "application/zip",
    });

    const result = await processVisualTourUpload(file);
    if (result.tourId) createdTourIds.push(result.tourId);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Unsafe path detected");
  });

  it("blocks and rejects server-executable scripts inside visual tour archives", async () => {
    const zip = new AdmZip();
    zip.addFile("index.html", Buffer.from("<html><body>Safe</body></html>"));
    zip.addFile("backdoor.php", Buffer.from("<?php system($_GET['cmd']); ?>"));

    const zipBuffer = zip.toBuffer();
    const file = new File([new Uint8Array(zipBuffer)], "exploit.zip", {
      type: "application/zip",
    });

    const result = await processVisualTourUpload(file);
    if (result.tourId) createdTourIds.push(result.tourId);

    expect(result.success).toBe(false);
    expect(result.error).toContain("Forbidden executable file type detected");
    expect(result.error).toContain(".php");
  });

  it("rejects unsupported file formats cleanly", async () => {
    const file = new File([Buffer.from("some text")], "tour.txt", {
      type: "text/plain",
    });

    const result = await processVisualTourUpload(file);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Unsupported file format");
  });
});
