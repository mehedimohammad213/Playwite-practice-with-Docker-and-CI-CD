import { config } from "./config.js";

/** Shared thresholds aligned with performance metrics list. */
export const thresholds = {
  http_req_duration: ["p(95)<2000", "p(99)<5000"],
  http_req_failed: ["rate<0.05"],
  http_req_waiting: ["p(95)<1500"],
  http_reqs: ["rate>1"],
  iteration_duration: ["p(95)<5000"],
  response_time: ["p(95)<2000"],
  latency: ["p(95)<2000"],
  time_to_first_byte: ["p(95)<1000"],
  error_rate: ["rate<0.05"],
  availability: ["rate>0.95"],
  login_success_rate: ["rate>0.95"],
  apdex_score: ["avg>0.85"],
  login_duration: ["p(95)<2000"],
};

const tags = { test_type: config.testType };

function baseOptions(scenarios) {
  return {
    scenarios,
    thresholds,
    tags,
    summaryTrendStats: ["avg", "min", "med", "max", "p(90)", "p(95)", "p(99)"],
  };
}

/** Load — expected production traffic sustained. */
function load() {
  return baseOptions({
    load: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: config.loadVus },
        { duration: config.loadDuration, target: config.loadVus },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
    },
  });
}

/** Stress — push beyond normal capacity until errors rise. */
function stress() {
  return baseOptions({
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: config.loadVus },
        { duration: "3m", target: config.stressMaxVus },
        { duration: "2m", target: config.stressMaxVus },
        { duration: "2m", target: 0 },
      ],
      gracefulRampDown: "1m",
    },
  });
}

/** Spike — sudden burst of traffic. */
function spike() {
  return baseOptions({
    spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: config.baselineVus },
        { duration: "10s", target: config.spikeVus },
        { duration: "1m", target: config.spikeVus },
        { duration: "10s", target: config.baselineVus },
        { duration: "2m", target: config.baselineVus },
        { duration: "10s", target: 0 },
      ],
    },
  });
}

/** Endurance / soak — moderate load for extended period. */
function soak() {
  return baseOptions({
    soak: {
      executor: "constant-vus",
      vus: config.soakVus,
      duration: config.soakDuration,
    },
  });
}

/** Volume — high iteration count with larger payloads. */
function volume() {
  return baseOptions({
    volume: {
      executor: "shared-iterations",
      vus: 20,
      iterations: config.volumeIterations,
      maxDuration: "30m",
    },
  });
}

/** Scalability — step up VUs to observe scaling behavior. */
function scalability() {
  const step = Math.max(10, Math.floor(config.loadVus / 5));
  return baseOptions({
    scalability: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: step },
        { duration: "2m", target: step * 2 },
        { duration: "2m", target: step * 3 },
        { duration: "2m", target: step * 4 },
        { duration: "2m", target: step * 5 },
        { duration: "2m", target: 0 },
      ],
    },
  });
}

/** Capacity — find upper bound with aggressive ramp. */
function capacity() {
  return baseOptions({
    capacity: {
      executor: "ramping-arrival-rate",
      startRate: 10,
      timeUnit: "1s",
      preAllocatedVUs: 50,
      maxVUs: config.stressMaxVus,
      stages: [
        { duration: "2m", target: 50 },
        { duration: "2m", target: 100 },
        { duration: "2m", target: 200 },
        { duration: "2m", target: 300 },
        { duration: "2m", target: 0 },
      ],
    },
  });
}

/** Baseline — minimal load to establish reference metrics. */
function baseline() {
  return baseOptions({
    baseline: {
      executor: "constant-vus",
      vus: config.baselineVus,
      duration: "3m",
    },
  });
}

/** Benchmark — fixed load with strict thresholds for regression comparison. */
function benchmark() {
  return {
    ...baseOptions({
      benchmark: {
        executor: "constant-vus",
        vus: config.benchmarkVus,
        duration: "10m",
      },
    }),
    thresholds: {
      ...thresholds,
      http_req_duration: ["p(95)<1500", "avg<800"],
      login_success_rate: ["rate>0.99"],
      apdex_score: ["avg>0.90"],
    },
  };
}

/** Concurrency — many simultaneous virtual users hitting login. */
function concurrency() {
  return baseOptions({
    concurrency: {
      executor: "per-vu-iterations",
      vus: config.concurrencyVus,
      iterations: 3,
      maxDuration: "10m",
    },
  });
}

/** Reliability — sustained load with emphasis on error/availability tracking. */
function reliability() {
  return {
    ...baseOptions({
      reliability: {
        executor: "constant-arrival-rate",
        rate: 30,
        timeUnit: "1s",
        duration: "10m",
        preAllocatedVUs: 40,
        maxVUs: 100,
      },
    }),
    thresholds: {
      ...thresholds,
      error_rate: ["rate<0.01"],
      availability: ["rate>0.99"],
    },
  };
}

/** Recovery — spike then return to normal; measure post-spike stability. */
function recovery() {
  return baseOptions({
    recovery: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: config.baselineVus },
        { duration: "30s", target: config.spikeVus },
        { duration: "1m", target: config.spikeVus },
        { duration: "30s", target: config.baselineVus },
        { duration: "5m", target: config.baselineVus },
        { duration: "1m", target: 0 },
      ],
    },
  });
}

/** Stability — long moderate run (alias of shorter soak). */
function stability() {
  return baseOptions({
    stability: {
      executor: "constant-vus",
      vus: config.soakVus,
      duration: "15m",
    },
  });
}

/** Configuration — same as load but tagged for A/B config comparison (set env vars). */
function configuration() {
  return {
    ...load(),
    tags: { ...tags, config_profile: __ENV.CONFIG_PROFILE || "default" },
  };
}

/** API performance — arrival-rate driven API load. */
function api() {
  return baseOptions({
    api_performance: {
      executor: "ramping-arrival-rate",
      startRate: 5,
      timeUnit: "1s",
      preAllocatedVUs: 20,
      maxVUs: config.loadVus,
      stages: [
        { duration: "1m", target: 20 },
        { duration: config.loadDuration, target: 50 },
        { duration: "1m", target: 0 },
      ],
    },
  });
}

/** Backend — combined API endpoints (login-focused for this project). */
function backend() {
  return load();
}

/** Web — HTTP-level frontend checks (TTFB, page load proxy). */
function web() {
  return baseOptions({
    web_performance: {
      executor: "constant-vus",
      vus: config.benchmarkVus,
      duration: "5m",
    },
  });
}

/** Queue / cache — placeholder arrival pattern (login as proxy transaction). */
function queue() {
  return baseOptions({
    queue_performance: {
      executor: "constant-arrival-rate",
      rate: 50,
      timeUnit: "1s",
      duration: "5m",
      preAllocatedVUs: 30,
      maxVUs: 80,
    },
  });
}

function cache() {
  return queue();
}

/**
 * Failover / cloud / database / mobile / network tests require external
 * infrastructure (second region, DB metrics, device farms, packet shaping).
 * These scenarios run baseline API load with descriptive tags for correlation
 * with external monitoring (Grafana, CloudWatch, APM).
 */
function taggedBaseline(name) {
  return {
    ...baseline(),
    tags: { ...tags, test_type: name },
  };
}

const scenarioMap = {
  load,
  stress,
  spike,
  soak,
  endurance: soak,
  volume,
  scalability,
  capacity,
  baseline,
  benchmark,
  concurrency,
  reliability,
  recovery,
  stability,
  configuration,
  network: taggedBaseline,
  api: api,
  database: taggedBaseline,
  frontend: web,
  backend,
  cloud: taggedBaseline,
  queue,
  cache,
  mobile: taggedBaseline,
  web,
  failover: recovery,
};

/**
 * Resolve k6 options for the requested test type.
 * @param {string} [testType]
 */
export function getOptions(testType = config.testType) {
  const key = testType.toLowerCase();
  const factory = scenarioMap[key];

  if (!factory) {
    const available = Object.keys(scenarioMap).sort().join(", ");
    throw new Error(
      `Unknown K6_TEST_TYPE "${testType}". Available: ${available}`,
    );
  }

  return typeof factory === "function" && factory.length === 0
    ? factory()
    : factory(key);
}
