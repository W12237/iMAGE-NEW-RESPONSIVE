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
  console.log("Launching headless Chrome...");
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
    // -----------------------------------------------------------------
    // 1. Navigation Menu Closed State - Desktop EN (1440x900)
    // -----------------------------------------------------------------
    console.log("1. Capturing Nav Closed (Desktop EN 1440x900)...");
    await setViewport(cdp, 1440, 900, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
    await sleep(2500); // allow initial intro to complete
    await captureScreenshot(cdp, "nav-closed-desktop-en.png");

    // -----------------------------------------------------------------
    // 2. Navigation Menu Open State - Desktop EN (1440x900)
    // -----------------------------------------------------------------
    console.log("2. Opening Menu and Capturing Overlay (Desktop EN 1440x900)...");
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".menu-button")?.click()`,
    });
    await sleep(800); // allow circular reveal transition to settle
    await captureScreenshot(cdp, "nav-open-desktop-en.png");

    // Test Escape key closes menu
    console.log("Testing Escape key dismissal...");
    await cdp.send("Input.dispatchKeyEvent", {
      type: "rawKeyDown",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await cdp.send("Input.dispatchKeyEvent", {
      type: "keyUp",
      key: "Escape",
      code: "Escape",
      windowsVirtualKeyCode: 27,
    });
    await sleep(500);

    // -----------------------------------------------------------------
    // 3. Navigation Menu Open State - Desktop AR (1440x900)
    // -----------------------------------------------------------------
    console.log("3. Navigating to AR, opening menu (Desktop AR 1440x900)...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar" });
    await sleep(2500);
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".menu-button")?.click()`,
    });
    await sleep(800);
    await captureScreenshot(cdp, "nav-open-desktop-ar.png");

    // Close AR menu
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".menu-close")?.click()`,
    });
    await sleep(400);

    // -----------------------------------------------------------------
    // 4. Navigation Menu - Mobile (390x844) Closed and Open
    // -----------------------------------------------------------------
    console.log("4. Capturing Mobile EN Nav (390x844)...");
    await setViewport(cdp, 390, 844, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
    await sleep(2500);
    await captureScreenshot(cdp, "nav-closed-mobile-en.png");

    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".menu-button")?.click()`,
    });
    await sleep(800);
    await captureScreenshot(cdp, "nav-open-mobile-en.png");

    // Close menu
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".menu-close")?.click()`,
    });
    await sleep(400);

    // -----------------------------------------------------------------
    // 5. Careers Page - Desktop EN (1440x900)
    // -----------------------------------------------------------------
    console.log("5. Navigating to Careers Page (Desktop EN 1440x900)...");
    await setViewport(cdp, 1440, 900, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en/careers" });
    await sleep(2500);
    await captureScreenshot(cdp, "careers-hero-desktop-en.png");

    // Scroll to Life at Image section
    console.log("Scrolling to Life at Image...");
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".life-at-image-section")?.scrollIntoView({ behavior: "instant" })`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "careers-life-desktop-en.png");

    // Scroll to Open Positions
    console.log("Scrolling to Open Positions...");
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById("open-positions")?.scrollIntoView({ behavior: "instant" })`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "careers-vacancies-desktop-en.png");

    // -----------------------------------------------------------------
    // 6. Careers Job Detail Modal
    // -----------------------------------------------------------------
    console.log("Opening Job Details Modal...");
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".btn-view-job-details")?.click()`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "careers-job-details-modal.png");

    // Click "Apply for this Position" from inside the details modal
    console.log("Clicking Apply for this Position from modal...");
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".job-modal-footer .btn-apply-job")?.click()`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "careers-apply-modal-en.png");

    // Close application modal
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".application-modal-box .btn-modal-close")?.click()`,
    });
    await sleep(400);

    // -----------------------------------------------------------------
    // 7. Careers Page - Arabic Desktop (1440x900)
    // -----------------------------------------------------------------
    console.log("7. Navigating to Arabic Careers Page (Desktop AR 1440x900)...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/careers" });
    await sleep(2500);
    await captureScreenshot(cdp, "careers-hero-desktop-ar.png");

    // Scroll to Arabic Vacancies and Open Apply Modal
    console.log("Scrolling to AR Vacancies and opening apply modal...");
    await cdp.send("Runtime.evaluate", {
      expression: `document.getElementById("open-positions")?.scrollIntoView({ behavior: "instant" })`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "careers-vacancies-desktop-ar.png");

    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".btn-apply-job")?.click()`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "careers-apply-modal-ar.png");

    // -----------------------------------------------------------------
    // 8. Careers Page - Mobile EN (390x844)
    // -----------------------------------------------------------------
    console.log("8. Capturing Mobile EN Careers Page (390x844)...");
    await setViewport(cdp, 390, 844, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en/careers" });
    await sleep(2500);
    await captureScreenshot(cdp, "careers-hero-mobile-en.png");

    console.log("All navigation and careers screenshots successfully captured!");
  } finally {
    cdp.close();
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error("Error running capture script:", err);
  process.exit(1);
});
