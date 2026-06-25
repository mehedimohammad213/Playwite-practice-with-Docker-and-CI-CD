import { Trend, Rate, Counter, Gauge } from "k6/metrics";

// ── Response & latency ──────────────────────────────────────────────────────
export const responseTime = new Trend("response_time", true);
export const latency = new Trend("latency", true);
export const ttfb = new Trend("time_to_first_byte", true);
export const pageLoadTime = new Trend("page_load_time", true);
export const dbQueryTime = new Trend("database_query_time", true);

// ── Throughput ──────────────────────────────────────────────────────────────
export const throughput = new Counter("throughput");
export const tps = new Rate("transactions_per_second");
export const rps = new Rate("requests_per_second");

// ── Reliability ───────────────────────────────────────────────────────────────
export const errorRate = new Rate("error_rate");
export const availability = new Rate("availability");
export const loginSuccess = new Rate("login_success_rate");

// ── Concurrency & cache ───────────────────────────────────────────────────────
export const concurrentUsers = new Gauge("concurrent_users");
export const cacheHitRatio = new Rate("cache_hit_ratio");

// ── Apdex ───────────────────────────────────────────────────────────────────
export const apdexScore = new Trend("apdex_score", true);

// ── Business ──────────────────────────────────────────────────────────────────
export const loginDuration = new Trend("login_duration", true);

/**
 * Record standard HTTP metrics from a k6 response object.
 * @param {import('k6/http').RefinedResponse} res
 * @param {object} opts
 * @param {number} opts.apdexT
 * @param {number} opts.apdexTolerating
 * @param {boolean} opts.isTransaction - count toward TPS
 */
export function recordHttpMetrics(res, { apdexT, apdexTolerating, isTransaction = true }) {
  const duration = res.timings.duration;
  const waiting = res.timings.waiting;
  const ok = res.status >= 200 && res.status < 400;

  responseTime.add(duration);
  latency.add(duration);
  ttfb.add(waiting);
  throughput.add(1);
  rps.add(1);
  if (isTransaction) tps.add(1);

  errorRate.add(!ok);
  availability.add(ok);

  // Apdex: 1.0 satisfied, 0.5 tolerating, 0.0 frustrated
  let apdex = 0;
  if (duration <= apdexT) apdex = 1;
  else if (duration <= apdexTolerating) apdex = 0.5;
  apdexScore.add(apdex);

  // Cache header hint (if API sends Cache-Control / X-Cache)
  const cacheHeader =
    res.headers["X-Cache"] || res.headers["x-cache"] || res.headers["Cf-Cache-Status"];
  if (cacheHeader) {
    const hit = /hit/i.test(cacheHeader);
    cacheHitRatio.add(hit);
  }

  return ok;
}
