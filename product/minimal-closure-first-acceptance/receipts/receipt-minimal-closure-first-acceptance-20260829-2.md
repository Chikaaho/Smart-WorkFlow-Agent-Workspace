# 补证回执 · 最小闭环第一轮验收（第 2 次）

> 会话角色：执行（Executor，工作区根入口）
> 性质：针对规划审查 `planning-review-20260829.md` 的补证与回执修正；不修改业务代码，不改变任何正式状态/计数/基线
> 权威输入：最新审查记录 `planning-review-20260829.md` + 原方向 `../ready/direction-minimal-closure-first-acceptance.md`
> 日期：2026-08-29

---

## 一、缺口承接矩阵

| 缺口 | 失败事实（审查记录原文口径） | 本次动作 | 完成状态 |
|------|------------------------------|----------|----------|
| A-01 角色授权不一致 | 已授权"低代码"节点未进业务用户真实菜单 | 采纳规划复核：角色管理判定由 PASSED 改为 **FAILED**；补真实登录后菜单截图与后端菜单树原始输出（证据 07、11-§4） | 已承接 |
| A-02 流程管理页面缺失 | `/workflow` 白屏、`/workflow/defs` 404 | 保留原行为证据并补新鲜截图+DOM 存档（证据 08、09） | 已承接 |
| A-03 简单流转未建立 | 提交后流程定义/实例/待办均为 0 | 补双账号 HTTP 原始输出存档（证据 11-§1） | 已承接 |
| A-04 页面伪装成功 | 无实例仍提示"流程已发起" | 该事实由原回执 §3.6 与 `FormRender.vue:291-309` 定位支撑，本轮未改代码，维持原证据（证据 11-§1 佐证状态不实） | 已承接（仅补证，未修复——审查未授权修复） |
| A-05 页面证据包不完整 | 已报通过项缺少截图/DOM 附件 | 为用户管理、组织管理、表单管理、数据展示逐项补截图 PNG + DOM 快照 TXT，路径见 §三证据索引 | 已承接 |

回执格式缺口（审查 §四.3/§四.4）：记忆草稿冲突已修正（见 §五）；本回执末行附唯一合法 `SWF_TERMINAL` 行并通过公共 Validator。

## 二、逐项判定（与规划复核对齐，不自行改判）

| 验收项 | 本回执判定 | 说明 |
|---|---|---|
| 用户管理 | VERIFYING→待规划锁定（证据 01/02） | 补齐页面证据，行为事实与原回执一致 |
| 组织管理 | VERIFYING→待规划锁定（证据 03） | 同上 |
| 角色管理 | **FAILED**（A-01，采纳规划复核） | 原回执自验 PASSED 不再主张；D-01 即为该失败事实 |
| 表单管理 | VERIFYING→待规划锁定（证据 04/11-§2） | 同上；D-03（业务用户定义列表 0 条）的权限口径留规划裁决 |
| 数据展示 | VERIFYING→待规划锁定（证据 05/06） | 记录 952bbde4-1256-4731-bbf7-fa991f446e3c 列表+详情+刷新回显 |
| 流程管理 | **FAILED**（A-02） | 证据 08/09 |
| 简单流程流转 | **FAILED**（A-03/A-04） | 证据 11-§1 |
| 页面质量 | **FAILED** | 受流程白屏/404/伪装成功阻断项影响 |

总体结论维持 **FAILED**：项目未达到第一轮最小闭环验收标准。

## 三、证据索引（本次新增，全部为本轮真实采集）

目录：`product/minimal-closure-first-acceptance/receipts/evidence/`

| 文件 | 内容 | 对应项 |
|------|------|--------|
| `01-user-list-admin.png` / `.dom.txt` | `/user` 列表（admin，共 3 条，含 accuser01/验收用户一） | 用户管理 |
| `02-user-edit-dialog-refreshed.png` / `.dom.txt` | `reload()` 后重开 accuser01 编辑对话框：所属部门=`验收一部门`、`验收业务角色` 勾选态保持 | 用户管理 |
| `03-dept-tree.png` / `.dom.txt` | `/dept` 树：根部门(root) → 验收一部门(acc-dept-01) | 组织管理 |
| `04-form-def-list-published.png` / `.dom.txt` | `/form/form-def-list`：验收申请表 · 已发布 | 表单管理 |
| `05-form-data-list.png` / `.dom.txt` | `/form/form-data/验收申请表`：记录 `验收流转测试数据-20260829-01`（共 1 条） | 数据展示 |
| `06-form-data-view.png` / `.dom.txt` | 只读详情回显同字段值（recordId=952bbde4…） | 数据展示 |
| `07-accuser01-menu-no-lowcode.png` / `.dom.txt` | accuser01 真实登录后侧边栏仅 `流程引擎`（A-01） | 角色管理 FAILED |
| `08-workflow-blank.png` / `.dom.txt` | `/workflow` main 区空白，停留 3.5s 不变（A-02） | 流程管理 FAILED |
| `09-workflow-defs-404.png` / `.dom.txt` | `/workflow/defs` → `/404`（A-02） | 流程管理 FAILED |
| `10-workflow-todo-404.png` / `.dom.txt` | `/workflow/todo` → `/404`（A-03） | 简单流转 FAILED |
| `11-http-raw-outputs.txt` | 双账号 instances/todo/defs 全 0、form/def 持久化、403/200 越权对照、accuser01 菜单树原始输出（A-01/A-03/A-04） | 多项 |

采集环境：后端 8080（H2 dev，本轮验收数据仍存续）、前端 5173 真实模式、IAB 桌面视口 1440×900；单标签顺序会话（规避原回执 D-06 记录的多标签串扰干扰）。

## 四、偏差与未完成内容

1. 审查未授权修复：A-01~A-04 产品缺陷本身**未修复**，本轮仅补证；修复需规划另行下发唯一修复方向。
2. 审查已裁定的范围外项（D-04 字典展示、D-06 多标签串扰）按审查口径从本轮缺口剔除，不再主张。
3. 除新增证据采集外，无其他方案偏差；未触碰 `ready/`、`passed/`、`memory/`、功能清单与任何基线。

## 五、记忆更新草稿（修正版，仅供规划角色核对后落盘，不构成最终判定）

- state.md 新增行：最小闭环第一轮验收 | 真实链路审计 FAILED：角色授权菜单不一致（A-01）+ 流程页面链路缺失（A-02~A-04）；用户/组织/表单/展示补证后待规划锁定 | 回执 `receipts/receipt-minimal-closure-first-acceptance-20260829-2.md` | 判定占位 FAILED（待规划编号）
- decisions.md：无新增
- issues.md：无新增（是否将 A-01~A-04 登记 known-issues 由规划裁决）
- features.md：无变化

---

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/minimal-closure-first-acceptance/receipts/receipt-minimal-closure-first-acceptance-20260829-2.md","evidence":["evidence/02-user-edit-dialog-refreshed.png+dom.txt：reload 后部门/角色勾选回查","evidence/07-accuser01-menu-no-lowcode.png+dom.txt 与 11-http-raw-outputs.txt §4：A-01 授权菜单不一致","evidence/08-workflow-blank.png、09-workflow-defs-404.png、10-workflow-todo-404.png：A-02/A-03 页面链路缺失","evidence/11-http-raw-outputs.txt §1/§3：双账号实例与待办均 0、403/200 越权对照"],"feature_status":"VERIFYING"}
