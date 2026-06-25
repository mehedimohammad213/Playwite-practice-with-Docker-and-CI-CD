import fs from "fs";
import path from "path";

const SUMMARY_PATTERN =
  /^summary-(.+)-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.json$/i;

/** @param {string} ms */
export function formatDuration(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  const sec = Math.floor(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/** @param {number} ms */
export function formatMs(ms) {
  if (ms == null || Number.isNaN(ms)) return "—";
  if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`;
  if (ms < 1000) return `${ms.toFixed(1)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** @param {number} rate 0–1 */
export function formatPercent(rate) {
  if (rate == null || Number.isNaN(rate)) return "—";
  return `${(rate * 100).toFixed(2)}%`;
}

/** @param {number} n */
export function formatNumber(n) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat().format(Math.round(n * 100) / 100);
}

/**
 * @param {string} filename
 */
export function parseFilename(filename) {
  const match = filename.match(SUMMARY_PATTERN);
  if (!match) return null;

  const testType = match[1];
  const rawTs = match[2];
  const isoTs = rawTs.replace(
    /T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/,
    "T$1:$2:$3.$4Z",
  );
  const timestamp = new Date(isoTs);

  return {
    testType,
    timestamp: Number.isNaN(timestamp.getTime()) ? null : timestamp,
    rawTimestamp: match[2],
  };
}

/**
 * @param {Record<string, unknown>} metrics
 * @param {string} name
 */
export function getMetric(metrics, name) {
  return metrics?.[name] ?? null;
}

/**
 * @param {Record<string, unknown>} metric
 */
export function trendValues(metric) {
  if (!metric?.values) return null;
  const v = metric.values;
  return {
    avg: v.avg,
    min: v.min,
    med: v.med,
    max: v.max,
    p90: v["p(90)"],
    p95: v["p(95)"],
    p99: v["p(99)"],
  };
}

/**
 * @param {Record<string, unknown>} metrics
 */
export function extractThresholds(metrics) {
  /** @type {{ metric: string, expression: string, ok: boolean }[]} */
  const results = [];

  for (const [metricName, metric] of Object.entries(metrics ?? {})) {
    if (!metric?.thresholds) continue;
    for (const [expression, result] of Object.entries(metric.thresholds)) {
      results.push({
        metric: metricName,
        expression,
        ok: Boolean(result?.ok),
      });
    }
  }

  return results;
}

/**
 * @param {Record<string, unknown>} rootGroup
 */
export function extractChecks(rootGroup) {
  /** @type {{ name: string, passes: number, fails: number, passRate: number }[]} */
  const checks = [];

  function walk(group) {
    for (const check of group?.checks ?? []) {
      const passes = check.passes ?? 0;
      const fails = check.fails ?? 0;
      const total = passes + fails;
      checks.push({
        name: check.name,
        passes,
        fails,
        passRate: total > 0 ? passes / total : 1,
      });
    }
    for (const child of group?.groups ?? []) walk(child);
  }

  walk(rootGroup);
  return checks;
}

/**
 * @param {Record<string, unknown>} data
 */
export function normalizeRun(filename, data) {
  const meta = parseFilename(filename);
  const metrics = data.metrics ?? {};
  const thresholds = extractThresholds(metrics);
  const checks = extractChecks(data.root_group);
  const thresholdFailed = thresholds.some((t) => !t.ok);
  const checksFailed = checks.some((c) => c.fails > 0);
  const durationMs = data.state?.testRunDurationMs ?? null;

  const httpFailed = getMetric(metrics, "http_req_failed");
  const errorRate = getMetric(metrics, "error_rate");
  const availability = getMetric(metrics, "availability");
  const loginSuccess = getMetric(metrics, "login_success_rate");
  const apdex = getMetric(metrics, "apdex_score");
  const httpReqs = getMetric(metrics, "http_reqs");
  const iterations = getMetric(metrics, "iterations");
  const vus = getMetric(metrics, "vus");
  const vusMax = getMetric(metrics, "vus_max");

  return {
    id: meta ? `${meta.testType}-${meta.rawTimestamp}` : filename,
    file: filename,
    testType: meta?.testType ?? "unknown",
    timestamp: meta?.timestamp?.toISOString() ?? null,
    timestampLabel: meta?.timestamp
      ? meta.timestamp.toLocaleString()
      : filename,
    durationMs,
    durationLabel: formatDuration(durationMs),
    status: thresholdFailed || checksFailed ? "failed" : "passed",
    thresholdSummary: {
      total: thresholds.length,
      passed: thresholds.filter((t) => t.ok).length,
      failed: thresholds.filter((t) => !t.ok).length,
    },
    checkSummary: {
      total: checks.length,
      passed: checks.filter((c) => c.fails === 0).length,
      failed: checks.filter((c) => c.fails > 0).length,
    },
    thresholds,
    checks,
    highlights: {
      responseTime: trendValues(getMetric(metrics, "http_req_duration")),
      latency: trendValues(getMetric(metrics, "latency")),
      ttfb: trendValues(getMetric(metrics, "time_to_first_byte") ?? getMetric(metrics, "http_req_waiting")),
      loginDuration: trendValues(getMetric(metrics, "login_duration")),
      pageLoadTime: trendValues(getMetric(metrics, "page_load_time")),
      apdex: apdex?.values?.avg ?? null,
      errorRate: httpFailed?.values?.rate ?? errorRate?.values?.rate ?? null,
      availability: availability?.values?.rate ?? null,
      loginSuccessRate: loginSuccess?.values?.rate ?? null,
      rps: httpReqs?.values?.rate ?? null,
      totalRequests: httpReqs?.values?.count ?? null,
      iterations: iterations?.values?.count ?? null,
      iterationRate: iterations?.values?.rate ?? null,
      vus: vus?.values?.max ?? vus?.values?.value ?? null,
      vusMax: vusMax?.values?.max ?? vusMax?.values?.value ?? null,
      dataReceived: getMetric(metrics, "data_received")?.values?.count ?? null,
      dataSent: getMetric(metrics, "data_sent")?.values?.count ?? null,
    },
    metrics: Object.fromEntries(
      Object.entries(metrics).map(([name, m]) => [name, { type: m.type, values: m.values, thresholds: m.thresholds }]),
    ),
  };
}

/**
 * @param {string} resultsDir
 */
export function loadAllRuns(resultsDir) {
  if (!fs.existsSync(resultsDir)) return [];

  const files = fs
    .readdirSync(resultsDir)
    .filter((f) => f.startsWith("summary-") && f.endsWith(".json"))
    .sort();

  /** @type {ReturnType<typeof normalizeRun>[]} */
  const runs = [];

  for (const file of files) {
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(resultsDir, file), "utf8"));
      runs.push(normalizeRun(file, raw));
    } catch (err) {
      console.warn(`Skipping ${file}: ${err.message}`);
    }
  }

  return runs.sort((a, b) => {
    const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return tb - ta;
  });
}

/**
 * @param {ReturnType<typeof normalizeRun>[]} runs
 */
export function buildSummary(runs) {
  const byType = {};
  for (const run of runs) {
    byType[run.testType] = (byType[run.testType] ?? 0) + 1;
  }

  const passed = runs.filter((r) => r.status === "passed").length;
  const failed = runs.filter((r) => r.status === "failed").length;
  const latest = runs[0] ?? null;

  const trendByType = {};
  for (const run of runs) {
    if (!trendByType[run.testType]) trendByType[run.testType] = [];
    trendByType[run.testType].push({
      timestamp: run.timestamp,
      p95: run.highlights.responseTime?.p95 ?? null,
      errorRate: run.highlights.errorRate,
      rps: run.highlights.rps,
      status: run.status,
    });
  }

  for (const key of Object.keys(trendByType)) {
    trendByType[key].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  }

  return {
    generatedAt: new Date().toISOString(),
    totalRuns: runs.length,
    passed,
    failed,
    byType,
    latestRunId: latest?.id ?? null,
    trendByType,
  };
}
