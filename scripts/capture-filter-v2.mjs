import { spawn } from "child_process";
import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/Users/wessam/.gemini/antigravity-ide/brain/7c3bbc7a-739f-4a0f-9732-740729bda20f";
const SCREENSHOT_DIR = path.join(ARTIFACT_DIR, "screenshots");

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

async function run() {
  const chrome = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9225",
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
      const res = await fetch("http://127.0.0.1:9225/json/version");
      versionInfo = await res.json();
      break;
    } catch {}
  }

  if (!versionInfo) {
    console.error("Chrome failed to start");
    chrome.kill();
    process.exit(1);
  }

  const newTabRes = await fetch("http://127.0.0.1:9225/json/new?about:blank", { method: "PUT" });
  const newTab = await newTabRes.json();
  const cdp = new CDPClient(newTab.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Runtime.enable");

  // 1. Arabic Homepage Default
  console.log("Navigating to Arabic homepage...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/ar" });
  await sleep(2500);

  // Scroll to #projects
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const el = document.getElementById("projects");
        if (el) {
          const top = el.getBoundingClientRect().top + window.pageYOffset - 40;
          window.scrollTo({ top, behavior: "instant" });
        }
      })()
    `
  });
  await sleep(800);

  let shot = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, "filter_unified_ar_default.png"), Buffer.from(shot.data, "base64"));
  console.log("Saved filter_unified_ar_default.png");

  // 2. Hover over a pill (Zayed / Solaya)
  const hoverTarget = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const pills = document.querySelectorAll(".featured-filter-pill");
        if (pills.length >= 3) {
          const rect = pills[2].getBoundingClientRect();
          return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
        }
        return null;
      })()
    `,
    returnByValue: true
  });

  if (hoverTarget.result.value) {
    const { x, y } = hoverTarget.result.value;
    console.log("Hovering at:", x, y);
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await sleep(400);

    shot = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, "filter_unified_ar_hover.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved filter_unified_ar_hover.png");

    // Click it to test filter selection & sliding pill animation
    await cdp.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await cdp.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    await sleep(700);

    shot = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, "filter_unified_ar_clicked.png"), Buffer.from(shot.data, "base64"));
    console.log("Saved filter_unified_ar_clicked.png");
  }

  // 3. English Homepage
  console.log("Navigating to English homepage...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
  await sleep(2000);

  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const el = document.getElementById("projects");
        if (el) {
          const top = el.getBoundingClientRect().top + window.pageYOffset - 40;
          window.scrollTo({ top, behavior: "instant" });
        }
      })()
    `
  });
  await sleep(800);

  shot = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(path.join(SCREENSHOT_DIR, "filter_unified_en_default.png"), Buffer.from(shot.data, "base64"));
  console.log("Saved filter_unified_en_default.png");

  cdp.close();
  chrome.kill();
  console.log("Done!");
}

run().catch(console.error);
