#!/usr/bin/env node

/**
 * dev-stable.js — Build-then-serve dev mode
 *
 * Avoids Astro dev server hot reload crashes when content files are
 * added/removed. Runs `astro build`, serves dist/ on port 4322,
 * watches for file changes, and rebuilds automatically.
 */

import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { watch, existsSync, statSync, readFileSync } from "node:fs";
import { join, extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = join(ROOT, "dist");
const PORT = 4322;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

let building = false;
let pendingRebuild = false;
let rebuildTimer = null;

// ── Build ──────────────────────────────────────────

function build() {
  return new Promise((ok, fail) => {
    console.log("\x1b[36m[stable]\x1b[0m Building...");
    const proc = spawn("pnpm", ["run", "build"], {
      cwd: ROOT,
      stdio: "inherit",
    });
    proc.on("error", fail);
    proc.on("exit", (code) =>
      code === 0 ? ok() : fail(new Error(`Build exit ${code}`))
    );
  });
}

// ── Static server ──────────────────────────────────

function serve() {
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${PORT}`);
    let filePath = join(DIST, decodeURIComponent(url.pathname));

    // Security: prevent path traversal
    const resolved = resolve(filePath);
    if (resolved !== resolve(DIST) && !resolved.startsWith(resolve(DIST) + sep)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    // Directory → index.html
    try {
      if (existsSync(filePath) && statSync(filePath).isDirectory()) {
        filePath = join(filePath, "index.html");
      }
    } catch {}

    // Fallback: .html or /index.html
    if (!existsSync(filePath)) {
      const withHtml = filePath + ".html";
      const withIndex = join(filePath, "index.html");
      if (existsSync(withHtml)) filePath = withHtml;
      else if (existsSync(withIndex)) filePath = withIndex;
      else {
        res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>404 Not Found</h1>");
        return;
      }
    }

    const ct = MIME[extname(filePath).toLowerCase()] || "application/octet-stream";
    try {
      const content = readFileSync(filePath);
      res.writeHead(200, { "Content-Type": ct, "Cache-Control": "no-cache" });
      res.end(content);
    } catch {
      res.writeHead(500);
      res.end("Internal server error");
    }
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`\x1b[36m[stable]\x1b[0m Serving on http://localhost:${PORT}`);
  });
}

// ── Watcher ────────────────────────────────────────

function scheduleRebuild() {
  if (rebuildTimer) clearTimeout(rebuildTimer);
  rebuildTimer = setTimeout(async () => {
    rebuildTimer = null;
    if (building) {
      pendingRebuild = true;
      return;
    }
    building = true;
    try {
      await build();
      console.log("\x1b[36m[stable]\x1b[0m Rebuild complete — refresh browser");
    } catch (err) {
      console.error("\x1b[31m[stable]\x1b[0m Rebuild failed:", err.message);
    } finally {
      building = false;
      if (pendingRebuild) {
        pendingRebuild = false;
        scheduleRebuild();
      }
    }
  }, 1500);
}

function startWatcher() {
  const dirs = [
    join(ROOT, "src"),
    join(ROOT, "public"),
  ];

  for (const dir of dirs) {
    if (!existsSync(dir)) continue;
    watch(dir, { recursive: true }, (event, filename) => {
      if (!filename) return;
      // Skip node_modules, dist, .git
      if (filename.includes("node_modules")) return;
      console.log(`\x1b[33m[watch]\x1b[0m ${event}: ${filename}`);
      scheduleRebuild();
    });
  }
  console.log("\x1b[36m[stable]\x1b[0m Watching src/ and public/ for changes");
}

// ── Main ───────────────────────────────────────────

try {
  await build();
  serve();
  startWatcher();
} catch (err) {
  console.error("Failed to start:", err.message);
  process.exit(1);
}
