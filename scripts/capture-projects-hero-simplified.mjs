import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/Users/wessam/.gemini/antigravity-ide/brain/7c3bbc7a-739f-4a0f-9732-740729bda20f";
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function captureScreenshot(cdp, filename) {
  const screenshot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const filepath = path.join(SCREENSHOT_DIR, filename);
  fs.writeFileSync(filepath, Buffer.from(screenshot.data, "base64"));
  console.log(`Saved screenshot: ${filename}`);
  return filepath;
}

async function run() {
  console.log("=== CAPTURING SIMPLIFIED PROJECTS HERO ===");

  let chromeProcess = null;
  let versionInfo = null;

  try {
    const res = await fetch("http://127.0.0.1:9222/json/version");
    versionInfo = await res.json();
  } catch {
    chromeProcess = spawn(
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      [
        "--headless=new",
        "--remote-debugging-port=9222",
        "--disable-gpu",
        "--no-sandbox",
        "--window-size=1440,900",
      ],
      { stdio: "ignore" }
    );
    for (let i = 0; i < 30; i++) {
      await sleep(200);
      try {
        const res = await fetch("http://127.0.0.1:9222/json/version");
        versionInfo = await res.json();
        break;
      } catch {}
    }
  }

  if (!versionInfo) {
    console.error("Failed to connect to Chrome");
    process.exit(1);
  }

  const listRes = await fetch("http://127.0.0.1:9222/json/list");
  const targets = await listRes.json();
  let target = targets.find((t) => t.type === "page");
  if (!target) {
    const newTargetRes = await fetch("http://127.0.0.1:9222/json/new?about:blank", { method: "PUT" });
    target = await newTargetRes.json();
  }

  const cdp = new CDPClient(target.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");

  // 1. ARABIC DESKTOP (exact match to user request)
  async function waitForPageReady() {
    for (let i = 0; i < 40; i++) {
      await sleep(200);
      const res = await cdp.send("Runtime.evaluate", {
        expression: `window.__transitionState === "idle" && Boolean(document.querySelector(".projects-hero-h1"))`,
        returnByValue: true,
      });
      if (res?.result?.value) return;
    }
  }

  // 1. ARABIC DESKTOP (exact match to user request)
  console.log("\n1. Arabic Desktop View...");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects" });
  await waitForPageReady();
  await sleep(400);

  await captureScreenshot(cdp, "projects_hero_ar_desktop.png");

  // 2. ENGLISH DESKTOP
  console.log("\n2. English Desktop View...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
  await waitForPageReady();
  await sleep(400);

  await captureScreenshot(cdp, "projects_hero_en_desktop.png");

  // Test Primary CTA Scroll
  const scrollTestBefore = await cdp.send("Runtime.evaluate", {
    expression: "window.scrollY",
    returnByValue: true,
  });
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.btn-hero-primary')?.click();`,
  });
  await sleep(800);
  const scrollTestAfter = await cdp.send("Runtime.evaluate", {
    expression: "window.scrollY",
    returnByValue: true,
  });
  console.log(`Scroll position before click: ${scrollTestBefore.result.value}, after click: ${scrollTestAfter.result.value}`);

  // 3. ARABIC MOBILE
  console.log("\n3. Arabic Mobile View...");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects" });
  await waitForPageReady();
  await sleep(400);

  await captureScreenshot(cdp, "projects_hero_ar_mobile.png");

  // 4. ENGLISH MOBILE
  console.log("\n4. English Mobile View...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
  await waitForPageReady();
  await sleep(400);

  await captureScreenshot(cdp, "projects_hero_en_mobile.png");

  cdp.close();
  if (chromeProcess) chromeProcess.kill();
  console.log("\nAll captures completed successfully!");
  process.exit(0);
}

run().catch((err) => {
  console.error("Capture error:", err);
  process.exit(1);
});
