# 批次 6 补充回执 02 — 执行补充提示 01（G1a/G1b）

- 日期：2026-09-27；承接 `planning-execution-prompt-batch-06-01.md`（依据 `planning-review-batch-06-supplement-01.md`；G2/G3 与表单管理子项已由规划核销锁定，本回执不重复）。
- 结论：**G1a、G1b 均已按完成条件处理并附原始捕获，执行自验通过，待规划复核。**
- 提交：Web `0.1.2-bugfix@e86f6b8`（NotifyTemplateList 操作列宽 170→240，推送回读一致）；Server 无改动。
- 证据目录：`receipts/evidence/batch-06-supplement-02/`（本回执制品相对此目录）。

## 环境与对象身份（提示第 1 步）

- 代码身份：Web HEAD `e86f6b871c35…`（修复前采集基于 `fe9f6be`，两时点均=origin/0.1.2-bugfix，工作树干净）；后端 `bootstrap-dev.jar`（local profile，PostgreSQL `sw_apaas_test`，health 200 UP）。
- 会话身份：admin（V4 种子）、English locale、视口 1440×900 与 1366×768、前端 `http://localhost:5174`。
- 对象账本（提示要求的新旧 ID 明确化）：
  - 旧对象 code `V012_G1_MORE_DEMO`：删除动作发生在补充提示 01 之前、无留存记录——按提示允许的替代路径，本回执以**只读回读**证明其不存在（`GET /api/notify/templates?keyword=V012_G1_MORE_DEMO` → 200 `records:[] total:"0"`，见 `api/notify-template-demo-object-lifecycle.json`）。
  - 替代对象 code `V012_G1B_DEMO_01`、**ID `2104030652024786945`**（POST 创建响应捕获 `data:"2104030652024786945"`）。

## G1a（原 G1）— 通知模板四动作完整显示与可达

**实测复现（修复前，1440×900）**：操作列单元格宽 170px（1238–1408），`.list-actions` 内容 scrollWidth 183 > clientWidth 114 且 `overflowX: visible`——按钮溢出单元格向右绘制：Disable 右缘 1413、More 右缘 1449 **超出视口 1440**，视觉上「Disa…」截断、More 完全不可见。与复核"截图只有 Edit/Disable/More 清晰可辨（残影）"吻合，根因与表单管理页同类：页面传入的操作列宽度不足。制品 `screens/notify-template-before-fix-1440-preview-clipped.png` + 上述 DOM 实测值。

**修复**：`NotifyTemplateList.vue` 操作列 `width: 170 → 240`（与 FormDefList 修正同口径；组件 `ListActionsColumn` 本体再次确认无需改动）。Web 提交 `e86f6b8`。

**修复后验证（DOM 实际边界 + 可见性 + 交互）**：

| 视口 | DOM 边界实测 | 制品 |
| --- | --- | --- |
| 1440×900 | 单元格 1168–1408（宽 240）；Preview 1196–1243 / Edit 1259–1283 / Disable 1299–1343 / More 1347–1379，`allInside=true`、无内溢出 | `screens/notify-template-1440-actions-full.png` |
| 1366×768 | 单元格右缘 1334；四按钮全部在单元格内（Preview 1122–1169 … More 1273–1305），`allInside=true`、无内溢出 | `screens/notify-template-1366-actions-full.png` |

More 交互：More 点击展开含 Delete 菜单项（`screens/notify-template-1366-more-open.png`，同帧可见完整四直显 + 展开菜单）。三直显（Preview/Edit/Disable）+ 末位 More 全部完整可见、可操作、无裁字遮挡。

## G1b（原 G1）— 演示对象删除与同对象回读

全链路原始捕获（`api/notify-template-demo-object-lifecycle.json`，页面会话 XHR 捕获，非声明）：

| 步骤 | 原始结果 |
| --- | --- |
| 创建（建立替代对象） | `POST /api/notify/templates` → 200 `data:"2104030652024786945"` |
| by-ID 读取（绑定 ID↔code） | `GET /api/notify/templates/2104030652024786945` → 200，body 含 `id:"2104030652024786945"`、`templateCode:"V012_G1B_DEMO_01"`（Edit 对话框触发） |
| 删除（More→Delete→确认） | `DELETE /api/notify/templates/2104030652024786945` → 200 `{"code":0,"msg":"success"}` |
| 列表刷新（自动 loadList） | `GET /api/notify/templates?pageNum=1&pageSize=10` → `records:[] total:"0"`；DOM 行消失（rowGone=true） |
| 同 code 回读 | `GET /api/notify/templates?keyword=V012_G1B_DEMO_01` → 200 `records:[] total:"0"`，页面 Total 0 / No data |
| 旧 code 回读 | `GET /api/notify/templates?keyword=V012_G1_MORE_DEMO` → 200 `records:[] total:"0"` |
| 无关数据 | 会话开始前后列表均为 Total 0；创建→删除净零，未触碰其他数据 |

边界（如实说明）：删除后的**by-ID 直读无 UI 触发路径**（模板无详情页/编辑已删行入口），同对象不存在性由 同 code 服务端查询 + 全列表刷新 证明；ID↔code 同一性由删除前 by-ID 响应体内的 `id`+`templateCode` 绑定。证据层级=真实浏览器会话内真实请求（headed，headless=false），非组件单测。

## 受影响验证（适用工程门禁）

代码改动仅 `NotifyTemplateList.vue` 一处宽度属性；修正后前端四连全绿（原始日志 `logs/`）：typecheck exit 0；lint exit 0（0 error / 95 warnings）；vitest **141 files + 1 skipped / 1298 passed + 3 skipped**；build exit 0（`✓ built in 2.45s`）。

## 提交自检（按提示核对单）

两种视口完整可见 ✅｜More 交互有效（展开含正确收拢动作 Delete）✅｜删除/清理回读指向同对象（ID+code 双绑定）✅｜修复后证据与代码一致（e86f6b8，HMR 后采集）✅｜适用门禁通过（四连）✅｜剩余可执行项为零（G1a/G1b 外无待办，锁定项未重验）✅。计数均为工具输出；秘密零入证据。

## 偏差与边界

- 复现环境与补证 01 时点一致（同一本地 dev 后端、同一测试库）；未重验锁定项（表单管理、G2、G3），未触碰历史证据，未扩大后端范围，未改整体终态。
- lint warnings 95（复核 01 记录 102 为该时点值，本时点 95，均为既有 warning、0 error）。

## 自验结论

G1a（四动作完整显示与可达，双视口 DOM 边界+截图+交互）与 G1b（同对象删除响应+回读）均已按补充提示完成条件闭环，执行自验通过；**待规划复核**。BUG-015 整项与 014/016/018 Owner 验收口径不变，整体修复循环保持开放。

```
ENGINE_TERMINAL status=EXECUTION_SUBMITTED task=v0.1.2-bugfix level=L work_items=0 remaining_actionable_count=0 independent_work_exhausted=true next_action=等待规划对补充回执02（G1a/G1b）复核 next_action_type=WAIT_PLANNER_REVIEW progress_basis=files_changed+tool_results+browser_evidence progress_fingerprint=web:e86f6b8,evidence:batch-06-supplement-02 stop_reason=planner_evidence_review_pending tool_results=web_four_gates:typecheck0+lint0error+vitest1298+3+build0,xhr_captures:create+byId+delete+readbacks browser_status=formal_headed_headless=false_both_viewports browser_status_detail=evidence/batch-06-supplement-02/screens
```
