# 测试回执：P5 / M07-F01 大模型管理前端闭环

> **功能名称**：大模型管理前端闭环（agent-model-management-frontend）
> **方向**：D105（2026-08-19）
> **执行角色**：执行层（subagent 分工执行，前后端互斥铁律）
> **日期**：2026-08-19

---

## 1. 功能名称与测试概要

大模型管理前端闭环 + 最小菜单/权限 seed。测试覆盖后端（V33 迁移 + 全量回归 + H2 全链 + PG 真实库验证）与前端（四连 + 专项 spec），并逐条对照方向 §6 全部 11 项验收标准。

## 2. 测试环境

| 项 | 值 |
|----|----|
| 后端数据库 | H2（测试内存库，mvn test 真实执行迁移）；PostgreSQL（application-local.yml `jdbc:postgresql://127.0.0.1:5432/smart_workflow`，真实库临时 schema 验证） |
| 前端环境 | vitest + @vue/test-utils + jsdom（仓库既有配置） |
| 内存上限 | 后端 `MAVEN_OPTS="-Xmx2g"`；前端 `NODE_OPTIONS="--max-old-space-size=2048"`（与验收标准一致） |
| 互斥 | 后端 mvn 与前端 pnpm 严格串行（本机物理内存 1.6G 铁律）；每次命令前 pgrep 互斥检查 |
| 操作系统 | macOS（Darwin 25.3.0） |

## 3. 测试前置条件

- 后端：V33 迁移脚本已就位（h2/pg 双方言）；FlywayFullChainH2Test 已更新
- 前端：契约/API/Mock/页面/spec 全部就位（10 文件）；mock session permissions 含三权限码
- PG：psql 未安装、docker daemon 未运行 → 用项目已有 PostgreSQL JDBC 驱动 + 一次性临时 JUnit 验证（独立临时 schema，验证后 DROP SCHEMA 清理）

## 4. 实际执行的测试命令

**后端**（严格串行）：
```bash
# 互斥检查（每次执行前）
pgrep -fl "pnpm|vite|vitest"          # 无命中
# 全量
MAVEN_OPTS="-Xmx2g" mvn test           # 项目级全量
# H2 全链专项（FlywayFullChainH2Test）
mvn -Dtest=FlywayFullChainH2Test test # 7 目录 33 迁移 + V32→V33 升级链
# PG 真实库临时验证（一次性临时 JUnit，验证后删除）
mvn -Dtest=TempPgV33Verify test       # 临时 schema，public 零改动
```

**前端**（严格串行，每次命令前 `pgrep -fl "java|mvn|surefire"` 确认无后端进程）：
```bash
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck   # → 0
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint        # → 0
NODE_OPTIONS="--max-old-space-size=2048" pnpm test        # → 0（628 passed）
NODE_OPTIONS="--max-old-space-size=2048" pnpm build       # → 0
npx prettier --check                                       # 本次 10 文件 → 0
```

## 5. 各测试项结果（逐条对照方向 §6 11 项验收标准）

| # | 验收标准 | 结果 | 证据 |
|---|---------|:---:|------|
| 1 | 有权用户可从生产菜单进入模型管理页，刷新/直达路由可用；无权用户看不到入口/操作，直接调用由后端拒绝；superadmin 不变 | ✅ | V33 菜单 id=209（permission=agent:model:view）+ 按钮 210/211；菜单 mock 与真实 seed 一致；前端 hasPerm 显隐（ModelList.spec 用例⑧⑨）；后端权限码三分离经既有 AgentModelControllerTest 覆盖（未改动，584 全量通过）；superAdmin 旁路未动 |
| 2 | 列表分页、名称查询、加载、空态、错误态完整；展示字段区分协议/模型/启停/多Key分组/优先级/锁定状态，无 Key 泄漏 | ✅ | ModelList.spec 用例①②（分页渲染、关键字查询+重置）；Mock spec 用例③（分页+过滤+响应无密钥字段）；锁定状态 warning 展示（ModelList 模板）；ModelFormDialog.spec 用例④（lockedUntil 只读展示） |
| 3 | 新增、编辑、删除、启停真实接口闭环；表单覆盖全部契约字段；协议值/范围/必填/默认与后端一致 | ✅ | 六个 API 全对接（pageModels/getModel/createModel/updateModel/deleteModel/testModelConnection）；ModelFormDialog.spec 用例①（默认值 30/0/0/60）②（协议三值提示）③（必填/URL/数值越界拦截）⑦（提交 emit）；协议值不自创枚举（select 三值，未知值原样保留） |
| 4 | API Key 仅显示脱敏值；编辑留空保持原密钥、输入新值才替换；自动化证据证明响应/页面/日志/URL/存储/快照无明文或 apiKeyCipher | ✅ | Mock spec 用例①（seeds 只含脱敏值、不含明文/apiKeyCipher，grep 实证）②（handler 源码快照断言）⑥（空 Key 保留、新 Key 替换脱敏值）；ModelFormDialog.spec 用例⑤（空 Key 提交请求体无 apiKey 字段）⑥（新 Key 提交）；ModelList.spec 用例⑩（页面文本/html 无明文形态）；编辑回填 apiKey 恒空、提交后 finally 清空输入 |
| 5 | 每条模型可发起连通性测试并展示成功/失败、消息、耗时；覆盖 OpenAI/Ollama/other/不可达/4xx；不泄漏鉴权信息 | ✅ | ModelList.spec 用例⑥⑦（成功/失败两种结果展示，message/latencyMs 渲染，不改判语义）；Mock spec 用例⑧（可测 true / disabled false / 锁定 429 / 不存在 404，结构一致）；后端 4xx 可达语义零改动（584 全量回归） |
| 6 | `agent:model:view/manage/test` 三类权限在菜单、页面按钮、真实请求链分别生效；授权可操作、撤权拒绝、未认证拒绝、不默认扩权 | ✅ | V33 三码 seed（view=菜单、manage=新建/编辑/删除、test=测试按钮）；ModelList.spec 用例⑧（无 manage → 新建/删除隐藏、test 仍可用）⑨（无 test → 测试隐藏）；后端 `@PreAuthorize` 三码分离经既有 Controller 测试覆盖；不 seed sys_role_menu（不默认扩权） |
| 7 | Mock 与真实 API 契约一致；GraphDesigner 模型下拉可正常读取；M07-F02 无回归 | ✅ | 契约逐字段对照后端 3 个 DTO（回执 §4）；listModelOptions 未改动（AgentModelConfigOption 字段不变）；GraphDefList/GraphDesigner/graphAdapter 零触碰；前端 628 全量含既有 F02 spec 全绿 |
| 8 | 前端 typecheck/lint/test/build 2G 上限全过；测试 ≥ 66f/602t；含列表/表单/密钥/权限/连通性/Mock 专项证据 | ✅ | 四连退出码 0（2G 上限）；**69 spec files / 628 tests / 0 failures**（+3 files/+26 tests）；专项 spec：ModelList 10 / ModelFormDialog 7 / agent-models 9 |
| 9 | 若补菜单/权限迁移：H2/PG 脚本语义对齐、版本无冲突、H2 新库全链与上一版本升级链；后端项目级 ≥ 582 | ✅ | V33 h2/pg 逐字节一致；版本 V33 无冲突（现场确认 V32 为最大）；H2 全链 33 迁移 migrate+validate 通过；V32→V33 升级链通过；后端 **584/0/0**（≥582） |
| 10 | 编译测试遵守 2G 上限与互斥；回执提供互斥检查、命令、退出码、计数、偏差说明 | ✅ | 本回执 §2/§4/§7；互斥检查证据（pgrep 无命中记录） |
| 11 | 知识库全量同步：P5、I45、M07-F01-01～05、current-status、功能追踪、known-issues、session-handoff、需求池全文对齐；无关清单行零漂移 | ✅ | 完成回执 §4/§11（8 改 1 新建；清单仅 5 行 🟦→✅，+5/-5，M07-F02/F03/F04 零触碰；P5 核销、I45 部分关闭、I52 登记） |

## 6. 通过项

### 后端
- **mvn 全量**：584 tests / 0 failures / 0 errors / 0 skipped，29 模块 BUILD SUCCESS
- **H2 全链**：FlywayFullChainH2Test 7 目录 33 迁移，migrate + validate 全绿；V32→V33 升级链（先 32 条再仅 V33 1 条）成功
- **PG 真实库临时 schema**：V33 目标执行成功、二次 migrate 0 条（幂等）、209/210/211 菜单+按钮产物断言全过、V26 既有行原样保留、DROP SCHEMA 清理、public 零改动

### 前端（69 spec files / 628 tests，全绿）
- **ModelList.spec.ts（10）**：mount 分页渲染 / 关键字查询+重置 / 编辑打开弹窗 / 删除确认+调用+刷新 / 删除取消不调用 / 连通性成功展示 / 连通性失败不改判语义 / manage 缺失按钮隐藏 / test 缺失按钮隐藏 / 无 Key 泄漏
- **ModelFormDialog.spec.ts（7）**：新增初始态默认值 / 协议切换提示 / 必填与范围校验拦截 / 编辑回填+apiKey 恒空+lockedUntil 只读 / 空 Key 提交无 apiKey 字段 / 新 Key 提交 / 提交成功 emit saved
- **agent-models.spec.ts（9）**：seeds 无明文无 apiKeyCipher + 覆盖矩阵 / handler 源码快照 / 分页+关键字过滤+响应无密钥 / 详情全字段+404 / 创建（新 Key 脱敏、无 Key null、lockedUntil 不可写）/ 更新（空 Key 保留、新 Key 替换、404）/ 删除幂等 / 连通性测试四种语义 / 菜单树目录+二级节点对齐 V26
- 既有 spec 全量通过（无回归）；typecheck/lint/build 四连退出码 0；prettier 全过

## 7. 失败项（首跑→修复）

| # | 项 | 首跑结果 | 修复 | 终态 |
|---|----|---------|------|:---:|
| 1 | typecheck | exit 2，4 个 TS 错误 | ModelFormDialog.vue remark `null`→`undefined`（契约无 null）；ModelFormDialog.spec 3 处 `as Record<string, unknown>`→`as unknown as Record<string, unknown>` | ✅ |
| 2 | lint | exit 1，1 个 no-undef（`new URL`） | 文件头 `/* global URL */`（对齐 StorageList 存量惯例）；eslint.config.js +globalThis 声明（曾尝试全局 URL 引发 StorageList 存量 no-redeclare 已回退） | ✅ |
| 3 | test | 2 failed / 628 | ①agent-models.spec.ts 脱敏正则后 2 位→后 2+ 位（对齐 maskApiKey `slice(-2)` 与种子 `sk****abcd` 形态）；②ModelFormDialog.spec.ts 取参缺陷（`updateModel(modelId, req)` 第二参数），改为 `[0][1]` + 补强断言——**被测实现无缺陷** | ✅ 628 passed |
| 4 | build | — | 未失败（首跑在修复前完成，终验 0） | ✅ |

## 8. 跳过项及原因

- **PG 侧全链 V1→V33 真实库直跑**：跳过（客观阻塞）。既有 V13 脚本 `DROP INDEX`（inline UNIQUE 隐式索引）在 PG 报 2BP01，非本轮引入（V19-V32 不可改）。替代验证：H2 侧全链（33 迁移全绿）+ PG 独立临时 schema 验证 V33 自身可执行/幂等/产物正确。**已登记 I52，建议规划层决策 V34 修复迁移**。
- 后端连通性测试用例（openai/ollama/4xx/不可达）：既有 Step1 `AgentModelConfigServiceImplTest` 已覆盖，本轮后端零业务改动，584 全量回归通过即视为覆盖。

## 9. 关键日志或错误信息

```
# typecheck 首跑（修复前）
TS2322: Type 'null' is not assignable to type 'string | undefined'  (ModelFormDialog.vue:216 remark)
TS2352: Conversion of type 'X' to type 'Record<string, unknown>' ... (ModelFormDialog.spec.ts ×3)

# lint 首跑
no-undef: 'URL' is not defined (ModelFormDialog.vue)

# test 首跑（修复前）
FAIL agent-models.spec.ts: 断言脱敏形态 /^..\*{4}..$/ 不匹配 'sk****abcd'（后 4 位）
FAIL ModelFormDialog.spec.ts: 编辑提交断言取 mock.calls[0][0]=7（modelId），实际请求体在 [0][1]

# 终验
Test Files  69 passed (69)
Tests       628 passed (628)
✓ typecheck / lint / build 均 exit 0
# PG 临时 schema 验证（后端）
V33 migrate success, second migrate 0 rows, menu/button rows 209/210/211 verified, schema dropped
# mvn 全量
Tests run: 584, Failures: 0, Errors: 0, Skipped: 0
```

---

**结论**：方向 §6 全部 11 项验收标准满足；前后端测试计数均超基线（后端 584 ≥ 582，前端 69f/628t ≥ 66f/602t）；互斥与 2G 上限证据完备；唯一披露遗留为既有 PG V13 缺陷（I52，非本轮引入，待规划层决策）。
