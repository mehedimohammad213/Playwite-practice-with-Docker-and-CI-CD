/**
 * Shared configuration loaded from k6 environment variables (__ENV).
 * Pass via CLI: k6 run -e API_BASE_URL=... -e TEST_USERNAME=... script.js
 */

export const config = {
  apiBaseUrl: __ENV.API_BASE_URL || "https://api.kto.solutions",
  webBaseUrl: __ENV.BASE_URL || "https://kto-cms-ecru.vercel.app/",
  email: __ENV.TEST_USERNAME || "mmhmasum98@gmail.com",
  password: __ENV.TEST_PASSWORD || "123456",
  testType: (__ENV.K6_TEST_TYPE || "load").toLowerCase(),

  // Apdex satisfied threshold (ms) — response faster than this counts as "satisfied"
  apdexT: Number(__ENV.APDEX_T || 500),
  // Apdex tolerating threshold (ms) — slower than T but within this counts as "tolerating"
  apdexTolerating: Number(__ENV.APDEX_TOLERATING || 2000),

  // Scenario tuning (override per environment)
  loadVus: Number(__ENV.LOAD_VUS || 50),
  loadDuration: __ENV.LOAD_DURATION || "5m",
  stressMaxVus: Number(__ENV.STRESS_MAX_VUS || 200),
  spikeVus: Number(__ENV.SPIKE_VUS || 100),
  soakVus: Number(__ENV.SOAK_VUS || 30),
  soakDuration: __ENV.SOAK_DURATION || "30m",
  baselineVus: Number(__ENV.BASELINE_VUS || 5),
  benchmarkVus: Number(__ENV.BENCHMARK_VUS || 25),
  concurrencyVus: Number(__ENV.CONCURRENCY_VUS || 100),
  volumeIterations: Number(__ENV.VOLUME_ITERATIONS || 1000),
};

export const endpoints = {
  login: `${config.apiBaseUrl}/api/v1/users/login`,
};
