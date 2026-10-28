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
  console.log("Launching Chrome for Homepage Intro & Stats verification...");
  const chromeProcess = spawn(
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
    console.error("Failed to connect to Chrome debugging port");
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
    // 1. Desktop English (1440x950)
    console.log("Capturing EN Desktop (1440x950)...");
    await setViewport(cdp, 1440, 950, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
    await sleep(2000);
    await cdp.send("Runtime.evaluate", {
      expression: `
        const el = document.getElementById("stats");
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "instant" });
        }
      `,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "homepage-intro-stats-desktop-en.png");

    // 2. Desktop Arabic (1440x950)
    console.log("Capturing AR Desktop (1440x950)...");
    await setViewport(cdp, 1440, 950, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar" });
    await sleep(2000);
    await cdp.send("Runtime.evaluate", {
      expression: `
        const el = document.getElementById("stats");
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "instant" });
        }
      `,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "homepage-intro-stats-desktop-ar.png");

    // 3. Tablet English (768x1024)
    console.log("Capturing EN Tablet (768x1024)...");
    await setViewport(cdp, 768, 1024, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
    await sleep(2000);
    await cdp.send("Runtime.evaluate", {
      expression: `
        const el = document.getElementById("stats");
        if (el) {
          el.scrollIntoView({ block: "center", behavior: "instant" });
        }
      `,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "homepage-intro-stats-tablet-en.png");

    // 4. Mobile English (390x844)
    console.log("Capturing EN Mobile (390x844)...");
    await setViewport(cdp, 390, 844, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
    await sleep(2000);
    await cdp.send("Runtime.evaluate", {
      expression: `
        const el = document.getElementById("stats");
        if (el) {
          el.scrollIntoView({ block: "start", behavior: "instant" });
        }
      `,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "homepage-intro-stats-mobile-en.png");

    // 5. Mobile Arabic (390x844)
    console.log("Capturing AR Mobile (390x844)...");
    await setViewport(cdp, 390, 844, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar" });
    await sleep(2000);
    await cdp.send("Runtime.evaluate", {
      expression: `
        const el = document.getElementById("stats");
        if (el) {
          el.scrollIntoView({ block: "start", behavior: "instant" });
        }
      `,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "homepage-intro-stats-mobile-ar.png");

    // 6. Admin CMS Homepage
    console.log("Setting up admin session for CMS Homepage screenshot...");
    const { PrismaClient } = await import("@prisma/client");
    const { createHash, randomBytes } = await import("node:crypto");
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

    console.log("Capturing Admin CMS Homepage...");
    await setViewport(cdp, 1440, 1100, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/homepage" });
    await sleep(2500);
    await cdp.send("Runtime.evaluate", {
      expression: `
        const headings = Array.from(document.querySelectorAll('h2, h3'));
        const target = headings.find(h => h.textContent.includes('Company Introduction'));
        if (target) {
          const card = target.closest('.rounded-2xl') || target;
          card.scrollIntoView({ block: "start", behavior: "instant" });
        } else {
          window.scrollTo(0, 950);
        }
      `,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "homepage-intro-stats-admin-cms.png");

    console.log("All screenshots captured successfully!");
  } finally {
    cdp.close();
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
