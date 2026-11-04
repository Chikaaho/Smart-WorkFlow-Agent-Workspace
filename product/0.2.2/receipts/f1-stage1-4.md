# F1 阶段 1 补充验证回执（第 4 轮：G2 标题判定 + G3 sw-bootstrap 迁移门禁）

- 执行入口：`product/0.2.2/receipts/planning-execution-prompt-f1-stage1-02.md`
- 上游锁定项（第一轮 a–d 与四项修复、G1/G4/G5/G6）本轮未重验；本轮只改 G2 标题判定与 G3 迁移测试断言，未触及锁定项业务路径
- 代码状态：web `feature/0.2.2-agent` @ `df2200e`；server `feature/0.2.2-agent` @ `12001c4f`
- 验证环境：本地 Docker PG 18（专用验证库 `smart_workflow_f1v4`，验收后已 DROP）；server 与 vite dev 本地启动（8080/5174），连通性目标为本地回环桩（9998）；可见浏览器（ZCode 应用内浏览器，headless=false，视口 1440×900）
- 安全约束执行情况：未使用任何真实 API Key；仅用本地桩 key，未写入 git/种子/迁移/回执/日志/截图；本地登录 RSA/JWT/SSO/Cipher 密钥运行时生成，验收后删除；验证库已 DROP

## F1S1-G2 连通性测试结果标题判定 ✅

### 根因

`ModelList.vue` 弹窗标题只按 `testResult.success` 二选一：成功→“服务可达”，其余一律→“网络不可达”。后端对 401/403 返回 `success=false` 且 message 为“鉴权失败（HTTP 401）：请检查 API Key 或权限”，于是标题与消息矛盾。

### 修复

- 位置：`Smart-WorkFlow-aPaaS-Web/src/modules/agent/views/ModelList.vue`
- 新增 `testResultHeadline(result)`：成功仍显示“服务可达”；失败取后端 message 冒号前的失败类别（如“鉴权失败（HTTP 401）”“请求超时”“网络不可达”）作为标题，无可识别类别时才回退“网络不可达”。不改变 message/latency 的展示语义。
- 回归单测：`ModelList.spec.ts` 新增 3 例（401 标题不显示网络不可达、成功显示服务可达、网络不可达仍为网络不可达），该文件 13/13 通过。

### 可见浏览器三态复验 ✅

操作路径：`/agent/model` → 供应商页签新建 `verify-title-p`（地址 `http://127.0.0.1:9998/v1`，桩 key）→ 模型页签新建 `verify-title-m`（`stub-model`，CHAT）→ 行内「测试」。

| 态 | 操作 | 标题 | 消息 | 截图 |
|---|---|---|---|---|
| 成功 | 桩 key `stub-ok-key` | 测试结果：服务可达 | 模型调用成功（122 ms） | `assets/f1-stage1-4-g2-success.png` |
| HTTP 401 | 编辑供应商改为错误 key | 测试结果：鉴权失败（HTTP 401） | 鉴权失败（HTTP 401）：请检查 API Key 或权限（4 ms） | `assets/f1-stage1-4-g2-auth-401.png` |
| 端口无监听 | 编辑供应商地址改为 `http://127.0.0.1:9997/v1`（无监听） | 测试结果：网络不可达 | 网络不可达：请检查服务地址（4 ms） | `assets/f1-stage1-4-g2-unreachable.png` |

补充：编辑供应商时密钥显示为 `st****ey` 掩码；留空保存保持旧密钥；截图与页面文本均无明文 key。

## F1S1-G3 sw-bootstrap 迁移门禁 ✅

### 修复前实测（原始输出 `assets/f1-stage1-4-g3-before.log`、`assets/f1-stage1-4-g3-upgrade-before.log`）

| 测试类 | 修复前结果 | 失败断言 |
|---|---|---|
| FlywayFullChainH2Test | 19/19 通过 | — |
| FlywayFullChainPostgresTest | 12/12 通过 | — |
| I6G7UpgradeDrillH2Test | 1 失败 | 全新库执行条数 expected 20, was 21 |
| I6G7bOldBaselineUpgradePostgresTest | 1 失败 | 全新库 20 vs 21；历史表成功记录 20 vs 21 |
| ApplicationCenterLegacyUpgradeTest | 1 失败 | 主链衔接 expected 0, was 1（V0.2.2 未登记） |
| ApplicationCenterUpgradeContinuityTest | 1 失败 | 主链衔接 expected 0, was 1 |
| ApplicationCenterRecoveryDrillPostgresTest | 跳过 | 宿主机无 `pg_dump`/`pg_restore` |

### 本轮改动

- `I6G7UpgradeDrillH2Test`：迁移条数 20→21、终点 0.2.0→0.2.2；新增 D022-03 升级演练测试：
  - 先迁到 `target=0.2.0` 基线，写入旧 `sw_agent_model_config` 三行（openai/ollama/other）；
  - 再迁满 V0.2.2，断言 ollama 行 `api_format=OPENAI_CHAT` 且地址补 `/v1`、other 行供应商停用、三行旧 id 原样且可从新表按 id 解析。
- `I6G7bOldBaselineUpgradePostgresTest`：全新库 20→21、历史表成功记录 20→21、终点 0.2.0→0.2.2。
- `ApplicationCenterLegacyUpgradeTest`：0.2.0 存量升级脚本衔接后仅执行新增 V0.2.2（0→1）；快照外新增 R__ 场景 7→8（7 支 R__ + V0.2.2），终点 0.2.0→0.2.2。
- `ApplicationCenterUpgradeContinuityTest`：主链衔接 0→1（仅 V0.2.2），不重放已登记 versioned/R__。

### 修复后实测（原始输出 `assets/f1-stage1-4-g3-after.log`）

命令：`mvn -pl sw-bootstrap test -Dtest='FlywayFullChainH2Test,FlywayFullChainPostgresTest,I6G7UpgradeDrillH2Test,I6G7bOldBaselineUpgradePostgresTest,ApplicationCenterLegacyUpgradeTest,ApplicationCenterUpgradeContinuityTest,ApplicationCenterRecoveryDrillPostgresTest'`

| 测试类 | 结果 |
|---|---|
| FlywayFullChainH2Test | Tests run: 19, Failures: 0, Errors: 0, Skipped: 0 |
| FlywayFullChainPostgresTest | Tests run: 12, Failures: 0, Errors: 0, Skipped: 0 |
| I6G7UpgradeDrillH2Test | Tests run: 2, Failures: 0, Errors: 0, Skipped: 0（含新增 D022-03） |
| I6G7bOldBaselineUpgradePostgresTest | Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 |
| ApplicationCenterLegacyUpgradeTest | Tests run: 7, Failures: 0, Errors: 0, Skipped: 0 |
| ApplicationCenterUpgradeContinuityTest | Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 |
| ApplicationCenterRecoveryDrillPostgresTest | Tests run: 1, Skipped: 1（宿主机无 pg_dump/pg_restore，按测试内建前置跳过） |
| **合计** | **Tests run: 47, Failures: 0, Errors: 0, Skipped: 1；BUILD SUCCESS** |

说明：
- 受 V0.2.2 影响的断言已按实际迁移条数更新；D022-03 搬运断言覆盖 ollama→OPENAI_CHAT 且补 `/v1`、other 停用、旧 id 原样。
- 本轮未改 pom 依赖；G6 的 Spring AI 移除属锁定项，受影响模块 sw-basic-agent 上轮已 328/328 通过，本轮未重跑。

### Web 门禁（本轮有前端改动，一并回归）

| 项 | 结果 |
|---|---|
| `npm run typecheck` | 通过（0 错误） |
| `npm run lint` | 通过（0 错误） |
| `npx vitest run` | 229 文件通过 + 1 跳过；Tests 2001 passed + 3 skipped |
| `npm run build` | ✓ built in 4.89s |
| `ModelList.spec.ts` | 13/13 通过 |

## 清理（已执行）

- DROP DATABASE `smart_workflow_f1v4`（含 verify-title-* 数据、桩 key 密文、临时登录密钥对应的密文）
- 停止 server(8080)、vite(5174)、桩(9998) 进程
- 删除本地临时 RSA/JWT/SSO/Cipher 密钥、桩脚本与启动脚本、运行日志（均在系统临时目录，不随仓库保留）
- 截图证据复制至 `product/0.2.2/receipts/assets/`（PNG 按仓库 `.gitignore` 规则仅本地留存）

## 限制与偏差

- G2 连通性目标为本地桩，未使用真实端点；这是执行提示明确允许的方式，三态语义与真实端点一致（鉴权失败由桩返回 401，端口无监听由 9997 真实拒绝连接）。
- `ApplicationCenterRecoveryDrillPostgresTest` 因宿主机缺少 `pg_dump`/`pg_restore` 跳过；该测试为备份恢复演练，不属于本次 D022-03 搬运断言范围。PG 迁移本体已由 FlywayFullChainPostgresTest 与 I6G7b 真实 PG 临时库覆盖。
- 截图 PNG 与原始日志位于 `receipts/assets/`，按仓库既有约定不入库；本轮回执记录文件名与断言原文，可本地复核。
- web 工作区存在与本轮无关的本地改动 `vite.config.ts`（allowedHosts），未纳入本次提交。
