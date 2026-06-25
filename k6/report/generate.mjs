#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";
import { loadAllRuns, buildSummary } from "./lib/parser.mjs";
import { renderReportHtml } from "./lib/template.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const RESULTS_DIR = path.join(ROOT, "k6/results");
const REPORT_DIR = path.join(ROOT, "k6/report");
const HTML_OUT = path.join(REPORT_DIR, "index.html");
const DATA_OUT = path.join(REPORT_DIR, "data.json");

const shouldOpen = process.argv.includes("--open");
const shouldServe = process.argv.includes("--serve");
const port = Number(process.env.PERF_REPORT_PORT || 4173);

function openBrowser(url) {
  const cmd = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  spawn(cmd, [url], { detached: true, stdio: "ignore" }).unref();
}

function serveStatic() {
  import("http").then(({ createServer }) => {
    const server = createServer((req, res) => {
      const file = req.url === "/" || req.url === "/index.html" ? HTML_OUT : path.join(REPORT_DIR, req.url.slice(1));
      if (!file.startsWith(REPORT_DIR) || !fs.existsSync(file)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(file);
      const types = { ".html": "text/html", ".json": "application/json" };
      res.writeHead(200, { "Content-Type": types[ext] || "text/plain" });
      res.end(fs.readFileSync(file));
    });
    server.listen(port, () => {
      const url = `http://localhost:${port}`;
      console.log(`Performance report server: ${url}`);
      if (shouldOpen) openBrowser(url);
    });
  });
}

function main() {
  const runs = loadAllRuns(RESULTS_DIR);
  const summary = buildSummary(runs);
  const payload = { summary, runs };

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  fs.writeFileSync(DATA_OUT, JSON.stringify(payload, null, 2));
  fs.writeFileSync(HTML_OUT, renderReportHtml(payload));

  console.log(`Loaded ${runs.length} run(s) from ${RESULTS_DIR}`);
  console.log(`Report: ${HTML_OUT}`);
  console.log(`Data:   ${DATA_OUT}`);

  if (summary.totalRuns === 0) {
    console.log("\nNo results yet. Run: pnpm run perf:load");
  } else {
    console.log(`\nSummary: ${summary.passed} passed, ${summary.failed} failed`);
  }

  if (shouldServe) {
    serveStatic();
    return;
  }

  if (shouldOpen) {
    openBrowser(`file://${HTML_OUT}`);
  }
}

main();
