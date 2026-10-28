import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "node:crypto";

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
      "--remote-debugging-port=9226",
      "--disable-gpu",
      "--no-sandbox",
      "--window-size=1440,1100",
    ],
    { stdio: "ignore" }
  );

  let versionInfo = null;
  for (let i = 0; i < 25; i++) {
    await sleep(200);
    try {
      const res = await fetch("http://127.0.0.1:9226/json/version");
      versionInfo = await res.json();
      break;
    } catch {}
  }

  const newTabRes = await fetch("http://127.0.0.1:9226/json/new?about:blank", { method: "PUT" });
  const newTab = await newTabRes.json();
  const cdp = new CDPClient(newTab.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Runtime.enable");

  try {
    const prisma = new PrismaClient();
    const admin = await prisma.adminUser.findFirst();
    if (admin) {
      const token = randomBytes(32).toString("base64url");
      const hash = createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
      await prisma.adminSession.create({
        data: { tokenHash: hash, userId: admin.id, expiresAt },
      });
      await cdp.send("Network.enable");
      await cdp.send("Network.setCookie", {
        name: "image_admin_session",
        value: token,
        domain: "localhost",
        path: "/",
        httpOnly: true,
        secure: false,
      });
      await prisma.$disconnect();
    }

    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 1100,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/homepage" });
    await sleep(2500);

    // Scroll directly to the Company Introduction & Achievements editor card
    await cdp.send("Runtime.evaluate", {
      expression: `
        const headings = Array.from(document.querySelectorAll('h2'));
        const introH2 = headings.find(h => h.textContent.toLowerCase().includes('introduction'));
        if (introH2) {
          const panel = introH2.closest('.panel') || introH2;
          panel.scrollIntoView({ block: "start", behavior: "instant" });
        }
      `,
    });
    await sleep(1200);

    const screenshot = await cdp.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: false,
    });
    const filepath = path.join(SCREENSHOT_DIR, "homepage-intro-stats-admin-cms.png");
    fs.writeFileSync(filepath, Buffer.from(screenshot.data, "base64"));
    console.log(`Saved screenshot: homepage-intro-stats-admin-cms.png`);
  } finally {
    cdp.close();
    chromeProcess.kill();
  }
}

run().catch(console.error);
