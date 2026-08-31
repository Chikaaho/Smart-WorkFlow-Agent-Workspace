# 管理员回执：Agent Coding Engine 治理入口通用化

> 执行角色：管理员（Admin）
> 依据方向：`product/p51-agent-coding-engine-decoupling/ready/direction-admin-engine-governance-generalization.md`
> 日期：2026-08-31
> 关联功能：P51 Agent Coding Engine 解耦
> 终态：EXECUTION_SUBMITTED（治理落地提交，未越权声明业务功能完成）

## 一、实际修改文件

严格限定于方向文档「二、允许修改范围」，全部 4 文件：

| 文件 | 改动摘要 |
|------|----------|
| `system.md` | 标题与定位改为 Agent Coding Engine；移除 `/usr/local/projects/Smart-WorkFlow` 绝对路径、`Smart-WorkFlow-Server/`/`Smart-WorkFlow-Web/` 固定仓名、Java/Spring/Vue/TypeScript 技术栈、端口/数据库/架构图（§11.3/§11.4/§11.5 原 OA 内容）、OA 关键工程约束（Token/superAdmin/租户/动态宽表等，§11.7）、OA 配置速查（§14）、OA 开发哲学（§15）；引入「项目说明（project.md）」驱动 coding 仓库映射；编译工具栈改由项目说明/仓库工程宪法声明（§0.3/§0.8/§9-executor/§11/§14/§15）；§11 章节重排修补编号断层 |
| `roles/planner.md` | `Smart-WorkFlow-Server/`/`Smart-WorkFlow-Web/` 固定仓名→「项目说明声明的任一 coding 仓库」；`mvn`/`pnpm` 状态变更命令列举→「编译、测试、构建、迁移、部署等」通用表述；「后端基线、前端基线」→「各 coding 仓库测试基线」 |
| `roles/executor.md` | 两端代码→coding 仓库代码；跨项目/跨前后端→跨 coding 仓库；前后端职责分离→跨 coding 仓库职责分离；§9 常用命令整节由 OA 固定 mvn/pnpm 命令→通用指引（只保留编译内存上限 2G 与跨仓库编译互斥两条硬约束）；§10 知识索引固定仓名行→项目说明声明；Flyway 脚本→数据库迁移脚本 |
| `roles/admin.md` | 三仓/两端仓库→工作区及 coding 仓库；固定仓名路径→项目说明声明；mvn/pnpm 等命令列举→编译/测试/构建/迁移/部署通用表述；治理文件清单「两端工程配置」→「coding 仓库工程配置」 |

未修改 `.codex/governance/`、`.claude/`、业务代码、`product/` 既有文件、Git 分支与远端。

## 二、通用项目说明如何驱动单仓/多仓映射

- 工作区根目录同时是规划层与统一执行入口，本身不是 coding 仓库（system.md §0.3）。
- coding 仓库的名称、数量、目录、职责与工程规则由**项目说明**（`project.md`，约定文件）声明，模板见 `project.example.md`（§2 仓储关系：单仓/多仓、代码仓列表、职责、开发入口；§3 工程规则：编译内存上限、启动方式、验证入口）。
- 单仓项目：项目说明填写单个代码仓 → 该仓即唯一 coding 仓库，局部执行入口 = 该仓。
- 多仓项目：项目说明逐行列出各仓（如后端/前端/其他）→ 各仓为独立 coding 仓库，各自 `docs/governance/engineering-constitution.md` 为工程宪法，各自受跨仓库编译互斥约束。
- 角色文件全程使用「工作区根」「coding 仓库」「项目说明」等通用概念，不按项目改写；不同实例复用同一份 `system.md` + `roles/` 即可。

## 三、验收标准逐项结果

| # | 验收标准 | 结果 | 依据 |
|---|----------|------|------|
| 1 | system.md 与 roles/ 不含 Smart-WorkFlow 产品定位、固定仓名、固定路径、OA 工程事实 | ✅ 通过 | 全文 grep 无 `Smart-WorkFlow`、`/usr/local/projects`、`Smart-WorkFlow-Server`/`-Web` 残留；§11.3/11.4/11.5 OA 架构、§14 OA 配置、§15 OA 哲学、§11.7 OA 关键约束全部移除 |
| 2 | 三角色门禁、允许/禁止读取范围、探索通道、回执验收、阶段三和终态约束仍完整且无权限扩大 | ✅ 通过 | §0.1/§0.2/§0.3/§0.4/§0.4.1/§3 均保留；Planner 不读 coding 仓库与 knowledge 的硬约束仍在（system.md §0.2/§0.4/§0.4.1，planner.md §3）；Executor 不规划裁决约束仍在（executor.md §3/§4）；Admin 不读业务实现/不裁决业务状态约束仍在（admin.md §3/§6）；终态契约引用未动 |
| 3 | 单仓和多仓项目均可通过项目说明映射为 coding 仓库，角色文件无需按项目改写 | ✅ 通过 | 见本回执「二」；system.md §0.3/§0.8/§11.2 与 roles 均以「项目说明 + coding 仓库」表达 |
| 4 | Planner 仍不能读 coding 仓库与 knowledge；Executor 仍不能作规划裁决；Admin 仍不能读业务实现或裁决业务状态 | ✅ 通过 | 三份角色文件禁止性条款逐一核验（grep 证据见回执附录 B），权限语义与改动前一致 |
| 5 | 所有内部章节、文件路径和工程规则引用可解析，无指向已移除固定仓名的死引用 | ✅ 通过 | system.md 内部 § 引用逐一核对；§11 章节编号断层已重排（11.4→11.5→11.6 连续）；roles 保留的历史映射表（§13/§12/§16）仅追溯拆分前旧章节，非死引用 |
| 6 | 全文检查仅保留通用 Engine 概念，无本地绝对路径和 OA 业务事实 | ✅ 通过 | 三类关键词全文 0 命中：绝对路径、OA 业务事实（低代码/办公/租户/审批等）、固定技术命令（mvn/pnpm/Xmx2g/spring-boot/vite 等） |
| 7 | `git diff --check` 通过，实际修改严格限定为允许范围和一份新回执 | ✅ 通过 | `git diff --check` 无输出（无空白错误）；`git diff --stat` 仅 4 文件（system.md 143 行改动、executor.md 76 行、admin.md 22 行、planner.md 15 行）；新增回执 1 份 |

## 四、专属仓名、本地绝对路径和 OA 业务事实全文检查

`grep -rn` 在 `system.md` + `roles/` 范围内三组模式均 **0 命中**：

1. 专属仓名 / 绝对路径：`Smart-WorkFlow`、`Smart-WorkFlow-Server`、`Smart-WorkFlow-Web`、`/usr/local/projects`、`/Users/.*/Smart`
2. OA 业务事实：低代码、办公、OA平台、工作流引擎、审批、租户、多租户、`sw-framework`、`sw-basic`、`sw-biz`、`sw-bootstrap`
3. 固定技术命令 / 栈：`mvn `、`pnpm `、`npm `、`gradle`、`Xmx2g`、`max-old-space`、`spring-boot`、`vite`、`eslint`

保留项说明：
- `MAVEN_OPTS`/`NODE_OPTIONS`/`GOFLAGS`（executor.md §9）作为**通用编译工具限内存形式示例**保留，非 OA 强制固定。
- `knowledge/shared-constraints.md`（executor.md §3/§9、system.md §11.6）是标准知识库结构路径引用，非 OA 事实。
- 治理决策号（D41/D74/D85）、日期、Mimo/Muse 能力适配机制、P 编号/里程碑/功能状态机，均为通用治理机制，不属于 OA 业务事实，保留。

## 五、权限语义未扩大、终态契约未改变的差异核对

- **权限语义**：全部改动均为「固定仓名/绝对路径/技术栈」替换为「工作区根/coding 仓库/项目说明」的**表述层通用化**；三角色允许清单、禁止清单、写入范围、读取范围的结构与语义逐一核对未扩大。代表性对比：
  - Planner 原「不读 `knowledge/` 与两端代码」→ 现「不读 `knowledge/` 与 coding 仓库代码」：语义等价。
  - Admin 原「不可读 Smart-WorkFlow-Server/Web 业务源码」→ 现「不可读项目说明声明的任一 coding 仓库业务源码」：语义等价且覆盖面等价。
  - Executor 原「前后端编译互斥」→ 现「跨 coding 仓库编译互斥」：语义从双仓推广到通用多仓，约束强度与原规则一致（每种工具 2G、先检测后编译）。
- **终态契约**：`.codex/governance/terminal-contract.json`、公共 Validator（.sh/.ps1）、Hook 阻断语义、`SWF_TERMINAL` marker 均未触碰（git diff 确认 0 改动），合法终态集合与字段 schema 未变。
- **三阶段协议与状态机**：§3/§5 原文保留，`PASSED`/`COMPLETED` 裁决归属、阶段三终态同步协议、`ready/passed` 流转规则未变。

## 六、范围声明

- 未修改任何业务代码、业务测试、数据库迁移、项目状态值或功能验收结论。
- 未执行提交、推送、强制推送或任何 Git 写操作。
- 未运行 `mvn`/`pnpm`/`java`/`node` 或任何编译、测试、构建、部署命令。
- 未修改 `.codex/governance/`（终态契约/公共 Validator）、`.claude/`（Hook）、两端仓库 `AGENTS.md`/工程宪法（不在本任务允许范围）。
- `product/` 目录下的方向文档与规划审查记录为既有内容，未改动。
- 本回执为本次管理员任务的新增文件。

## 附录 A：实际修改的 command/输出证据

- `git diff --check` → 无输出（通过）
- `git diff --stat` → 4 files changed, 91 insertions(+), 165 deletions(-)
- 全文 grep 检查 → 三组模式均 0 命中（见第四节）

## 附录 B：权限语义核验 grep 证据

- Planner 不读 coding 仓库/knowledge：system.md:53、system.md:100、planner.md:61
- Executor 不规划裁决：executor.md:13、executor.md:129、executor.md:149
- Admin 不读业务实现/不裁决业务状态：admin.md:21、admin.md:48、admin.md:65、admin.md:92