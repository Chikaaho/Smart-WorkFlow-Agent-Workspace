# v0.0.1-beta 最终发布就绪 · 规划裁决

> 日期：2026-08-30
> 审计快照：根 knowledge 仓 `a86cbbd`
> 代码发布候选：后端 `ba59539` / 前端 `f3a8988`
> 发布候选裁决：`READY`

## 最终结论

`v0.0.1-beta` 最小功能闭环、发布阻断修复、固定提交终验及后端稳定性补证均满足既定验收标准。规划确认后端与前端固定提交组成可发布代码候选，状态为 `READY`。

设备管理不属于本 beta 的最小功能要求；P45、P51、P52、P53 等后续候选不影响本次发布。

## 最终证据矩阵

| 编号 | 发布条件 | 最终行为证据 | 裁决 |
|---|---|---|---|
| F1 | 固定提交与隔离工作树 | 三仓完整 SHA 精确匹配，detached checkout clean | `PASSED` |
| F2 | 候选范围 | 根仓发布文档、后端 README/JWT 异常路径、前端 live spec；与 B1～B3 一致 | `PASSED` |
| F3 | 前端质量门 | typecheck、lint、test、build 全部退出码 0；110 files / 1060 tests / 0 skipped | `PASSED` |
| F4 | 后端全量测试 | `ApprovalProcessIntegrationTest` 定向 3 连过；固定提交全量 2 次均为 955/0/0/0 | `PASSED` |
| F5 | 构建与首次启动 | 隔离 Maven 仓构建成功；安全注入 `SW_CIPHER_KEY`；H2 完成 44 migrations 到 V44 | `PASSED` |
| F6 | 认证与 Redis | 无 token 401；登录 200/code0；Redis 停机 503；恢复后 200/code0 | `PASSED` |
| F7 | 最小业务闭环 | 用户/组织/角色、表单、单节点流程、提交、审批、结果与流转记录已锁定通过；候选差异未触碰该链 | `PASSED` |
| F8 | tag 与追溯 | 两个代码仓库本地及远端无同名 tag；固定提交对可唯一还原前后端发布物 | `PASSED` |

## F4 核销依据

两份 macOS crash report 将 exit 134 的 abort 站点唯一定位在 JVM AWT/AppKit 注册路径；候选仓库未发生任何修改或测试语义调整。由于具体窗口级触发条件无法事后唯一重建，执行层采用保守门槛完成：

- `ApprovalProcessIntegrationTest` 连续 3 次通过，每次 2/0/0/0；
- 后端根全量连续 2 次通过，每次 955/0/0/0；
- 两次全量后无新增 Java crash report。

该证据满足定向诊断方向的“根因未完全重建时全量连续通过 2 次”门槛，F4 正式核销。

## 固定发布方式

在取得 Git 发布授权后，发布动作只能使用以下映射：

| 代码仓库 | tag | 目标提交 |
|---|---|---|
| 后端仓 | `v0.0.1-beta` | `ba5953977ef8b8684e0d551216283727b7540ad4` |
| 前端仓 | `v0.0.1-beta` | `f3a89888e022d8b1c9de658e5a6cb5f97a8a9a2b` |

- 两个代码仓库分别创建同名 annotated tag，不从可漂移的分支 HEAD 推导目标；
- 两个 tag annotation 相互记录前后端完整 SHA，作为组合发布索引；
- 推送前再次只读确认同名 tag 不存在及目标 SHA 一致；
- 根 knowledge 仓保留审计记录，不进入 tag 创建或推送范围。

## 状态与下一动作

- 发布候选：`READY`；
- 发布阻断：无；
- 当前唯一下一动作：取得对后端、前端上述精确 tag 创建与推送的 Git 发布授权，然后按固定映射执行并回读本地/远端 tag 指向。
