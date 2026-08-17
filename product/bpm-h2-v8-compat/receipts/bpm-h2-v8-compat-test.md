# 测试回执：P10 / I47 BPM H2 V8 迁移链兼容性修复（bpm-h2-v8-compat）

- **所属功能**：bpm-h2-v8-compat（P10 / I47）
- **执行日期**：2026-08-17（实现 subagent 模块级自测 + 主会话项目级全量回归）
- **测试范围**：sw-bpm-process 绑定语义正反例 + sw-bootstrap 永久真全链 H2 迁移验证 + 项目级 31 模块全量回归
- **内存约束**：全部命令 `MAVEN_OPTS="-Xmx2g"`（2G 上限）；本机 1.6G 物理内存，所有 mvn 严格串行，每次运行前 `ps` 编译互斥检测（全程无并发编译进程）

---

## 1. 测试计划（对应验收方向 1/3/4/5）

| 层 | 目标 | 对应验收点 |
|----|------|-----------|
| 全链（sw-bootstrap） | 真实 Flyway 7 目录 H2 全链 migrate + validate，BPM 链纳入 | 验收 1/4 |
| 绑定语义（sw-bpm-process） | active 唯一性/非 active 共存/启停切换/租户隔离正反例 | 验收 3 |
| 项目级 | 全量 31 模块回归，对比 527 基线 | 验收 5 |

## 2. 绑定语义测试（sw-bpm-process，BpmFormBindingServiceImplTest，8 用例）

**命令**：`cd sw-biz/sw-bpm/sw-bpm-process && MAVEN_OPTS="-Xmx2g" mvn -q test`

**结果**：退出码 0，**Tests run: 58, Failures: 0, Errors: 0, Skipped: 0**（基线 50 → +8）。surefire XML 确认 `BpmFormBindingServiceImplTest` **8/0/0/0**。

用例清单（DB 级用例走 JdbcTemplate 显式 tenant_id；唯一冲突断言 `DuplicateKeyException` + 根因 SQLState=23505）：

| 用例 | 类型 | 断言语义 |
|------|------|---------|
| 插入 active=true 绑定成功 | 正例 | 正常插入 |
| 同租户同 form_key 第二条 active=true → 唯一冲突 | 反例 | SQLState 23505（partial index 等价约束生效） |
| 同租户同 form_key 多条 active=false 共存 | 正例 | 历史记录可共存 |
| 不同 tenant_id 同 form_key 各一条 active=true | 正例 | 租户隔离 |
| 停用（active=true→false）后新插 active=true | 正例 | 启停切换 |
| 已有 active=true 时另一条 active=false 更新为 true → 冲突 | 反例 | 重复启用被拒 |
| `findActiveByFormKey` 只返回 active 记录 | 正例 | 服务查询语义 |
| 查-插幂等模式 + 重复保存被唯一索引兜底 | 正例 | DeployRunner 幂等前提成立（Service 级，Flowable 路径见完成回执 §4 偏差 2） |

## 3. 永久真全链 H2 验证（sw-bootstrap，FlywayFullChainH2Test，8 用例）

**命令**：`cd sw-bootstrap && MAVEN_OPTS="-Xmx2g" mvn -q test`

**结果**：退出码 0，**Tests run: 8, Failures: 0, Errors: 0, Skipped: 0**（sw-bootstrap 首次获得测试基建，0→8）。surefire XML 确认 `FlywayFullChainH2Test` **8/0/0/0**。

关键运行日志原文（mvn test 输出）：

```
INFO ... FlywayExecutor -- Database: jdbc:h2:mem:flyway_full_chain (H2 2.3)
INFO ... DbMigrate -- Migrating schema "PUBLIC" to version "8 - init bpm metadata"
INFO ... DbMigrate -- Migrating schema "PUBLIC" to version "14 - add process def"
INFO ... DbMigrate -- Successfully applied 30 migrations to schema "PUBLIC", now at version v30
INFO ... DbValidate -- Successfully validated 30 migrations
```

用例清单：
1. migrate 迁移计数 = **30**（28 + bpm V8/V14；7 目录链与 `application.yml` locations 一一对应，`{vendor}` 按 Spring Boot 语义替换 `h2`）
2. `info().applied()` = 30，且含版本 8/14（BPM 链在列）
3. migrate 后再 validate 通过（30/30）
4. `sw_bpm_form_binding` 表存在 + `active_key` 生成列存在 + `uk_sw_bpm_binding_active` 索引存在（JDBC 元数据断言）
5. 语义正反例（JDBC）：重复 active → SQLException（SQLState 23505）；多条 inactive 共存；租户隔离；停用后切换成功；inactive 改 true 被拒——与模块测试同套契约（独立 tenant/form_key 互不干扰）

**验证入口（永久）**：`sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainH2Test.java`。修复后全链迁移计数 **28 → 30**，BPM 不再被排除，"28 条排除 BPM"口径自此失效。

## 4. 项目级全量回归

**命令**：`MAVEN_OPTS="-Xmx2g" mvn test`（Smart-WorkFlow/ 根目录）

**结果**：退出码 0，BUILD SUCCESS（31/31 模块 SUCCESS）。

**汇总**：surefire 时间窗过滤 97 个 TEST-*.xml，聚合 **tests=543 failures=0 errors=0 skipped=0**；逐模块（tests/failures/errors/skipped）：Common 16/0/0/0、Security 4/0/0/0、Storage-Biz 16/0/0/0、Notify-Biz 7/0/0/0、Job-Biz 48/0/0/0、Agent 178/0/0/0、System-Biz 111/0/0/0、Form-Biz 76/0/0/0、BPM-Engine 21/0/0/0、**BPM-Process 58/0/0/0**（基线 50）、**Bootstrap 8/0/0/0**（基线 0），合计 **543**。

**与基线对比**：2026-08-16 CONFIRMED 基线 527/0/0 → 本次 **543/0/0**（+16：bpm 71→79 +8、bootstrap 0→8 +8），零失败、零错误、零 flaky 重试。

## 5. 静态复核

- `grep -n 'where active'` h2/V8：**零命中**（partial index 已移除）；`grep -c 'generated always as'` h2/V8：1（生成列唯一处）。
- `git diff`：pg/V8 **零差异**（生产语义未动）；V13/V14 及全部其他迁移文件零差异。
- 生成列在两种 H2 模式下实测通过：纯 H2 默认模式（bootstrap 测试，与 dev H2 URL 一致）与 `MODE=PostgreSQL`（sw-bpm-process 测试）——重复 active 均报 SQLState 23505、多条 inactive 共存、启停切换成功。

## 6. 失败/异常清单

- **环境性（首跑，已修复）**：sw-bpm-process 首跑 58/7 error——BpmFormBindingServiceImplTest 与 BpmInstanceServiceImplTest 共享内存库 `bpm_svc_test` 建表冲突；已按既有先例（BpmInstanceDataScopeTest）用独立 URL 隔离修复，重跑全绿。
- **测试自身缺陷（首跑，已修复）**：FlywayFullChainH2Test 首跑 1 failure——flyway-core 不解析 `{vendor}` 占位符（由 Spring Boot LocationResolver 解析），迁移计数=0；已在 `@BeforeAll` 显式替换为 `h2`（复刻 Boot 逻辑，注释说明），重跑 8/0/0。
- 除此之外：零失败、零异常、零 flaky 重试。

## 7. 结论

- 验收方向 1：✅ H2 BPM 迁移链 8→14 连续执行成功，30/30 应用 + validate 通过；
- 验收方向 3：✅ 绑定语义正反例双证（模块 8 用例 + 全链 JDBC 正反例，SQLState 23505）；
- 验收方向 4：✅ 永久验证入口 `FlywayFullChainH2Test`，迁移计数 28→**30**；
- 验收方向 5：✅ 项目级 **543/0/0**（≥527 基线），全部命令 `MAVEN_OPTS="-Xmx2g"` 串行。

**最终结论**：**PASSED**（执行层自验收口径；最终判定由规划层对照方向文档完成）。
