# Phase 3 完成回执：动态宽表数据安全与引用完整性收口

> 执行角色：执行（Executor）  
> 日期：2026-09-24  
> 方向：`../ready/direction-phase3-dynamic-table-data-safety-reference-integrity.md`  
> 对应候选：BAO-06、BAO-07  
> 任务等级：XL（总体任务 `backend-architecture-optimization` 的 Phase 3）  
> 自验结论：**实现与行为证据均通过；待规划验收**（未写 `PASSED/COMPLETED`，未 commit/push/tag/Release/部署）

---

## 1. 结果摘要

| 项 | 结果 |
|---|---|
| 受控动态宽表入口 | 新增 `DynamicTableSql`（唯一 SQL 构造与执行出口：标识符校验 + 强制 tenant/deleted + 占位符绑定校验 + 父行锁） |
| 迁移调用点 | 生产动态宽表/元数据 SQL 全部改经受控入口；`com/sw/ck/form/dynamic/` 之外无任何直接 `JdbcTemplate` 调用（实测 0） |
| 失败放行 | 删除路径 4 处 fail-open（元数据扫描、单表引用检查、级联软删、子表映射解析）全部改为 fail closed；查询/导出子表读取失败同样 fail closed |
| REFERENCE 并发 | 删除侧与引用写入侧对同一父行加锁（锁身份 = 租户 + 物理表 + 记录 id，批量按 (表,id) 升序）；超时/死锁映射为 1511（可重试） |
| 竞态固定 | 真实 PostgreSQL 上先复现孤儿引用（`orphanReferences=1`，FAIL），恢复父行锁后同一编排 `orphanReferences=0`（PASS） |
| 守门 | 新增 `DynamicTableSqlGateTest`（7 项机械规则）与 `DynamicTableSqlContractTest`（10 项契约）常驻 |
| 迁移边界 | **未新增/修改任何 Flyway 迁移**（`db/migration` 零改动），schema 无变化 |
| 门禁 | form-biz 159/0/0/0；bootstrap 110/0/0/0；Server 全量 **1493/0/0/0**，`BUILD SUCCESS`（04:09 min） |

---

## 2. §5.A 动态 SQL 安全边界（逐项）

| # | 要求 | 实现与证据 | 判定 |
|---|---|---|---|
| A.1 | 动态宽表 DML 完整清单 + 归类为受控入口或有理由的例外，零未分类旁路 | `evidence/dynamic-sql-entry-inventory.tsv`：EQ-01—EQ-07 为 7 个调用面收口前后映射，EX-01—EX-05 为登记例外及理由；`unclassified-bypass-scan.txt` 实测 0 处旁路；`DynamicTableSqlGateTest` G1/G6 常驻守门 | 通过 |
| A.2 | 表名/列名在 SQL 构造边界统一校验；映射不替代校验；历史/越权元数据不可绕过 | `DynamicTableSql.requireTableName/requireColumn/validatePhysicalColumn/quote`；`requireColumn` = `physicalColumnName` 映射 **+** `validateColumnName` 校验；删除路径遇到非法子表名/非法引用列名直接中止（1510）；导出显示列改经 `requireColumn`（原先完全绕过）；表名正则字面量唯一来源由 G2 守门 | 通过 |
| A.3 | 租户隔离与逻辑删除由基础设施强制表达 | 受控入口在执行前断言语句含 `"deleted"` 与 `"tenant_id"`（动态宽表）；缺失即抛 1509 且不执行；单表约束禁止借其它动态宽表旁路；`appendLivePredicate` 拒绝空租户上下文 | 通过 |
| A.4 | 元数据扫描/引用检查/目标表访问失败必须 fail closed 且可诊断 | 删除路径：扫描失败→1510；单表检查失败→1510；级联失败→1510；子表映射解析失败→1510；查询详情/导出的子表读取失败→1510。原始证据：`FormDynamicTableSafetyTest`（H2）与 `pg-concurrency-suite-postfix.log` | 通过 |
| A.5 | 参数继续绑定，不因封装退化为拼接 | 受控入口统计字符串字面量之外的 `?` 数量并要求与参数个数一致，不一致即拒绝（1509）；所有调用点使用 `?`；契约测试覆盖含 `ESCAPE '\'` 字面量的语句 | 通过 |

## 3. §5.B REFERENCE 并发完整性（逐项）

| # | 要求 | 实现与证据 | 判定 |
|---|---|---|---|
| B.1 | 先用真实数据库固定竞态，再证明三种次序不留非法状态 | 竞态固定：`pg-race-reproduction-lock-disabled.log`（父行锁临时停用以等价收口前“检查后删除”语义）→ `delete=success insert=success orphanReferences=1 parentLive=0`，断言 FAIL；修复后同一用例同一编排：`pg-same-test-with-fix.log` → `delete=success insert=被拒(1217) orphanReferences=0`，PASS。三序证据：`Phase3ReferenceConcurrencyPostgresTest`（重叠/引用先到/删除先到）7/7 通过 | 通过 |
| B.2 | RESTRICT 有有效引用即拒绝；CASCADE 保持语义且受租户边界 | PG：引用先到 → 删除得 1505 且父记录存活（`parentLive=true`）；H2：CASCADE 软删子表行、子表映射非法即中止；跨租户删除对他租户记录零影响（PG `isLive=true`、H2 记录数不变） | 通过 |
| B.3 | 串行化必须覆盖“当前无引用行”场景 | 锁对象是**被引用父记录行**（`SELECT "id" FROM <表> WHERE id=? AND deleted=0 AND tenant_id=? FOR UPDATE`）而非已查到的引用行；竞态复现用例正是“检查时无引用”的场景 | 通过 |
| B.4 | 锁身份含租户与被引用对象；锁序/超时/死锁/回滚行为明确 | 锁身份 `tenantId + 物理表 + 记录 id`（`JVM_LOCKS` key 与 SQL 谓词同源）；批量加锁按 `LockTarget.compareTo`（表名 → 记录 id）升序；JVM 等待上限 10s + 数据库语句超时 10s；PG 实测超时 → 1511（`elapsedMs≈10068`）并回滚；死锁/锁冲突 SQLState（40P01/40001/55P03/57014/HYT*）统一映射 1511；事务 `afterCompletion` 释放锁（契约测试断言 `registeredLockCount()` 归零） | 通过 |
| B.5 | 修复后无存活引用指向已删除父记录；无跨租户误判/级联 | 三序 + 跨租户 + 超时四类用例中 `orphanReferences` 恒为 0；跨租户引用得 1217（未写入任何行） | 通过 |

## 4. §5.C 兼容、验证与守门（逐项）

| # | 要求 | 证据 | 判定 |
|---|---|---|---|
| C.1 | 改造前后入口映射、例外清单、零未分类旁路的可复算证据 | `dynamic-sql-entry-inventory.tsv`、`unclassified-bypass-scan.txt`（0）、`command-results.tsv` | 通过 |
| C.2 | 跨租户/逻辑删除/非法标识符/失败放行/正常 CRUD/导入导出 的集成行为证据 | `FormDynamicTableSafetyTest`（H2，9 用例）覆盖：CRUD+逻辑删除物理标记+跨租户读写删、非法物理表名（1500）、非法子表名（1510）、元数据不可用（1510 且记录存活）、子表缺失（详情与删除均 1510）、REFERENCE 存活/跨租户/不存在/已删除、RESTRICT（1505）、导入引用校验（行级错误 + 整批回滚）与导出（引用显示值 + 子表 sheet + 子表缺失 fail closed） | 通过 |
| C.3 | REFERENCE 并发行为证据；静态代码/测试名/锁语句不可替代 | 真实 PostgreSQL（zonky 内嵌 PG + 全链迁移 + 完整应用上下文）行为结果见 §3.B.1/B.5 | 通过 |
| C.4 | PostgreSQL 为生产语义依据；H2 继续作为代理并保持回归可运行 | PG 承担全部并发与跨租户行为证据；H2 承担 CRUD/导入导出/fail-closed 回归；两者差异（大小写折叠、锁等待）在实现中已显式处理（元数据表不加引号、锁查询带超时） | 通过 |
| C.5 | 迁移变更需证明前置校验/正向迁移/终点/回滚；未改迁移则声明并证明 schema 无变化 | **未改迁移**：`git status` 中 `db/migration` 零改动（实测 0）；Flyway 全链随全量门禁通过：H2 15/0/0/0、PostgreSQL 12/0/0/0、升级演练 I6G7 1/0/0/0 | 通过 |
| C.6 | 受影响模块与 Server 全量门禁绿色，计数取自实际输出 | form-biz 159/0/0/0；bootstrap 110/0/0/0；全量 **1493/0/0/0**、`BUILD SUCCESS`；逐条见 `command-results.tsv` | 通过 |
| C.7 | 机械守门防止重新绕过受控入口或恢复 fail-open | `DynamicTableSqlGateTest`：G1 dynamic 包外禁止直接 JdbcTemplate；G2 表名正则唯一来源；G3 删除路径禁止静默放弃的 catch（且至少 4 处显式抛出）；G4 删除/写入/导入三侧均存在父行锁调用；G5 禁止恢复已移除的放行文案；G6 受控入口调用点数量下限。`rules-gate.log` 17/0/0/0 | 通过 |

---

## 5. 实际修改范围

**修改（10 个已跟踪文件）**

| 文件 | 摘要 |
|---|---|
| `sw-biz-form-api/.../FormErrorCode.java` | 新增 1509/1510/1511（受控入口契约违规、元数据不可用、行锁超时） |
| `sw-biz-form-biz/.../dynamic/DynamicTableManager.java` | 生成表名以真实校验替代 `assert`；`addColumn` 校验入参表名/列名；DDL 走 `DynamicTableSql.ddl` |
| `.../service/FormDataQueryService.java` | 全部 SQL 经受控入口；删除死代码 `ensureDeletedColumn` 与其缓存；子表/详情读取失败 fail closed |
| `.../service/FormDataUpdateService.java` | 5 处 DML 经受控入口；子表名非法改为中止（原静默跳过） |
| `.../service/FormDataDeleteService.java` | 删除前对父行加锁；4 处 fail-open 改 fail closed；元数据扫描走元数据表白名单 |
| `.../service/FormSubmitService.java` | 主表/子表 INSERT 经受控入口；表名与子表名在构造边界校验 |
| `.../service/FormFieldEnrichmentService.java` | REFERENCE 校验升级为“批量确定锁序 + 父行存活判定”；补上子表 REFERENCE 校验（原先跳过） |
| `.../service/FormImportExportService.java` | 导入引用加锁；导出子表读取 fail closed；导出显示列经 `requireColumn` 校验（原先绕过） |
| `docs/governance/error-code-catalog.md` | §2 登记数 127→130，追加 1509-1511 |
| `sw-bootstrap/.../ErrorCodeCatalogTest.java` | 常量总数 127→130、唯一数值码 122→125 |

**新增（5 个文件）**

| 文件 | 用途 |
|---|---|
| `sw-biz-form-biz/.../dynamic/DynamicTableSql.java` | 受控动态宽表入口（唯一构造与执行出口） |
| `.../dynamic/DynamicTableSqlGateTest.java` | 7 项机械守门（G1—G6 + 扫描器自检） |
| `.../dynamic/DynamicTableSqlContractTest.java` | 10 项契约测试（真实 H2） |
| `.../service/FormDynamicTableSafetyTest.java` | 9 项 H2 行为证据（CRUD/隔离/标识符/fail-closed/引用/导入导出） |
| `sw-bootstrap/.../phase3/Phase3ReferenceConcurrencyPostgresTest.java` | 7 项 PG 行为证据（重叠/锁身份/超时/两序/跨租户/活库 schema） |

**附带（2 个消息目录文件，因新增 errorKey 必须双语）**：`messages_zh_CN.properties`、`messages_en_US.properties`（各追加 3 条，`BilingualMessageContractTest` 8/0/0/0 通过）。

未修改：任何 Flyway 迁移、HTTP 契约、前端仓、`-api` 既有方法签名（除新增错误码枚举成员）、Phase 1 产物。

## 6. 命令与原始结果

见 `evidence/command-results.tsv`（命令 / 工作目录 / 退出码 / 计数 / 原始日志文件名）。原始日志体积与哈希见 `evidence/evidence.sha256`（14/14 OK）。

## 7. 身份

- **代码仓**：`Smart-WorkFlow-aPaaS-server`，分支 `develop`，HEAD `76dc947`；工作树 204 tracked modified + 22 untracked（含 Phase 1 既有改动与本轮 17 个输入文件），`git diff --shortstat` = 204 files changed, +3650/−1996。详见 `evidence/workspace-identity.txt`。
- **数据库**：并发与跨租户证据使用 zonky 内嵌真实 PostgreSQL（每轮独立实例，端口见日志 `[P3-PG] pgPort=`）；H2 证据使用 `jdbc:h2:mem:phase3safety;MODE=PostgreSQL`。
- **租户/身份**：PG 侧租户 0（user 1）与租户 100（user 9001）；H2 侧租户 1（user 11）与租户 2（user 21）。
- **对象**：动态宽表物理名由发布时生成（日志中逐例打印，如 `[P3-PG-OVERLAP] tableA=sw_form_k939542fxo`）。
- **输入哈希**：本轮 17 个改动/新增文件 `sha256sum -c` 17/17 OK（`behavior-input-sha256-check.txt`）。

## 8. 并发结果（摘要）

| 场景 | 结果 |
|---|---|
| 重叠（外部锁制造检查窗口） | 收口前语义：两侧均成功、`orphanReferences=1`（FAIL）→ 收口后：写侧被拒 1217、`orphanReferences=0`（PASS） |
| 引用先到 | 删除被 RESTRICT 拒绝（1505），父记录存活 |
| 删除先到 | 引用写入被拒（1217），无引用行写入 |
| 锁身份 | 同记录删除必须等待（`sameRecordCompletedWhileLocked=false`）；异记录删除 18—20ms 完成 |
| 锁超时 | 持锁不放时写入返回 1511（实测 10.07s）并回滚 |
| 跨租户 | 引用得 1217；删除对他租户记录零副作用 |

## 9. 与方向的偏差、行为变更与风险

1. **行为收紧（有意，方向 §5.A.4 要求）**：子表读取失败、元数据扫描失败、引用检查失败、级联失败、子表映射解析失败，均由“告警后继续/返回空”改为显式失败（1510）。历史静默放行的场景现在会返回可诊断错误。
2. **并发语义变化**：同一父记录上的并发删除/引用写入改为串行化；等待超过 10s 返回 1511，调用方可重试（此前为无界等待或静默成功）。
3. **新增校验面**：子表 REFERENCE 值此前完全未校验，现按主表同口径校验（越权/失效目标将被拒绝）。
4. **错误码**：新增 1509/1510/1511，已登记目录与双语文案；属“可诊断错误”要求的一部分，不改变既有码语义。
5. **声明例外**（保持不改）：外部数据源只读执行器、固定表催办行锁、dev-only 验证 SQL、导出显示值降级、`information_schema` 探测（理由见 `dynamic-sql-entry-inventory.tsv` EX-01—EX-05）。
6. **未完成/残余**：`DynamicTableSql.LOCK_WAIT_MILLIS=10s`、语句超时 10s 为固定值（未配置化）；批量锁序按 (表,id) 升序，跨表单的复杂多引用场景仍可能在极端并发下出现死锁（由 1511 + 回滚兜底，未做重试机制）；H2 的锁等待行为与 PG 不同，H2 侧只做非阻塞断言。

## 10. 证据索引

| 文件 | 内容 |
|---|---|
| `command-results.tsv` | 命令 / 退出码 / 计数 / 日志文件名 |
| `form-module-tests.log`、`bootstrap-module-tests.log`、`full-maven-test.log` | 门禁原始输出（含起止、退出码、逐用例计数） |
| `rules-gate.log` | 守门 + 契约测试原始输出（17/0/0/0） |
| `pg-race-reproduction-lock-disabled.log` | 竞态复现（FAIL，`orphanReferences=1`） |
| `pg-same-test-with-fix.log` | 同一编排收口后（PASS，`orphanReferences=0`） |
| `pg-concurrency-suite-postfix.log` | PG 并发套件 7/0/0/0 |
| `dynamic-sql-entry-inventory.tsv` | 入口映射 + 例外清单 |
| `unclassified-bypass-scan.txt` | 零未分类旁路实测 |
| `workspace-identity.txt` | 工作树身份与改动清单 |
| `resource-mutex-check.txt` | 重型命令前后端互斥检查（前端 dev 进程 2 个，仅执行后端 Maven） |
| `behavior-input.sha256` / `behavior-input-sha256-check.txt` | 本轮输入哈希与回读（17/17 OK） |
| `evidence.sha256` / `evidence-sha256-check.txt` | 证据包哈希与回读（14/14 OK） |

---

## 11. 自验结论

Phase 3 方向 §5 的 A/B/C 三组共 17 条要求逐条落地并有行为证据；Server 全量门禁 1493/0/0/0 绿色，迁移零改动；REFERENCE 竞态在真实 PostgreSQL 上先复现后消除。**自验通过，待规划验收**；本回执不构成功能级 `PASSED`，未执行 commit/push/merge/tag/Release/部署，未启动 BAO-01—05、08—10。
