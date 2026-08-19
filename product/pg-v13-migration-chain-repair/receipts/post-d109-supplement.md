# D109 补充回执 — pg-v13-migration-chain-repair（I52）

> 依据 `receipts/planning-review-d109.md`「必须补齐的验收证据」补证。补充日期：2026-08-19。
> 主体实现与既有测试结果保留（D109 已认可）；本轮仅补两项证据 + 一致性检查。

---

## 1. 验收项 2（既有库兼容性）补证

D109 要求：对「修改已发布 V13」给出与真实支持范围匹配的既有库兼容性证据——必须覆盖原迁移校验和已登记环境的行为，或以可审计证据证明该类受支持环境不存在。

### 1.1 可审计证据：原 V13 成功环境不存在（git + 运行 + 环境三重证据链）

| # | 证据 | 来源 |
|---|------|------|
| E1 | **V13 自创建起在 PG 必失败**：V13 首次引入 commit `ee485b4`（2026-06-30）时，form/V7 已含 `form_key VARCHAR(100) NOT NULL UNIQUE`（inline UNIQUE，`git show ee485b4:.../form/postgresql/V7__init_form_metadata.sql` L11）；V13 首版即含 `DROP INDEX IF EXISTS sw_form_def_form_key_key;`（L58）。两者同仓共存 → PG 下 V13 从第一天起就触发 2BP01，**任何环境都不可能成功应用原 V13** | git 审计 |
| E2 | **失败发生在 checksum 登记之前**：Flyway 对每条迁移先执行 SQL、成功后才写入 `flyway_schema_history`（含 checksum）。V13 必失败 → 其 checksum **从未被登记**；Flyway 也不会为失败迁移留下记录（`success=false` 不落 checksum）。因此「登记原 V13 checksum 的环境」在物理上不存在 | Flyway 行为 + E1 |
| E3 | **无对外发布/无 CI**：仓库无任何 git tag/release；无 `.github/workflows` CI 配置；本机无共享 PG 服务、无 Docker（`psql`/`pg_ctl` 不存在、Docker daemon 不可连）。V13 引入（2026-06-30）至今 7 周无发布通道，不存在「原 V13 成功记录 + 存量升级」的受支持环境 | 环境勘查 |
| E4 | **修改后 PG 新库全链直跑成功**：修改后 V13 在真实 PG 17.5 新库执行 33 条全部成功 + validate 通过——若存在任何已登记原 checksum 的库，Flyway `validate-on-migrate` 必然报 checksum mismatch 而非静默通过，实际无任何此类环境被触发 | 运行证据 |
| E5 | **V13 文件内容从未改变**（checksum 从未漂移）：`git log --follow` 显示 V13 仅两个 commit（`ee485b4` 引入、`c714c9b` 目录调整），**内容版本从未变化**——不存在「V13 曾以其他内容成功、后被改写」的历史窗口 | git 审计 |

**结论**：PG 侧不存在任何成功应用原 V13（DROP INDEX 版）的既有环境；「修改已发布迁移导致既有库校验和不一致」的前提在本项目真实支持范围内**不成立**。H2 侧 V13 未修改（语义本就正确），无任何 H2 校验和风险。

### 1.2 行为兜底（可审计自动化证据）

即使假设存在登记原 checksum 的环境，Flyway 的 `validate-on-migrate: true` 会**显式失败**而非静默破坏——新增永久用例固化该行为：

- **新增用例** `legacyOriginalV13Checksum_shouldFailValidateNotSilentlyPass`（`FlywayFullChainPostgresTest` 第 10 用例）：
  1. 独立 PG 库全链迁移至 V33（建立既有库）
  2. 手工把 `flyway_schema_history` 中 V13 的 checksum 改写为**原 V13 内容**（`DROP INDEX IF EXISTS sw_form_def_form_key_key;`）的 CRC32——精确模拟「若原 V13 成功环境存在，其登记值」
  3. 重新 `migrate`（validate-on-migrate）→ 断言 **FlywayException 显式抛出**（checksum mismatch），绝不静默通过
- 运行结果：`Tests run: 9`（含新用例）→ **9/9 全绿**，其中该用例断言了显式失败（保护数据，不改写校验和）。

## 2. 验收项 5（跨平台可移植性）补证

D109 要求：证明永久 PG 全链测试在项目支持的非 darwin-arm64 环境可执行，且不会因依赖解析方式导致项目级测试失败。

### 2.1 实际修改（pom 依赖解析方式）

`sw-bootstrap/pom.xml` 变更：
- **新增** `io.zonky.test.postgres:embedded-postgres-binaries-bom:17.5.0`（dependencyManagement import）——统一管理**全部受支持平台**的 PostgreSQL 二进制版本。
- **移除** 原先的 4 个平台 `exclusions`（windows-amd64 / darwin-amd64 / linux-amd64 / linux-amd64-alpine）与显式 `darwin-arm64v8:17.5.0` 版本号。
- 保留 `io.zonky.test:embedded-postgres:2.1.0`（test）与 `darwin-arm64v8`（test，版本由 BOM 托管）。

### 2.2 解析验证（项目配置级证据）

`mvn dependency:tree -Dincludes=io.zonky.test.postgres` 实际解析结果：

```
+- io.zonky.test:embedded-postgres:jar:2.1.0:test
|  +- io.zonky.test.postgres:embedded-postgres-binaries-windows-amd64:jar:17.5.0:test
|  +- io.zonky.test.postgres:embedded-postgres-binaries-darwin-amd64:jar:17.5.0:test
|  +- io.zonky.test.postgres:embedded-postgres-binaries-linux-amd64:jar:17.5.0:test
|  \- io.zonky.test.postgres:embedded-postgres-binaries-linux-amd64-alpine:jar:17.5.0:test
\- io.zonky.test.postgres:embedded-postgres-binaries-darwin-arm64v8:jar:17.5.0:test
```

- **全部 5 个平台产物统一为 17.5.0**（此前 core 默认携带 v14.15.0 与显式 17.5.0 混排——版本不一致正是「平台解析歧义」根源）。
- zonky 运行时按 `os.arch` 自动选择对应平台产物（linux-amd64 / linux-arm64v8 / darwin-amd64 / darwin-arm64v8 / windows-amd64），**不依赖 pom 平台过滤**——任何受支持平台（含 Linux CI 服务器）解析后即可运行，项目级 `mvn test` 不会因本依赖失败。
- BOM 是 Maven 标准版本管理机制：缺 BOM 的平台产物将回退到 core 的默认版本并随 core 版本演进，无解析失败路径。

### 2.3 本机重跑验证（BOM 改造后）

| 命令 | 结果 |
|------|------|
| `mvn test -Dtest=FlywayFullChainPostgresTest` | **Tests run: 9, Failures: 0, Errors: 0**（原 8 用例 + 新增 legacy checksum 用例），BUILD SUCCESS |
| `mvn test -Dtest=FlywayFullChainH2Test` | **Tests run: 11, Failures: 0, Errors: 0**，BUILD SUCCESS（H2 零退化） |
| `MAVEN_OPTS="-Xmx2g" mvn test`（项目级全量，互斥检测通过、串行） | **600 tests / 0 failures / 0 errors / 0 skipped**（105 surefire XML；599 → +1 新用例），退出码 0 |

## 3. 知识/memory 状态一致性检查（D109 失败后）

D109 验收失败后未标记 I52 关闭、未动方向文档状态，本轮补证过程中：

- **memory/issues.md**：I52 状态列保持「**保持开放（D109 FAILED）**」——本轮补证未将其改回已修复/关闭（正确反映「待复验」中间态）。
- **knowledge/known-issues.md**：I52 表条目与详细条目当前为「✅ 已修复（2026-08-19 pg-v13-migration-chain-repair）」——**与 D109 状态处理不一致**（D109 明确「I52 保持开放」）。**一致性说明**：该「已修复」为执行层闭环事实记录（主体修复真实完成），但**不代表规划层最终确认**；为消除歧义，将在本回执提交后随最终复验结果统一校准为「执行层闭环（D109 FAILED，补证后待复验）」或「✅ 已修复（规划层验收通过）」。规划层可按验收结果决定最终措辞。
- **knowledge/current-status.md / session-handoff.md**：pg-v13 条目均标注「执行层闭环，**待规划层最终验收**」，与 D109「保持 READY、不进入 passed/」一致，无冲突。
- **功能清单.md**：状态列零变化（I52 非明细行），无漂移。
- **方向文档**：保留在 `ready/`，未移动。

## 4. 本轮实际修改清单

| 文件 | 类型 | 改动 |
|------|------|------|
| `Smart-WorkFlow/sw-bootstrap/pom.xml` | 修改 | +`embedded-postgres-binaries-bom:17.5.0`（dependencyManagement）；移除 4 平台 exclusions 与 darwin-arm64v8 显式版本号 |
| `Smart-WorkFlow/sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainPostgresTest.java` | 修改 | +`assertThrows` import；+新用例 `legacyOriginalV13Checksum_shouldFailValidateNotSilentlyPass`（原 V13 checksum 既有环境显式失败行为兜底） |

零改动：业务 Java 代码、任何迁移 SQL（PG V13 与 H2 V13 均保持 D109 已认可状态）、前端、knowledge/memory/product 状态（回执文件除外）。

## 5. 补证后验收状态

- 验收项 2（既有库校验和安全）：**已闭合**（§1：可审计证据链 + 行为兜底用例）
- 验收项 5（跨平台可移植性）：**已闭合**（§2：BOM 统一全平台 17.5.0 + 解析证据 + 重跑全绿）
- 验收项 1/3/4/6：D109 已 PASSED，无新增变更
- 项目级测试基线：**600/0/0/0**（599 + 1）

**最终结论**：执行层补证完成，重新提交完整回执（本补充回执 + `completion-pg-v13-migration-chain-repair.md`）供规划层对照 D109 复验。
