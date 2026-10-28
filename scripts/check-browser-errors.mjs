import { spawn } from "child_process";

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const chromeProcess = spawn(
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    [
      "--headless=new",
      "--remote-debugging-port=9224",
      "--disable-gpu",
      "--no-sandbox",
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
    chromeProcess.kill();
    process.exit(1);
  }

  const newTabRes = await fetch("http://127.0.0.1:9224/json/new?about:blank", { method: "PUT" });
  const newTab = await newTabRes.json();
  const ws = new WebSocket(newTab.webSocketDebuggerUrl);

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  const logs = [];
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.consoleAPICalled") {
      logs.push({ type: msg.params.type, args: msg.params.args.map((a) => a.value || a.description) });
    }
    if (msg.method === "Runtime.exceptionThrown") {
      logs.push({ type: "exception", details: msg.params.exceptionDetails });
    }
    if (msg.method === "Log.entryAdded") {
      logs.push({ type: "log", entry: msg.params.entry });
    }
  };

  let id = 0;
  const send = (method, params = {}) => {
    ws.send(JSON.stringify({ id: ++id, method, params }));
  };

  send("Page.enable");
  send("Runtime.enable");
  send("Log.enable");

  send("Page.navigate", { url: "http://localhost:3000/ar/projects" });

  await sleep(4000);

  console.log("=== BROWSER LOGS & ISSUES ===");
  console.log(JSON.stringify(logs, null, 2));

  // Also evaluate and get Next.js dev overlay errors if any
  // Check if any error overlay exists
  send("Runtime.evaluate", {
    expression: `
      (() => {
        const errors = [];
        const nextError = document.querySelector('nextjs-portal');
        if (nextError) errors.push('nextjs-portal found');
        return {
          title: document.title,
          url: window.location.href,
          errors
        };
      })()
    `,
    returnByValue: true,
  });

  await sleep(1000);

  ws.close();
  chromeProcess.kill();
}

run();
