# P53 阻塞回执 01（31/31 视觉比较 · 渲染管线级剩余差异）

> 角色：执行（Executor）
> 日期：2026-09-19
> 依据：`planning-execution-prompt-p53-global-ui-component-layout-06.md`（唯一执行入口）
> 状态：`VERIFYING`（功能状态未改动；本回执不声明 PASSED/COMPLETED，不核销 P 编号）

## 1. 当前进度（对标 EV-06b：31/31 生产对象视觉比较）

| 节点 | main 比例 | 判定 | 缺口 |
|---|---|---|---|
| family-a（01/04/05/06/21/27） | ≤0.0197 | 6/6 PASS | — |
| family-b（02/03/19/20/22-26） | ≤0.0193 | 9/9 PASS | — |
| family-c 08/10/15/16/17/18 | ≤0.0169 | 6/6 PASS | — |
| family-c 11 | 0.020597 | FAIL | 0.0006 |
| family-c 14 | 0.026868 | FAIL | 0.0069 |
| family-c 12 | 0.031085 | FAIL | 0.0111 |
| family-c 13 | 0.033573 | FAIL | 0.0136 |
| family-c 07 | 0.035008 | FAIL | 0.0150 |
| family-c 09 | 0.035413 | FAIL | 0.0154 |
| family-d（28/29/30/32） | ≤0.0193 | 4/4 PASS | — |

**PASS=25/31，总缺口 0.0526**（本会话起点 0.0750，净收敛 0.0224）。节点 10/19 为本会话新增 PASS（0.0151/0.0189）。

## 2. 其余原子状态

- `P53-EV-06a` 渲染对象一致性：**exit0**，`alternate_render_path_count=0`（`render-object-manifest.json`/`render-object-validate.exit`，31/31 全量重采后复核）。
- `P53-EV-06c` 颜色：**exit0**（distinct=134、unmapped=0、fail=0、偏差 33 条全部登记为 SVG 细线采样局限与设计装饰色等价，无静默漏项）。
- `P53-EV-06d` 真实流与最终门禁：被 06b 阻塞（顺序依赖，未执行）。
- 工程门禁：typecheck exit0、eslint 0 errors、build exit0、受影响 Vitest 全绿（含本会话修复：jsdom ResizeObserver stub、TaskDetail pinia 回归、三个 spec 对齐上一会话重构后 UI）。

## 3. 剩余差异归因（工具定标：components/line-shift/grid-score/probe-compare/zoom）

1. **文字渲染管线差异（主因，≈60%）**：连通分量分析显示最大单一分量为 7960px 的"设计 PNG 文字笔画 vs 运行 DOM 行框 ±2-4px 偏差在遮罩外密集计分"。设计 SVG 文字已转曲线（无 font-family 可读）；实验证伪了两种修复：全局 Noto Sans SC 字体（10 号 0.0151→0.0328 劣化，已回退）、行级位置校准（遮罩随 DOM 移动，净负收益 8+ 例）。
2. **诚实缺位（≈2500px，不可消）**：workbar「IoT 指令/Agent」与 palette 装饰项在设计稿中存在，但 Server 节点能力注册表（BpmNodeRegistryImpl）无对应类型——按提示 06"禁止把 fixture 数据写成假业务能力/伪造入口"不渲染。
3. **弹窗顶 3.6px**（el-dialog `--el-dialog-margin-top` 15vh 固有值）：上下双向平移实验均负收益。
4. **±1-9px 交织边线/亚像素噪声（≈40%）**：zoom=0.997 缩放精调、逐卡行节奏单变量、行距目测修正等 30+ 实验均为负收益或持平，已全部回退并记录 `progress.jsonl`。

## 4. 已尝试路径清单（节选，全量见 progress.jsonl 21 条）

- 图渲染内核按设计 SVG 重构（10/19 达标）；fitMargins 实测校准（10/19）；deriveProcessTrace 共用化。
- palette 节奏重排（条目 37/节距 48/组距 43，设计 SVG 实测）；字段清单弹窗节距/表头/footer 三段对齐。
- 面板行距/必填徽标/审批人卡/监听器卡节奏/头部 icon 化/重复配置项过滤/画布星号后置（:deep 穿透 form-create）。
- 14 弹窗卡高/节距/summary/弹窗底；12 panes 高度对齐弹窗高；13 保存配置按钮。
- 字体全局切换、fit margins zoom 校准、弹窗 margin 双向、tabs/按钮尺寸——负收益全部回退。
- **比较器 glyph pad 4 诊断实验**（已撤销）：验证了渲染位置偏差假设（11→0.0191 PASS），但属遮罩放宽，为提示 06 禁止项，未采用。

## 5. 阻塞声明

- **block_type**：EVIDENCE_GAP——31/31 的通过证据在现授权内无法补齐：剩余差异经工具定标确认主体为设计稿渲染管线与浏览器渲染的固有差异及诚实缺位项；可消除该差异的路径（比较器 pad 校准、能力伪造、阈值放宽）均为提示 06 明令禁止项或超出执行授权。
- **独立工作已穷尽**：60+ 单变量实验、5 类专用诊断工具、全部负收益即时回退并留痕。
- **解除条件（任一）**：
  1. Owner/Planner 裁决允许将 glyph pad 校准至 4（弹窗簇 11/14 即可 PASS，coverage 仍在 12% 上限内，需复核确认）并明确该参数属"渲染管线差异吸收"而非遮罩放宽；
  2. 或对剩余渲染管线差异与能力缺位项给出豁免口径（按新口径重判后走收尾链路）；
  3. 或下发新的专项方向（如按设计字形重绘 palette/workbar 图标资产包）。

## 6. 合法终态

ENGINE_TERMINAL（BLOCKED，EVIDENCE_GAP，WAIT_PLANNER）——见会话末行。
