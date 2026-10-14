# AI-Forge — 验证优先的零依赖 AI 核心

> Verification-First, Zero-Dependency AI Core.
> **每个算法用「数学不变量」自证正确性。**
> 作者：**晨星** (CJX0712) · MIT License

[![tests](https://img.shields.io/badge/self--test-12%2F12-brightgreen)](.)
[![deps](https://img.shields.io/badge/dependencies-0-blue)](.)
[![license](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## 这是什么

一个**纯 JavaScript、零依赖、零构建**的 AI/ML 核心。它不是简单堆砌算法，而是把一条工程信条做到极致：

> **不信任"看起来对"的数值实现，只信任能被独立不变量证伪的实现。**

库中每一个模块都附带一条可被独立计算的**数学不变量**（重构误差、正交性、梯度检验、单调性……）。运行 `npm test`，12 组不变量全绿才算数。任何一处反向传播写错、分解写错，都会被自己的梯度检验/重构误差当场抓住。

## 为什么零依赖

"零重写"的边界在这里：**数值数学是确定的**，没有比 `Golub & Van Loan` 更优的现成方案去"调用"，最好的方式是**忠实复现**这些世界顶级算法，并加上现代工程最缺的一环——**可验证性**。所以我们不引 TensorFlow，而是把顶级算法用一等公民的方式重写 + 自证。

## 算法与溯源（集大成）

| 模块 | 方法 | 世界级来源 | 自证不变量 |
|---|---|---|---|
| `cholesky` | A = LLᵀ 分解 | LAPACK `dpotrf` · G&VL §4.2 | `‖A−LLᵀ‖ < 1e-9` |
| `qr` | Householder QR | G&VL §5.2 | `QᵀQ=I` 且 `QR=A` |
| `jacobiEigen` | 循环 Jacobi 特征值 | Jacobi 1846 · G&VL §8.5 | `VᵀV=I` 且 `SV=VΛ` |
| `svd` | 经 AᵀA 的薄 SVD | Eckart–Young 最优性 | `‖A−UΣVᵀ‖ < 1e-7` |
| `adam` | Adam 优化器 | Kingma & Ba, ICLR 2015 | 损失单调下降 |
| `linregFit` | 正规方程 + 岭 | Hastie et al. ESL §3.2 | 残差 `Xᵀr ≈ 0` |
| `logisticFit` | sigmoid + BCE | GLM (Nelder & Wedderburn 1972) | 梯度检验 `maxRelErr<1e-4` |
| `kmeans` | k-means++ + Lloyd | Arthur & Vassilvitskii 2007 | 惯性单调不增 |
| `knnFit` | 暴力 k 近邻 | Cover & Hart 1967 | 可分数据 100% 准确 |
| `pca` | 协方差特征分解 | Pearson 1901 / Hotelling 1933 | 主轴标准正交 |
| `nbFit` | 高斯朴素贝叶斯 | Bayes 定理 · 条件独立 | 可分数据 ≥95% 准确 |
| `mlpGrad` | MLP 手写反向传播 | Rumelhart et al. 1986 | 梯度检验 `maxRelErr<1e-4` |
| `attnGrad` | Transformer 自注意力 | **Vaswani et al. 2017** | 梯度检验 `maxRelErr<1e-4` |

## 快速开始

```bash
# 运行自检套件（12 组数学不变量，需全绿）
npm test

# 生成单文件 HTML 演示（零外部依赖，双击即可在浏览器打开）
npm run demo

# Headless 校验 HTML 演示确实可在浏览器运行
node scripts/verify-demo.js
```

### 作为库使用

```js
const AIForge = require('ai-forge/src/ai-forge.js');

// 矩阵分解
const { U, S, V } = AIForge.svd(A);

// 训练 + 预测
const model = AIForge.logisticFit(X, y);
const pred = model.predict(Xtest);

// 深度学习 — 手写反向传播的 Transformer 注意力
const P = { Wq, Wk, Wv, Wo };
const { A } = AIForge.attnForward(X, P);
const grads = AIForge.attnGrad(X, target, P); // 可被 gradientCheck 验证
```

浏览器直接用（单文件内联版）：

```html
<script src="src/ai-forge.js"></script>
<script> console.log(AIForge.runAll().allPass); </script>
```

## 验证哲学

数值 AI 最大的风险是**"能跑但错"**——错误的反向传播、非正交的分解、发散的优化，都能跑出看似合理的结果。AI-Forge 的对策是给每个算法挂一条**可独立证伪的不变量**：

- **梯度检验**（中心差分 vs 解析梯度）：反向传播的金标准。实测逻辑回归 `1.22e-10`、MLP `2.49e-8`、Transformer 注意力 `6.08e-7`。
- **重构误差**：分解能否还原原矩阵（Cholesky/QR/Jacobi/SVD 实测到 `1e-15 ~ 1e-16`）。
- **正交性**：正交矩阵/特征向量是否真的正交（`‖QᵀQ−I‖`、`‖VᵀV−I‖`）。
- **结构性**：线性回归残差 ⊥ 特征、k-means 惯性单调、softmax 行和=1。

全部用确定性随机数（mulberry32）播种，**结果可复现**。

## 目录结构

```
ai-forge/
├── src/ai-forge.js        # 唯一数据源：全部算法 + 不变量自检注册表
├── test/run.js            # Node 自检套件（npm test）
├── scripts/build-demo.js  # 生成单文件 HTML 演示
├── scripts/verify-demo.js # Headless 校验浏览器可运行
├── demo/index.html        # 单文件演示（自动生成，勿手改）
├── .github/workflows/ci.yml
├── LICENSE                # MIT
└── package.json
```

## 路线图

- [ ] CNN 原语（im2col / 卷积/池化）及其梯度检验
- [ ] 梯度提升决策树（GBDT）+ 单变量分裂增益检验
- [ ] 序列模型（RNN/GRU）手写反向传播
- [ ] WASM/SIMD 加速核心数值内核（保持同一套不变量）

## 许可

MIT © 晨星 (CJX0712)

---

### English Summary

**AI-Forge** is a dependency-free, pure-JS AI/ML core where every algorithm **proves its own correctness via an independently computable mathematical invariant** — gradient checks (finite-difference vs analytic backprop, down to 1e-7~1e-10), reconstruction error, orthogonality, monotonicity. It faithfully reimplements world-class methods (LAPACK-style Cholesky/QR/Jacobi/SVD, Adam, Transformer self-attention) and is verifiable in both Node (`npm test`, 12/12 green) and the browser (single-file demo).
