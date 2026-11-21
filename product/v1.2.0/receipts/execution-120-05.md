# 1.2.0 第五批执行回执（execution-120-05）——ROOT 缺陷修复 + GATE + MIG

日期：2026-11-21｜执行（Executor）｜依据 `planning-execution-prompt-120-01.md`（MIG/GATE 原子项）｜自验通过，待规划验收

## 1. Git 事实

| 仓 | 提交 | 内容 |
|---|---|---|
| Server | `070fbcb2`（远端回读 070fbcb2b3a1） | ROOT 恢复默认显式回落配置文件根级别（execution-120-04 §5 缺陷闭环）+ LogLevelServiceTest 5/5 |

## 2. ROOT 恢复默认缺陷修复（120-04 §5 登记）

修复：`LogLevelService.setLevel` 首次管理动作前快照配置文件根级别（此时 ROOT 必未被本服务调整，避免快照污染）；`ROOT + level=null` 时显式 set 回快照值。非 ROOT logger 恢复默认仍走 null（继承父级，语义正确）。测试新增 `rootResetFallsBackToConfiguredRoot`：ROOT 调 DEBUG→恢复默认→生效等级回到配置根级别（不再出现「配置=默认、生效=DEBUG」）。**LogLevelServiceTest 5/5 绿**。

## 3. GATE 计数（方向 §5 门禁项）

### Server 全量 `mvn test`（全 reactor，本地 feature/1.2.0 @ 070fbcb2）

- **1746 tests / 8 failures / 70 errors / 38 skipped**；BUILD FAILURE 只在 sw-bootstrap（08:39 min）。
- **32 个失败类全部为 sw-bootstrap 的 PG boot 族**（phase3/phase4/p61/p62/p63/i5/iot-native/multidb——依赖远程证据库 `8.166.112.85:3897/sw_p5_evidence`（PostgreSQL 14.25，状态漂移，日志实证）与 zonky 本地 PG 并发资源）。
- **本批改动模块全部 SUCCESS**：agent-api/agent/iot-api/iot/knowledge/notify/job/storage/system-api/system-biz/form-api/form-biz/bpm-api/bpm-engine(57.9s)/bpm-process(31.5s)/openapi/security/common。
- 与 1.1.3 基线口径一致：`execution-113-01.md` 已登记「Phase4 PG 族（远程证据库状态漂移）+ P61 zonky——干净 develop 同样复现，既有环境问题」；本批失败为同族扩大，非本批引入的直接佐证 = ①失败类全部不在本批改动文件集内 ②本批改动模块 100% SUCCESS ③tag 1.1.3 的 main CI run 为 success（干净 runner 可全绿，本地失败属远程库漂移）。**正式以 main CI 为准（方向 §5：环境类失败照旧记为限制，以 main CI 为准）**——run 号随阶段 4 合并补。

### Web 四门禁（feature/1.2.0 @ da0f987）

| 门禁 | 结果 |
|---|---|
| typecheck（vue-tsc -b --noEmit） | EXIT=0 |
| lint（eslint .） | EXIT=0 |
| test（vitest run 全仓） | **2128 passed / 3 skipped**（2131） |
| build（vue-tsc -b && vite build） | EXIT=0，✓ built in 4.27s |

## 4. MIG：九库迁移结论（P66 口径）

| 库 | 结论 |
|---|---|
| PostgreSQL | **真实执行**：zonky 内嵌 PG 全链 13/13（FlywayFullChainPostgresTest，33 条终点 1.2.0）+ 0.3.2 升级链 2/2 + iso120 真库 37 条（33 主链 + devseed）health UP |
| H2 | **真实执行**：FlywayFullChainH2Test 20/20（33 条终点 1.2.0）+ 032 升级 2/2 |
| MySQL | **未跑**：本机 mysql 8.0.33 服务存在但无受控凭据（root 访问被拒），docker daemon 不可用无法起容器（1.0.0 先例即容器实测失败记环境原因）；脚本与 `-Dmysql.url` 断言就位（FlywayFullChainMySqlTest 33 条断言已更新，跳过 1） |
| Oracle | **未跑**：无本地实例；脚本与 `-Doracle.url` 断言就位（FlywayFullChainOracleTest 33 条断言已更新，跳过 1） |
| SQL Server | **静态门禁**：SqlServerScriptStaticTest 35 脚本（33+V1.2.0+R__1.2.0）无 PG 专属语法 + 真实增量 V1.2.0（四列两索引）+ 菜单种子 R__1.2.0（R4 裁定口径）；SqlServerRepeatableSyncTest 校验和清单绿 |
| DM | **静态 parity**：DmOracleScriptParityTest 33 脚本一一对应（差异仅 VARCHAR2 CHAR 单位）绿 |
| KingbaseES | **静态 parity**：KingbasePostgresParityTest 33 脚本与 PG 逐字节一致（除 V0.2.5 pgvector）绿 |
| openGauss | 脚本与 PG 同文（KingbasePostgresParity 同目录口径）；真实执行需本地实例，未跑——SwVendorMigrationRunner 路径已有单测覆盖 |
| 断言清单 | 13 个测试文件条数/终点断言更新（32→33、1.1.0→1.2.0、sqlserver 33→35、032 升级 4→5、legacy 演练 11→12/19→20）——明细见 execution-120-01 §5 |

## 5. 未完成（下批）

- E1-1~E1-8、E1-3T 全链浏览器取证（造数：发布 Graph、含人工节点 Graph、慢 Graph、流程编排、表单动作）。
- E2-3（t100admin 无权限 403 + 操作日志 OP 行）、E2-4（重启前后对照——iso120 Server 重启 + ROOT 修复后重测恢复语义）。
- E3-1 修复后对照截图（1.1.3 基线对照口径见 120-04 §6，待规划裁定）。
- E3-2 main CI run 号随阶段 4。

## 6. 阶段进度

七阶段：已完成 2；进行中 1（验收：GATE/MIG 已清，余 E1/E2/E3 行为证据）；未开始 4。下一批：E1 造数与全链取证 + E2-3/E2-4 收口。

## 7. 自验结论

本批覆盖项全部完成并通过适用门禁（LogLevelServiceTest 5/5、Web 四门禁全绿、Server 全量除既有环境族外全绿且改动模块 100% 绿），**自验通过，待规划验收**。
