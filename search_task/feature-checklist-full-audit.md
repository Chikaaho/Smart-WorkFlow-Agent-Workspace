# 探索任务：功能清单（PRD）全量对照审计

**当前模型**：anthropic/claude-sonnet-5，可承担角色：规划模型（仅规划，不探索代码）

**任务目标**：`Smart-WorkFlow/功能清单.md`（权威 PRD/需求清单，10 模块 54 功能 89 明细）上次同步是 2026-07-24（`feature-checklist-sync` 功能完成时）。此后 M07-F01/F02（Step1-12，D53-D71）全部完结，`kb-verification`/`storage-multi-provider`/`job-scheduler`/`auth-seam-completion`/`process-monitoring`/`bpmn-adapter`/`vue-flow-adapter` 等功能也均已完成（见 `memory/features.md`）。清单当前对 M07 全部 14 条明细仍标记 `⬜ 待开发`，与 `memory/state.md` 记录的实际完成度明显不一致，怀疑清单整体存在过期条目，不止 M07 一处。

规划层需要一份**当前代码真实状态 vs 清单标记状态**的逐条差异清单，用于后续更新 `Smart-WorkFlow/功能清单.md` 的状态列，以及判断 `todo/README.md`（暂不修复清单）/`knowledge/known-issues.md` 是否需要补充新发现的缺口。

---

**需要回答的问题**：

### 问题 1：逐模块状态核实（M01-M10，89 条明细全量过一遍）

对 `Smart-WorkFlow/功能清单.md` 中每一条明细（ID 格式 `Mxx-Fyy-zz`），核实当前代码（`Smart-WorkFlow/` 后端 + `Smart-WorkFlow-Web/` 前端）的真实实现状态，与清单当前标记（✅/🟦/⬜）比对，输出差异表（只列出**不一致**的条目，一致的不必列出）：

| ID | 清单当前标记 | 代码真实状态 | 证据（文件路径/端点/组件名） |
|----|---|---|---|

判断标准：
- 后端有对应 Controller/Service/Mapper + 至少覆盖该功能的单测 → 视为该项后端已实现
- 前端有对应组件/页面 + 路由可达（非仅代码存在但菜单不可达的占位页） → 视为该项前端已实现
- 只要后端或前端任一端明确未实现，即不能标 ✅（部分实现按 🟦 处理，并在证据栏注明"仅后端"/"仅前端"）
- M07 部分请重点核实：`memory/features.md` 记录 Step1-12 已完成大模型管理（M07-F01 全 5 条）+ 图设计器（M07-F02 全 4 条，含调试运行 M07-F02-04——注意 Step12 只做了后端执行历史持久化查询端点，前端是否有"运行日志查看"页面需要现场确认，"单步调试"明确未做，据 `memory/handoff.md` 待办池）；M07-F03（智能助手）/M07-F04（对话交互）是否有任何代码落地（`sw-basic-agent` 是否有助手配置/知识库/对话窗口相关 Controller，之前记录为"骨架"，需确认当前是否仍为骨架或已有实质代码）

### 问题 2：`todo/README.md` 与 `knowledge/known-issues.md` 覆盖度检查

- 问题 1 发现的差异中，如果某条属于"已知但决定暂不修复"性质（例如某功能明确延后、非当前阶段目标），检查 `knowledge/known-issues.md` 是否已有对应条目记录、`todo/README.md` 是否已有索引。
- 列出问题 1 差异中**完全没有被 known-issues.md 提及**的条目（即全新发现的缺口，此前规划层未记录过）。

### 问题 3：清单本身格式/口径问题

- 确认清单文件当前是否有版本号/最后更新日期字段；若有，贴出当前值。
- 确认 `功能清单.xlsx`（清单原始来源）是否存在于仓库中，若存在，其修改时间是否比 `功能清单.md` 更新（判断谁是当前权威源）。

---

**搜索范围**：
- `Smart-WorkFlow/功能清单.md`（全文，含每条明细的当前标记）
- `Smart-WorkFlow/sw-basic/sw-basic-agent/`、`sw-basic/sw-basic-notify/`、`sw-basic/sw-basic-iot/`（若存在）、`sw-biz/sw-biz-openapi/`（若存在）、`sw-biz/sw-biz-system/`、`sw-biz/sw-biz-form/`、`sw-bpm/`（各模块 Controller/Service 清单，用于逐条核实）
- `Smart-WorkFlow-Web/src/modules/`（各业务模块前端路由/页面清单）
- `knowledge/known-issues.md`、`knowledge/current-status.md`、`knowledge/features/`（全部功能追踪文件，用于交叉核实哪些功能已完成、哪些明确延后）
- `todo/README.md`
- `find Smart-WorkFlow/ -iname "*清单*"`（确认 xlsx 是否存在及其修改时间）

**禁止范围**：
- 不得修改任何文件（本任务只产出核实结论，不产出方案）
- 不得运行 `mvn compile`/`mvn test`/`npm run build` 等触发编译的命令
- 不得对"如何补齐某条缺失功能"给设计建议——只汇报"清单标记 vs 代码真实状态"的差异事实，规划方向由规划层做
- 89 条明细如工作量过大，允许按模块拆分为多个 Sub Agent 并行核实，但最终汇总到同一份回执

**预期证据**：
- 问题 1：差异表每一行必须有具体文件路径或组件名/端点路径作为证据，不得凭清单描述文字或训练记忆猜测
- 问题 2：明确列出"已被 known-issues.md 覆盖"和"全新缺口"两类，各自给出条目清单
- 问题 3：文件真实内容摘录

**完成标准**：89 条明细全部过一遍（可只列差异行，但需在回执开头声明"已核对 89/89 条"），问题 2/3 有明确结论。

**执行模型**：`deepseek/deepseek-v4-pro`（89 条明细逐条比对代码真实状态属于大范围、需要跨多个模块目录交叉核实的语义判断任务，且需要保证不遗漏，用 pro 保证覆盖完整性和判断准确性；若单次上下文过大，允许 pro 自行拆分为多个 flash/pro 并行 Sub Agent 按模块核实后再汇总）

**失败处理**：若某模块代码目录完全不存在（如 `sw-basic-iot`/`sw-biz-openapi` 确认仍为空骨架），直接标注"该模块无代码，清单标记应为全 ⬜"，不算探索失败。若清单条目描述过于模糊无法与具体代码对应，如实标注"无法判定，需规划层进一步澄清该条含义"。

**回执位置**：`search_fallback/feature-checklist-full-audit.md`
