/**
 * KTO API & Web Performance Test Suite
 *
 * Usage:
 *   k6 run k6/performance-test.js
 *   k6 run -e K6_TEST_TYPE=stress k6/performance-test.js
 *   k6 run -e K6_TEST_TYPE=spike -e SPIKE_VUS=150 k6/performance-test.js
 *   k6 run -e API_BASE_URL=... -e TEST_USERNAME=... -e TEST_PASSWORD=... k6/performance-test.js
 *
 * Test types (K6_TEST_TYPE):
 *   load, stress, spike, soak|endurance, volume, scalability, capacity,
 *   baseline, benchmark, concurrency, reliability, recovery, stability,
 *   configuration, network, api, database, frontend|web, backend, cloud,
 *   queue, cache, mobile, failover
 *
 * Metrics tracked:
 *   response_time, latency, time_to_first_byte, throughput, tps, rps,
 *   error_rate, availability, login_success_rate, apdex_score, concurrent_users,
 *   page_load_time, database_query_time (if API returns meta), cache_hit_ratio
 *
 * Infrastructure metrics (CPU, memory, disk, network bandwidth) require
 * external monitoring — correlate k6 runs with your APM / cloud dashboards.
 */

import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.2/index.js";
import { config } from "./lib/config.js";
import { getOptions } from "./lib/scenarios.js";
import { loginRequest, webPageRequest, volumeLoginRequest, thinkTime } from "./lib/helpers.js";

export const options = getOptions();

const webTypes = new Set(["web", "frontend"]);
const volumeTypes = new Set(["volume"]);
const apiOnlyTypes = new Set([
  "api",
  "backend",
  "queue",
  "cache",
  "database",
  "network",
  "cloud",
  "mobile",
  "configuration",
  "failover",
]);

export default function () {
  const type = config.testType;

  if (webTypes.has(type)) {
    webPageRequest();
    thinkTime(1, 3);
    return;
  }

  if (volumeTypes.has(type)) {
    volumeLoginRequest(__ITER);
    thinkTime(0.1, 0.5);
    return;
  }

  loginRequest({ scenario: type });

  if (!apiOnlyTypes.has(type)) {
    thinkTime(0.5, 2);
  }
}

export function handleSummary(data) {
  const type = config.testType;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  return {
    stdout: textSummary(data, { indent: " ", enableColors: true }),
    [`k6/results/summary-${type}-${timestamp}.json`]: JSON.stringify(data, null, 2),
  };
}
