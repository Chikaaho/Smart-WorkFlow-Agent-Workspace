# 完成回执：P5 / M07-F01 大模型管理前端闭环

> **功能名称**：大模型管理前端闭环（agent-model-management-frontend）
> **方向**：D105（2026-08-19），`product/agent-model-management-frontend/ready/direction-agent-model-management-frontend.md`
> **执行角色**：执行层（工作区根进入），自主拆分 Step 与派发 subagent
> **日期**：2026-08-19

---

## 1. 功能名称与自拆 Step 概要

| Step | 名称 | 执行方式 | 产出 | 判定 |
|------|------|---------|------|------|
| S1 | 后端菜单可达性审计 + V33 权限 seed + 后端全量验证 | subagent（后端） | V33 h2/pg 双方言迁移、FlywayFullChainH2Test 更新、584/0/0、PG 临时 schema 验证 | ✅ |
| S2 | 前端契约/API/Mock 层 | subagent（前端地基） | contracts/agent.ts、api/index.ts、mock seeds/handlers、agent-models.spec.ts | ✅ |
| S3 | 前端页面层（ModelList + ModelFormDialog + 路由） | subagent（前端页面） | ModelList.vue、ModelFormDialog.vue、两个 spec | ✅ |
| S4 | 前端四连收口（typecheck/lint/test/build） | subagent（前端测试） | 69f/628t 全绿、6 处修复 | ✅ |
| S5 | 知识库全量同步 + 回执 | subagent（知识同步）+ 执行层 | 8 改 1 新建、P5 核销、I45 部分关闭、I52 登记 | ✅ |

Step 拆分原则：前后端互斥铁律（1.6G 物理内存，mvn 与 pnpm 严格串行）下，S1（mvn）与 S2/S3（纯写代码不跑命令）并行，S4（pnpm）在 S1 完成后串行执行，S5 收口。

## 2. 实际读取的文件

**方案与规划依据**：`direction-agent-model-management-frontend.md`、`memory/handoff.md`、`memory/state.md`、`product/agent-model-orchestration/passed/step-1-backend-model-management.md`、`step-5-multikey-quota.md`（后端契约基准）、`AGENTS.md`、`system.md` §7 回执规范。

**后端**：`AgentModelConfigDTO.java` / `AgentModelSaveReqDTO.java` / `AgentModelTestConnectionRespDTO.java`（契约逐字段核实）、`db/migration/postgresql/V26__agent_graph_menu_seed.sql`（菜单 seed 先例）、V29/V31/V32（按钮 seed 先例与最大版本号确认）、`FlywayFullChainH2Test`、`application-local.yml`（PG 连接）。

**前端**：`src/contracts/agent.ts`、`src/modules/agent/api/index.ts`、`src/foundation/mock/{handlers,seeds,index}.ts`、`src/modules/agent/views/GraphDefList.vue`（页型 B 先例）、`GraphDefList.spec.ts`（测试先例）、`src/modules/system/views/DictDataList.vue`（弹窗表单先例）、`src/router/index.ts`、`src/foundation/permission/index.ts`、`src/foundation/menu/index.ts`（component 白名单解析机制）、`package.json`（脚本与基线）、`eslint.config.js`。

**知识层**：`功能清单.md`、`knowledge/current-status.md`、`known-issues.md`、`session-handoff.md`、`features/` 先例、`todo/requirement-pool.md`、memory 四件。

## 3. 实际修改的文件（前后端+规划层）

### 后端（Smart-WorkFlow 仓库，3 提交）

| 文件 | 类型 | 说明 |
|------|:---:|------|
| `sw-bootstrap/src/main/resources/db/migration/h2/V33__agent_model_menu_seed.sql` | 新建 | H2 菜单/按钮权限 seed |
| `sw-bootstrap/src/main/resources/db/migration/postgresql/V33__agent_model_menu_seed.sql` | 新建 | PG 同名 seed（双方言逐字节一致） |
| `FlywayFullChainH2Test`（路径以实际为准） | 修改 | 全链断言 32→33、新增 V32→V33 升级链测试 |
| `功能清单.md` | 修改 | M07-F01-01～05 五行 🟦→✅（+5/-5，零触碰其他行） |
| `application-local.yml` | 未提交改动 | 会话前既有本地改动（PG 连接配置），非本轮产物，未纳入提交 |

### 前端（Smart-WorkFlow-Web 仓库，1 提交 e26e5f0，10 文件 +2316/-2）

| 文件 | 类型 | 说明 |
|------|:---:|------|
| `src/contracts/agent.ts` | 修改 | +AgentModelConfig / AgentModelSaveReq / AgentModelTestConnectionResp（与后端 DTO 逐字段对齐）；AgentModelConfigOption 保留 |
| `src/modules/agent/api/index.ts` | 修改 | +pageModels / getModel / createModel / updateModel / deleteModel / testModelConnection |
| `src/foundation/mock/seeds.ts` | 修改 | +MOCK_AGENT_MODELS（6 条覆盖多 Key/锁定/脱敏）；MOCK_MENU_TREE 智能体矫正为目录+大模型管理二级；permissions +3 权限码 |
| `src/foundation/mock/handlers.ts` | 修改 | +6 个 /agent/models handler（分页/详情/创建/更新空 Key 保留/删除/连通性测试） |
| `src/foundation/mock/agent-models.spec.ts` | 新建 | 9 用例（mock 一致性/密钥安全断言） |
| `src/modules/agent/views/ModelList.vue` | 新建 | 383 行列表页 |
| `src/modules/agent/views/ModelList.spec.ts` | 新建 | 10 用例 |
| `src/modules/agent/views/ModelFormDialog.vue` | 新建 | 490 行新增/编辑弹窗 |
| `src/modules/agent/views/ModelFormDialog.spec.ts` | 新建 | 7 用例 |
| `eslint.config.js` | 修改 | +globalThis 声明（配合 URL no-undef 修复） |

### 规划层（工作区根，1 提交 b501652，9 文件 +174/-79）

`knowledge/current-status.md`、`knowledge/known-issues.md`、`knowledge/session-handoff.md`、`knowledge/features/agent-model-management-frontend.md`（新建）、`todo/requirement-pool.md`、`memory/state.md`、`memory/handoff.md`、`memory/features.md`、`memory/decisions.md`（未新增条目，见 §4）。

## 4. 每个文件的修改摘要

**V33（h2/pg 双方言，逐字节一致）**：
- 菜单 id=209「大模型管理」（parent=7 智能体目录，permission=`agent:model:view`，component=`agent/views/ModelList`，path=`model`，icon=`Cpu`，sort=20 在图定义 15 之后）
- 按钮 id=210 `agent:model:manage`（新建/编辑/删除）、id=211 `agent:model:test`（连通性测试），menu_type=2，仿 V31 按钮行形态 + `WHERE NOT EXISTS` 幂等
- 不 seed `sys_role_menu`（沿用 V6/V26 超管旁路决策），不自动授予普通角色

**前端各文件**：见 §3 表，核心语义——契约逐字段对齐后端 DTO；API 复用 `request`/`adaptPage` 模式；mock 只存脱敏值（`maskApiKey` 前2+`****`+后2），更新空 Key 保留旧脱敏值，创建空 Key→null，lockedUntil 不可写；页面无明文 Key 渲染、`apiKeyCipher` 字样在全部新增文件中零命中；编辑时 apiKey 输入框恒空（只显示脱敏提示），提交成功后 finally 清空输入；lockedUntil 只读展示（冷却 warning 信息条）。

**知识层**：清单 5 行 🟦→✅（M07-F01-02 描述列追加动态装载语义注记）；I45 部分关闭（M07-F01-01～05 已闭环，其余 10 条仍待排期）；I52 新登记（PG V13 2BP01）；P5 核销；features 新建追踪文件；memory 最少摘要同步。`memory/decisions.md` 未新增条目——V33 的 id 分配（209-211 空闲最小）、幂等写法、不 seed role_menu 均严格沿用既有先例（V31 按钮行、V6/V26 决策、D105 方向授权），非新决策。

## 5. 实际执行的命令

**后端**（subagent 执行，MAVEN_OPTS="-Xmx2g"，严格串行）：
- 互斥检查：`pgrep -fl "pnpm|vite|vitest"`（无命中记录）
- `mvn test`（全量，项目级）
- FlywayFullChainH2Test 专项 + V32→V33 升级链
- PG 真实库验证：一次性临时 JUnit 连 `jdbc:postgresql://127.0.0.1:5432/smart_workflow`（独立临时 schema，验证后 DROP SCHEMA 清理，public 零改动）

**前端**（subagent 执行，NODE_OPTIONS="--max-old-space-size=2048"，严格串行，每次命令前 pgrep 确认无 java/mvn 进程）：
- `pnpm typecheck` → 0（首跑 2，修复后 0）
- `pnpm lint` → 0（首跑 1，修复后 0）
- `pnpm test` → 0（69 passed / 628 passed，首跑 2 failed 修复后全绿）
- `pnpm build` → 0
- `npx prettier --check`（本次 10 文件）→ 0

**规划层**：git 提交三笔（后端 d4d7dc3 + deed31a、前端 e26e5f0、工作区 b501652）。

## 6. 命令输出摘要

- 后端 mvn 全量：**584 tests / 0 failures / 0 errors**（≥ 582 基线达标），29 模块全 SUCCESS
- H2 全链：迁移计数 30→33（V33 双方言各 1），`validate()` 通过；升级链先 V32（32 条）再仅执行 V33（1 条）成功
- PG 临时 schema：V33 目标执行成功、二次 migrate 0 条（幂等）、209/210/211 产物断言全过、V26 既有行原样保留、DROP SCHEMA 清理
- 前端：69 spec files / 628 tests / 0 failures；typecheck/lint/test/build 四连退出码 0；prettier 全过
- 详见测试回执 `agent-model-management-frontend-test.md`。

## 7. 与原方案的偏差

| 方向约定 | 实际 | 说明 |
|---------|------|------|
| 「若确认无需后端变更，回执须给出生产可达性证据」 | 需补 seed | 审计确认生产菜单缺「大模型管理」入口与 manage/test 按钮 seed，按方向 §3 非目标允许的最小 seed 补齐（V33） |
| 迁移版本号 | V33 | 现场确认最大版本号 V32（V33 空闲），H2/PG 双方言 |
| 后端测试基线 | 582 | 584（+2：FlywayFullChainH2Test 升级链断言新增，零业务测试改动） |
| 前端测试基线 | 66f/602t | 69f/628t（+3 spec files / +26 tests） |
| 「不允许修改任何 Flyway」 | 未违反 | 只新增 V33，V19-V32 零触碰（git diff 证实） |
| eslint.config.js | 有 1 处最小修改 | +globalThis 声明（配合 ModelFormDialog `new URL` no-undef 修复；曾尝试全局 URL 声明引发 StorageList 存量 no-redeclare 已回退，见测试回执 §7） |

## 8. 遇到的问题

1. **commitlint body-max-line-length 100**：首次前端提交被拦截，body 行超长；重写为折行中文提交通过。
2. **ModelFormDialog TS2322**：`remark: form.remark.trim() || null` → `|| undefined`（契约 `AgentModelSaveReq.remark?: string` 不含 null；groupKey 本就带 null，未动）。
3. **ModelFormDialog `new URL` lint no-undef**：文件头加 `/* global URL */` 内联注释（对齐 StorageList.vue:2 存量惯例）。
4. **agent-models.spec.ts 断言与实现不符**：脱敏正则 `/^..\*{4}..$/`（后 2 位）→ `/^..\*{4}..{2,}$/`（后 2+ 位），对齐 `maskApiKey` 与种子形态 `sk****abcd`。
5. **ModelFormDialog.spec.ts 测试自身缺陷**：编辑路径 `updateModel(modelId, req)` 请求体是第二参数，原取 `mock.calls[0][0]` 得到 modelId，改为 `[0][1]` 并补强断言（实现无缺陷）。
6. **mock PUT 更新下标错位**：原按 `MOCK_AGENT_MODELS[id-1]` 下标写，删除 spliced 后错位，改为 `findIndex`（地基 subagent 已修）。

## 9. 未完成内容

- 无。方向 §6 11 项验收标准全部满足（逐条对照见测试回执）。
- 方向 §7 待确认问题：无，执行层按现场代码裁定并已披露（见本回执 §7/§10）。

## 10. 风险和注意事项

1. **PG V13 既有缺陷（新登记 I52）**：`postgresql/V13:58` 对 inline UNIQUE 隐式索引 `DROP INDEX` 在 PG 报 2BP01（2BP01 = dependent objects still exist），导致 **PG 侧全链 V1→V33 无法在真实库直跑**（H2 全链不受影响）。非本轮引入（V19-V32 不可改），本轮通过独立临时 schema 验证了 V33 自身可执行与幂等。**建议规划层决策是否排期 V34 修复迁移**。
2. **PG 真实库勘察**：`127.0.0.1:5432/smart_workflow` 从未初始化 Flyway 历史（V33 验证在独立临时 schema 进行，public 零改动）；application-local.yml 的本地 PG 连接信息为会话前既有内容。
3. **密钥安全边界**：全链路（契约/API/Mock/页面/spec）零明文 Key、零 `apiKeyCipher`（grep 实证）；明文仅存在于当次提交输入，编辑留空保持旧密钥，lockedUntil 只读。
4. **连通性语义**：前端直接展示后端 message 与耗时，不自行改判 4xx 语义；disabled 模型以 success=false 表达（mock 层），与后端「服务可达含 4xx」语义一致。
5. **权限闭环**：菜单 permission=`agent:model:view`、按钮 manage/test 三码与后端 `@PreAuthorize` 一一闭合；mock session permissions 与真实 V33 seed 一致；未默认扩权（不 seed role_menu）。

## 11. Git diff 摘要

| 仓库 | 提交 | 文件数 | 变更 |
|------|------|:---:|------|
| Smart-WorkFlow | d4d7dc3 | 5（2 迁移新建 + 测试 + 回执） | V33 seed 双方言 + 全链测试更新 |
| Smart-WorkFlow | deed31a | 1 | 功能清单 5 行 +5/-5 |
| Smart-WorkFlow-Web | e26e5f0 | 10 | +2316 / -2 |
| 工作区根 | b501652 | 9 | +174 / -79 |

**关键变更点**：V33 菜单+按钮三码 seed（幂等、双方言、不 seed role_menu）；前端契约与后端 DTO 逐字段对齐；mock 与真实契约一致且密钥安全；ModelList/ModelFormDialog 全功能闭环；知识库全量同步（§3.3 第10项）。

## 12. 建议重点验证的测试场景

- 编辑表单空 Key 提交 → 请求体不含 apiKey 字段（保持旧密钥）
- 连通性测试成功/失败两种结果展示（不改判语义）
- 无 manage 权限 → 新建/删除按钮隐藏；无 test 权限 → 测试按钮隐藏（hasPerm）
- mock handler 响应不含 `apiKeyCipher` / 明文
- 多 Key 分组与锁定状态（lockedUntil 未来时间 warning 展示）
- 既有 GraphDesigner 模型下拉（listModelOptions 契约未变）回归

---

**知识库触碰文件清单**（§3.3 第10项）：`Smart-WorkFlow/功能清单.md`、`knowledge/current-status.md`、`knowledge/known-issues.md`、`knowledge/session-handoff.md`、`knowledge/features/agent-model-management-frontend.md`（新建）、`todo/requirement-pool.md`、`memory/state.md`、`memory/handoff.md`、`memory/features.md`。
**清单变更明细**：M07-F01-01～05 五行 🟦→✅（✅16/🟦33/⬜41 → ✅21/🟦28/⬜41，共 90 行），M07-F02/F03/F04 及其他所有行零漂移。
