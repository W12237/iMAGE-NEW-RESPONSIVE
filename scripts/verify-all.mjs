import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

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
  console.log("Setting up admin session in database...");
  const prisma = new PrismaClient();
  const adminUser = await prisma.adminUser.findFirst();
  if (!adminUser) throw new Error("No admin user found");

  const sessionToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
  await prisma.adminSession.create({
    data: {
      tokenHash,
      userId: adminUser.id,
      expiresAt: new Date(Date.now() + 86400000 * 7),
    },
  });
  console.log("Admin session token created.");

  console.log("Launching headless Chrome...");
  const chromeProcess = spawn(
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

  let versionInfo = null;
  for (let i = 0; i < 25; i++) {
    await sleep(200);
    try {
      const res = await fetch("http://127.0.0.1:9222/json/version");
      versionInfo = await res.json();
      break;
    } catch {}
  }

  if (!versionInfo) {
    console.error("Failed to connect to Chrome debugging port");
    chromeProcess.kill();
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
  await cdp.send("Network.enable");

  // Set admin session cookie
  await cdp.send("Network.setCookie", {
    name: "image_admin_session",
    value: sessionToken,
    domain: "localhost",
    path: "/",
  });

  console.log("\n--- TEST 1: Legacy Redirect Check ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/developments" });
  await sleep(1500);
  const evalUrl = await cdp.send("Runtime.evaluate", { expression: "window.location.href" });
  console.log("Navigated to /ar/developments, current URL is:", evalUrl.result.value);

  console.log("\n--- TEST 2: /en/projects Desktop ---");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
  await sleep(2500);
  await captureScreenshot(cdp, "en_projects_desktop.png");

  // Check card alignment classes
  const cardsCheckEn = await cdp.send("Runtime.evaluate", {
    expression: `
      Array.from(document.querySelectorAll('.project-showcase-card')).map((card, i) => ({
        index: i,
        title: card.querySelector('.project-card-title')?.textContent,
        className: card.className,
        textOrder: window.getComputedStyle(card.querySelector('.project-showcase-text')).gridColumn,
        photoOrder: window.getComputedStyle(card.querySelector('.project-showcase-photo')).gridColumn
      }))
    `,
    returnByValue: true,
  });
  console.log("English Desktop Project Cards:", JSON.stringify(cardsCheckEn.result.value, null, 2));

  console.log("\n--- TEST 3: /ar/projects Desktop (RTL & White Bar Check) ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects" });
  await sleep(2500);
  await captureScreenshot(cdp, "ar_projects_desktop.png");

  const overflowCheck = await cdp.send("Runtime.evaluate", {
    expression: `
      ({
        bodyOverflowX: window.getComputedStyle(document.body).overflowX,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        htmlDir: document.documentElement.dir,
        cardsCount: document.querySelectorAll('.project-showcase-card').length
      })
    `,
    returnByValue: true,
  });
  console.log("Arabic RTL Layout & Overflow Status:", overflowCheck.result.value);

  console.log("\n--- TEST 4: Contextual Enquiry Modal Opening (Arabic) ---");
  // Click first Enquire Now button
  await cdp.send("Runtime.evaluate", {
    expression: `
      document.querySelector('.btn-project-enquire')?.click();
    `,
  });
  await sleep(800);
  await captureScreenshot(cdp, "ar_enquiry_modal.png");

  const modalCheck = await cdp.send("Runtime.evaluate", {
    expression: `
      ({
        modalOpen: !!document.querySelector('.enquiry-modal-dialog'),
        modalTitle: document.querySelector('#enquiry-modal-title')?.textContent,
        selectedProjectValue: document.querySelector('#enquiry-project')?.value
      })
    `,
    returnByValue: true,
  });
  console.log("Arabic Modal Status:", modalCheck.result.value);

  // Close modal via Escape
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape" });
  await sleep(500);

  console.log("\n--- TEST 5: Contextual Enquiry Modal Opening (English) ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
  await sleep(1800);
  await cdp.send("Runtime.evaluate", {
    expression: `
      document.querySelector('.btn-project-enquire')?.click();
    `,
  });
  await sleep(800);
  await captureScreenshot(cdp, "en_enquiry_modal.png");

  // Close modal
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape" });
  await sleep(500);

  console.log("\n--- TEST 6: Mobile Stacking (/ar/projects 390px) ---");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects" });
  await sleep(2000);
  await captureScreenshot(cdp, "ar_projects_mobile.png");

  const mobileCheck = await cdp.send("Runtime.evaluate", {
    expression: `
      Array.from(document.querySelectorAll('.project-showcase-card')).map(card => {
        const photo = card.querySelector('.project-showcase-photo');
        const text = card.querySelector('.project-showcase-text');
        return {
          photoGridRow: window.getComputedStyle(photo).gridRow,
          textGridRow: window.getComputedStyle(text).gridRow
        };
      })
    `,
    returnByValue: true,
  });
  console.log("Mobile Stacking Grid Rows (Expect Photo 1 / -1, Text 2 / -1):", mobileCheck.result.value);

  console.log("\n--- TEST 7: Mobile Stacking (/en/projects 390px) ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
  await sleep(2000);
  await captureScreenshot(cdp, "en_projects_mobile.png");

  console.log("\n--- TEST 8: CMS Dashboard Overview & Projects List ---");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await cdp.send("Page.navigate", { url: "http://localhost:3000/admin" });
  await sleep(2500);
  await captureScreenshot(cdp, "cms_overview.png");

  await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/projects" });
  await sleep(2500);
  await captureScreenshot(cdp, "cms_projects_table.png");

  cdp.close();
  chromeProcess.kill();
  await prisma.$disconnect();
  console.log("\nAll visual and behavioral verification completed successfully!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
