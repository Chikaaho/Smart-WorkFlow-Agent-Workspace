# v0.0.1-beta 固定候选终验 · 规划审查

> 日期：2026-08-30
> 审查对象：`final-candidate-audit-receipt-20260830.md`、`search_fallback/v0.0.1-beta-final-candidate-audit.md`
> 执行任务验收：`PASSED`
> 发布候选裁决：`NOT_READY`

## 结论

执行层完整核验了固定三仓提交组，并如实保留后端全量测试的进程异常。回执的固定输入、候选范围、前端四门、后端构建与启动、H2 V44、Redis 三态和 tag 事实均有行为结果，执行任务本身验收为 `PASSED`。

发布候选仍为 `NOT_READY`。唯一未满足条件是后端根全量测试没有形成 `955/0/0/0` 的候选证据：`ApprovalProcessIntegrationTest` 启动阶段发生 `Abort trap: 6`，进程退出码 134，且定向进程内复核仍复现。现有回执未给出可区分候选缺陷、JVM/原生崩溃或运行环境资源异常的根因，因此不能把该结果按偶发环境噪声放行。

## 逐项核销

| 编号 | 终验条件 | 行为证据 | 规划判定 |
|---|---|---|---|
| F1 | 三仓固定提交精确、隔离工作树 clean | 三仓 detached HEAD 与完整 SHA 匹配，均 clean | `PASSED`，锁定 |
| F2 | 候选范围与 B1～B3 一致 | 根仓为发布文档；后端仅 README/JWT 过滤器；前端仅 live spec | `PASSED`，锁定 |
| F3 | 前端最终提交四门通过 | typecheck/lint/test/build 均通过；110f/1060t/0sk | `PASSED`，锁定 |
| F4 | 后端全量 955/0/0/0 | `ApprovalProcessIntegrationTest` 启动时 exit 134，Tests run 0 | `FAILED`，唯一缺口 |
| F5 | 候选构建与干净启动 | 隔离 Maven 仓构建成功；H2 44 migrations 到 V44；应用启动 | `PASSED`，锁定 |
| F6 | Redis 与认证三态 | 401、登录 200/code0、Redis 停机 503、恢复 200/code0 | `PASSED`，锁定 |
| F7 | 最小业务链适用性 | 候选差异未触碰锁定业务链，影响矩阵成立 | `PASSED`，锁定 |
| F8 | tag 冲突与追溯 | 三仓本地/远端无同名 tag，三元组可追溯 | `PASSED`，锁定 |

## 后续处理

仅针对 F4 下发 `search_task/v0.0.1-beta-backend-exit134-diagnosis.md`。执行层不得重跑前端、完整业务链、Redis 三态或其他已锁定项，也不得修改候选。

- 若证明 exit 134 是可识别、已消除的环境/JVM异常，并在固定提交 `ba59539` 上取得规定的稳定通过证据，规划复核后可直接恢复最终发布裁决；
- 若发现候选代码或测试存在确定性缺陷，或在受控环境仍无法得到完整通过，固定候选失效，由规划另行下发最小修复方向；
- 在 F4 核销前不得创建或推送 `v0.0.1-beta` tag。

