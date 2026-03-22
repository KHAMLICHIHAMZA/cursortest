import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = "C:/Projects/MALOC";
const require = createRequire(path.join(ROOT, "frontend-web", "package.json"));
const { chromium } = require("playwright");
const APP_HTML_DIR = path.join(ROOT, "frontend-web", ".next", "server", "app");
const OUTPUT_DIR = path.join(ROOT, "docs", "evidence", "web-local-html");

function sanitizeName(relativePath) {
  return relativePath
    .replace(/\\/g, "/")
    .replace(/^\//, "")
    .replace(/\/index\.html$/i, "")
    .replace(/\.html$/i, "")
    .replace(/[\/[\]]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "") || "root";
}

async function walkHtmlFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walkHtmlFiles(fullPath)));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
      results.push(fullPath);
    }
  }
  return results;
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const htmlFiles = (await walkHtmlFiles(APP_HTML_DIR)).filter(
    (p) => !p.toLowerCase().includes("_not-found"),
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });

  let count = 0;
  for (const htmlFile of htmlFiles) {
    const relative = path.relative(APP_HTML_DIR, htmlFile);
    const shotName = `${sanitizeName(relative)}.png`;
    const outputPath = path.join(OUTPUT_DIR, shotName);
    const fileUrl = `file:///${htmlFile.replace(/\\/g, "/")}`;

    try {
      await page.goto(fileUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(400);
      await page.screenshot({ path: outputPath, fullPage: true });
      count += 1;
    } catch (error) {
      console.error(`Failed: ${relative} -> ${error.message}`);
    }
  }

  await browser.close();
  console.log(`Captured ${count} screenshots in ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
