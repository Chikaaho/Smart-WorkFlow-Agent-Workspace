# execution-100-05：1.0.0 阶段 4—6 合并、发版、部署与同步

接 `planning-review-100-04.md` §3（阶段 4—6）。2026-11-11 完成两仓合并与 CI、tag 1.0.0 + Release(Latest)、演示环境备份→部署→复测→同步。测试账号与口令不入 Git 与回执；未强推、未改写历史、未动既有 tag/Release、未删除/重建演示环境。

## 1. 概要

- Server：`feature/1.0.0` `9fe3f11c` → develop `708d3a36` → main `aa7c86e5`；tag `1.0.0`（tag 对象 `3de61eb7`），Release `441827517`，资产 `bootstrap-1.0.0.jar` **242,697,784 B** sha256 `a8dc16b61a9ce96078cdcef38f1ebdda2e8e47c059ccae7337cbd5d0d8fdfddf`
- Web：`feature/1.0.0` `838b84d` → develop `b4b2d25` → main `a85aa8e2`；tag `1.0.0`（tag `1eb974f1`），Release `441848348`，资产 `sw-web-dist-1.0.0.zip` **6,221,796 B** sha256 `cc94fa3013dcbf15691d9cfd613415ebcb6193e9675da399cdcf90688b91f2d3`
- UAT：Server `build.version=1.0.0`、health UP、Flyway **33→34 行**/max 1.0.0；Web 入口 `assets/index-BCCrQSgQ.js`、根/入口/健康/登录 200
- 复测 F1—F4 各一组（测试数据复测后**停用不删**）；version.json/CHANGELOG/knowledge（功能数 55、P27/P33/P40 核销）/memory 已同步

## 2. 阶段 4：合并与 CI

### 2.1 合入链（普通合并，`--no-ff`）

| 仓库 | feature/1.0.0 | develop | main（发布源） |
|---|---|---|---|
| Server | `9fe3f11c` | `cffce87d` + merge → `708d3a36` | `e2beb027` + merge → `aa7c86e5` |
| Web | `838b84d`（含 TZ 修复） | `c5b1b87` + merge → `400b464` → `b4b2d25` | `65594c0` + merge → `fc45f7b` → `a85aa8e2` |

合并前核验：Server pom `<revision>1.0.0-SNAPSHOT</revision>` 与工作流断言/`check-version-identity.sh` 一致（0.4.1 首跑教训无复发）；Web `package.json` 1.0.0。Web 合并受 commitlint 约束沿用 0.3.8 措辞（`chore(web): merge … for 1.0.0`）；合并树与 feature 尖 `git diff` 为空（无 lint-staged 夹带）。

### 2.2 Web CI 首跑失败与修复（如实记录）

- feature `3c5b5ec` 的 CI（run `43016224031`）与首合并 develop `43035516843`、main `43035549222` 均 **failure**：`PrintSheet.spec.ts` 第 3 条用例在 UTC runner 上 `17:00Z` 打成 `2026-11-11`（期望本地 `2026-11-12`）。
- **根因**：`vi.stubEnv('TZ','Asia/Shanghai')` 只在模块顶层执行一次，`afterEach(() => vi.unstubAllEnvs())` 在第 1 条用例后撤销 stub；本机时区恰为 +08 故本地全绿，UTC runner 上第 2/3 条用例回退 UTC。
- **修复** `838b84d`：TZ stub 移入 `beforeEach` 每条用例重设。本地 3/3；重走合并链后 feature `43036986258`、develop `43037004490`、main `43037042393` 全 success（2060 passed / 3 skipped）。

### 2.3 Server main 首跑失败与重跑（如实记录）

- main `aa7c86e5` 首跑（run `43035353166` attempt 1）**failure**：`JavaSubprocessSandboxTest.testFileWriteBlockedBySecurityManager` NullPointer（子进程阻塞时 `getOutputJson()` 为 null）——`sw-iot` 模块 fail-fast 中断，**`p0PrioritizedWhileNormalBacklogged` 所在的 sw-bpm-process 未及执行**（非 p0 失败，未触发「停下报 Planner」条件）。
- 佐证：同树 develop run `43035313977` 全绿（该类 7/7，全量 2,492/0/0/45）；attempt 1 中该类先于中断点已跑过且通过（5.130s 时长的 ERROR 为另一并发分片）。该用例为已知 CI 偶发族（`execution-100-01.md` §4.3 双侧对照）。
- **重跑失败 job**（API `rerun-failed-jobs`，同 SHA 不动历史）→ attempt 2 **success**：全量 **2,492/0/0/45**，`CommandQueueIntegrationTest` **7/7（含 p0）**、`JavaSubprocessSandboxTest` 7/7。

### 2.4 CI run 号汇总

| 仓库 | 分支 | run | 结论 |
|---|---|---|---|
| Server | develop `708d3a36` | `43035313977` | success |
| Server | main `aa7c86e5` | `43035353166`（attempt 2） | success |
| Web | feature `838b84d` | `43036986258` | success |
| Web | develop `b4b2d25` | `43037004490` | success |
| Web | main `a85aa8e2` | `43037042393` | success |

### 2.5 分支删除

`merge-base --is-ancestor` 对 main/develop 均为 TRUE 后删除：Server feature tip `9fe3f11c`、Web feature tip `838b84d`，本地与远端同步删除；回读两仓剩余 `main`、`develop` 及保留分支（Server `feature/p62-perf-bounded-20261011`、`z7-readme`；Web `feature/ui-figma-align-20261027` 均未触碰）。

## 3. 阶段 5：tag 与 Release

| 仓库 | tag → commit | tag 对象 | Release | 资产（字节） | sha256 |
|---|---|---|---|---|---|
| Server | `1.0.0` → `aa7c86e5` | `3de61eb7` | `441827517` | `bootstrap-1.0.0.jar` 242,697,784 B | `a8dc16b6…` |
| Web | `1.0.0` → `a85aa8e2` | `1eb974f1` | `441848348` | `sw-web-dist-1.0.0.zip` 6,221,796 B | `cc94fa30…` |

- 资产取自 CI 自动创建的 `build-<sha>` Release（Server `441822294`、Web `441795498`），上传后状态 `uploaded`、字节一致。
- 两仓 `releases/latest` 回读均为 `1.0.0`（`make_latest=true`）；0.4.1/0.3.8 及更早 tag/Release 未改动。
- tag 为 annotated，创建前确认不存在，已推送。
- **发布说明含三项已接受限制**：DM8、KingbaseES 只做了静态核对；MySQL 5.7 需要会话参数 `explicit_defaults_for_timestamp=ON`；明细表子字段的日期格式在设计器里还不能配置。底稿见 `receipts/evidence/release-notes-server-100.md`、`release-notes-web-100.md`。

## 4. 阶段 6：演示环境部署（8.166.112.85）

### 4.1 部署前检查与备份

- 根分区余 **6.4G**（≥3G）；DB `smart_workflow` 42 用户；原 Server 0.4.1（jar sha256 `fe6ad3ed…`）、Flyway 33 行/max 0.4.0。
- 备份：`/data/backup/smart_workflow_20261111_2318_pre100.dump.gz`（771,644 B）、`bootstrap.jar.bak-pre100`、`server.env.bak-pre100`、`web.bak-20261111_2318_100pre`（10.6 MB）。

### 4.2 Server（先）

- 上传 `bootstrap-1.0.0.jar` → `bootstrap.jar.new`；`STOP_TIMEOUT=30 ./stop.sh` 停旧进程、8080 释放；替换后 `build.version=1.0.0`；`./start.sh` PID **3417483**。
- health 200 `{"status":"UP"}`（路径 `http://127.0.0.1:8080/api/actuator/health`，本环境 context-path 带 `/api`）；`flyway_schema_history` **34 行、max(version)=1.0.0**（新增 rank 39 `audit log and must change password` success=t）；启动日志 **0 ERROR**。
- 在跑 jar sha256 `a8dc16b6…` 与 Release 资产逐字节一致。

### 4.3 Web（后）

- 上传 `sw-web-dist-1.0.0.zip` 解压落位 `/opt/smart-workflow/web`；入口 **`assets/index-BCCrQSgQ.js`**；`nginx -t` 通过并 reload。
- 回读：根 `/` 200、入口 JS 200、`/sw-server/api/actuator/health` 200、`/login` 200。

## 5. F1—F4 复测（各一组；测试数据复测后停用不删）

**测试数据（回执写明）**：账号 `uat100_a/b/c`（租户 9001「演示集团A」，部门 demo-a-dept1/dept2/team1，岗位 `uat100_post`、角色 `uat100_role`——为本批专门建的停用型测试角色/岗位）；测试表单 `uat100_f2_demo` + 流程「1.0.0 演示环境打印导出验收流程」+ 2 条流程实例 + 1 条直录记录。口令存本地 gitignore 文件，不入 Git/回执。

- **F1**：模板下载 200（3,942 B）；导入 **3/3 成功**（`totalRows:3,successCount:3,warnings:[],errors:[]`）；含错误行批（部门编码不存在）**successCount=0**、错误清单指向行 3、查库 `uat100_%` 仅首批 3 行（**整批回滚 0 行落库**）；`uat100_a` 首登 `mustChangePassword=true`、业务接口 403 `system.must_change_password`、改密 200、复登 false、此后业务接口 403 `common.forbidden`（无权限语义）；用户管理页截图含导入/导出按钮与租户筛选（`f1_uat_user_page.png`）。
- **F2**：`uat100_f2_demo` 表单详情入口：浏览器打印预览（14 行明细完整、页脚版本标注、`f2_uat_print_preview.png`）；下载 PDF 1 页（文本抽取含「采购明细」14 行「部件-01…14」与页脚，`f2_uat_record.pdf` + `f2_uat_pdf_page_1.png`）；明细表导出 Excel `A1:D15`（表头+14 行，到货时间列字符串 `2026-11-12` 与页面一致）。
- **F3**：日志查询页（菜单 9115）截图；接口回读 LOGIN **32 条**（含 FAIL **11 条**，带 IP `163.125.113.135` 与原因「账号不存在或密码不匹配」——含本批故意错口令用例）、OPERATION **13 条**、EXCEPTION 0（UAT 无未处理异常，属环境事实，隔离环境已验证异常路径）；页面文本无密码明文（`hasPwdLeak=false`）。回执留 `uat100-f3-audit-fail.json`。
- **F4**：`/workflow/instances` 列表 IoT 实例行（`iot-2118780073471991810`，已完成）发起人列显示 **「系统（IoT）」**、详情同（`f4_uat_monitor_iot_list.png`、`f4_uat_monitor_iot_detail.png`）；三仓 README 回读：版本行 1.0.0、图注「流程结构总览」均在（raw.githubusercontent.com main 分支）。

**测试数据停用（不删除）**：`uat100_a/b/c` `status=1`（复登实测 401 `system.account_disabled`）；`uat100_role`/`uat100_post` 停用；测试表单/流程/实例与审计日志留置（属环境数据，未清理）。

## 6. 同步

- `version.json`：status **PUBLISHED**；发布/部署/回滚事实更新（含资产字节与 sha256、Flyway 34 行、备份位置）。
- `CHANGELOG.md`：新增 1.0.0 条目（功能、迁移、返修、门禁、发布事实、CI run 号、演示环境、三项已接受限制）。
- `knowledge/current-status.md`：新增 2026-11-11 状态块；`knowledge/feature-reconciliation-index.md`：M01-F02-05（P27）/M03-F06-01（P33）/M10-F02-01（P40）→ ✅ 已核销（第 53—55 个），已核销池 24→27、未排期 14→11。
- `todo/requirement-pool.md`：P27/P33/P40 标记已核销（P69 已于 2026-11-10 关闭，无需再动）。
- `memory/state.md`、`memory/handoff.md`：阶段 4—6 事实、教训、待办（停 18093/5275）。

## 7. 门禁汇总

| 项 | 结果 |
|---|---|
| Server CI（代码合并） | develop `43035313977`、main `43035353166`(attempt 2) success；全量 **2,492 / 0 / 0 / 45 skipped**；`CommandQueueIntegrationTest`（含 p0）7/7 |
| Web CI（代码合并） | feature `43036986258`、develop `43037004490`、main `43037042393` success；**2060 passed / 3 skipped** |
| 部署后 | health UP；Flyway 34 行/max 1.0.0（+1）；Web 四路 200 |

## 8. 证据文件（`receipts/evidence/`，本地、不入 Git）

部署：`stage5-release-100.sh`、`stage6-deploy-100.sh`、`up-web-resp.json`、`up-jar-resp.json`（上传回执）；复测：`uat100-lib.mjs`、`uat100-f1-retest.mjs`、`uat100-f1-userpage.mjs`、`uat100-f2-setup.mjs`、`uat100-f2-capture.mjs`、`uat100-f2-verify.py`、`uat100-f3-f4-capture.mjs`、`uat100-f4-capture.mjs`、`uat100-f1-import-result.json`、`uat100-f1-badrows-result.json`、`uat100-f3-audit-fail.json`、`uat100-f2-setup.json`；截图：`f1_uat_user_page.png`、`f2_uat_print_preview.png`、`f2_uat_pdf_page_1.png`、`f3_uat_audit_page.png`、`f3_uat_audit_login_filter.png`、`f4_uat_monitor_iot_list.png`、`f4_uat_monitor_iot_detail.png`；制品：`uat100-user-template.xlsx`、`uat100-import-3rows.xlsx`、`uat100-import-badrows.xlsx`、`f2_uat_record.pdf`、`f2_uat_itemsA.xlsx`；发布说明底稿 `release-notes-server-100.md`、`release-notes-web-100.md`、CHANGELOG 底稿 `changelog-100-draft.md`。凭据（口令文件、token）不入 Git。

## 9. 偏差与说明

1. **Server main 首跑失败**：固有 flake `JavaSubprocessSandboxTest`（sw-iot），非 p0 失败——p0 所在模块因 fail-fast 未及执行。按「同树 develop run 全绿 + attempt 2 全绿（p0 7/7）」闭环，未触发停下报 Planner 条件；如 Planner 认定应先报，下一轮补报。
2. **Web 首合并 CI 失败**：PrintSheet.spec TZ stub 测试缺陷（`838b84d` 修复），产品代码无改动；重走合并链产生新的 develop/main 合并提交。
3. **资产上传一波三折（如实）**：Release 主体创建后资产上传历经 3 次失败（本地代理断流、后台任务 cwd 不符致 curl 发空请求体 422、中断残留状态），最终 Web 代理直连、Server 代理上传 913s 成功；两仓资产均 `uploaded` 且与 `build-<sha>` 制品字节一致。
4. **监控页发起人筛选**：`el-input-number :min="1"` 不接受 0（UI 层限制，API `initiatorId=0` 可用）；F4 证据经列表翻页获取。
5. **EXCEPTION 日志为 0**：UAT 无未处理异常可采样；异常审计路径已在阶段 3 隔离环境验证（`execution-100-01/03`）。
6. **导入目标租户**：UAT admin 为租户 0 超管，`resolveImportTenant` 要求显式 `tenantId`——按接口契约以 `tenantId=9001` 导入；租户 9001 原无角色/岗位，为使「含部门/岗位/角色」导入成立建了停用型测试角色/岗位（见 §5，复测后停用）。
7. **隔离环境**：18093/5275 仍运行（本回执提交后停止）；`smart_workflow_100` 克隆库与多库容器留待阶段 7 结束清理。

## 10. 下一步

Planner 阶段 7 复核演示环境证据、同步回读与本回执；通过后停隔离环境进程与克隆库，1.0.0 列车结束。
