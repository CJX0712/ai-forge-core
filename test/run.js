#!/usr/bin/env node
/*
 * AI-Forge 自检套件 — 运行全部数学不变量检验
 * 用法: node test/run.js
 * 退出码 0 = 全绿; 1 = 有失败项
 */
'use strict';
const AIForge = require('../src/ai-forge.js');

const GREEN = '\x1b[32m', RED = '\x1b[31m', BOLD = '\x1b[1m', DIM = '\x1b[2m', RESET = '\x1b[0m';

const { results, allPass, passed, total } = AIForge.runAll();

console.log('');
console.log(`${BOLD}AI-Forge — Verification-First Self-Test${RESET}`);
console.log(`${DIM}每个算法用数学不变量自证正确性。通过标准: 重构误差/正交性 ~1e-9, 梯度检验 maxRelErr<1e-4${RESET}`);
console.log('');

for (const r of results) {
  const mark = r.pass ? `${GREEN}✅ PASS${RESET}` : `${RED}❌ FAIL${RESET}`;
  console.log(`${mark}  ${r.name}`);
  for (const it of r.items) {
    const im = it.pass ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`       ${im} ${it.name}  ${DIM}= ${it.detail}${RESET}`);
  }
}

console.log('');
console.log(`${BOLD}结果: ${passed}/${total} 通过${RESET}  ${allPass ? `${GREEN}— 全绿 ✅${RESET}` : `${RED}— 存在失败 ❌${RESET}`}`);
console.log('');

process.exit(allPass ? 0 : 1);
