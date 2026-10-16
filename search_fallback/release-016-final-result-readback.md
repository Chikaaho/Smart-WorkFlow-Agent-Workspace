# 0.1.6 发布完成结果回读（回传）

2026-10-16｜Executor→Planner｜对应 `search_task/release-016-final-result-readback.md`｜最终回执：`product/0.1.6-release/receipts/release-016-02.md`（本文件为其压缩回传；不新增发布动作、未重跑已验证项）

## 1. 结论

0.1.6 **已发布并已在 UAT 交付**（两仓 CI 发布成功 + 成对语义 tag/Release + UAT 就地升级部署 + 可见最小业务链）。发布前态的"两仓 CI 失败、无 Release/制品、UAT 0.1.5"是 `release-016-01.md` 时点事实，现已被本轮结果取代；发布/部署事实分列见 §4。

## 2. 两仓发布结果与来源

| 项 | Server | Web |
|---|---|---|
| 修复提交（分支 `feature/release-016-ci-fix`） | `e115857` | `f91e8bf` |
| develop/main 回读 | 两者均 = `e1158571bc3e75f96c1c4d2b9751ca98e8330a0f` | 两者均 = `f91e8bf2307a02f2aad95234df52627ab2d23735` |
| CI（main 推送） | run `38849696705` **success** | run `38849736987` **success** |
| 自动 Release（CI） | `build-e115857…` 标题 `CH-aPaaS-Server 0.1.6 build e115857…`；资产 `bootstrap.jar`（label `bootstrap-0.1.6.jar`，217,870,418 B，sha256 `d32b4752039f7faad581345b8e6b69691679df31bfe8d1aaeaf03540cfaf8145`） | `build-f91e8bf…` 标题 `CH-aPaaS-Web 0.1.6 build f91e8bf…`；资产 `dist-f91e8bf….zip`（1,331,541 B，sha256 `c6f173083892c06cb8220a01a38d787f7ff0100fef716cb627ccdbe6ef10dd6e`） |
| **成对语义 tag/Release** | tag `0.1.6`（对象 `10ce7194…`）→ `e115857`；Release `CH-aPaaS Server 0.1.6`，资产 `bootstrap-0.1.6.jar` | tag `0.1.6`（对象 `6b09d66d…`）→ `f91e8bf`；Release `CH-aPaaS Web 0.1.6`，资产 `sw-web-dist-0.1.6.zip` |

- 发布前已核实两仓此前无 `0.1.6`（亦无 `0.1.5`）tag/Release；未覆盖/移动既有 `0.1.0/0.1.2/0.1.3`。

## 3. 两项原 CI 失败的实际解决

- **Server**：`P63ImmediateMqttBrokerPgTest` 与 `P63ReservationUnknownPgTest` —— 所需隔离设施改由**测试源承载**（`P63ControlledMqttBroker` 18830／`P63ControlledDevicePeer` 9778／`P63LoopbackPeerTransport`；协议就绪探测＋接收记录＋有界清理，缺设施显式失败），未跳过、未放宽、未关门禁；**归因更正**：`P63ReservationUnknownPgTest` 主因是默认/发布构建未装配 loopback provider（日志"发送通道未装配"），资产缺失为并因。定向复跑 2/0/0/0 与 1/0/0/0；CI 中 sw-bootstrap **256/0/0/34**、全仓汇总 **2046/0/0/34**。
- **Web**：`pnpm lint` 32 项 `import/no-restricted-paths`（13 文件）改经 **7 个 `src/adapters/*` 接缝**整改；未改 ESLint 配置、未放宽规则。四检在 CI 与本地两轮均通过（本地 169 文件通过+1 跳过、1549 用例通过+3 跳过）。
- 该两项原被登记为"外部资产缺失按环境依赖隔离"的既有失败，**本轮起不再需要该豁免**。

## 4. 工作流版本与 eslint 模块规则生效结果

- **工作流采用版本**：Server = 0.1.6（CI effective version 断言 `0.1.6-SNAPSHOT` 通过后以 `-Drevision=0.1.6` 驱动；制品门禁回读 `build.version=0.1.6`＝期望发布版本）；Web = 0.1.6（Release 标题取自 `package.json`）。
- **eslint 模块规则**：模块清单经治理提交 `341b9a5` 修正为当前 `src/modules`；实测违规集合 32 项（与旧 CI 数字一致），整改后 0 error；**边界有效性探针**（stdin 不落盘）：模块内直引 `@/modules/workflow/api` 仍被检出（exit 1）、经 `@/adapters` 接缝导入通过（exit 0）。

## 5. 实际部署状态（与发布事实分列）

- **UAT（chikaho.cn 单机）**：由 0.1.5 **就地升级**至 0.1.6（S1 脚本 `upgrade-to-0.1.6-from-0.1.5.postgresql.sql`）——DB versioned 终点**单条 0.1.6**（checksum `-1768731444`）、`R__` 单次新增 1 支、**零 versioned 重放**；jar 与前端替换为本次 CI 制品（sha256 本地/远端一致）；健康 `/api/actuator/health` **200**、`Started StarterApplication in 190.418s`、启动段 **ERROR 0**。
- **可见最小业务链**（可见浏览器 1280×720，系统管理员会话）：应用中心（承接应用 `未分类` 2 业务表单）→ 表单数据列表（读取正常）→ 表单发起（记录 `6af86ef6-681e-4a39-b591-74255e4b88eb`、"Process started"）→ 待办 `20261016-002` Approve → 我发起的 **Approved**；库内 `sw_bpm_instance` 实例 `61117ffe-c91c-11f1-a743-00163e0d142f`=APPROVED。
- 备份/回滚入口：`/data/backup/smart_workflow_20261016_1236_pre016.dump`、`bootstrap.jar.bak`、`web.bak-20261016_1236`（jar 回滚需连同 DB 回填，见回执 §5.2）。
- 限知：非超管受限视角的数据权限对照未做；UAT 新增验收数据待 Owner 处置。

## 6. 受影响当前入口（已同步）

knowledge（`current-status`／`session-handoff`／`known-issues`／两处 feature 档）→ memory 五件（单文件 <5KB、总量 19,916 B）→ todo（需求池 + 前端边界待办已处置）→ 根 `CHANGELOG.md`（新增 0.1.6）／`docs/ops/production-ops.md` §8.3（0.1.6 升级通道）→ 两仓 README 与 Server `功能清单.md` 焦点行。历史回执保留原时点；未决项与限知见回执 §7。

**唯一下一动作（Planner）**：复核 `release-016-02.md` 与发布/部署事实，按实际发布验证集合下发唯一终态值清单并完成终审。
