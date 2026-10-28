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

async function setViewport(cdp, width, height, isMobile = false) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: isMobile,
  });
}

async function captureScreenshot(cdp, filename) {
  const screenshot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: false,
  });
  const filepath = path.join(SCREENSHOT_DIR, filename);
  fs.writeFileSync(filepath, Buffer.from(screenshot.data, "base64"));
  console.log(`Saved screenshot: ${filename} -> ${filepath}`);
  return filepath;
}

async function run() {
  console.log("Launching Chrome for Projects Collection verification...");
  const chromeProcess = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9224",
      "--disable-gpu",
      "--no-sandbox",
      "--window-size=1440,900",
    ],
    { stdio: "ignore" }
  );

  let versionInfo = null;
  for (let i = 0; i < 25; i++) {
    await sleep(200);
    try {
      const res = await fetch("http://127.0.0.1:9224/json/version");
      versionInfo = await res.json();
      break;
    } catch {}
  }

  if (!versionInfo) {
    console.error("Failed to connect to Chrome debugging port");
    chromeProcess.kill();
    process.exit(1);
  }

  console.log("Chrome debugging port ready:", versionInfo.webSocketDebuggerUrl);

  const newTabRes = await fetch("http://127.0.0.1:9224/json/new?about:blank", { method: "PUT" });
  const newTab = await newTabRes.json();
  const cdp = new CDPClient(newTab.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Runtime.enable");

  try {
    // 1. English Desktop (1440x900) - Scrolled directly to Projects Collection
    console.log("Capturing EN Desktop Projects Collection (1440x900)...");
    await setViewport(cdp, 1440, 900, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
    await sleep(1500);
    await cdp.send("Runtime.evaluate", {
      expression: `
        const el = document.getElementById("projects-collection");
        if (el) el.scrollIntoView({ behavior: "instant" });
      `,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "projects-collection-en-desktop-1440.png");

    // Scroll down to show alternating card 2
    await cdp.send("Runtime.evaluate", {
      expression: `window.scrollBy(0, 650);`,
    });
    await sleep(800);
    await captureScreenshot(cdp, "projects-collection-en-alternating-1440.png");

    // 2. Arabic Desktop (1440x900) - Scrolled directly to Projects Collection
    console.log("Capturing AR Desktop Projects Collection (1440x900)...");
    await setViewport(cdp, 1440, 900, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects" });
    await sleep(1500);
    await cdp.send("Runtime.evaluate", {
      expression: `
        const el = document.getElementById("projects-collection");
        if (el) el.scrollIntoView({ behavior: "instant" });
      `,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "projects-collection-ar-desktop-1440.png");

    // Scroll down to show alternating card 2 in Arabic
    await cdp.send("Runtime.evaluate", {
      expression: `window.scrollBy(0, 650);`,
    });
    await sleep(800);
    await captureScreenshot(cdp, "projects-collection-ar-alternating-1440.png");

    // 3. English Mobile (390x844) - Stacking verification
    console.log("Capturing EN Mobile Projects Collection (390x844)...");
    await setViewport(cdp, 390, 844, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
    await sleep(1500);
    await cdp.send("Runtime.evaluate", {
      expression: `
        const el = document.getElementById("projects-collection");
        if (el) el.scrollIntoView({ behavior: "instant" });
      `,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "projects-collection-en-mobile-390.png");

    // Scroll mobile to show card image on top of text
    await cdp.send("Runtime.evaluate", {
      expression: `window.scrollBy(0, 500);`,
    });
    await sleep(800);
    await captureScreenshot(cdp, "projects-card-en-mobile-390.png");

    // 4. Arabic Mobile (390x844) - Arabic stacking & typography
    console.log("Capturing AR Mobile Projects Collection (390x844)...");
    await setViewport(cdp, 390, 844, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects" });
    await sleep(1500);
    await cdp.send("Runtime.evaluate", {
      expression: `
        const el = document.getElementById("projects-collection");
        if (el) el.scrollIntoView({ behavior: "instant" });
      `,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "projects-collection-ar-mobile-390.png");

    // Scroll mobile AR to show card
    await cdp.send("Runtime.evaluate", {
      expression: `window.scrollBy(0, 500);`,
    });
    await sleep(800);
    await captureScreenshot(cdp, "projects-card-ar-mobile-390.png");

    // 5. Tablet (768x1024)
    console.log("Capturing EN Tablet (768x1024)...");
    await setViewport(cdp, 768, 1024, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
    await sleep(1500);
    await cdp.send("Runtime.evaluate", {
      expression: `
        const el = document.getElementById("projects-collection");
        if (el) el.scrollIntoView({ behavior: "instant" });
      `,
    });
    await sleep(800);
    await captureScreenshot(cdp, "projects-collection-en-tablet-768.png");

    console.log("Projects collection verification screenshots successfully captured!");
  } finally {
    cdp.close();
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error("Error running collection capture script:", err);
  process.exit(1);
});
