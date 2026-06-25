import http from "k6/http";
import { check, sleep } from "k6";
import { config, endpoints } from "./config.js";
import {
  recordHttpMetrics,
  loginDuration,
  loginSuccess,
  concurrentUsers,
  dbQueryTime,
  pageLoadTime,
} from "./metrics.js";

const JSON_HEADERS = { "Content-Type": "application/json" };

/**
 * POST /api/v1/users/login — primary API under test.
 */
export function loginRequest(tags = {}) {
  concurrentUsers.add(__VU);

  const payload = JSON.stringify({
    email: config.email,
    password: config.password,
  });

  const res = http.post(endpoints.login, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: "login", ...tags },
  });

  const ok = recordHttpMetrics(res, {
    apdexT: config.apdexT,
    apdexTolerating: config.apdexTolerating,
    isTransaction: true,
  });

  loginDuration.add(res.timings.duration);

  let body = {};
  try {
    body = res.json();
  } catch {
    // non-JSON response
  }

  const loginOk = check(res, {
    "login status is 200": (r) => r.status === 200,
    "login success flag": () => body.success === true,
    "access token present": () =>
      typeof body.data?.accessToken === "string" && body.data.accessToken.length > 0,
    "response time < 2s": (r) => r.timings.duration < 2000,
  });

  loginSuccess.add(loginOk && ok);

  // If API returns query timing metadata, record it
  if (body.meta?.dbQueryTimeMs != null) {
    dbQueryTime.add(Number(body.meta.dbQueryTimeMs));
  }

  return { res, body, ok: loginOk && ok };
}

/**
 * GET web base URL — frontend / TTFB smoke (no browser).
 */
export function webPageRequest(tags = {}) {
  const res = http.get(config.webBaseUrl, {
    tags: { endpoint: "web_home", ...tags },
  });

  recordHttpMetrics(res, {
    apdexT: config.apdexT,
    apdexTolerating: config.apdexTolerating,
    isTransaction: false,
  });

  pageLoadTime.add(res.timings.duration);

  check(res, {
    "web status is 2xx": (r) => r.status >= 200 && r.status < 300,
    "web TTFB < 1s": (r) => r.timings.waiting < 1000,
  });

  return res;
}

/**
 * Volume test helper — login with extra payload fields to increase request size.
 */
export function volumeLoginRequest(iteration) {
  const payload = JSON.stringify({
    email: config.email,
    password: config.password,
    metadata: {
      iteration,
      padding: "x".repeat(256),
      timestamp: new Date().toISOString(),
    },
  });

  const res = http.post(endpoints.login, payload, {
    headers: JSON_HEADERS,
    tags: { endpoint: "login_volume" },
  });

  recordHttpMetrics(res, {
    apdexT: config.apdexT,
    apdexTolerating: config.apdexTolerating,
  });

  check(res, { "volume login status 200": (r) => r.status === 200 });
  return res;
}

export function thinkTime(min = 0.5, max = 2) {
  sleep(min + Math.random() * (max - min));
}
