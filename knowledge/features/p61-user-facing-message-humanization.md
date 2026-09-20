# 功能追踪：P61 全系统用户可见错误码与提示语人性化治理

> 工作区统一知识库 — 跨系统质量同步追踪（非业务功能明细，不映射 90 明细、不增加业务功能数）。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | P61（需求池编号；不对应 Mxx-Fyy-zz 明细） |
| 功能名称 | 全系统用户可见错误码与提示语人性化治理 |
| 功能目标 | 对用户可见的错误码描述、接口提示、页面提示与恢复指引做系统性语言治理：消除内部实现术语、自造概念与无恢复动作提示，同时保持机器码、HTTP 契约与安全披露边界 |
| 创建日期 | 2026-09-14（Owner 补充需求定义）；2026-09-20 Owner 恢复并与 P53 并行 |
| 当前状态 | **COMPLETED（规划已确认，2026-09-20）**（功能级验收 PASSED，2026-09-20；正式核销；阶段三终态同步回执经最终复核 01 PASSED 确认） |
| 等级 / 优先级 | L / P1 |
| 涉及模块 | Server `sw-common`（i18n 目录、错误码枚举兜底文案）、`sw-biz-form` / `sw-bpm`（业务枚举兜底）、`sw-bootstrap`（契约与运行测试）；Web `src/locales` 兜底文案、`src/foundation/request` 映射与断言 |

---

## 2. 方向与归档

| 项 | 路径 |
|---|---|
| 主方向（已归档） | `product/p61-user-facing-message-humanization/passed/direction-p61-user-facing-message-humanization.md` |
| 2026-09-20 范围纠偏方向（已归档） | `product/p61-user-facing-message-humanization/passed/direction-p61-user-facing-message-humanization-scope-correction-20260920.md` |
| 阶段三终态同步方向（已归档） | `product/p61-user-facing-message-humanization/passed/direction-p61-user-facing-message-humanization-terminal-sync.md` |
| 阶段三最终复核 | `product/p61-user-facing-message-humanization/receipts/planning-final-review-terminal-sync-p61-user-facing-message-humanization-01-passed.md`（**PASSED**，`COMPLETED（规划已确认，2026-09-20）`） |
| 集成顺序记录 | `product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`（P61 独立提交 Server `742adb8` / Web `d110ed8` 先保留；P53 结束后统一合并；locale 冲突须同时保留 P53 结构/新增键与 P61 八值 8/8） |
| 功能级验收 | `product/p61-user-facing-message-humanization/receipts/planning-review-p61-scope-corrected-completion-03-passed.md`（**PASSED**，2026-09-20） |
| 阶段三回执 | `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`） |

---

## 3. 交付事实（2026-09-20 范围纠偏后锁定）

| 维度 | 事实 |
|---|---|
| 服务端目录 | 中文目录 **154 键**，本轮修订 **22 键**（工具 `p61-generate-catalog-inventory.mjs` 重新生成并回读，与 `^error.` 前缀键计数独立复算一致） |
| Web 兜底 | 4 个兜底键（`errDynamicTableExists` / `errFieldTypeUnknown` / `errOperatorTypeMismatch` / `errOperatorUnsupported`）中英文与服务端修订值对齐 |
| 集成核对 | 在 P53 最新可合并结果上完成两个 locale 文件值级整合；工具比对 4 键 × 2 语言 **8/8 match=true**、`missingCount=0`、`duplicateCount=0`、`allMatch=true`、exit 0 |
| 代表行为 | 真实 HTTP 22/22；契约/运行测试 9/9、8/8、8/8；高风险诊断零外露、机器码/errorKey 兼容、认证防枚举成立 |
| 验证基线集合 | Server **1423 tests / 0 failures / 0 errors / 0 skipped**（BUILD SUCCESS、exit 0）；Web typecheck/lint/test/build 四门 exit 0（**1217 passed + 3 skipped**）。该集合只证明 P61，不构成 P53 视觉或功能通过结论 |
| 边界 | P53 的颜色、布局、响应式与视觉结果不属于 P61；P61 不增加业务功能数、不映射 90 明细、不改动数据模型与机器码契约 |

---

## 4. 状态与终态值

- 功能级验收：**PASSED**（2026-09-20，范围纠偏后六项标准全部通过）。
- 功能状态：**COMPLETED（规划已确认，2026-09-20）**（已核销）。
- 需求编号：**P61 已核销**；P2/P4/P31/P34/P35/P37/P38/P39/P47 及其他开放编号状态不变。
- 计数：业务功能数 **44**（P61 不增加）、清单 **✅46 / 🟦22 / ⬜22**（90）、**ADV64**，均零变化；I 集合 54 条不增删。
- 终态同步：回执 `receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`）已经最终复核 01 PASSED 确认；三份方向均归档 `passed/`。
- 集成顺序：P61 独立提交（Server `742adb8`、Web `d110ed8`）先保留、暂不合并；P53 结束后统一合并，locale 冲突按「P53 结构与新增键全部保留 + P61 八值 8/8 保留」处理。

---
> 登记说明：本文件由执行角色在 P61 阶段三终态同步轮按唯一终态值清单登记；不含业务代码与迁移。

