# 测试回执（三级收敛 S1—S4 · 独立测试回执）

> 日期：2026-08-29
> 依据：`planning-execution-prompt-form-data-import-export-3.md` 第 6 节第 5 条
> 性质：独立测试回执（追加，不覆盖历史）

## 1. S1—S4 新增测试清单（可定位名称 + 实际计数 + 结果）

| S 编号 | 测试文件（可定位路径） | 测试用例（DisplayName / 方法名） | 计数 | 结果 |
|---|---|---|---|---|
| S1 | `sw-biz/sw-biz-form/sw-biz-form-biz/src/test/java/com/sw/ck/form/service/FormSubmitServiceTest.java`（子行校验口径复用） | 既有 5 例全部通过（含 TABLE 字典拦截） | 5/5 | ✅ |
| S1 | 同上模块真实 HTTP 证据 | TABLE 合法导入（2父3子）/ 导出往返 / 非法子行原子拒绝 —— 见执行回执 S1 节 | 3 项行为断言 | ✅ |
| S3 | `Smart-WorkFlow-Web/src/foundation/mock/form-import-export-mock.spec.ts` | `S3 Mock 三身份权限一致：未登录 → 401`（`未登录 → 模板请求返回 401 未认证`） | 1/1 | ✅ |
| S3 | 同上 | `普通无权限身份（user）→ 导入返回 403 无权限` | 1/1 | ✅ |
| S3 | 同上 | `有 P32 权限身份（admin）→ 导出成功` | 1/1 | ✅ |
| S3 | 同上 | 既有五组（模板成功/合法导入/格式错/字段错/空集导出）改为授权身份执行，仍全部通过 | 5/5 | ✅ |
| S4 | `sw-biz/sw-biz-form/sw-biz-form-biz/src/test/java/com/sw/ck/form/controller/FormDataUpdateControllerTest.java`（新增） | `PUT /form/data/{formKey}/{recordId} → 编辑委托成功，R.ok`（`updateData_happyPath`） | 1/1 | ✅ |
| S4 | `sw-biz/sw-biz-form/sw-biz-form-biz/src/test/java/com/sw/ck/form/service/FormDataUpdateServiceTest.java`（既有回归承接） | `主表整量更新 → 所有列更新 + version+1`（`updateSuccess`）、`version 不匹配 → VERSION_CONFLICT(1508)`、`更新不存在的记录 → RECORD_NOT_FOUND(1507)` 等 | 14/14 | ✅ |
| S4 | `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainH2Test.java`（修复后） | 全链计数 43、applied 43、升级链 11/10/7 条、终点版本 V43 等 | 14/14 | ✅ |
| S4 | `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainPostgresTest.java`（修复后，补 iot location） | 全链计数 42、applied 42、升级链 10 条等 | 11/11 | ✅ |

## 2. 实际运行输出（精确计数）

- `mvn -pl sw-bootstrap test -Dtest='FlywayFullChainH2Test,FlywayFullChainPostgresTest'`：
  `Tests run: 25, Failures: 0, Errors: 0, Skipped: 0`，BUILD SUCCESS。
- `mvn -pl sw-biz/sw-biz-form/sw-biz-form-biz test`：
  `Tests run: 81, Failures: 0, Errors: 0, Skipped: 0`（含新增 FormDataUpdateControllerTest 1 例）。
- 前端 `pnpm vitest run src/foundation/mock/form-import-export-mock.spec.ts`：
  `Test Files 1 passed (1)，Tests 10 passed (10)`（7 组 L13 语义 + 3 组 S3 身份）。

## 3. S4 全量门（后端根，仅执行一次）

- 互斥检测：`ps aux | grep -E '(mvn|pnpm|...)'` 计数为 0 后执行。
- 命令：`MAVEN_OPTS="-Xmx2g" mvn test`（后端根 `Smart-WorkFlow/`）
- **退出码 0**；汇总 `TOTAL tests=947, failures=0, errors=0, skipped=0`；`BUILD SUCCESS`。

## 4. 修复说明（S4 允许范围内的 Flyway 阻塞修复）

- `FlywayFullChainPostgresTest`：APP_LOCATIONS 缺失 `classpath:db/migration/iot/{vendor}`（H2 侧已有），
  导致主链 V42 引用的 `sw_iot_device`（由 iot 链 V40 创建）不存在。已补齐该 location 并把期望计数更新为
  42（39 基线 + iot V40 + V42 + V43）。
- `FlywayFullChainH2Test`：全链/升级链/终点版本计数断言未覆盖 V42/V43，已更新为 43 与 11/10/7 条、终点 V43。
- 未删除或改写任何迁移脚本本身（V42/V43 保持原样），仅修正测试契约与缺失的 location 声明。
