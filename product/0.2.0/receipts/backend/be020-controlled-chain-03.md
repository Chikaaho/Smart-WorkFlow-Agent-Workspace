# be020-03 受控集成真实执行链证据与统一监听覆盖核查

2026-10-24｜Executor（后端）｜XL｜IN_PROGRESS｜自验通过，待 Planner 验收

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本回执关闭 be020-capability-contract-01 剩余项 4（J020 受控集成真实证据）并核查剩余项 5（统一监听副作用覆盖），不改变产品边界、不核销 P。

## J020 受控集成真实执行链（新增集成测试）

新增 `FormExtDatasourceControlledChainTest`（sw-bpm-engine integration），补齐 j020-form-events-01 声明的缺口——此前受控集成只有 G2 桩端口与执行器上限单测，没有「真实加密、真实连接池、真实执行引擎、真实外部库」的全链行为证据。本测试全链使用真实组件（真实 AES-256-GCM、真实 Hikari 独立池、真实 SqlExecutor 的 jsqlparser SELECT-only 校验/行数上限/超时、真实 form 端口适配），仅数据源登记解析与审计落库用桩；外部库为独立内存 H2，与主库隔离：

1. **真实查询成功**：密文解密建池 → 只读 SELECT 返回 2 行契约列（value/display）→ `auditSuccess` 留痕（数据源、SQL、行数、耗时、操作者）。
2. **写语句拒绝**：`INSERT` 在 SELECT-only 校验阶段被拒（执行前、不留执行审计），外部库行数不变（零副作用）。
3. **执行期失败**：表不存在的 SELECT 通过校验后执行失败，`auditFailure` 留痕（含诊断消息），无成功审计。
4. **目标缺失/停用**：停用与未登记数据源均以专用异常表达，端口适配转 `Optional.empty()`，查询未执行、零审计。
5. **行数上限**：maxRows=1 下两行结果明确抛 `ExternalDatasourceResultLimitExceededException`，不返回不完整行集。

验证：`mvn test -pl sw-biz/sw-bpm/sw-bpm-engine -am`（`MAVEN_OPTS=-Xmx2g`）exit 0，engine 全量 **175 tests / 0 failures / 0 errors / 0 skipped**（170 + 本批 5）；日志 `/tmp/f020-chain-engine-full.log`（本机留存）。

服务端受控集成契约结论（供前端/脚本面板消费）：脚本可用的集成入口即 `/form/ext/query/{queryKey}`（授权引用 + 启用契约 + 启用数据源 + SELECT-only + 限时/限量 + 审计）；原始网络、秘密、任意 SQL 不暴露给脚本层——本测试即为该边界的真实行为证据。

## 统一监听副作用覆盖核查（无新增代码）

对照任务表「同一 ProcessGraph.triggers、顺序/启停/条件/结果分支及发布快照；旧缺 enabled 视为启用；PROCESS_START 在实例建立后、PROCESS_COMPLETED 在终态提交后；按实例/事件/动作去重，失败可诊断，只重试未成功副作用」逐项核对既有事实：

| 要求 | 既有证据 | 结论 |
| --- | --- | --- |
| 旧缺 enabled 视为启用 | `TriggerExecutionService.isEnabled`：`enabled == null || TRUE`；测试 helper 不设 enabled，23+ 用例隐式覆盖 null 路径 | 已覆盖 |
| 禁用监听零执行（发起/终态均不执行） | `shouldSkipDisabledTrigger`（j020-a13-02 声明的新增断言） | 已覆盖 |
| PROCESS_COMPLETED 仅 APPROVED 终态触发 | `shouldTriggerProcessCompletedOnlyOnApproved` | 已覆盖 |
| PROCESS_START 同事务、实例建立后 | 实现注释 BF20261013-022⑥（实例创建成功同事务后判定）；入口 `onProcessStart` | 已覆盖 |
| 冻结版本按原配置运行、新版本零触发 | `shouldKeepFrozenTriggerForOldVersionAndSilenceNewVersion` | 已覆盖 |
| 旧图无触发器零行为 | `shouldNoOpOnGraphWithoutTriggers` | 已覆盖 |
| 实例/事件/动作幂等键去重 | `shouldSkipDuplicateExecutionByIdempotentKey`、`shouldDeduplicateIntentsByCommandKey`、`shouldFireNodeRoundCompletedWhenNodeQuiet`（exec_key 语义） | 已覆盖 |
| 载荷冲突可诊断、不冒称成功 | `shouldDetectPayloadFingerprintConflictOnConcurrentEnqueue` | 已覆盖 |
| 失败/UNMATCHED 落行可诊断、不派发 | `shouldRecordScriptFailureWithoutActions`、`shouldRecordUnmatchedWithoutActions`、`shouldBlockOnMissingRequiredVariables` | 已覆盖 |
| 顺序（版本 triggers 数组序） | 运行端按数组序执行（j020-a13-02）；发布快照冻结沿用 | 已覆盖 |

j020-a13-02 声明的剩余（发布版本上的可见浏览器验证：新旧配置回显、启停快照、单次副作用）属正式浏览器验收，由前端会话承担，后端无未关闭项。**剩余项 5 就此关闭，无需新增代码。**

## Git

- Server 提交 `6c03afb7c9f496fbaa5f6ce995d3620a0b731dad`（普通推送，远端 `origin/codex/0.2.0-tenant-form-flow` 回读同 SHA；1 文件 +187）。前置批次 `5e70b47`（be020-02）、`1b1f5f7`（be020-01 基线）。

## 剩余项状态（承接 be020-01 清单）

1. 数据源授权主体 —— 已交付（be020-02，`5e70b47`）。
2. 查询契约列表/启停 —— 已交付（be020-02，`5e70b47`）。
3. 密钥轮换 —— 更新已支持；独立密钥版本化轮换待 Planner 裁量。
4. J020 受控集成真实证据 —— 已交付（本回执，`6c03afb`）。
5. 统一监听副作用覆盖 —— 核查关闭（本回执，无新增代码）。
6. 节点库三项（起草/IoT指令/Agent）—— 差距已报 Planner 裁量（be020-01）。
7. 富文本值格式 —— 待与前端对齐既有值格式后补充契约（be020-01 已登记）。

授权内常规决定：受控链测试的审计桩替代登记/审计落库路径，理由是登记与审计已有控制器测试与既有审计单测覆盖，本测试聚焦执行链真实性。
