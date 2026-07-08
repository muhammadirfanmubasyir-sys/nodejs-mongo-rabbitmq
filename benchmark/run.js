const autocannon = require('autocannon');
const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const RESULTS_DIR = path.join(__dirname);

function makeApp() {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const method = req.method;
    let body = '';

    req.on('data', c => body += c);
    req.on('end', () => {
      let parsed = null;
      if (body) try { parsed = JSON.parse(body); } catch {}

      if (method === 'GET' && url.pathname === '/health') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'healthy' }));
      } else if (method === 'POST' && url.pathname === '/api/users') {
        res.writeHead(201, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', data: { _id: '1', ...parsed } }));
      } else if (method === 'GET' && url.pathname === '/api/users') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', count: 0, data: [] }));
      } else if (method === 'GET' && /^\/api\/users\/id\/\w+$/.test(url.pathname)) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', data: { _id: '1', name: 'Test', email: 'test@test.com' } }));
      } else if (method === 'PUT' && /^\/api\/users\/\w+$/.test(url.pathname)) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', data: { _id: '1', ...parsed } }));
      } else if (method === 'DELETE' && /^\/api\/users\/id\/\w+$/.test(url.pathname)) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', message: 'User deleted successfully' }));
      } else if (method === 'POST' && url.pathname === '/api/tasks') {
        res.writeHead(201, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', data: { _id: '1', ...parsed } }));
      } else if (method === 'GET' && url.pathname === '/api/tasks') {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', count: 0, data: [] }));
      } else if (method === 'GET' && /^\/api\/tasks\/\w+$/.test(url.pathname)) {
        res.writeHead(200, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'success', data: { _id: '1', title: 'Task', userId: 'u1' } }));
      } else {
        res.writeHead(404, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ status: 'error', message: 'Not found' }));
      }
    });
  });
}

async function bench(name, endpoints) {
  const server = makeApp();
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;
  const results = [];

  for (const t of endpoints) {
    process.stdout.write(`  ${t.label.padEnd(30)}`);

    const result = await new Promise((resolve, reject) => {
      const opts = {
        url: `http://127.0.0.1:${port}${t.path}`,
        method: t.method || 'GET',
        connections: config.connections,
        pipelining: config.pipelining,
        duration: config.duration,
      };
      if (t.body) {
        opts.body = JSON.stringify(t.body);
        opts.headers = { 'content-type': 'application/json' };
      }
      autocannon(opts, (err, res) => err ? reject(err) : resolve(res));
    });

    const row = {
      service: name,
      endpoint: t.label,
      'req/s': result.requests.average,
      'latency avg (ms)': result.latency.average,
      'latency p50 (ms)': result.latency.p50,
      'latency p99 (ms)': result.latency.p99,
      'throughput (MB/s)': parseFloat((result.throughput.average / 1024 / 1024).toFixed(2)),
      'total requests': result.requests.total,
      errors: result.errors || 0,
    };
    results.push(row);
    console.log(`${row['req/s']} req/s | avg ${row['latency avg (ms)']}ms | p50 ${row['latency p50 (ms)']}ms | p99 ${row['latency p99 (ms)']}ms`);
  }

  await new Promise(r => server.close(r));
  return results;
}

function generateHTML(results) {
  const services = [...new Set(results.map(r => r.service))];
  const avg = (arr, key) => arr.reduce((a, b) => a + b[key], 0) / arr.length;

  const rows = results.map(r => `
        <tr>
          <td>${r.service}</td><td>${r.endpoint}</td>
          <td class="num">${r['req/s'].toLocaleString()}</td>
          <td class="num">${r['latency avg (ms)']}</td>
          <td class="num">${r['latency p50 (ms)']}</td>
          <td class="num">${r['latency p99 (ms)']}</td>
          <td class="num">${r['throughput (MB/s)']}</td>
          <td class="num">${r['total requests'].toLocaleString()}</td>
          <td class="num">${r.errors}</td>
        </tr>`).join('');

  const summaryRows = services.map(s => {
    const sr = results.filter(r => r.service === s);
    return `<tr>
          <td class="svc">${s}</td>
          <td class="num">${Math.round(avg(sr, 'req/s')).toLocaleString()}</td>
          <td class="num">${avg(sr, 'latency avg (ms)').toFixed(1)}</td>
          <td class="num">${avg(sr, 'latency p50 (ms)').toFixed(1)}</td>
          <td class="num">${avg(sr, 'latency p99 (ms)').toFixed(1)}</td>
          <td class="num">${sr.reduce((a,b) => a + b['total requests'], 0).toLocaleString()}</td>
        </tr>`;
  }).join('');

  const totalReqs = results.reduce((a,b) => a + b['total requests'], 0);
  const totalErrors = results.reduce((a,b) => a + b.errors, 0);

  fs.writeFileSync(path.join(RESULTS_DIR, 'benchmark-report.html'), `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Benchmark Report</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0d1117;color:#c9d1d9;padding:2rem}
.c{max-width:1200px;margin:0 auto}
h1{font-size:2rem;color:#f0f6fc;margin-bottom:.25rem}
.sub{color:#8b949e;margin-bottom:2rem;font-size:.9rem}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem;margin-bottom:2rem}
.card{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:1.25rem}
.card .lbl{font-size:.8rem;color:#8b949e;margin-bottom:.4rem}
.card .val{font-size:1.8rem;font-weight:700;color:#3fb950}
.card .det{font-size:.75rem;color:#8b949e;margin-top:.2rem}
h2{font-size:1.3rem;color:#f0f6fc;margin:1.5rem 0 1rem}
table{width:100%;border-collapse:collapse;background:#161b22;border:1px solid #30363d;border-radius:8px;overflow:hidden;margin-bottom:2rem}
th,td{padding:.7rem 1rem;text-align:left;border-bottom:1px solid #21262d;font-size:.85rem}
th{background:#1c2128;color:#f0f6fc;font-weight:600;text-transform:uppercase;letter-spacing:.04em;font-size:.75rem}
tr:last-child td{border-bottom:none}
tr:hover{background:#1c2128}
.num{text-align:right;font-variant-numeric:tabular-nums}
.svc{font-weight:600;color:#58a6ff}
.cfg{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:1rem 1.5rem;margin-bottom:2rem;font-size:.85rem;color:#8b949e}
.cfg b{color:#c9d1d9}
.ft{margin-top:2rem;padding-top:1rem;border-top:1px solid #30363d;color:#8b949e;font-size:.8rem;text-align:center}
</style></head><body><div class="c">
<h1>Benchmark Report</h1>
<p class="sub">Node.js Microservices &mdash; Throughput &amp; Latency</p>
<div class="cfg"><b>Config:</b> ${config.connections} connections | pipelining: ${config.pipelining} | ${config.duration}s per endpoint</div>
<div class="cards">
  <div class="card"><div class="lbl">Total Requests</div><div class="val">${totalReqs.toLocaleString()}</div><div class="det">all endpoints combined</div></div>
  <div class="card"><div class="lbl">Avg Req/s</div><div class="val">${Math.round(avg(results,'req/s')).toLocaleString()}</div><div class="det">across all endpoints</div></div>
  <div class="card"><div class="lbl">Avg Latency</div><div class="val">${avg(results,'latency avg (ms)').toFixed(1)}ms</div><div class="det">mean response time</div></div>
  <div class="card"><div class="lbl">Avg p99 Latency</div><div class="val">${avg(results,'latency p99 (ms)').toFixed(1)}ms</div><div class="det">99th percentile</div></div>
  <div class="card"><div class="lbl">Errors</div><div class="val" style="color:${totalErrors?'#f85149':'#3fb950'}">${totalErrors}</div><div class="det">failed requests</div></div>
</div>
<h2>Per-Service Summary</h2>
<table><thead><tr><th>Service</th><th class="num">Avg Req/s</th><th class="num">Avg Latency (ms)</th><th class="num">Avg p50 (ms)</th><th class="num">Avg p99 (ms)</th><th class="num">Total Requests</th></tr></thead>
<tbody>${summaryRows}</tbody></table>
<h2>Detailed Results</h2>
<table><thead><tr><th>Service</th><th>Endpoint</th><th class="num">Req/s</th><th class="num">Lat avg</th><th class="num">Lat p50</th><th class="num">Lat p99</th><th class="num">MB/s</th><th class="num">Total</th><th class="num">Err</th></tr></thead>
<tbody>${rows}</tbody></table>
<div class="ft">Generated ${new Date().toISOString()}</div>
</div></body></html>`);
}

async function main() {
  console.log('================================================');
  console.log('    NODEJS MICROSERVICES - HTTP BENCHMARK');
  console.log(`    ${config.connections} connections | pipelining: ${config.pipelining} | ${config.duration}s`);
  console.log('================================================\n');

  const allResults = [];

  for (const svc of config.services) {
    console.log(`--- ${svc.name} ---`);
    allResults.push(...await bench(svc.name, svc.endpoints));
    console.log();
  }

  console.log('\n================================================');
  console.log('              RESULTS SUMMARY');
  console.log('================================================\n');
  console.table(allResults);

  fs.writeFileSync(path.join(RESULTS_DIR, 'benchmark-results.json'), JSON.stringify(allResults, null, 2));
  generateHTML(allResults);
  console.log('\nSaved: benchmark-results.json, benchmark-report.html');
}

main().catch(console.error);
