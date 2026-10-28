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
  const chromeProcess = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9225",
      "--disable-gpu",
      "--no-sandbox",
      "--window-size=1280,680",
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
    chromeProcess.kill();
    process.exit(1);
  }

  const newTabRes = await fetch("http://127.0.0.1:9225/json/new?about:blank", { method: "PUT" });
  const newTab = await newTabRes.json();
  const cdp = new CDPClient(newTab.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Runtime.enable");

  try {
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1280,
      height: 680,
      deviceScaleFactor: 2,
      mobile: false,
    });

    console.log("Navigating to AR (1280x680 laptop screen)...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar" });
    await sleep(2200);

    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".menu-button")?.click()`,
    });
    await sleep(800);

    const shot1 = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, "menu-scrollbar-ar-top.png"), Buffer.from(shot1.data, "base64"));
    console.log("Captured menu-scrollbar-ar-top.png");

    // Scroll down the menu list
    await cdp.send("Runtime.evaluate", {
      expression: `
        const nav = document.querySelector(".menu-nav");
        if (nav) nav.scrollTop = 140;
      `,
    });
    await sleep(300);

    const shot2 = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, "menu-scrollbar-ar-scrolled.png"), Buffer.from(shot2.data, "base64"));
    console.log("Captured menu-scrollbar-ar-scrolled.png");

    // Also do English
    console.log("Navigating to EN (1280x680 laptop screen)...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
    await sleep(2200);

    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".menu-button")?.click()`,
    });
    await sleep(800);

    await cdp.send("Runtime.evaluate", {
      expression: `
        const nav = document.querySelector(".menu-nav");
        if (nav) nav.scrollTop = 140;
      `,
    });
    await sleep(300);

    const shot3 = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(path.join(SCREENSHOT_DIR, "menu-scrollbar-en-scrolled.png"), Buffer.from(shot3.data, "base64"));
    console.log("Captured menu-scrollbar-en-scrolled.png");
  } finally {
    cdp.close();
    chromeProcess.kill();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
