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
  console.log(`[Screenshot] Saved: ${filename}`);
  return filepath;
}

async function run() {
  console.log("=== ENQUIRY MODAL REFINEMENT VERIFICATION ===");

  let versionInfo = null;
  let chromeProcess = null;

  try {
    const res = await fetch("http://127.0.0.1:9222/json/version");
    versionInfo = await res.json();
    console.log("Connected to existing Chrome instance.");
  } catch {
    console.log("Launching headless Chrome on port 9222...");
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
    console.error("Failed to connect to Chrome debugging port");
    if (chromeProcess) chromeProcess.kill();
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

  // TEST 1: Desktop English Modal Open
  console.log("\n--- TEST 1: Desktop English Enquiry Modal ---");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
  await sleep(2200);

  // Click the enquire button
  const clickRes = await cdp.send("Runtime.evaluate", {
    expression: `
      const btn = document.querySelector('.btn-hero-secondary') || document.querySelector('[data-enquiry-trigger]');
      if (btn) { btn.click(); true; } else { false; }
    `,
    returnByValue: true,
  });
  console.log("Clicked enquiry button:", clickRes.result.value);
  await sleep(600);

  // Measure computed styles of the fields
  const fieldMetrics = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const nameInput = document.querySelector('input[name="name"]');
        const emailInput = document.querySelector('input[name="email"]');
        const phoneCtrl = document.querySelector('.enquiry-phone-control');
        const phoneInput = document.querySelector('input[name="phone"]');
        const countrySelect = document.querySelector('select[name="countryCode"]');
        const projectSelect = document.querySelector('select[name="projectId"]');
        const textarea = document.querySelector('textarea[name="message"]');
        const label = document.querySelector('.enquiry-label');
        const formBody = document.querySelector('.enquiry-modal-body');

        const getStyle = (el) => {
          if (!el) return null;
          const s = window.getComputedStyle(el);
          return {
            height: s.height,
            padding: s.padding,
            border: s.border,
            borderRadius: s.borderRadius,
            fontSize: s.fontSize,
            fontWeight: s.fontWeight,
            color: s.color,
            backgroundColor: s.backgroundColor,
          };
        };

        const getNameRect = nameInput ? nameInput.getBoundingClientRect() : null;
        const getEmailRect = emailInput ? emailInput.getBoundingClientRect() : null;

        return {
          isOpen: !!document.querySelector('.enquiry-modal-dialog'),
          formDisplay: formBody ? window.getComputedStyle(formBody).display : null,
          formGap: formBody ? window.getComputedStyle(formBody).gap : null,
          isSideBySide: getNameRect && getEmailRect ? Math.abs(getNameRect.top - getEmailRect.top) < 5 : false,
          nameInput: getStyle(nameInput),
          phoneCtrl: getStyle(phoneCtrl),
          phoneInput: getStyle(phoneInput),
          countrySelect: getStyle(countrySelect),
          projectSelect: getStyle(projectSelect),
          textarea: getStyle(textarea),
          label: getStyle(label),
        };
      })()
    `,
    returnByValue: true,
  });
  console.log("Field metrics:", JSON.stringify(fieldMetrics.result.value, null, 2));

  await captureScreenshot(cdp, "enquiry_modal_desktop_en.png");

  // TEST 2: Focused State
  console.log("\n--- TEST 2: Focused Field State ---");
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('input[name="name"]')?.focus();`,
  });
  await sleep(300);
  await captureScreenshot(cdp, "enquiry_modal_desktop_focused.png");

  // TEST 3: Validation Error State
  console.log("\n--- TEST 3: Validation Error State ---");
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('#enquiry-modal-submit-btn')?.click();`,
  });
  await sleep(400);

  const errorMetrics = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const errors = Array.from(document.querySelectorAll('.enquiry-error')).map(e => e.textContent.trim());
        const hasAriaInvalid = Array.from(document.querySelectorAll('[aria-invalid="true"]')).length;
        return { errors, hasAriaInvalid };
      })()
    `,
    returnByValue: true,
  });
  console.log("Validation errors displayed:", errorMetrics.result.value);
  await captureScreenshot(cdp, "enquiry_modal_desktop_errors.png");

  // Close modal via escape
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape" });
  await sleep(400);

  // TEST 4: Desktop Arabic Modal Open
  console.log("\n--- TEST 4: Desktop Arabic Enquiry Modal ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects" });
  await sleep(2200);

  await cdp.send("Runtime.evaluate", {
    expression: `
      const btn = document.querySelector('.btn-hero-secondary') || document.querySelector('[data-enquiry-trigger]');
      if (btn) { btn.click(); true; } else { false; }
    `,
  });
  await sleep(600);

  const arMetrics = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const dialog = document.querySelector('.enquiry-modal-dialog');
        const phoneInput = document.querySelector('input[name="phone"]');
        const emailInput = document.querySelector('input[name="email"]');
        return {
          isOpen: !!dialog,
          dialogDir: dialog?.getAttribute('dir') || window.getComputedStyle(dialog).direction,
          phoneDir: phoneInput?.getAttribute('dir'),
          emailDir: emailInput?.getAttribute('dir'),
        };
      })()
    `,
    returnByValue: true,
  });
  console.log("Arabic modal metrics:", arMetrics.result.value);
  await captureScreenshot(cdp, "enquiry_modal_desktop_ar.png");

  // TEST 5: Mobile English Modal
  console.log("\n--- TEST 5: Mobile English Modal ---");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });

  await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects" });
  await sleep(2000);

  await cdp.send("Runtime.evaluate", {
    expression: `
      const btn = document.querySelector('.btn-hero-secondary') || document.querySelector('[data-enquiry-trigger]');
      if (btn) { btn.click(); true; } else { false; }
    `,
  });
  await sleep(600);

  const mobileMetrics = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const nameInput = document.querySelector('input[name="name"]');
        const emailInput = document.querySelector('input[name="email"]');
        const dialog = document.querySelector('.enquiry-modal-dialog');
        const getNameRect = nameInput ? nameInput.getBoundingClientRect() : null;
        const getEmailRect = emailInput ? emailInput.getBoundingClientRect() : null;
        return {
          isOpen: !!dialog,
          dialogWidth: dialog ? dialog.getBoundingClientRect().width : null,
          hasHorizontalScroll: document.documentElement.scrollWidth > window.innerWidth,
          isStackedOnMobile: getNameRect && getEmailRect ? getNameRect.top < getEmailRect.top : false,
        };
      })()
    `,
    returnByValue: true,
  });
  console.log("Mobile metrics (English):", mobileMetrics.result.value);
  await captureScreenshot(cdp, "enquiry_modal_mobile_en.png");

  // TEST 6: Mobile Arabic Modal
  console.log("\n--- TEST 6: Mobile Arabic Modal ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects" });
  await sleep(2000);

  await cdp.send("Runtime.evaluate", {
    expression: `
      const btn = document.querySelector('.btn-hero-secondary') || document.querySelector('[data-enquiry-trigger]');
      if (btn) { btn.click(); true; } else { false; }
    `,
  });
  await sleep(600);

  await captureScreenshot(cdp, "enquiry_modal_mobile_ar.png");

  console.log("\n=== ALL REFINEMENT CHECKS & SCREENSHOTS COMPLETED ===");
  cdp.close();
  if (chromeProcess) chromeProcess.kill();
  process.exit(0);
}

run().catch((err) => {
  console.error("Verification error:", err);
  process.exit(1);
});
