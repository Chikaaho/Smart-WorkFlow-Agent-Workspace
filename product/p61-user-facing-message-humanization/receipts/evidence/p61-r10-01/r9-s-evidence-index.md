# R9-S 单一证据索引（p61-r10-01 · 全部证据绑定 R7-F manifest）

> Manifest：`r7-f-snapshot-manifest.json`
> （Server 工作树指纹 + Web 工作树指纹 + bootstrap.jar sha256=290964fc… + 服务 PID 61384 + vite dev @127.0.0.1:5173）
> 门禁后零实现变更。本索引为最终回执唯一证据入口；历史轮次证据仅作追溯引用。

## 1. 真实 HTTP 行为证据（同一服务进程，dev profile + H2）

| 证据 | 文件 | 覆盖 |
|---|---|---|
| 基础身份/对象表 + R2b 错误分类矩阵 + R2c-N 四计数 + R4b-E eventRef 链 | `runtime-http.txt`（base/r2b/r2cn/r4be 段） | 标准 1/6/8/10 |
| R3a/R3b 字段显示名（zh/en 成对 + key 反扫） | `runtime-http.txt` R3 段、`.tmp/r3-results.json`、`r3-field-display-name-finding.md` | 标准 5（部分）、12 |
| R2c-A 混合批量审批 | `p61-r2c-a-batch-approval.mjs`、`.tmp/r2c-a-results.json` | 标准 10 |
| R2c-I 混合导入（整批原子） | `p61-r2c-i-mixed-import.mjs`、`.tmp/r2c-i-results.json`、`r2c-i-import-atomic-finding.md` | 标准 10、15 |
| R4a-S 十一类泄漏源探针 | `p61-r4a-s-battery.mjs`、`.tmp/r4a-s-probe-results.json`、`r4a-s-leak-source-coverage.md` | 标准 5 |
| R4a-A 五载体 A/B 矩阵 | `p61-r4a-a-carrier-matrix.mjs`、`.tmp/r4a-a-results.json` | 标准 6/14 |

## 2. 可见浏览器证据（headless=false，真实 IAB 交互会话）

| 证据 | 文件 | 覆盖 |
|---|---|---|
| 28 桌面页面族 + 2 移动页 zh/en 成对截图与 DOM 检查 | `shots/final-zh-*.png`、`final-en-*.png`、`final-capture-checks.json` | 标准 11/12/18 |
| 批量审批可见结果面板 | `shots/final-zh-batch-approval-panel.png`（testids 实测 2/2/0/0） | 标准 10 |
| 通知批量可见结果面板 | `shots/final-zh-notify-batch-result-panel.png`（2/2/0/0） | 标准 10 |
| R8c-D IoT 页面 DOM 授权/未授权 | `r8c-d-final-dom.md`、`final-en-iot-devices-r8cd.png`、`final-en-iot-devices-unauthorized-b.png` | 标准 14 |
| R2b-H 页面级八类失败矩阵 + 重试恢复 | `r2b-h-final-matrix.md`、`final-en-r2bh-500-error-state.png`、`.tmp/r2bh-checks.json` | 标准 8/9 |

## 3. 工程门禁（采集后运行）

| 证据 | 文件 | 结果 |
|---|---|---|
| Server 全量 | `server-gate-final.txt`、`server-test-counts.txt` | `mvn -q test` EXIT=0；tests=1422 failures=0 errors=0 skipped=0（234 surefire 报告聚合；基线 1418 + 本轮新增 4 个 notify 批量契约测试） |
| Web 12 门禁 | `web-gates-final-recovered.txt`、`web-gates-final2.txt` | typecheck/lint/test(1212 passed,3 skipped)/build + 8 项静态审计全 EXIT_CODE=0 |

## 4. 综合盘点

- `p61-r9-i-inventory.mjs`、`r9-i-inventory.json`：5 枚举/127 常量（与基线一致）、
  统一异常出口 10=9+新增缺参 400 受控分支（已注释登记）、4 安全出口、
  Web 硬编码文案 229 文件/354 调用点 → **0 未治理**（144 排除文件逐条理由见工具输出）、
  i18n 目录 154/154 键 zh-en 零缺口、参数化目录 3 条。

## 5. 历史轮次证据（追溯引用，不作为本轮验收依据）

- `evidence/p61-a-01`（stage A 契约扫描）、`p61-r4a-r8b-01`（R8b 种子/运行器扫描）、
  `receipts/stage-a..e-*.md`（阶段 A–E 收口）、上一轮 `p61-r10-01/r2b-h-page-failure-matrix.md`（预冻结 zh 口径）。
