/**
 * @param {{ summary: Record<string, unknown>, runs: Record<string, unknown>[] }} payload
 */
export function renderReportHtml(payload) {
  const dataJson = JSON.stringify(payload).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>K6 Performance Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js"></script>
  <style>
    :root {
      --bg: #0c0f14;
      --surface: #141a22;
      --surface-2: #1b2330;
      --border: #2a3544;
      --text: #e8edf4;
      --muted: #8b9cb3;
      --accent: #3dd6c6;
      --accent-dim: #2a9d8f;
      --pass: #4ade80;
      --fail: #f87171;
      --warn: #fbbf24;
      --font: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif;
      --mono: "IBM Plex Mono", "SF Mono", Consolas, monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--font);
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      min-height: 100vh;
    }

    .layout {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem 1.5rem 4rem;
    }

    header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
    }

    h1 {
      font-size: 1.75rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .subtitle { color: var(--muted); font-size: 0.9rem; margin-top: 0.25rem; }

    .actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }

    button, select, input {
      font-family: inherit;
      font-size: 0.875rem;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text);
      padding: 0.5rem 0.75rem;
    }

    button {
      cursor: pointer;
      background: var(--surface-2);
      transition: border-color 0.15s, background 0.15s;
    }

    button:hover { border-color: var(--accent-dim); background: var(--surface); }
    button.primary { background: var(--accent-dim); border-color: var(--accent); color: #041412; font-weight: 600; }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .card-label { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted); }
    .card-value { font-size: 1.75rem; font-weight: 600; font-family: var(--mono); margin-top: 0.25rem; }
    .card-value.pass { color: var(--pass); }
    .card-value.fail { color: var(--fail); }
    .card-value.accent { color: var(--accent); }

    .section { margin-bottom: 2rem; }
    .section-title { font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem; }

    .charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1rem;
      min-height: 280px;
    }

    .chart-card h3 { font-size: 0.9rem; color: var(--muted); margin-bottom: 0.75rem; font-weight: 500; }

    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: 1rem;
      align-items: center;
    }

    .table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--surface);
    }

    table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    th, td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid var(--border); }
    th { color: var(--muted); font-weight: 500; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; background: var(--surface-2); }
    tr:last-child td { border-bottom: none; }
    tbody tr { cursor: pointer; transition: background 0.1s; }
    tbody tr:hover { background: var(--surface-2); }
    tbody tr.selected { background: rgba(61, 214, 198, 0.08); }

    .badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .badge.pass { background: rgba(74, 222, 128, 0.15); color: var(--pass); }
    .badge.fail { background: rgba(248, 113, 113, 0.15); color: var(--fail); }

    .mono { font-family: var(--mono); font-size: 0.85em; }

    .detail-panel {
      margin-top: 1.5rem;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      display: none;
    }

    .detail-panel.visible { display: block; }

    .detail-header {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }

    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .metric-tile {
      background: var(--surface-2);
      border-radius: 8px;
      padding: 0.75rem 1rem;
    }

    .metric-tile .label { font-size: 0.7rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.05em; }
    .metric-tile .value { font-family: var(--mono); font-size: 1.1rem; margin-top: 0.2rem; }

    .sub-table { margin-top: 1rem; }
    .sub-table h4 { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.5rem; }

    .empty {
      text-align: center;
      padding: 4rem 2rem;
      color: var(--muted);
      border: 1px dashed var(--border);
      border-radius: 12px;
    }

    .empty code {
      background: var(--surface-2);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-family: var(--mono);
      font-size: 0.85em;
    }

    @media (max-width: 640px) {
      .layout { padding: 1rem; }
      h1 { font-size: 1.35rem; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <header>
      <div>
        <h1>K6 Performance Report</h1>
        <p class="subtitle" id="generated-at">Loading…</p>
      </div>
      <div class="actions">
        <select id="filter-type" aria-label="Filter by test type">
          <option value="">All test types</option>
        </select>
        <select id="filter-status" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
        </select>
        <button type="button" id="btn-refresh" class="primary">Refresh data</button>
      </div>
    </header>

    <div id="empty-state" class="empty" hidden>
      <p>No performance test results found.</p>
      <p style="margin-top:0.75rem">Run a test, then generate the report:</p>
      <p style="margin-top:0.5rem"><code>pnpm run perf:load</code> → <code>pnpm run perf:report</code></p>
    </div>

    <div id="dashboard" hidden>
      <div class="cards" id="summary-cards"></div>

      <div class="section">
        <h2 class="section-title">Trends by test type</h2>
        <div class="charts" id="charts"></div>
      </div>

      <div class="section">
        <h2 class="section-title">All test runs</h2>
        <div class="filters">
          <input type="search" id="search" placeholder="Search runs…" style="min-width:220px" />
        </div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Status</th>
                <th>Test type</th>
                <th>Date</th>
                <th>Duration</th>
                <th>p95 response</th>
                <th>RPS</th>
                <th>Error rate</th>
                <th>Thresholds</th>
                <th>Checks</th>
              </tr>
            </thead>
            <tbody id="runs-body"></tbody>
          </table>
        </div>
        <div class="detail-panel" id="detail-panel"></div>
      </div>
    </div>
  </div>

  <script>
    const REPORT = ${dataJson};

    function fmtMs(ms) {
      if (ms == null || Number.isNaN(ms)) return "—";
      if (ms < 1) return (ms * 1000).toFixed(0) + " µs";
      if (ms < 1000) return ms.toFixed(1) + " ms";
      return (ms / 1000).toFixed(2) + " s";
    }

    function fmtPct(rate) {
      if (rate == null || Number.isNaN(rate)) return "—";
      return (rate * 100).toFixed(2) + "%";
    }

    function fmtNum(n) {
      if (n == null || Number.isNaN(n)) return "—";
      return new Intl.NumberFormat().format(Math.round(n * 100) / 100);
    }

    function fmtMetric(label, val) {
      if (val == null) return "—";
      if (label.includes("rate") || label.includes("Availability") || label.includes("success")) return fmtPct(val);
      if (label === "Apdex avg") return Number(val).toFixed(3);
      if (label === "RPS" || label === "Total requests" || label === "Iterations" || label === "Max VUs") return fmtNum(val);
      return fmtMs(val);
    }

    let selectedId = null;
    let charts = [];

    function init() {
      document.getElementById("generated-at").textContent =
        "Generated " + new Date(REPORT.summary.generatedAt).toLocaleString() +
        " · " + REPORT.summary.totalRuns + " run(s)";

      if (!REPORT.runs.length) {
        document.getElementById("empty-state").hidden = false;
        return;
      }

      document.getElementById("dashboard").hidden = false;
      populateTypeFilter();
      renderSummaryCards();
      renderCharts();
      renderTable();
      bindEvents();
    }

    function populateTypeFilter() {
      const select = document.getElementById("filter-type");
      const types = Object.keys(REPORT.summary.byType).sort();
      for (const t of types) {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = t + " (" + REPORT.summary.byType[t] + ")";
        select.appendChild(opt);
      }
    }

    function renderSummaryCards() {
      const s = REPORT.summary;
      const latest = REPORT.runs[0];
      const html = [
        card("Total runs", s.totalRuns, "accent"),
        card("Passed", s.passed, "pass"),
        card("Failed", s.failed, s.failed ? "fail" : ""),
        card("Test types", Object.keys(s.byType).length, ""),
        card("Latest p95", latest?.highlights?.responseTime?.p95 != null ? fmtMs(latest.highlights.responseTime.p95) : "—", ""),
        card("Latest RPS", latest?.highlights?.rps != null ? fmtNum(latest.highlights.rps) : "—", ""),
      ].join("");
      document.getElementById("summary-cards").innerHTML = html;
    }

    function card(label, value, cls) {
      return '<div class="card"><div class="card-label">' + label + '</div><div class="card-value ' + (cls || "") + '">' + value + '</div></div>';
    }

    function renderCharts() {
      const container = document.getElementById("charts");
      const trend = REPORT.summary.trendByType;
      const types = Object.keys(trend).slice(0, 6);

      charts.forEach((c) => c.destroy());
      charts = [];

      for (const type of types) {
        const wrap = document.createElement("div");
        wrap.className = "chart-card";
        wrap.innerHTML = "<h3>" + type + " — p95 response time</h3><canvas></canvas>";
        container.appendChild(wrap);
        const canvas = wrap.querySelector("canvas");
        const points = trend[type];
        charts.push(new Chart(canvas, {
          type: "line",
          data: {
            labels: points.map((p) => p.timestamp ? new Date(p.timestamp).toLocaleString() : ""),
            datasets: [{
              label: "p95 (ms)",
              data: points.map((p) => p.p95),
              borderColor: "#3dd6c6",
              backgroundColor: "rgba(61, 214, 198, 0.1)",
              tension: 0.25,
              fill: true,
            }],
          },
          options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: "#8b9cb3", maxRotation: 45 }, grid: { color: "#2a3544" } },
              y: { ticks: { color: "#8b9cb3" }, grid: { color: "#2a3544" } },
            },
          },
        }));
      }
    }

    function filteredRuns() {
      const type = document.getElementById("filter-type").value;
      const status = document.getElementById("filter-status").value;
      const q = document.getElementById("search").value.toLowerCase();
      return REPORT.runs.filter((r) => {
        if (type && r.testType !== type) return false;
        if (status && r.status !== status) return false;
        if (q && !r.id.toLowerCase().includes(q) && !r.testType.includes(q)) return false;
        return true;
      });
    }

    function renderTable() {
      const runs = filteredRuns();
      const tbody = document.getElementById("runs-body");
      tbody.innerHTML = runs.map((r) => {
        const p95 = r.highlights.responseTime?.p95;
        const err = r.highlights.errorRate;
        const sel = r.id === selectedId ? "selected" : "";
        return "<tr class=\\"" + sel + "\\" data-id=\\"" + r.id + "\\">" +
          "<td><span class=\\"badge " + r.status + "\\">" + r.status + "</span></td>" +
          "<td>" + r.testType + "</td>" +
          "<td class=\\"mono\\">" + (r.timestampLabel || "—") + "</td>" +
          "<td>" + (r.durationLabel || "—") + "</td>" +
          "<td class=\\"mono\\">" + (p95 != null ? fmtMs(p95) : "—") + "</td>" +
          "<td class=\\"mono\\">" + (r.highlights.rps != null ? fmtNum(r.highlights.rps) : "—") + "</td>" +
          "<td class=\\"mono\\">" + (err != null ? fmtPct(err) : "—") + "</td>" +
          "<td>" + r.thresholdSummary.passed + "/" + r.thresholdSummary.total + "</td>" +
          "<td>" + r.checkSummary.passed + "/" + r.checkSummary.total + "</td>" +
          "</tr>";
      }).join("");

      tbody.querySelectorAll("tr").forEach((row) => {
        row.addEventListener("click", () => showDetail(row.dataset.id));
      });

      if (selectedId && !runs.find((r) => r.id === selectedId)) {
        selectedId = null;
        document.getElementById("detail-panel").classList.remove("visible");
      }
    }

    function showDetail(id) {
      selectedId = id;
      const run = REPORT.runs.find((r) => r.id === id);
      if (!run) return;
      renderTable();

      const h = run.highlights;
      const panel = document.getElementById("detail-panel");
      panel.classList.add("visible");

      const metrics = [
        ["Avg response", h.responseTime?.avg],
        ["p95 response", h.responseTime?.p95],
        ["p99 response", h.responseTime?.p99],
        ["TTFB avg", h.ttfb?.avg],
        ["Apdex avg", h.apdex != null ? h.apdex.toFixed(3) : null],
        ["Error rate", h.errorRate],
        ["Availability", h.availability],
        ["Login success", h.loginSuccessRate],
        ["RPS", h.rps],
        ["Total requests", h.totalRequests],
        ["Iterations", h.iterations],
        ["Max VUs", h.vusMax],
      ];

      let html = '<div class="detail-header"><div><h3 style="font-size:1.15rem">' + run.testType + ' run</h3>' +
        '<p class="subtitle">' + (run.timestampLabel || run.file) + ' · ' + (run.durationLabel || "") + '</p></div>' +
        '<span class="badge ' + run.status + '">' + run.status + '</span></div>';

      html += '<div class="detail-grid">' + metrics.map(([label, val]) =>
        '<div class="metric-tile"><div class="label">' + label + '</div><div class="value">' +
        fmtMetric(label, val) + '</div></div>'
      ).join("") + '</div>';

      if (run.thresholds.length) {
        html += '<div class="sub-table"><h4>Thresholds</h4><div class="table-wrap"><table><thead><tr><th>Metric</th><th>Expression</th><th>Result</th></tr></thead><tbody>' +
          run.thresholds.map((t) => '<tr><td class="mono">' + t.metric + '</td><td class="mono">' + t.expression + '</td><td><span class="badge ' + (t.ok ? "pass" : "fail") + '">' + (t.ok ? "pass" : "fail") + '</span></td></tr>').join("") +
          '</tbody></table></div></div>';
      }

      if (run.checks.length) {
        html += '<div class="sub-table"><h4>Checks</h4><div class="table-wrap"><table><thead><tr><th>Check</th><th>Passes</th><th>Fails</th><th>Pass rate</th></tr></thead><tbody>' +
          run.checks.map((c) => '<tr><td>' + c.name + '</td><td>' + c.passes + '</td><td>' + c.fails + '</td><td class="mono">' + fmtPct(c.passRate) + '</td></tr>').join("") +
          '</tbody></table></div></div>';
      }

      panel.innerHTML = html;
    }

    function bindEvents() {
      ["filter-type", "filter-status"].forEach((id) => {
        document.getElementById(id).addEventListener("change", renderTable);
      });
      document.getElementById("search").addEventListener("input", renderTable);
      document.getElementById("btn-refresh").addEventListener("click", () => location.reload());
    }

    init();
  </script>
</body>
</html>`;
}
