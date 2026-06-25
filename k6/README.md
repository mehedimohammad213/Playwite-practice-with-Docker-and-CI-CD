# K6 Performance Tests

Load and performance scenarios for the KTO API (`POST /api/v1/users/login`) and web frontend, using [Grafana k6](https://k6.io/).

## Prerequisites

Install k6:

```bash
# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg \
  --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" \
  | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update && sudo apt-get install k6

# macOS
brew install k6
```

## Quick start

```bash
# Load test (default)
pnpm run perf:load

# With credentials from .env
export $(grep -v '^#' .env | xargs) && pnpm run perf:load
```

## Test types

Set `K6_TEST_TYPE` to select a scenario:

| Type | Description |
|------|-------------|
| `load` | Ramp to expected traffic, sustain, ramp down |
| `stress` | Push beyond normal capacity |
| `spike` | Sudden traffic burst |
| `soak` / `endurance` | Long-running moderate load |
| `volume` | Many iterations with larger payloads |
| `scalability` | Step-wise VU increase |
| `capacity` | Arrival-rate ramp to find limits |
| `baseline` | Low VUs — reference metrics |
| `benchmark` | Fixed load, strict thresholds |
| `concurrency` | Many simultaneous users |
| `reliability` | Sustained load, low error tolerance |
| `recovery` | Spike then return to normal |
| `stability` | 15m moderate constant load |
| `api` / `backend` | API-focused arrival-rate test |
| `web` / `frontend` | HTTP GET on `BASE_URL` (TTFB proxy) |
| `queue` / `cache` | High arrival-rate API pattern |
| `configuration` | Load test tagged for config A/B |
| `network`, `database`, `cloud`, `mobile`, `failover` | Tagged baseline for external monitoring correlation |

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `K6_TEST_TYPE` | `load` | Scenario selector |
| `API_BASE_URL` | `https://api.kto.solutions` | API host |
| `BASE_URL` | KTO CMS URL | Web performance target |
| `TEST_USERNAME` | — | Login email |
| `TEST_PASSWORD` | — | Login password |
| `LOAD_VUS` | `50` | Target VUs for load test |
| `LOAD_DURATION` | `5m` | Sustain duration |
| `STRESS_MAX_VUS` | `200` | Peak VUs for stress |
| `SPIKE_VUS` | `100` | Spike peak |
| `SOAK_VUS` | `30` | Soak/stability VUs |
| `SOAK_DURATION` | `30m` | Soak duration |
| `APDEX_T` | `500` | Apdex satisfied threshold (ms) |
| `APDEX_TOLERATING` | `2000` | Apdex tolerating threshold (ms) |

## Metrics

k6 reports built-in and custom metrics:

- **Response time / latency** — `http_req_duration`, `response_time`, `latency`
- **TTFB** — `http_req_waiting`, `time_to_first_byte`
- **Throughput / RPS / TPS** — `http_reqs`, `throughput`, `requests_per_second`, `transactions_per_second`
- **Error rate / availability** — `http_req_failed`, `error_rate`, `availability`, `login_success_rate`
- **Apdex** — `apdex_score` (from response times vs thresholds)
- **Concurrency** — `vus`, `concurrent_users`
- **Page load** — `page_load_time` (web scenario)
- **Cache** — `cache_hit_ratio` (when `X-Cache` header present)

CPU, memory, disk, and network bandwidth require external tools (Prometheus, CloudWatch, `node_exporter`, etc.) during test runs.

## Examples

```bash
# Stress test
k6 run -e K6_TEST_TYPE=stress -e STRESS_MAX_VUS=300 k6/performance-test.js

# 30-minute soak
k6 run -e K6_TEST_TYPE=soak -e SOAK_DURATION=30m k6/performance-test.js

# Benchmark with credentials
k6 run -e K6_TEST_TYPE=benchmark \
  -e TEST_USERNAME=user@example.com \
  -e TEST_PASSWORD=secret \
  k6/performance-test.js

# Web TTFB check
k6 run -e K6_TEST_TYPE=web -e BASE_URL=https://kto-cms-ecru.vercel.app/ k6/performance-test.js
```

JSON summaries are written to `k6/results/` after each run.

## Reporting

Generate an HTML dashboard from all saved k6 results:

```bash
# Build report from k6/results/*.json
pnpm run perf:report

# Build and open in browser
pnpm run perf:report:open

# Serve report with auto-refresh when new results appear
pnpm run perf:report:serve
```

The report includes:

- Summary cards (total runs, pass/fail, latest p95 & RPS)
- Trend charts per test type (p95 response time over time)
- Sortable/filterable table of all runs
- Run detail view with thresholds, checks, and key metrics

Output files (gitignored):

- `k6/report/index.html` — interactive dashboard
- `k6/report/data.json` — normalized run data for tooling/CI
