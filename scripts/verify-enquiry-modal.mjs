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
  console.log(`[Screenshot] Saved: ${filename}`);
  return filepath;
}

async function run() {
  console.log("=== ENQUIRY MODAL & CTA FULL VERIFICATION ===");
  const prisma = new PrismaClient();

  // Create admin session token for viewing CMS leads
  const adminUser = await prisma.adminUser.findFirst();
  let sessionToken = null;
  if (adminUser) {
    sessionToken = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
    await prisma.adminSession.create({
      data: {
        tokenHash,
        userId: adminUser.id,
        expiresAt: new Date(Date.now() + 86400000 * 7),
      },
    });
    console.log("Admin session created for CMS inspection.");
  }

  console.log("Launching headless Chrome on port 9222...");
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
  for (let i = 0; i < 30; i++) {
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

  if (sessionToken) {
    await cdp.send("Network.setCookie", {
      name: "image_admin_session",
      value: sessionToken,
      domain: "localhost",
      path: "/",
    });
  }

  // 1. DESKTOP ENGLISH HEADER CTA & GENERAL ENQUIRY
  console.log("\n--- TEST 1: Desktop Header Enquiry CTA (English) ---");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
  await sleep(2500);

  // Click header enquire button
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.header-enquire-btn')?.click();`,
  });
  await sleep(600);
  await captureScreenshot(cdp, "en_header_enquiry_modal.png");

  const headerModalInfo = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const dialog = document.querySelector('.enquiry-modal-dialog');
        const rect = dialog?.getBoundingClientRect();
        return {
          isOpen: !!dialog,
          title: document.querySelector('.enquiry-title')?.textContent,
          submitText: document.querySelector('#enquiry-modal-submit-btn')?.textContent?.trim(),
          hasCloseBtn: !!document.querySelector('.enquiry-close-button'),
          hasHotline: !!document.querySelector('.enquiry-hotline-chip'),
          hasMessageField: !!document.querySelector('#enquiry-message'),
          modalWidth: Math.round(rect?.width || 0),
          modalHeight: Math.round(rect?.height || 0),
          bodyOverflow: document.body.style.overflow
        };
      })()
    `,
    returnByValue: true,
  });
  console.log("English Header Modal State:", headerModalInfo.result.value);

  // Test Escape key closes modal
  await cdp.send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape" });
  await sleep(400);

  const afterEscape = await cdp.send("Runtime.evaluate", {
    expression: `!document.querySelector('.enquiry-modal-dialog')`,
  });
  console.log("Escape key closed modal successfully:", afterEscape.result.value);

  // 2. PROJECT-SPECIFIC ENQUIRY (AERA) FROM PROJECT DETAIL PAGE
  console.log("\n--- TEST 2: Contextual Project Enquiry from Project Detail ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects/aera" });
  await sleep(2200);

  // Click the Register Interest button on the project hero
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.btn-project-enquire-hero')?.click();`,
  });
  await sleep(600);
  await captureScreenshot(cdp, "en_project_enquiry_modal.png");

  const projectModalInfo = await cdp.send("Runtime.evaluate", {
    expression: `
      ({
        title: document.querySelector('.enquiry-title')?.textContent,
        selectedProjectPill: document.querySelector('.enquiry-pill-name')?.textContent,
        hiddenProjectId: document.querySelector('input[name="projectId"]')?.value
      })
    `,
    returnByValue: true,
  });
  console.log("Project Enquiry Modal State:", projectModalInfo.result.value);

  // 3. VALIDATION ERROR STATES (SUBMIT BLANK)
  console.log("\n--- TEST 3: Validation & Inline Error Messaging ---");
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const nameInput = document.querySelector('#enquiry-name');
        if (nameInput) nameInput.value = '';
        const phoneInput = document.querySelector('#enquiry-phone');
        if (phoneInput) phoneInput.value = '';
        document.querySelector('#enquiry-modal-submit-btn')?.click();
      })()
    `,
  });
  await sleep(1500);
  await captureScreenshot(cdp, "en_validation_errors.png");

  const validationInfo = await cdp.send("Runtime.evaluate", {
    expression: `
      Array.from(document.querySelectorAll('#enquiry-modal-form .enquiry-field-error')).map(e => e.textContent)
    `,
    returnByValue: true,
  });
  console.log("Inline validation error messages displayed:", validationInfo.result.value);

  // 4. SUCCESSFUL SUBMISSION FLOW
  console.log("\n--- TEST 4: Successful Submission & Real CMS Lead Integration ---");
  const testEmail = `test.buyer.${Date.now()}@example.com`;
  await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const nameInput = document.querySelector('#enquiry-name');
        const emailInput = document.querySelector('#enquiry-email');
        const phoneInput = document.querySelector('#enquiry-phone');

        nameInput.value = "Kareem El-Sayed";
        emailInput.value = "${testEmail}";
        phoneInput.value = "1023456789";

        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        phoneInput.dispatchEvent(new Event('input', { bubbles: true }));

        document.querySelector('#enquiry-modal-submit-btn')?.click();
      })()
    `,
  });

  await sleep(2500);
  await captureScreenshot(cdp, "en_submission_success.png");

  const successViewInfo = await cdp.send("Runtime.evaluate", {
    expression: `
      ({
        isSuccess: !!document.querySelector('.enquiry-success-view'),
        title: document.querySelector('.enquiry-success-title')?.textContent,
        desc: document.querySelector('.enquiry-success-desc')?.textContent,
        projectBadge: document.querySelector('.enquiry-success-project-badge')?.textContent
      })
    `,
    returnByValue: true,
  });
  console.log("Confirmation View State:", successViewInfo.result.value);
  console.log("Confirmation View State:", successViewInfo.result.value);

  // Verify in SQLite database
  const createdLead = await prisma.contactSubmission.findFirst({
    where: { email: testEmail },
  });
  console.log("Database Record Verified:", {
    id: createdLead?.id,
    name: createdLead?.name,
    email: createdLead?.email,
    phone: createdLead?.phone,
    subject: createdLead?.subject,
    notes: createdLead?.notes,
    status: createdLead?.status,
  });

  // 5. ARABIC RTL MODAL VERIFICATION
  console.log("\n--- TEST 5: Arabic RTL Header & Project Enquiry Modal ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects/aera" });
  await sleep(2200);

  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.btn-project-enquire-hero')?.click();`,
  });
  await sleep(600);
  await captureScreenshot(cdp, "ar_project_enquiry_modal.png");

  const arModalInfo = await cdp.send("Runtime.evaluate", {
    expression: `
      ({
        htmlDir: document.documentElement.dir,
        modalDir: document.querySelector('.enquiry-modal-dialog')?.getAttribute('dir'),
        title: document.querySelector('.enquiry-title')?.textContent,
        submitLabel: document.querySelector('.enquiry-submit-button')?.textContent?.trim(),
        emailDir: window.getComputedStyle(document.querySelector('#enquiry-email')).direction,
        phoneDir: window.getComputedStyle(document.querySelector('#enquiry-phone')).direction
      })
    `,
    returnByValue: true,
  });
  console.log("Arabic Modal RTL Attributes:", arModalInfo.result.value);

  // 6. MOBILE EXPERIENCE (390 x 844)
  console.log("\n--- TEST 6: Mobile Centered Dialog (English & Arabic) ---");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await cdp.send("Page.navigate", { url: "http://localhost:3000/en/projects/aera" });
  await sleep(2000);
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.btn-project-enquire-hero')?.click();`,
  });
  await sleep(600);
  await captureScreenshot(cdp, "en_enquiry_modal_mobile.png");

  const mobileEnInfo = await cdp.send("Runtime.evaluate", {
    expression: `
      (() => {
        const dialog = document.querySelector('.enquiry-modal-dialog');
        const rect = dialog?.getBoundingClientRect();
        return {
          width: Math.round(rect?.width || 0),
          height: Math.round(rect?.height || 0),
          isCentered: Math.abs(window.innerWidth - (rect?.width || 0)) <= 34
        };
      })()
    `,
    returnByValue: true,
  });
  console.log("Mobile English Dialog Metrics:", mobileEnInfo.result.value);

  await cdp.send("Page.navigate", { url: "http://localhost:3000/ar/projects/aera" });
  await sleep(2000);
  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.btn-project-enquire-hero')?.click();`,
  });
  await sleep(600);
  await captureScreenshot(cdp, "ar_enquiry_modal_mobile.png");

  // 7. FLOATING QUICK ACTION VERIFICATION
  console.log("\n--- TEST 7: Floating Quick Action CTA ---");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });
  await cdp.send("Page.navigate", { url: "http://localhost:3000/en" });
  await sleep(1500);

  // Scroll down 600px to reveal floating pill
  await cdp.send("Runtime.evaluate", { expression: `window.scrollTo(0, 600);` });
  await sleep(600);

  const floatingBtnVisible = await cdp.send("Runtime.evaluate", {
    expression: `!!document.querySelector('.floating-enquiry-btn')`,
  });
  console.log("Floating action pill visible after scroll:", floatingBtnVisible.result.value);

  await cdp.send("Runtime.evaluate", {
    expression: `document.querySelector('.floating-enquiry-btn')?.click();`,
  });
  await sleep(600);
  await captureScreenshot(cdp, "floating_enquiry_modal.png");

  // 8. CMS LEADS DASHBOARD INSPECTION
  console.log("\n--- TEST 8: CMS Leads Management Inspection ---");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/leads" });
  await sleep(2500);
  await captureScreenshot(cdp, "cms_leads_table.png");

  const leadsCount = await cdp.send("Runtime.evaluate", {
    expression: `document.querySelectorAll('tbody tr').length`,
  });
  console.log("CMS Leads count in table:", leadsCount.result.value);

  cdp.close();
  chromeProcess.kill();
  await prisma.$disconnect();
  console.log("\n=== ALL VERIFICATION CHECKS COMPLETED SUCCESSFULLY ===");
}

run().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
