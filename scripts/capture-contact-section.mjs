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

async function scrollToContact(cdp, id = "contact") {
  return await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const el = document.getElementById("${id}") || document.querySelector(".global-contact");
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        const top = rect.top + window.scrollY;
        window.scrollTo({ top: Math.max(0, top - 20), behavior: "instant" });
        return { top, height: rect.height, id: el.id, className: el.className };
      })()
    `,
    returnByValue: true,
  });
}

async function run() {
  console.log("Launching Chrome for Contact Section verification...");
  const chromeProcess = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9228",
      "--disable-gpu",
      "--no-sandbox",
      "--window-size=1440,950",
    ],
    { stdio: "ignore" }
  );

  let versionInfo = null;
  for (let i = 0; i < 25; i++) {
    await sleep(200);
    try {
      const res = await fetch("http://127.0.0.1:9228/json/version");
      versionInfo = await res.json();
      break;
    } catch {}
  }

  const newTabRes = await fetch("http://127.0.0.1:9228/json/new?about:blank", { method: "PUT" });
  const newTab = await newTabRes.json();
  const cdp = new CDPClient(newTab.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Runtime.enable");

  try {
    // 1. Desktop English Home (1440x950)
    console.log("Capturing EN Desktop Contact...");
    await setViewport(cdp, 1440, 950, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
    await sleep(2500);
    await scrollToContact(cdp, "contact");
    await sleep(1000);
    await captureScreenshot(cdp, "contact-desktop-en-refined.png");

    // 2. Desktop Arabic Home (1440x950)
    console.log("Capturing AR Desktop Contact...");
    await setViewport(cdp, 1440, 950, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar" });
    await sleep(2500);
    await scrollToContact(cdp, "contact");
    await sleep(1000);
    await captureScreenshot(cdp, "contact-desktop-ar-refined.png");

    // 3. Contact Page English (/en/contact) (1440x950)
    console.log("Capturing EN Contact Page Section D...");
    await setViewport(cdp, 1440, 950, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en/contact" });
    await sleep(2500);
    await scrollToContact(cdp, "contact-form");
    await sleep(1000);
    await captureScreenshot(cdp, "contact-page-en-refined.png");

    // 4. Contact Page Arabic (/ar/contact) (1440x950)
    console.log("Capturing AR Contact Page Section D...");
    await setViewport(cdp, 1440, 950, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/contact" });
    await sleep(2500);
    await scrollToContact(cdp, "contact-form");
    await sleep(1000);
    await captureScreenshot(cdp, "contact-page-ar-refined.png");

    // 5. Tablet English (820x1180)
    console.log("Capturing Tablet EN Contact...");
    await setViewport(cdp, 820, 1180, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
    await sleep(2500);
    await scrollToContact(cdp, "contact");
    await sleep(1000);
    await captureScreenshot(cdp, "contact-tablet-en-refined.png");

    // 6. Tablet Arabic (820x1180)
    console.log("Capturing Tablet AR Contact...");
    await setViewport(cdp, 820, 1180, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar" });
    await sleep(2500);
    await scrollToContact(cdp, "contact");
    await sleep(1000);
    await captureScreenshot(cdp, "contact-tablet-ar-refined.png");

    // 7. Mobile English (390x844)
    console.log("Capturing Mobile EN Contact...");
    await setViewport(cdp, 390, 844, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
    await sleep(2500);
    await scrollToContact(cdp, "contact");
    await sleep(1000);
    await captureScreenshot(cdp, "contact-mobile-en-refined.png");

    // 8. Mobile Arabic (390x844)
    console.log("Capturing Mobile AR Contact...");
    await setViewport(cdp, 390, 844, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar" });
    await sleep(2500);
    await scrollToContact(cdp, "contact");
    await sleep(1000);
    await captureScreenshot(cdp, "contact-mobile-ar-refined.png");

    // 9. Test Form Validation & Error Preservation
    console.log("Testing validation error state...");
    await setViewport(cdp, 1440, 950, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
    await sleep(2500);
    await scrollToContact(cdp, "contact");
    await sleep(600);
    // Fill partial inputs and trigger submit
    await cdp.send("Runtime.evaluate", {
      expression: `
        (() => {
          const form = document.querySelector(".contact-form-refined");
          if (!form) return false;
          const phoneInput = document.getElementById("contact-phone");
          if (phoneInput) phoneInput.value = "01099998888";
          const emailInput = document.getElementById("contact-email");
          if (emailInput) emailInput.value = "john@example.com";
          const submitBtn = document.getElementById("contact-form-submit-btn");
          if (submitBtn) submitBtn.click();
          return true;
        })()
      `,
    });
    await sleep(2000);
    await scrollToContact(cdp, "contact");
    await sleep(600);
    await captureScreenshot(cdp, "contact-validation-error-en.png");

    console.log("All captures completed successfully!");
  } finally {
    cdp.close();
    chromeProcess.kill();
  }
}

run().catch(console.error);
