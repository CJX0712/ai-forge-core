#!/usr/bin/env node
/*
 * Headless 校验 demo/index.html — 用桩 document/canvas 真实执行内联脚本，
 * 确保浏览器内运行零运行时错误（验证「浏览器可运行」这条硬承诺）。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'demo', 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
if (scripts.length < 2) { console.error('未找到预期脚本块'); process.exit(1); }

// 桩 canvas context — 所有方法 no-op
const ctxStub = new Proxy({}, { get: () => () => {} });
function makeCanvas() {
  return {
    width: 0, height: 0, clientWidth: 300, style: {},
    getContext: () => ctxStub
  };
}
const cells = {};
const elements = {
  'test-body': { appendChild: () => {} },
  'test-badge': { textContent: '', className: '' },
  'loss-canvas': makeCanvas(),
  'attn-canvas': makeCanvas()
};
const documentStub = {
  getElementById: (id) => elements[id] || (elements[id] = makeCanvas()),
  createElement: () => ({ innerHTML: '', className: '' })
};
const sandbox = {
  document: documentStub,
  window: { devicePixelRatio: 1 },
  console,
  module: { exports: {} }
};
vm.createContext(sandbox);

try {
  scripts.forEach((s, i) => vm.runInContext(s, sandbox, { filename: 'demo-script-' + i + '.js' }));
  console.log('✅ demo/index.html headless 执行通过 — ' + scripts.length + ' 个脚本块无运行时错误');
  console.log('   test-badge 渲染值 =', JSON.stringify(elements['test-badge'].textContent));
} catch (e) {
  console.error('❌ 运行时错误:', e && e.stack ? e.stack : e);
  process.exit(1);
}
