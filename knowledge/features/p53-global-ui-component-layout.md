# 功能追踪：P53 全局 UI 与组件布局优化

> 工作区统一知识库 — 正式业务功能登记（第 45 个正式功能，XL，P0）。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | P53（需求池编号；不对应 Mxx-Fyy-zz 既有明细，不改变 90 明细与 I 集合） |
| 功能名称 | 全局 UI 与组件布局优化 |
| 功能目标 | 以 Owner 导出的 `docs/ui/`（上游 Figma `mbEKPcZv9pcchmElQanR5E`、page `0:1`，32 节点清单见 `search_task/p53-figma-ui-current-seams.md`）为离线视觉权威，统一重构用户端、管理端、登录、数据页、表单/流程设计器、审批与会签、流程中心及个人菜单的设计令牌、全局壳、导航与组件布局；真实业务行为、接口、权限、租户、数据与流程语义仍以现有产品契约为准 |
| 创建日期 | 2026-08-30（Owner 补充需求定义）；2026-09-16 Figma 基线与插单；2026-09-21 功能级验收通过 |
| 当前状态 | **COMPLETED（规划已确认，2026-09-21）**（功能级验收 `PASSED（2026-09-21）`；P53 已核销（规划已确认）；规划最终复核 01 PASSED；P53/P61 已合入两仓 develop 并推送） |
| 等级 / 优先级 | XL / P0 |
| 涉及模块 | Web `src/styles/tokens.css`、`src/layouts/**`、`src/components/**`、`src/views/**`、`src/modules/**`、`src/assets/brand/**`、`e2e/visual/**`（视觉基线与正式浏览器证据）；Server 未因 P53 晋级任何基线 |

---

## 2. 方向与归档

| 项 | 路径 |
|---|---|
| 主方向（已归档） | `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md` |
| 阶段三终态同步方向（已归档 `passed/`） | `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md` |
| 功能级验收 | `product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-12-passed.md`（**PASSED**，2026-09-21） |
| 阶段三终态同步回执 | `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`，经规划最终复核 01 PASSED 确认） |
| 集成顺序记录 | `product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`（P61 独立提交 Server `742adb8` / Web `d110ed8`；已随 P53 于 2026-09-21 合入两仓 develop 并推送；locale 冲突按「P53 结构/新增键 + P61 八值 8/8」消解） |

---

## 3. 交付事实（2026-09-21 功能级验收后锁定）

| 维度 | 事实 |
|---|---|
| 设计对象 | 31 个适用设计节点均绑定正式生产组件树；节点06 按主方向 §2.3 接受「安全与真实能力优先」的记录性视觉偏差，不恢复未授权登录能力 |
| 视觉颜色 | 1096/1096 适用声明色完成映射，`unmapped=0`、`fail=0`，最大 RGB 通道差 3 |
| 桌面与响应式 | 1440/1920/1280 页面族完成设计核对；375 登录页及三个 H5 页面无碰撞、无横向滚动、主要操作可达 |
| 真实行为 | 可见 headed FORMAL_FLOW 使用真实后端、真实验证码/RSA 会话、真实 T0 身份与真实表单对象；20 条 `/api/*` 请求可回读；11 类路由与补充 01/03 锁定真实链完成绑定 |
| 能力边界 | 账号登录不出现未授权租户、记住登录或忘记密码能力；fixture 只承担 DESIGN_FIDELITY，不冒充正式业务证据 |
| 工程门禁 | typecheck、Vitest、build、lint 均 exit 0；Vitest 134 files passed + 1 skipped、1217 tests passed + 3 skipped；lint 0 error / 458 个既有 warning |
| 视觉回归 | Playwright 单 worker 视觉套件 **71 passed + 17 skipped、0 failed、exit 0**；34 个失败实例逐项分类收敛（G1—G12 账本），46 张快照清单前后一一对应（42 张精确更新、4 张不变） |
| 验证基线集合 | 只证明 P53：Web 四门 exit 0、Vitest 1217+3、视觉 71/0/17、可见 FORMAL_FLOW 5 制品与 20 条真实 `/api/*`；Server/Flyway 不为 P53 晋级（沿用 0.1.0 终值 1362/0/0/0、V93） |
| 边界 | 不改变业务逻辑、接口、权限、租户与数据语义；P61 机器错误语义与安全边界不得回退；不核销 P61、不改动 P60 发布身份与迁移终点 |

---

## 4. 状态与终态值

- 功能级验收：**PASSED（2026-09-21）**（审查 12；主方向 §9 十八项标准逐项通过）。
- 功能状态：**COMPLETED（规划已确认，2026-09-21）**；需求编号 **P53 已核销（规划已确认）**。
- 计数：正式业务功能数 **44→45**（P53 为第 45 个正式功能）；清单 **✅46 / 🟦22 / ⬜22**（90）、**ADV64** 与 M/I/P 其余状态零变化。
- 终态同步：回执 `receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）经规划最终复核 01 PASSED 确认；主方向与阶段三方向均已归档 `passed/`。
- 集成（2026-09-21，Owner 授权）：P53 与 P61 已按既定 P61→P53 顺序合入两仓 develop 并推送（Web 合并 `fc37608` = P61 `d110ed8` + P53 `29d90e8`；Server 合并 `fa96290` = P61 `742adb8` + P53 `42cbc86`/`6698b8c`）；受影响检查见 `receipts/p53-p61-integration-and-projection-01.md`。
- 下一动作：无待执行方向，等待 Owner/Planner 下发下一轮任务。

---
> 登记说明：本文件由执行角色在 P53 阶段三终态同步轮按唯一终态值清单登记；不含业务代码与迁移。

