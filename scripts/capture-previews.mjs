#!/usr/bin/env node
/**
 * Captures the screenshots used by the marketing page, straight from the real
 * product: the public demo wedding and its admin panel.
 *
 * Usage:
 *   npm run capture-previews                  # uses the production URL
 *   npm run capture-previews -- http://localhost:3000
 *
 * Needs Chrome installed (or CHROME_PATH) and the demo account in .env.local:
 *   DEMO_ADMIN_EMAIL=...
 *   DEMO_ADMIN_PASSWORD=...
 *
 * Nothing here ships to the browser: the PNGs are temporary, the AVIF/WebP in
 * public/previews is what the page loads. Re-run after a UI change so the
 * screenshots never show an older design.
 */
import { spawn, spawnSync } from "node:child_process";
import { mkdtemp, mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { randomInt } from "node:crypto";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
loadEnv(join(root, ".env.local"));

const SITE = (process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL ?? "https://wedding-ro.vercel.app").replace(/\/+$/, "");
const SLUG = "demo";
const EMAIL = process.env.DEMO_ADMIN_EMAIL ?? "demo@ne-casatorim.ro";
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? "";

const CHROME =
  process.env.CHROME_PATH ||
  [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
  ].find((path) => existsSync(path));

if (!CHROME) {
  console.error("Chrome nu a fost găsit. Setează CHROME_PATH.");
  process.exit(1);
}
if (!PASSWORD) {
  console.error("Lipsește DEMO_ADMIN_PASSWORD în .env.local (parola contului demo).");
  process.exit(1);
}

const OUT = join(root, "public", "previews");
const RAW = join(root, ".previews-raw");
// A fresh port per run: reusing one would let this run attach to a Chrome left
// behind by an earlier run, complete with its signed-in session.
const PORT = 9400 + randomInt(0, 400);

await rm(RAW, { recursive: true, force: true });
await mkdir(RAW, { recursive: true });
await mkdir(OUT, { recursive: true });

// Desktop: a normal laptop window. Phone: a modern 390×844 screen.
const DESKTOP = { width: 1440, height: 900, scale: 2 };
const PHONE = { width: 390, height: 844, scale: 2, mobile: true };

const shots = [
  { name: "deschidere", viewport: DESKTOP, path: `/${SLUG}`, settle: 1600 },
  { name: "deschidere-telefon", viewport: PHONE, path: `/${SLUG}`, settle: 1600 },
  { name: "invitatie", viewport: DESKTOP, path: `/${SLUG}`, open: true, settle: 1400 },
  { name: "invitatie-telefon", viewport: PHONE, path: `/${SLUG}`, open: true, settle: 1400 },
  { name: "program", viewport: DESKTOP, path: `/${SLUG}`, open: true, scrollTo: "locatii", settle: 1200 },
  { name: "confirmare", viewport: DESKTOP, path: `/${SLUG}?nume=Ana%20Ionescu#rsvp`, click: "Continuă", scrollTo: "rsvp", settle: 1600 },
  { name: "confirmare-telefon", viewport: PHONE, path: `/${SLUG}?nume=Ana%20Ionescu#rsvp`, click: "Continuă", scrollTo: "rsvp", settle: 1600 },
];

const panelShots = [
  { name: "panou-invitati", path: `/${SLUG}/admin` },
  { name: "panou-confirmari", path: `/${SLUG}/admin/confirmari` },
  { name: "panou-mese", path: `/${SLUG}/admin/seating` },
  { name: "panou-buget", path: `/${SLUG}/admin/budget` },
  { name: "panou-mesaje", path: `/${SLUG}/admin/messages` },
];

const profile = await mkdtemp(join(tmpdir(), "preview-chrome-"));
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--disable-gpu",
    "--hide-scrollbars",
    "--disable-extensions",
    "--force-color-profile=srgb",
    "about:blank",
  ],
  { stdio: "ignore" }
);

const cleanup = async () => {
  try {
    if (process.platform === "win32") {
      // Chrome starts helper processes; killing only the launcher leaves the
      // browser alive, holding the profile and the debugging port.
      spawnSync("taskkill", ["/pid", String(chrome.pid), "/T", "/F"], { stdio: "ignore" });
    } else {
      chrome.kill("SIGKILL");
    }
  } catch {
    /* already gone */
  }
  await sleep(600);
  // Windows keeps a few Crashpad files locked for a moment after the process
  // exits, so a failed unlink must never fail the run: the profile lives in the
  // OS temp folder and is disposable.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await rm(profile, { recursive: true, force: true, maxRetries: 2 });
      return;
    } catch (error) {
      if (attempt === 2) {
        console.warn(`  ! profilul Chrome nu a putut fi șters (${error.code ?? error.message})`);
        return;
      }
      await sleep(400);
    }
  }
};

process.on("SIGINT", async () => {
  await cleanup();
  process.exit(1);
});

try {
  const target = await waitForTarget();
  const page = await connect(target.webSocketDebuggerUrl);
  await page.send("Page.enable");
  await page.send("Runtime.enable");

  console.log(`› Capturi din ${SITE}`);

  for (const shot of shots) {
    await page.setViewport(shot.viewport);
    await page.navigate(`${SITE}${shot.path}`, shot.settle);
    if (shot.open) {
      const clicked = await page.clickText("Deschide Invitația");
      if (!clicked) console.warn(`  ! butonul nu a fost găsit pentru ${shot.name}`);
      await page.sleep(1500);
    }
    if (shot.click) {
      const clicked = await page.clickText(shot.click);
      if (!clicked) console.warn(`  ! butonul „${shot.click}” nu a fost găsit pentru ${shot.name}`);
      await page.sleep(1500);
    }
    if (shot.scrollTo) {
      await page.scrollToId(shot.scrollTo);
      await page.sleep(700);
    }
    const png = await page.screenshot();
    await writeFile(join(RAW, `${shot.name}.png`), png);
    console.log(`  ✓ ${shot.name}`);
  }

  // The panel needs a session: sign in once, then every page is reachable.
  await page.setViewport(DESKTOP);
  await page.navigate(`${SITE}/${SLUG}/admin/login`, 1400);
  const loginUrl = await page.evaluate("window.location.href").catch(() => "?");
  const loginForm = await page.evaluate("!!document.querySelector('form')").catch(() => false);
  console.log(`  · login: ${loginUrl} (form: ${loginForm})`);
  await page.fill("#email", EMAIL);
  await page.fill("#password", PASSWORD);
  await page.submit("form");
  if (!(await page.waitForPath(`/${SLUG}/admin`, 25_000))) {
    const where = await page.evaluate("window.location.href").catch(() => "?");
    throw new Error(`Autentificarea în panoul demo a eșuat (${where}) — verifică DEMO_ADMIN_PASSWORD.`);
  }
  console.log("  ✓ autentificare");

  for (const shot of panelShots) {
    await page.navigate(`${SITE}${shot.path}`, 1200);
    // The panel loads its data after the shell: wait until the skeletons are
    // replaced, otherwise the screenshot shows grey boxes.
    await page.waitForSettled();
    const png = await page.screenshot();
    await writeFile(join(RAW, `${shot.name}.png`), png);
    console.log(`  ✓ ${shot.name}`);
  }

  await page.close();
  await writeOutputs();
  console.log(`\n✔ Capturi scrise în public/previews (${shots.length + panelShots.length} imagini)`);
} finally {
  await cleanup();
}

/* ------------------------------------------------------------------ images */

async function writeOutputs() {
  const files = await readdir(RAW);
  for (const file of files) {
    if (!file.endsWith(".png")) continue;
    const name = file.replace(/\.png$/, "");
    const source = join(RAW, file);
    const isPhone = name.includes("telefon");
    // Desktop shots are shown at ~1100 CSS px, phone ones in a ~260 px frame.
    const widths = isPhone ? [520, 780] : [1200, 2000];

    for (const width of widths) {
      const base = sharp(source).resize({ width, withoutEnlargement: true });
      const avif = await base.clone().avif({ quality: 58, effort: 5 }).toBuffer();
      const webp = await base.clone().webp({ quality: 78 }).toBuffer();
      await writeFile(join(OUT, `${name}-${width}.avif`), avif);
      await writeFile(join(OUT, `${name}-${width}.webp`), webp);
    }
    const sourceSize = Math.round((await stat(source)).size / 1024);
    console.log(`    ${name}: ${sourceSize} KB sursă → ${widths.join("/")} px`);
  }
  await rm(RAW, { recursive: true, force: true });
}

/* ------------------------------------------------------------------- chrome */

async function waitForTarget() {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" });
      if (res.ok) return await res.json();
    } catch {
      /* Chrome is still starting */
    }
    await sleep(150);
  }
  throw new Error("Chrome nu a pornit.");
}

async function connect(url) {
  const ws = new WebSocket(url);
  const pending = new Map();
  let nextId = 1;

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve, reject } = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) reject(new Error(`${data.error.message}`));
      else resolve(data.result);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = nextId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression, awaitPromise = false) => {
    const result = await send("Runtime.evaluate", {
      expression,
      awaitPromise,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text ?? "evaluate failed");
    }
    return result.result.value;
  };

  return {
    send,
    evaluate,
    sleep: (ms) => sleep(ms),

    async setViewport({ width, height, scale, mobile = false }) {
      await send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: scale,
        mobile,
      });
      await send("Emulation.setTouchEmulationEnabled", { enabled: mobile });
    },

    async navigate(url, settle = 1200) {
      await send("Page.navigate", { url });
      await sleep(settle);
      await evaluate("document.fonts.ready.then(() => true)", true).catch(() => {});
      await sleep(250);
    },

    async clickText(text) {
      const found = await evaluate(`(() => {
        const wanted = ${JSON.stringify(text)};
        const node = [...document.querySelectorAll("button, a")].find(
          (el) => (el.textContent || "").replace(/\\s+/g, " ").includes(wanted)
        );
        if (!node) return false;
        node.click();
        return true;
      })()`);
      return found === true;
    },

    async scrollToId(id) {
      await evaluate(`(() => {
        const el = document.getElementById(${JSON.stringify(id)});
        if (!el) return false;
        window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
        return true;
      })()`);
    },

    async fill(selector, value) {
      await this.waitForSelector(selector);
      await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`);
      await send("Input.insertText", { text: value });
    },

    async waitForSelector(selector, timeout = 15_000) {
      const started = Date.now();
      while (Date.now() - started < timeout) {
        const found = await evaluate(
          `!!document.querySelector(${JSON.stringify(selector)})`
        ).catch(() => false);
        if (found === true) return true;
        await sleep(250);
      }
      throw new Error(`Elementul ${selector} nu a apărut.`);
    },

    async submit(selector) {
      await evaluate(`document.querySelector(${JSON.stringify(selector)}).requestSubmit()`);
    },

    async waitForPath(path, timeout = 20_000) {
      const started = Date.now();
      while (Date.now() - started < timeout) {
        const current = await evaluate("window.location.pathname + window.location.search").catch(() => "");
        if (typeof current === "string") {
          const [pathname, query = ""] = current.split("?");
          if (pathname === path) return query.includes("error=") ? false : true;
          if (query.includes("error=") && pathname === `${path}/login`) return false;
        }
        await sleep(300);
      }
      return false;
    },

    /** Waits out the panel's skeletons and any late data paint. */
    async waitForSettled(timeout = 15_000) {
      const started = Date.now();
      let quiet = 0;
      while (Date.now() - started < timeout) {
        const busy = await evaluate(
          `document.readyState !== "complete" ||
           !!document.querySelector(".animate-pulse") ||
           !!document.querySelector("[aria-busy='true']")`
        ).catch(() => true);
        quiet = busy === false ? quiet + 1 : 0;
        if (quiet >= 3) {
          await sleep(500);
          return true;
        }
        await sleep(350);
      }
      return false;
    },

    async screenshot() {
      const { data } = await send("Page.captureScreenshot", { format: "png" });
      return Buffer.from(data, "base64");
    },

    async close() {
      try {
        ws.close();
      } catch {
        /* already closed */
      }
    },
  };
}

/* ------------------------------------------------------------------ helpers */

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[match[1]]) process.env[match[1]] = value;
  }
}
