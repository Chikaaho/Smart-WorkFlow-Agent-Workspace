# 0.1.1 全部推送准备盘点回执 01

> 功能：`v0.1.1-bugfix`（0.1.1 长周期缺陷修复与版本发布列车，XL）内的推送准备工作项
> 授权依据：`product/v0.1.1-bugfix/receipts/planning-owner-bugfix-stage-close-20260923.md`（Owner 确认修复阶段结束、收件关闭；当前下一动作＝整理全部待推送提交及文档，给出仓库/分支/HEAD/远端范围清单并补齐提交归档）
> 执行角色：Executor｜日期：2026-09-23｜测量方式：只读 `git rev-parse` / `git ls-remote` / `git rev-list` / `git status`，测量时点 **2026-09-23T23:05:05+0800**
> 本轮结论：**盘点与 18 提交归档已完成，自验通过，待 Planner 复核**。**本轮未执行任何 Git 写动作**（无 add/commit/push/fetch/pull/merge/tag），推送需 Owner 对具体远端、分支与范围的明确授权。

---

## 1. 概要

Owner 于 2026-09-23 确认 V011-BUG-021、V011-BUG-024 通过并宣布 bug 修复阶段结束（收件关闭，开放修复项 0），后续转为全部推送前的提交、文档与证据归档整理。本回执给出全部待推送范围的只读实测清单，并为 18 个未登记提交补齐归档与对应关系。

| Step | 目标 | 结果 |
|---|---|---|
| P1 | 只读实测三仓分支、HEAD、实际远端与领先/落后关系 | 完成（§2） |
| P2 | 18 提交归档与对应关系（分组、受影响文件、关联编号、证据适用性） | 完成（§3） |
| P3 | 根仓工作树待提交内容分类清点 | 完成（§4） |
| P4 | 范围外分支差异如实列出，交 Owner/Planner 裁决 | 完成（§5） |
| P5 | V95 静态风险与证据边界如实保留 | 完成（§6） |
| P6 | 推送授权边界声明 | 完成（§7） |
| P7 | 提交本回执 + 账本归档段 | 完成 |

---

## 2. 待推送范围清单（仓库 / 分支 / HEAD / 远端）

**判定口径**：以只读 `git ls-remote origin` 的实际远端值为基准，不用本地跟踪引用代替。

| # | 仓库 | 分支 | 本地 HEAD | 实际远端 | 待推送提交数 | 可 fast-forward | 结论 |
|---|---|---|---|---|---|---|---|
| 1 | Smart-WorkFlow-aPaaS-server | `0.1.1-bugfix` | `7ff4743b3aff714f9058ede783d0b1af8eb8fd9f` | `750ad391d6d2c9760f6c29aee0ea17bfbbabfe2e` | **2** | 是 | 待推送 |
| 2 | Smart-WorkFlow-aPaaS-Web | `0.1.1-bugfix` | `281892e43b67b466326b25fb83f2e471a5ca48fe` | `5eb6da1edcb6599f029b578fa4abe465f38ac951` | **16** | 是 | 待推送 |
| 3 | Smart-WorkFlow-Agent-Workspace（根） | `develop-sw` | `50a710f614a77d0938384f8f776c41e4be1a5ff3` | `50a710f614a77d0938384f8f776c41e4be1a5ff3` | **0** | — | 分支无未推送提交；**工作树有待提交内容（§4）** |

Server 待推送 2 条（`750ad39..7ff4743`，2026-09-23 19:40—20:44）：

| SHA | 时间 | 主题 |
|---|---|---|
| `690772a21cd3cb3bf3f929b7abc62bf1a7b0fba6` | 19:40:48 | feat(admin): 后台信息架构规整迁移 V95（更名/归位/路径规范化） |
| `7ff4743b3aff714f9058ede783d0b1af8eb8fd9f` | 20:44:57 | feat(admin): 表单设计改为设计器内部页签，侧栏不再单列入口 |

Web 待推送 16 条（`5eb6da1..281892e`，2026-09-23 12:58—21:37）：见 §3 归档表（按时间正序，与 `git log --reverse` 一致）。

---

## 3. 18 提交归档与对应关系

归档口径：**只作推送准备归档**——不为这些提交分配 `V011-BUG-NNN` 编号、不改变 25 项登记的标签与计数、不判定其属于或不属于本列车、不改变任何正式基线。逐条授权来源仍为**待补**（见 §3.3）。

### 3.1 按线索分组

| 线索 | 提交数 | SHA（按时间正序） | 说明 |
|---|---|---|---|
| A 后台信息架构规整 | 8 | `690772a` `7ff4743` `efd88e9` `f15ac23` `c9018dd` `f8e1f91` `61aa1c5` `aa912d8` | 目录更名/路径规范化/归位、侧栏按分区收敛、目录点击 404 修复、区域过滤修复及配套测试 |
| B 表单设计器能力扩展 | 5 | `0ad05ac` `05fc292` `fa31207` `0165478` `6ba5bbf` | 字段标题五种位置、新增文字组件与对齐、画布整块可放置与落点预览、hover 条调整 |
| C 表单列表分类树 | 2 | `783e51d` `7b771a3` | 分类树（分类→表单，formKey 反查）与并排布局修正 |
| D 前台流程 UX | 2 | `99a37a8` `281892e` | 发起后跳「我发起的」；「我发起的」筛选与列表随容器自适应 |
| E 流程设计器页签移除 | 1 | `5df1a5d` | 删除流程设计器「表单设计/流程设计」页签及其顶栏居中 CSS |
| **合计** | **18** | | 2 Server + 16 Web |

### 3.2 逐条归档（SHA / 主题 / 关联编号建议 / 既有证据适用性）

| # | SHA | 主题 | 关联 V011 编号（建议，待裁决） | 既有证据适用性 |
|---|---|---|---|---|
| S1 | `690772a` | V95 迁移：sys_menu 更名/路径规范化/归位 | 新需求（后台 IA） | 无任何证据；**迁移断言静态漂移风险见 §6** |
| S2 | `7ff4743` | V95 追加：隐藏表单设计侧栏入口 | S1 续 | 同上 |
| W1 | `5df1a5d` | 删除流程设计器页签及居中 CSS（0 新增） | 关联 BUG-012（删除其对象） | **BUG-012 §10 证据对象已被删除**，旧补证不能证明当前 HEAD |
| W2 | `0ad05ac` | 表单画布 hover 条去拖拽手柄，字段壳整体可拖 | 改变 BUG-007 已登记行为 | **BUG-007 证据（hover 条=手柄+删除）与 HEAD 不符** |
| W3 | `05fc292` | 字段标题五位置＋新增文字组件（22 文件） | 新需求 | 不适用（新增能力） |
| W4 | `fa31207` | 文字组件左中右对齐 | W3 续 | 不适用 |
| W5 | `0165478` | 同步按需组件声明（chore） | W3/W4 收尾 | 不适用 |
| W6 | `6ba5bbf` | 表单画布整块可放置＋落点实时预览 | 新交互能力 | 证据漂移风险（`DesignerCanvas.vue`、`FormDesigner.vue`） |
| W7 | `f15ac23` | 目录 redirect 相对→绝对（自述 404 根因）＋顶栏指向后台首叶 | **关联 BUG-021**（Owner 已确认通过） | 候选根因修复；**仍需行为验证**（未做 headed 证据） |
| W8 | `c9018dd` | 有按钮的页面不再被区域过滤丢弃 | 关联 BUG-021 同族 | 无 headed 证据 |
| W9 | `efd88e9` | 文案：低代码→表单管理、流程引擎→流程管理 | 新需求（与 S1 配套） | 不适用 |
| W10 | `f8e1f91` | 后台侧栏按顶部分区收敛并高亮所属项 | 新需求（后台 IA） | 不适用 |
| W11 | `783e51d` | 表单列表增加分类树（formKey 反查） | 新需求 | 不适用 |
| W12 | `61aa1c5` | 对齐侧栏分区收敛后的测试断言 | W10 收尾 | 不适用 |
| W13 | `aa912d8` | 二级路径页面锁定所属分区 | W10 收尾 | 不适用 |
| W14 | `7b771a3` | 分类树与列表并排，修复布局错位 | W11 收尾 | 不适用 |
| W15 | `99a37a8` | 前台发起后跳「我发起的」而非后台流程实例页 | 新需求/UX 修正 | 不适用 |
| W16 | `281892e` | 「我发起的」筛选与列表随容器自适应 | 符合 09-22 自适应基线 | 无 headed 证据 |

**与已登记候选的文件重叠（证据漂移面，冻结前需逐项确认）**：`src/locales/{en-US,zh-CN}.ts`、`DesignerCanvas.vue`、`FieldConfigPanel.vue`、`FormDefList.vue`、`FormDesigner.vue`、`ProcessDesigner.vue` 共 6 组文件同时被已登记候选与未登记提交改动，涉及 004/005/006/007/008/009/010/011/012/013/014/015/016/017/019/020/021/023/024/025。**未受影响**：BUG-023/024/025 的实现（`5eb6da1..HEAD` 对 `ProcessDesigner.vue` 的唯一改动是 `5df1a5d` 纯删除，未触及 `onWheel`、连线端点/waypoint、四向锚点）。

### 3.3 授权来源与边界

- 工作区内**未找到**这 18 个提交对应的 Owner 输入、方向文档或授权记录（`product/`、`knowledge/`、`memory/`、`todo/`、`search_task/`、`search_fallback/`、`tickets/`、`uploads/` 全文检索无对应登记；`uploads/` 为空；两仓无 stash/notes/额外分支）。逐条来源记为**待补**。
- 按阶段结束裁决：**来源待补不等于未获授权**，不凭提交主题作范围定性，不自动分离或回退提交；这些提交纳入本次推送准备盘点范围。
- 明细与逐条 diff 依据：`search_fallback/v011-unregistered-commits-reconciliation-20260923.md`（摘要）与 `…-detail.md`（明细）。

---

## 4. 根仓工作树待提交内容（`develop-sw`，分支本身无未推送提交）

| 类别 | 数量 | 内容 |
|---|---|---|
| 已修改跟踪文件 | **16** | `knowledge/current-status.md`、`knowledge/session-handoff.md`、`knowledge/features/v0.1.1-bugfix.md`、`memory/{README,state,handoff,features,issues}.md`、`product/v0.1.1-bugfix/ready/direction-v0.1.1-bugfix.md`、`product/v0.1.1-bugfix/receipts/{bug-ledger.md,V011-BUG-012.md,V011-BUG-021.md,V011-BUG-024.md,handoff-20260922-02.md,evidence/V011-BUG-024/evidence-index.json}`、`todo/requirement-pool.md` |
| 未跟踪文件（应纳入） | **56** | 3 份同步回执与 3 个证据目录、Planner 记录（规划记录/复核 01·02/最终复核 03 PASSED/补充提示 01/阶段结束裁决）、已归档同步方向 `passed/direction-current-state-sync-20260923.md`、探索通道 3 份（`search_task/` 1 + `search_fallback/` 2）、`product/oa-ui-experience-design/`（2）、`product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md`、`V011-BUG-012/` 证据 2 份与 `V011-BUG-024/network-index.json` |
| 未跟踪文件（建议排除） | **10** | `product/v0.1.0-oa-completion/receipts/evidence/i3-04·05·06/scripts/__pycache__/`（Python 字节码缓存，非交付内容） |
| 子模块指针 | 2 | `Smart-WorkFlow-aPaaS-server`（→ `7ff4743`）、`Smart-WorkFlow-aPaaS-Web`（→ `281892e`）；提交后需与 §2 的推送结果保持一致 |

> 提交信息与分组由执行推送时的会话按 Angular/Conventional Commits 规范拟定；本回执只做范围盘点，不预设提交粒度。

---

## 5. 范围外分支差异（如实列出，需 Owner/Planner 裁决）

以下差异在本次只读测量中被观察到，**不属于「0.1.1 全部推送」范围**，本轮未做任何处理：

| 仓库 | 分支 | 本地 | 实际远端 | 关系 | 说明 |
|---|---|---|---|---|---|
| 根 | `main` | `afe0bd77292bb66a09e4d5359fbc1452558cbc5f` | `653e42edb785f9feb6ba17bbbfbcf29902168a89` | 本地落后 9 | Engine 默认分支；本项目不从属、不回写 |
| Server | `develop` | `d18e9a39c552918615be8b158dfe0cc278cb309f` | `073cb39f4bf5d60f9a9f1547d906e9ced0608669` | 本地落后 1 | 0.1.0 发布身份；落后的是 P53 终态同步的功能清单提交 |
| Server | `main` | `20fffc1ddec13ea665fc388f4243c6e063974883` | `d18e9a39c552918615be8b158dfe0cc278cb309f` | 本地落后（0.0.2 时点） | 0.1.0 发布身份锁定，不得移动或重建 |
| Web | `main` | `4ed9fdbfaaaf4e7be469201e2d0297c319a37c35` | `039f987437ed6369c3c131631bd7622c6ae482e7` | 本地落后 | 同上 |
| Web | `develop` | `039f987437ed6369c3c131631bd7622c6ae482e7` | 同 | 一致 | 无待推送 |
| 根 | `backup-main-20260831`、`codex/p51-continuation-gates`、`codex/p51-continuation-gates-develop-sw` | — | 无同名远端分支 | 本地独有 | 历史/工作分支，未在远端 |
| Server | `backup-develop-20260831` | — | 无同名远端分支 | 本地独有 | 同上 |
| 两仓 | 远端 `feature/p61-user-facing-message-humanization`、Web `feature/p61-msg-scope-corrected` | — | 存在 | 已归档方向的远端分支 | 与 0.1.1 推送无直接关系 |

---

## 6. V95 静态风险与证据边界（如实保留）

- Server `690772a` 新增 `V95__admin_ia_normalization.sql`（H2/PostgreSQL 各 66 行），`7ff4743` 追加第 9 条（各 +4 行）；内容为纯 `sys_menu` UPDATE（title/path/parent_id/sort/hidden），每条带旧值守卫、幂等，不改 id/name/component/permission。
- 与既有基线关系：正式迁移终点仍为 **V93**；V94 由已登记候选 `750ad39` 引入并**同步更新**了 4 个测试文件的迁移计数与终点断言（94→95、`"93"`→`"94"`）；**V95 未同步任何断言**，而 HEAD 的迁移链测试仍以 V94 为链尾、测试 Flyway `locations` 含 V95 所在目录。
- 表述边界：以上为**静态文件核对发现的风险**，本轮**未运行任何测试或迁移**，**不得写成实测失败**，也**不得写成已验证**。断言行号见 `search_fallback/v011-unregistered-commits-reconciliation-20260923-detail.md` §3.4。
- 缺失项：V95 的迁移回归与断言同步；`version.json`/`CHANGELOG.md`/两仓 README 的迁移终点投影仍为 V93（本轮未改）；V95 对 `sys_menu` 的实际落库与前端菜单行为证据。

---

## 7. 推送授权边界

- 本轮**未执行任何 Git 写动作**：无 `add`/`commit`/`push`/`fetch`/`pull`/`merge`/`tag`/`rebase`；远端仅做只读 `ls-remote`。
- 推送前需 Owner 对**具体远端、分支、提交范围与顺序**作出明确授权（阶段结束记录亦明确「当前规划会话不执行 Git 推送；具体仓库、分支、提交范围在执行推送时列明」）。
- 未授权前不得：合并 `main`、创建 `0.1.1` tag/Release、部署任何环境、移动或重建 0.1.0 的 main/tag/Release。
- 主列车仍 `IN_PROGRESS`，正式版本与正式验证基线保持 0.1.0（Server 1423/0/0/0、Web 1217+3、Flyway V93）。

---

## 8. 自验结论

待推送范围已由只读实际远端查询确认：Server `0.1.1-bugfix` 2 条、Web `0.1.1-bugfix` 16 条、根 `develop-sw` 分支 0 条（工作树 16 个已修改跟踪文件 + 56 个应纳入的未跟踪文件 + 10 个建议排除的 `__pycache__`）；两条分支均可 fast-forward。18 个未登记提交已按 5 条线索补齐归档与对应关系，逐条给出主题、编号建议与证据适用性，并如实标注来源待补、BUG-012/007 证据受影响、023/024/025 未受影响、V95 为静态风险。范围外的分支差异已单列待裁决。计数（25 = 23 已提交候选 + 2 项 Owner确认通过，开放修复项 0）与全部正式基线零变化。

**结论：自验通过，待 Planner 复核。** 本回执只完成盘点与归档，不构成推送授权，不代表 0.1.1 列车完成。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.1-bugfix/receipts/push-inventory-20260923-01.md","evidence":["product/v0.1.1-bugfix/receipts/push-inventory-20260923-01.md (仓库/分支/HEAD/实际远端范围清单 + 18 提交归档)","product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/snapshots/ (8 份受修改文件全文快照)","product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/hashes.txt (仅快照条目、自引用 0)","product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/hash-verify.txt (逐项独立重算 8/8 PASS)","product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/consistency-assert.txt (阶段结束投影正反断言 + V95 语义边界判定)","product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/memory-size.txt (17598 B < 20480 B)","product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/secret-scan.txt (无命中)","product/v0.1.1-bugfix/receipts/bug-ledger.md §9 (推送准备归档段)"],"feature_status":"IN_PROGRESS","work_items":[{"id":"P1-只读实测待推送范围","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"只读 rev-parse/ls-remote/rev-list/status 实测 23:05:05：Server 0.1.1-bugfix 待推送 2 条、Web 16 条、根 develop-sw 分支 0 条，两分支均可 fast-forward"},{"id":"P2-18提交归档与对应关系","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"18 提交按 5 条线索分组归档，逐条给出主题/编号建议/证据适用性；来源待补如实标注"},{"id":"P3-根仓工作树清点","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"16 个已修改跟踪文件 + 56 个应纳入未跟踪文件 + 10 个建议排除的 __pycache__ 已分类清点"},{"id":"P4-范围外分支差异列出","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"root main 落后 9、Server develop 落后 1、Server/Web main 落后、本地独有分支已单列待裁决"},{"id":"P5-V95静态风险如实保留","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"V95 表述为静态文件核对风险，未运行测试，不写实测失败或已验证（逐行语义判定 5/5 均为否定式）"},{"id":"P6-推送授权边界声明","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"本轮零 Git 写动作；推送需 Owner 对具体远端/分支/范围的明确授权，未授权前不得合并 main、建 tag/Release 或部署"},{"id":"P7-knowledge与memory投影","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"两份 knowledge 与 5 份 memory 摘要已投影阶段结束与推送准备；反向断言 收件保持开放=0、021处理中=0、待复核补正回执=0"},{"id":"P8-账本归档段与证据","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"账本 §9 推送准备归档已补；8 份快照、无自引用哈希、逐项重算 8/8 PASS、一致性断言、体积与秘密扫描均已落盘"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"Planner 复核 product/v0.1.1-bugfix/receipts/push-inventory-20260923-01.md 的推送范围清单与 18 提交归档；复核通过后由 Owner 对具体远端、分支、提交范围与顺序作出明确授权，执行会话方可执行推送（未授权前不推送、不合并 main、不建 tag/Release、不部署）","next_action_type":"WAIT_PLANNER","progress_fingerprint":"v011-push-inventory-01:server-2-750ad39..7ff4743:web-16-5eb6da1..281892e:root-0-worktree-16m56u:ff-yes:18archived-5streams:stage-closed-open0:memory17598:ledger-sec9","progress_basis":{"files_changed":["knowledge/current-status.md","knowledge/session-handoff.md","memory/state.md","memory/handoff.md","memory/features.md","memory/issues.md","memory/README.md","product/v0.1.1-bugfix/receipts/bug-ledger.md","product/v0.1.1-bugfix/receipts/push-inventory-20260923-01.md"],"tool_actions":["只读 git rev-parse / ls-remote origin / rev-list / status 实测三仓分支、HEAD、实际远端与领先落后关系","python3 定点替换（每处断言 count==1）投影阶段结束与推送准备到两份 knowledge 与 5 份 memory","cp 生成 8 份全文快照；shasum -a 256 生成 hashes.txt 并逐项独立重算；diff -q 校验快照与实际文件一致","grep/python 生成阶段结束正反断言、V95 逐行语义边界判定、锁定值核对与秘密扫描；wc -c 统计体积","追加 bug-ledger.md §9 推送准备归档段（18 提交分组归档 + 待推送范围表）"],"new_evidence":["product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/snapshots/ (8 份)","product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/hashes.txt","product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/hash-verify.txt","product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/consistency-assert.txt","product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/memory-size.txt","product/v0.1.1-bugfix/receipts/evidence/push-inventory-20260923-01/secret-scan.txt"],"closed_work_items":["P1-只读实测待推送范围","P2-18提交归档与对应关系","P3-根仓工作树清点","P4-范围外分支差异列出","P5-V95静态风险如实保留","P6-推送授权边界声明","P7-knowledge与memory投影","P8-账本归档段与证据"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"Bash(git ls-remote 实际远端只读查询)","outcome":"SUCCEEDED","detail":"23:05:05 实测：server 0.1.1-bugfix=750ad39、web=5eb6da1、root develop-sw=50a710f；Server/Web 分别领先 2/16 且均可 fast-forward"},{"tool":"Bash(git status / ls-files 工作树清点)","outcome":"SUCCEEDED","detail":"根仓 16 个已修改跟踪文件、56 个应纳入未跟踪文件、10 个 __pycache__ 建议排除、2 个子模块指针"},{"tool":"Bash(python3 定点替换 count==1)","outcome":"SUCCEEDED","detail":"current-status 7 处、session-handoff 4 处、memory 5 份共 5 处更正全部唯一命中并写入"},{"tool":"Bash(cp/shasum/diff 快照与哈希)","outcome":"SUCCEEDED","detail":"8 份快照；hashes.txt 无自引用；逐项独立重算 recorded=live=snapshot 8/8 PASS"},{"tool":"Bash(grep/python 一致性断言)","outcome":"SUCCEEDED","detail":"收件关闭与开放修复项 0 在各入口在位；反向：收件保持开放=0、021 处理中=0、待复核补正回执=0；V95 提及实测失败/已验证的 5 行均为否定式；锁定值零变化"},{"tool":"Bash(wc -c 与秘密扫描)","outcome":"SUCCEEDED","detail":"memory 合计 17598 B（门禁 20480，余量 2882）；最大 4950 B（门禁 5120）；快照无凭据命中"},{"tool":"Bash(Git 写动作 / 工程测试 / 构建 / 迁移 / 浏览器)","outcome":"SUCCEEDED","detail":"本轮均未执行：零 Git 写动作、未运行测试/构建/迁移、未使用浏览器；browser_status=NOT_APPLICABLE"}],"browser_status":"NOT_APPLICABLE"}
