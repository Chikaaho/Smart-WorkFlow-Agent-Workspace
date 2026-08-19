# 后端执行回执：菜单可达性审计 + V33 最小权限 seed + 后端全量验证

> P5 / M07-F01「大模型管理前端闭环」· 后端 subagent 执行回执（Step 后端部分）
> 日期：2026-08-19 · 仓库：`/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow`（分支 develop）

---

## 1. 菜单可达性审计结论（现场证据，非训练记忆）

**结论：生产菜单缺失「大模型管理」入口与 `agent:model:manage` / `agent:model:test` 按钮权限，需补最小 seed。**

| 审计项 | 现场证据 | 结论 |
|---|---|---|
| 「智能体」目录(id=7)下子菜单 | `V26__agent_graph_menu_seed.sql` 仅 INSERT id=15「图定义管理」(parent_id=7, permission=`agent:model:view`)；V6/V10/V15/V26/V29/V31 全量 grep，id=7 下无其他子菜单 | 无「大模型管理」菜单 |
| `agent:model:view/manage/test` 权限 seed | 全迁移目录 grep `agent:model` 仅命中 V26 两处**注释**（提及 view/manage）与 id=15 的 permission 列；无任何 `menu_type=2` 的按钮行 | 仅 view 有菜单级 seed，manage/test 无任何 seed |
| 后端权限契约对齐 | `AgentModelController.java` 现场：列表/详情 `@ss.hasPermi('agent:model:view')`、新建/编辑/删除 `'agent:model:manage'`、连通性测试 `'agent:model:test'` | 三类权限码与 seed 一一闭合 |
| 既有先例 | V31（`admin_role_governance.sql`）以 `menu_type=2` + `path/component=''` 形态为 job/storage 补 9 枚按钮（id=200-208）；V26 注释口径「按钮级操作复用前端 hasPerm 控制显隐」；V6/V26 决策「不 seed sys_role_menu（超管旁路）沿用」 | 按钮级先例为 V31 形态 |

---

## 2. V33 脚本与设计说明

新增文件（双方言逐字节一致，diff exit=0）：
- `sw-bootstrap/src/main/resources/db/migration/h2/V33__agent_model_menu_seed.sql`
- `sw-bootstrap/src/main/resources/db/migration/postgresql/V33__agent_model_menu_seed.sql`

**id 分配（现场核实）**：1-14 被 V6/V10/V15 占用；15 图定义管理（V26）；16-19 job/storage（V29）；200-208 按钮（V31）；V2 旧行 10-16/100-112 已在 V6 被 DELETE 清理。**209-211 为空闲最小值**。

| id | parent_id | menu_type | permission | 说明 |
|---|---|---|---|---|
| 209 | 7（智能体） | 1（菜单） | `agent:model:view` | 「大模型管理」，path=`model`、component=`agent/views/ModelList`、icon=`Cpu`、sort=20（图定义管理 sort=10 之后） |
| 210 | 209 | 2（按钮） | `agent:model:manage` | 新建/编辑/删除，path/component 空串（仿 V31） |
| 211 | 209 | 2（按钮） | `agent:model:test` | 连通性测试，path/component 空串 |

设计要点：
- 字段清单与列顺序完全对齐 V31 按钮行先例（`id, create_time, update_time, deleted, version, parent_id, name, title, menu_type, path, component, permission, icon, sort, hidden`）；菜单行对齐 V26 id=15 写法（hidden 在中位、15 列）。
- 按钮行用 `INSERT ... SELECT ... WHERE NOT EXISTS`（V31 幂等防重先例），重复执行不重复插入。
- **不 seed sys_role_menu**：V6/V26 决策沿用，普通 admin 是否授按钮权限由菜单管理页面配置；菜单/按钮对 superadmin 旁路可见可用。
- 未修改任何 Java 业务代码；未修改 V19-V32 任何既有迁移脚本。

---

## 3. 后端全量验证（mvn）

**命令**：`MAVEN_OPTS="-Xmx2g" mvn test`（严格串行，最终复验一次）

- **项目级：584 tests / 0 failures / 0 errors**（验收下限 ≥582 达标；FlywayFullChainH2Test 由 11 → 12 tests）
- 全部 29 个模块 BUILD SUCCESS
- 内存：全程 2G 上限，无内存异常

## 4. H2 全链与升级链（FlywayFullChainH2Test，12 tests 全绿）

- **新库全链**：目录扫描自动纳入 V33 → **迁移计数 32 → 33**（`migrationsExecuted=33`、`info().applied()=33`、`validate()` 通过）；已更新测试断言 32→33
- **V32→V33 升级链**（新增永久测试 `upgradeChain_V32_to_V33_shouldPass`）：先 `target("32")` 执行 32 条 → 再全量仅执行 V33（1 条）→ validate 通过 → 断言 209/210/211 三行字段（permission/component/path/menu_type/parent_id/sort>15）→ 断言 `sys_role_menu` 对 209-211 零关联（不自动授权）

## 5. PG 真实库验证（127.0.0.1 共享开发库）

**环境现场**：psql 客户端未安装；docker daemon 未运行（`docker info` 报 Cannot connect）；`nc -z -w 5 127.0.0.1 5432` 成功（网络可达）。

**验证方式**：一次性临时 JUnit（`PgV33VerificationTest`，验证后已删除），连接 `application-local.yml` 中的 `jdbc:postgresql://127.0.0.1:5432/smart_workflow`（凭据由本地环境变量注入），全程**独立临时 schema**（`sw_v33_verify_*`），不触碰 public schema 任何既有表，验证后 `DROP SCHEMA ... CASCADE` 清理。

**结果（真实执行成功）**：
1. 勘察：`public.flyway_schema_history` **不存在**（共享库从未初始化 Flyway 历史）
2. PG 全链 V1→V33 直跑被**既有 V13 PG 脚本缺陷**阻断（详见遗留事项），遂改为**目标验证法**：临时 schema 手工建 V5 演进后最终形态的 `sys_menu` + 模拟 V26 既有行（id=7/15），Flyway `baseline=32`、`target=33`、仅执行 V33
3. **V33 在真实 PG 上执行成功**：迁移 1 条；二次 migrate 0 条（幂等）；209/210/211 产物断言全部通过；V26 既有行（id=7/15）原样保留；临时 schema 已清理
4. **public 零改动**：全程未执行任何 public schema DDL/DML（仅只读 SELECT 勘察）

## 6. 互斥检查证据

| 时间 | 命令 | 结果 |
|---|---|---|
| 首次全量前 | `pgrep -fl "pnpm|vite|vitest"`；`ps aux \| grep -iE "pnpm|vite|vitest" \| grep -v grep \| wc -l` | 无前端构建进程（仅 VSCode IDE 内部 node 服务，计数 0） |
| 最终复验前 | `pgrep -fl "pnpm|vite|vitest"` | 无命中（exit=1） |

全程无任何 pnpm/npm 命令与本任务并行；mvn 严格串行。

## 7. git 提交

提交 3 个文件（未纳入会话前既有的 `application-local.yml` 改动）：
- `sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V33__agent_model_menu_seed.sql`（新增）
- `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainH2Test.java`（断言 33 + 升级链/产物断言）

提交信息：中文描述 + 中文 body，无 AI 署名行。

---

## 8. 遗留事项（如实披露）

1. **既有 V13 PG 方言缺陷**（与本次改动无关，按硬约束未改 V19-V32）：`db/migration/postgresql/V13__logical_delete_unique_constraints.sql:58` 对 inline UNIQUE 隐式索引 `sw_form_def_form_key_key` 执行 `DROP INDEX`，PG 报 **2BP01**（约束创建的索引须 `DROP CONSTRAINT` 而非 DROP INDEX）。导致 **PG 侧全链 V1→V33 无法在真实库直跑**（H2 全链不受影响，测试全绿）。建议规划层决策是否另立修复迁移（如 V34 将 `sw_form_def` 的 UNIQUE 约束改建于显式索引）。
2. PG 共享库（127.0.0.1）`flyway_schema_history` 不存在，即该库从未跑过 Flyway 全链；若后续要在此库启用正式 Flyway，需先解决第 1 项。
3. 前端菜单消费侧（路由/侧边栏渲染 ModelList 页面与 hasPerm 按钮显隐）由前端 subagent 承接，本回执范围仅后端 seed 与验证。
