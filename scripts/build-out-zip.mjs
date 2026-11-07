/**
 * Build static `out/` for cPanel / Namecheap upload, then zip to Desktop.
 * Temporarily parks API routes + cookie/middleware pages that cannot be statically exported.
 */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const desktop = path.join(root, "..");
const stamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
const zipName = `Jarcode-Technology-out-${stamp}.zip`;
const zipPath = path.join(desktop, zipName);
const parkDir = path.join(root, ".export-park");

const toPark = [
  { from: path.join(root, "src", "app", "api"), name: "api" },
  { from: path.join(root, "src", "middleware.ts"), name: "middleware.ts" },
  { from: path.join(root, "src", "app", "erp"), name: "erp" },
  { from: path.join(root, "src", "app", "admin"), name: "admin" },
  { from: path.join(root, "src", "app", "demo"), name: "demo" },
  // Metadata routes need force-static under output:export — park and use public/ copies
  { from: path.join(root, "src", "app", "robots.ts"), name: "robots.ts" },
  { from: path.join(root, "src", "app", "sitemap.ts"), name: "sitemap.ts" },
];

const dynamicFiles = [
  path.join(root, "src", "app", "create-your-demo", "hospital", "page.tsx"),
  path.join(root, "src", "app", "create-your-demo", "society", "page.tsx"),
];

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function park() {
  ensureDir(parkDir);
  for (const item of toPark) {
    if (!fs.existsSync(item.from)) continue;
    const dest = path.join(parkDir, item.name);
    rmrf(dest);
    fs.renameSync(item.from, dest);
    console.log("parked", item.name);
  }
  for (const file of dynamicFiles) {
    if (!fs.existsSync(file)) continue;
    const bak = file + ".export.bak";
    const raw = fs.readFileSync(file, "utf8");
    fs.writeFileSync(bak, raw, "utf8");
    fs.writeFileSync(
      file,
      raw.replace(/export const dynamic = "force-dynamic";\r?\n?/g, ""),
      "utf8",
    );
    console.log("stripped force-dynamic", path.relative(root, file));
  }
}

function restore() {
  for (const file of dynamicFiles) {
    const bak = file + ".export.bak";
    if (fs.existsSync(bak)) {
      fs.writeFileSync(file, fs.readFileSync(bak, "utf8"), "utf8");
      fs.unlinkSync(bak);
      console.log("restored", path.relative(root, file));
    }
  }
  for (const item of toPark) {
    const dest = path.join(parkDir, item.name);
    if (!fs.existsSync(dest)) continue;
    if (fs.existsSync(item.from)) rmrf(item.from);
    fs.renameSync(dest, item.from);
    console.log("restored", item.name);
  }
  rmrf(parkDir);
}

function zipOut() {
  const outDir = path.join(root, "out");
  if (!fs.existsSync(outDir)) throw new Error("out/ folder was not created.");

  // Drop a short note for the manager / host
  fs.writeFileSync(
    path.join(outDir, "DEPLOY-README.txt"),
    [
      "JARCODE TECHNOLOGY — static out/ upload package",
      "",
      "Upload ALL contents of this folder into public_html (or the site root).",
      "Do not upload only part of the files. Keep folder structure.",
      "",
      "IMPORTANT:",
      "- This is a STATIC export (HTML/CSS/JS).",
      "- AI Chat, Image API, Voice, ERP login APIs need a Node.js server.",
      "- On plain cPanel static hosting, marketing pages/demos UI will show;",
      "  live AI/API features require Node hosting (Vercel/VPS) with full project.",
      "",
      `Built: ${new Date().toISOString()}`,
    ].join("\n"),
    "utf8",
  );

  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  // Windows tar can write .zip
  execSync(`tar -a -c -f "${zipPath}" -C "${outDir}" .`, {
    stdio: "inherit",
    cwd: root,
  });

  if (!fs.existsSync(zipPath)) {
    throw new Error("Zip failed to create at " + zipPath);
  }
  const sizeMb = (fs.statSync(zipPath).size / (1024 * 1024)).toFixed(2);
  console.log("ZIP_OK", zipPath, `${sizeMb} MB`);
}

try {
  process.chdir(root);
  console.log("ROOT", root);
  park();
  console.log("Building static export (STATIC_EXPORT=1)...");
  const runBuild = () =>
    execSync("npm run build", {
      stdio: "inherit",
      cwd: root,
      env: { ...process.env, STATIC_EXPORT: "1" },
    });
  try {
    runBuild();
  } catch {
    // Next may stop once on security upgrade nudge — retry once
    console.log("Retrying build once...");
    runBuild();
  }
  zipOut();
} catch (err) {
  console.error("BUILD_OUT_FAILED", err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  try {
    restore();
  } catch (e) {
    console.error("RESTORE_FAILED", e);
    process.exitCode = 1;
  }
}
