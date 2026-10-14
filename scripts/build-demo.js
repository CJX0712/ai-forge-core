#!/usr/bin/env node
/*
 * 单文件 HTML 演示生成器 (零外部依赖)
 * 将 src/ai-forge.js 内联进 demo/index.html — 保持单一数据源，产出即可双击打开的单文件。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const lib = fs.readFileSync(path.join(ROOT, 'src/ai-forge.js'), 'utf8');

const demoJS = `
// ---- 渲染自检表 ----
(function renderTests(){
  const { results, passed, total } = AIForge.runAll();
  const host = document.getElementById('test-body');
  const badge = document.getElementById('test-badge');
  const allPass = passed === total;
  badge.textContent = passed + '/' + total + (allPass ? ' 全绿 ✅' : ' ⚠️');
  badge.className = 'badge ' + (allPass ? 'ok' : 'warn');
  results.forEach(r => {
    const tr = document.createElement('tr');
    const items = r.items.map(it =>
      '<div class="sub">' + (it.pass ? '<span class="ok-t">✓</span>' : '<span class="no-t">✗</span>')
      + ' ' + it.name + ' <b>' + it.detail + '</b></div>').join('');
    tr.innerHTML = '<td>' + (r.pass ? '<span class="ok-t">✅</span>' : '<span class="no-t">❌</span>') + '</td>'
      + '<td>' + r.name + items + '</td>';
    host.appendChild(tr);
  });
})();

// ---- 演示1: 逻辑回归训练损失曲线 (Adam) ----
(function trainLogistic(){
  const rng = AIForge.mulberry32(2025);
  const randn = AIForge.randn;
  const X = [], y = [];
  for (let i = 0; i < 120; i++) {
    const lab = i % 2;
    X.push([rng() * 2 + (lab ? 2 : 0), rng() * 2 + (lab ? 2 : 0)]);
    y.push(lab);
  }
  const w = new Array(3).fill(0);
  const state = {};
  const losses = [];
  const lr = 0.1;
  for (let it = 0; it < 400; it++) {
    const g = AIForge.logisticGrad(w, X, y);
    AIForge.adam(w, g, state, lr);
    if (it % 10 === 0) losses.push(AIForge.logisticLoss(w, X, y));
  }
  drawCurve('loss-canvas', losses, '#c0392b', '损失 Loss', '迭代');
})();

// ---- 演示2: 自注意力矩阵热力图 (Transformer) ----
(function attentionHeat(){
  const rng = AIForge.mulberry32(88);
  const randn = AIForge.randn;
  const T = 8, d = 5;
  const X = Array.from({ length: T }, () => Array.from({ length: d }, () => randn(rng)));
  const mk = () => Array.from({ length: d }, () => Array.from({ length: d }, () => randn(rng) * 0.3));
  const P = { Wq: mk(), Wk: mk(), Wv: mk(), Wo: mk() };
  const { A } = AIForge.attnForward(X, P);
  drawHeat('attn-canvas', A);
})();

function drawCurve(id, data, color, yLabel, xLabel){
  const c = document.getElementById(id);
  const dpr = window.devicePixelRatio || 1;
  const w = c.clientWidth, h = 240;
  c.width = w * dpr; c.height = h * dpr; c.style.height = h + 'px';
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const max = Math.max(...data), min = Math.min(...data);
  const px = 34, py = 12;
  const X0 = px, X1 = w - py, Y0 = h - py, Y1 = py;
  ctx.strokeStyle = '#ccc'; ctx.beginPath();
  ctx.moveTo(X0, Y0); ctx.lineTo(X1, Y0); ctx.moveTo(X0, Y0); ctx.lineTo(X0, Y1); ctx.stroke();
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
  data.forEach((v, i) => {
    const x = X0 + (X1 - X0) * (i / (data.length - 1));
    const yy = Y0 - (Y0 - Y1) * ((v - min) / (max - min || 1));
    i === 0 ? ctx.moveTo(x, yy) : ctx.lineTo(x, yy);
  });
  ctx.stroke();
  ctx.fillStyle = '#888'; ctx.font = '12px sans-serif';
  ctx.fillText(max.toFixed(3), 2, Y1 + 12);
  ctx.fillText(min.toFixed(3), 2, Y0 - 2);
  ctx.fillText(xLabel, (X0 + X1) / 2 - 10, h - 0);
}

function drawHeat(id, A){
  const c = document.getElementById(id);
  const n = A.length;
  const dpr = window.devicePixelRatio || 1;
  const size = 240; c.width = size * dpr; c.height = size * dpr; c.style.height = size + 'px';
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  const cell = size / n;
  let mx = 0; A.forEach(r => r.forEach(v => { if (v > mx) mx = v; }));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const t = A[i][j] / (mx || 1);
    ctx.fillStyle = 'rgb(' + Math.round(255 - 100 * t) + ',' + Math.round(255 - 160 * t) + ',' + Math.round(255 - 60 * t) + ')';
    ctx.fillRect(j * cell, i * cell, cell - 1, cell - 1);
  }
}
`;

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI-Forge — 验证优先的零依赖 AI 核心 · 晨星</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif; margin: 0; background: #f5f6f8; color: #1c2733; line-height: 1.6; }
  .wrap { max-width: 960px; margin: 0 auto; padding: 32px 20px 60px; }
  header h1 { font-size: 26px; margin: 0 0 6px; }
  header .sub { color: #5b6b7b; font-size: 14px; margin-bottom: 4px; }
  .meta { font-size: 13px; color: #8a97a5; margin-bottom: 20px; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 600; vertical-align: middle; }
  .badge.ok { background: #e7f6ec; color: #1e8e4a; }
  .badge.warn { background: #fdeceb; color: #c0392b; }
  .ok-t { color: #1e8e4a; font-weight: 700; }
  .no-t { color: #c0392b; font-weight: 700; }
  section { background: #fff; border: 1px solid #e6e9ee; border-radius: 12px; padding: 20px 22px; margin-bottom: 22px; }
  h2 { font-size: 18px; margin: 0 0 12px; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  td { padding: 10px 8px; border-bottom: 1px solid #eef1f4; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .sub { color: #6b7889; font-size: 12.5px; margin-top: 3px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; }
  @media (max-width: 720px){ .grid { grid-template-columns: 1fr; } }
  canvas { width: 100%; }
  .cap { font-size: 12.5px; color: #8a97a5; margin-top: 6px; }
  code { background: #eef1f4; padding: 1px 5px; border-radius: 4px; font-size: 12.5px; }
  a { color: #2563eb; }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>AI-Forge <span id="test-badge" class="badge ok">…</span></h1>
    <div class="sub">验证优先的零依赖 AI 核心 — 每个算法用「数学不变量」自证正确性</div>
    <div class="meta">作者 <b>晨星</b> · MIT · 零依赖零构建 · 本页为单文件，所有计算在浏览器本地完成</div>
  </header>

  <section>
    <h2>① 数学不变量自检 <span class="sub" style="display:inline">重构误差/正交性 ~1e-9，梯度检验 maxRelErr&lt;1e-4</span></h2>
    <table>
      <thead><tr><td style="width:52px"><b>状态</b></td><td><b>算法 / 不变量</b></td></tr></thead>
      <tbody id="test-body"></tbody>
    </table>
  </section>

  <section>
    <h2>② 实时演示 — 浏览器内训练与推理</h2>
    <div class="grid">
      <div>
        <div><b>逻辑回归 + Adam</b> <span class="cap">损失单调下降 (Kingma & Ba 2015)</span></div>
        <canvas id="loss-canvas"></canvas>
      </div>
      <div>
        <div><b>Transformer 自注意力</b> <span class="cap">注意力权重矩阵 A = softmax(QKᵀ/√d)</span></div>
        <canvas id="attn-canvas"></canvas>
      </div>
    </div>
    <p class="cap">全部由本页内联的纯 JS 引擎实时计算，无任何网络请求、无外部脚本。</p>
  </section>

  <section>
    <h2>③ 溯源 — 站在世界顶级成果之上</h2>
    <table>
      <tbody>
        <tr><td><code>Cholesky / QR / Jacobi / SVD</code></td><td>Golub &amp; Van Loan《Matrix Computations》· LAPACK · Eckart–Young</td></tr>
        <tr><td><code>Adam</code></td><td>Kingma &amp; Ba, ICLR 2015</td></tr>
        <tr><td><code>k-means++ / Lloyd</code></td><td>Arthur &amp; Vassilvitskii 2007</td></tr>
        <tr><td><code>自注意力 / Transformer</code></td><td>Vaswani et al. 2017 (Attention Is All You Need)</td></tr>
        <tr><td><code>梯度检验</code></td><td>中心差分数值微分 · CS231n 规范</td></tr>
      </tbody>
    </table>
  </section>
</div>

<script>
${lib}
</script>
<script>
${demoJS}
</script>
</body>
</html>
`;

const outDir = path.join(ROOT, 'demo');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('demo/index.html 生成完成 (' + (html.length / 1024).toFixed(1) + ' KB, 单文件零依赖)');
