import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = "C:/Projects/MALOC";
const BASE_URL = "http://localhost:3100";
const OUTPUT_DIR = path.join(ROOT, "docs", "evidence", "live-role-screens");
const require = createRequire(path.join(ROOT, "frontend-web", "package.json"));
const { chromium } = require("playwright");

const PUBLIC_ROUTES = ["/", "/login", "/forgot-password", "/reset-password"];
const ADMIN_ROUTES = [
  "/admin",
  "/admin/companies",
  "/admin/agencies",
  "/admin/users",
  "/admin/subscriptions",
  "/admin/plans",
  "/admin/settings",
  "/admin/company-health",
  "/admin/notifications",
  "/admin/profile",
];
const COMPANY_ROUTES = [
  "/company",
  "/company/agencies",
  "/company/users",
  "/company/analytics",
  "/company/planning",
  "/company/notifications",
  "/company/profile",
];
const AGENCY_ROUTES = [
  "/agency",
  "/agency/bookings",
  "/agency/clients",
  "/agency/vehicles",
  "/agency/maintenance",
  "/agency/planning",
  "/agency/fines",
  "/agency/invoices",
  "/agency/contracts",
  "/agency/charges",
  "/agency/kpi",
  "/agency/gps",
  "/agency/gps-kpi",
  "/agency/journal",
  "/agency/notifications",
  "/agency/profile",
];

const ROLES = [
  {
    key: "super_admin",
    email: "admin@malocauto.com",
    password: "admin123",
    routes: [...ADMIN_ROUTES, ...COMPANY_ROUTES, ...AGENCY_ROUTES],
  },
  {
    key: "company_admin",
    email: "admin@autolocation.fr",
    password: "admin123",
    routes: [...COMPANY_ROUTES, ...AGENCY_ROUTES],
  },
  {
    key: "agency_manager",
    email: "manager1@autolocation.fr",
    password: "manager123",
    routes: AGENCY_ROUTES,
  },
  {
    key: "agent",
    email: "agent1@autolocation.fr",
    password: "agent123",
    routes: AGENCY_ROUTES,
  },
];

function routeToFileName(route) {
  if (route === "/") return "home";
  return route.replace(/^\//, "").replace(/\//g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function capturePublic(browser) {
  const dir = path.join(OUTPUT_DIR, "public");
  await ensureDir(dir);
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  for (const route of PUBLIC_ROUTES) {
    const url = `${BASE_URL}${route}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(400);
      await page.screenshot({
        path: path.join(dir, `${routeToFileName(route)}.png`),
        fullPage: true,
      });
      console.log(`PUBLIC OK: ${route}`);
    } catch (error) {
      console.error(`PUBLIC FAIL: ${route} -> ${error.message}`);
    }
  }
  await page.close();
}

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 30000 });
  await page.fill('input[type="email"], input[name="email"]', email);
  await page.fill('input[type="password"], input[name="password"]', password);
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 30000 }),
    page.click('button[type="submit"], button:has-text("Se connecter")'),
  ]);
}

async function captureRole(browser, role) {
  const dir = path.join(OUTPUT_DIR, role.key);
  await ensureDir(dir);
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const report = [];

  try {
    await login(page, role.email, role.password);
    report.push(`LOGIN OK: ${role.email}`);
  } catch (error) {
    report.push(`LOGIN FAIL: ${role.email} -> ${error.message}`);
    await fs.writeFile(path.join(dir, "_capture-report.txt"), report.join("\n"), "utf8");
    await page.close();
    return;
  }

  for (const route of role.routes) {
    const url = `${BASE_URL}${route}`;
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      await page.waitForTimeout(500);
      const finalUrl = page.url();
      await page.screenshot({
        path: path.join(dir, `${routeToFileName(route)}.png`),
        fullPage: true,
      });
      report.push(`OK: ${route} -> ${finalUrl}`);
      console.log(`${role.key.toUpperCase()} OK: ${route}`);
    } catch (error) {
      report.push(`FAIL: ${route} -> ${error.message}`);
      console.error(`${role.key.toUpperCase()} FAIL: ${route} -> ${error.message}`);
    }
  }

  await fs.writeFile(path.join(dir, "_capture-report.txt"), report.join("\n"), "utf8");
  await page.close();
}

async function main() {
  await ensureDir(OUTPUT_DIR);
  const browser = await chromium.launch({ headless: true });
  await capturePublic(browser);
  for (const role of ROLES) {
    await captureRole(browser, role);
  }
  await browser.close();
  console.log(`Done: ${OUTPUT_DIR}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
