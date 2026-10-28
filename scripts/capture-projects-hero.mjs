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
  console.log("Launching Chrome...");
  const chromeProcess = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9223",
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
      const res = await fetch("http://127.0.0.1:9223/json/version");
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

  const newTabRes = await fetch("http://127.0.0.1:9223/json/new?about:blank", { method: "PUT" });
  const newTab = await newTabRes.json();
  const cdp = new CDPClient(newTab.webSocketDebuggerUrl);
  await cdp.connect();
  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Runtime.enable");

  try {
    // Listen for console messages and exceptions
    const pageErrors = [];
    await cdp.send("Runtime.enable");
    cdp.ws.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.method === "Runtime.exceptionThrown") {
          pageErrors.push(msg.params.exceptionDetails);
        }
        if (msg.method === "Runtime.consoleAPICalled" && msg.params.type === "error") {
          pageErrors.push(msg.params.args);
        }
      } catch {}
    });

    // 1. English Desktop (1440x900)
    console.log("Capturing EN Desktop (1440x900)...");
    await setViewport(cdp, 1440, 900, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
    await sleep(3500); // wait for entrance animation and cinematic curtain to settle
    await captureScreenshot(cdp, "projects-hero-en-desktop-1440.png");

    // 2. Click "Explore Projects" CTA and capture scrolled view (Filter toolbar & first card)
    console.log("Clicking Explore Projects CTA...");
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".btn-hero-primary")?.click()`,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "projects-collection-en-scrolled-1440.png");

    // 3. Scroll down to view the project cards alternating sequence
    console.log("Capturing project cards alternating sequence...");
    await cdp.send("Runtime.evaluate", {
      expression: `window.scrollBy({ top: 700, behavior: 'instant' })`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "projects-cards-alternating-en-1440.png");

    // 4. Scroll down to view the dark-mode closing CTA panel
    console.log("Capturing closing CTA section...");
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".projects-closing-cta")?.scrollIntoView({ behavior: 'instant', block: 'center' })`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "projects-closing-cta-en-1440.png");

    // 5. Click "Register Interest" CTA and capture enquiry modal
    console.log("Clicking Register Interest CTA...");
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".btn-closing-enquiry")?.click()`,
    });
    await sleep(800);
    await captureScreenshot(cdp, "projects-enquiry-modal-en-1440.png");

    // Close modal
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".enquiry-modal-close")?.click()`,
    });
    await sleep(500);

    // 6. Arabic Desktop (1440x900)
    console.log("Capturing AR Desktop (1440x900)...");
    await setViewport(cdp, 1440, 900, false);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects" });
    await sleep(2500);
    await captureScreenshot(cdp, "projects-hero-ar-desktop-1440.png");

    console.log("Clicking AR Explore Projects CTA...");
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".btn-hero-primary")?.click()`,
    });
    await sleep(1000);
    await captureScreenshot(cdp, "projects-collection-ar-scrolled-1440.png");

    // Test filter interaction: select residential type
    console.log("Selecting Residential filter...");
    await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const sel = document.getElementById("filter-type");
        if (sel) {
          sel.value = "RESIDENTIAL";
          sel.dispatchEvent(new Event("change", { bubbles: true }));
        }
      })()`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "projects-filter-active-state-ar-1440.png");

    // Arabic Project Cards alternating sequence
    await cdp.send("Runtime.evaluate", {
      expression: `window.scrollBy({ top: 700, behavior: 'instant' })`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "projects-cards-alternating-ar-1440.png");

    // Arabic Closing CTA
    await cdp.send("Runtime.evaluate", {
      expression: `document.querySelector(".projects-closing-cta")?.scrollIntoView({ behavior: 'instant', block: 'center' })`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "projects-closing-cta-ar-1440.png");

    // 7. Arabic Mobile (390x844)
    console.log("Capturing AR Mobile (390x844)...");
    await setViewport(cdp, 390, 844, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects" });
    await sleep(2500);
    await captureScreenshot(cdp, "projects-hero-ar-mobile-390.png");

    // Scrolled Arabic Mobile
    await cdp.send("Runtime.evaluate", {
      expression: `window.scrollBy({ top: 750, behavior: 'instant' })`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "projects-collection-ar-mobile-390.png");

    // 8. English Mobile (390x844)
    console.log("Capturing EN Mobile (390x844)...");
    await setViewport(cdp, 390, 844, true);
    await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
    await sleep(2500);
    await captureScreenshot(cdp, "projects-hero-en-mobile-390.png");

    // Scrolled English Mobile
    await cdp.send("Runtime.evaluate", {
      expression: `window.scrollBy({ top: 750, behavior: 'instant' })`,
    });
    await sleep(600);
    await captureScreenshot(cdp, "projects-collection-en-mobile-390.png");

    console.log("Page errors recorded during navigation:", pageErrors.length);
    if (pageErrors.length > 0) {
      console.warn("Errors caught:", JSON.stringify(pageErrors, null, 2));
    }
    console.log("All screenshots successfully captured!");
  } finally {
    cdp.close();
    chromeProcess.kill();
  }
}

run().catch((err) => {
  console.error("Error running capture script:", err);
  process.exit(1);
});
