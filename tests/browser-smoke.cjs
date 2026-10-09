// Optional browser verification; Playwright is a test-only dependency.
// See docs/cloud-native-validation.md for the isolated installation command.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const base = process.env.SIMPLEKIT_PREVIEW_URL || "http://127.0.0.1:8000";
  const origin = new URL(base).origin;
  assert(["127.0.0.1", "localhost"].includes(new URL(base).hostname), "Use a local preview, not production");
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    headless: true,
    args: ["--no-sandbox"]
  });
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/tools.json"), "utf8"));
  let pageErrors = 0;
  let failedResponses = 0;
  async function newContext() {
    const context = await browser.newContext();
    // Analytics and unrelated external services are outside this smoke test.
    await context.route("**/*", route => new URL(route.request().url()).origin === origin
      ? route.continue()
      : route.fulfill({ status: 200, body: "", contentType: "text/plain" }));
    return context;
  }
  try {
    for (const tool of manifest.tools) {
      const context = await newContext();
      const page = await context.newPage();
      page.on("pageerror", error => { pageErrors++; console.error(`${tool.slug}: ${error.message}`); });
      page.on("response", response => {
        if (new URL(response.url()).origin === origin && response.status() >= 400) {
          failedResponses++; console.error(`${tool.slug}: ${response.status()} ${response.url()}`);
        }
      });
      const response = await page.goto(`${base}${tool.canonicalPath}`, { waitUntil: "networkidle" });
      assert.equal(response.status(), 200);
      assert(await page.locator("input,select,button").count() > 0, `No calculator controls for ${tool.slug}`);
      assert(await page.locator("[data-simplekit-header] nav").count() > 0, `Core did not mount for ${tool.slug}`);
      await context.close();
    }
    assert.equal(pageErrors, 0, "Browser JavaScript errors");
    assert.equal(failedResponses, 0, "Failed local requests");
    const context = await newContext();
    const page = await context.newPage();
    await page.goto(`${base}/mortgage-calculator/`, { waitUntil: "networkidle" });
    const payment = async () => {
      const text = await page.locator("#headlineSummary").innerText();
      const match = text.match(/YOUR PAYMENT\s*\$([\d,]+)/);
      assert(match, "Mortgage payment did not render");
      return Number(match[1].replaceAll(",", ""));
    };
    const before = await payment();
    const principal = Number(await page.locator("#loanAmount").inputValue());
    assert(principal > 0 && before > 0);
    await page.locator("#loanAmount").fill(String(principal * 2));
    await page.locator("#loanAmount").press("Tab");
    await page.waitForFunction(previous => {
      const text = document.querySelector("#headlineSummary").innerText;
      const match = text.match(/YOUR PAYMENT\s*\$([\d,]+)/);
      return match && Number(match[1].replaceAll(",", "")) !== previous;
    }, before);
    const after = await payment();
    assert(Math.abs(after - before * 2) <= 1, "Payment should double with principal (rounded dollars)");
    await context.close();
    console.log(`Browser smoke passed: ${manifest.tools.length} calculators, Core mounted on every route, 0 page errors, 0 failed local responses; mortgage payment $${before} -> $${after}.`);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
