#!/usr/bin/env node

/**
 * Regenerate report and serve it locally with live reload on new k6 results.
 * Usage: node k6/report/server.mjs
 */

import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const RESULTS_DIR = path.join(ROOT, "k6/results");
const GENERATE = path.join(__dirname, "generate.mjs");
const port = Number(process.env.PERF_REPORT_PORT || 4173);

function runGenerate() {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [GENERATE], { stdio: "inherit" });
    child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`generate exited ${code}`))));
  });
}

async function main() {
  await runGenerate();

  const { createServer } = await import("http");
  const REPORT_DIR = path.join(ROOT, "k6/report");
  const HTML_OUT = path.join(REPORT_DIR, "index.html");

  createServer((req, res) => {
    if (req.url === "/api/runs") {
      const dataPath = path.join(REPORT_DIR, "data.json");
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(fs.readFileSync(dataPath));
      return;
    }
    const file = path.join(REPORT_DIR, "index.html");
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(fs.readFileSync(file));
  }).listen(port, () => {
    console.log(`\nPerformance report: http://localhost:${port}`);
    console.log("Watching k6/results for new summaries…\n");
  });

  let debounce;
  fs.watch(RESULTS_DIR, () => {
    clearTimeout(debounce);
    debounce = setTimeout(async () => {
      console.log("New results detected — regenerating report…");
      try {
        await runGenerate();
        console.log("Report updated.");
      } catch (err) {
        console.error(err.message);
      }
    }, 500);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
