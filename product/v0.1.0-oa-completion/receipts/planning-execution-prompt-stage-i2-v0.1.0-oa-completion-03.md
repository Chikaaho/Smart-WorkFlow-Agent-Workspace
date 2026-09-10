# P60 I2 三级执行补充提示 03

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-10  
> 功能：P60 I2「低代码表单收口」  
> 级别：三级补充提示（二级提示后仍失败）  
> 当前状态：P60 `IN_PROGRESS`；I2 `VERIFYING`

## 1. 权威输入与替代关系

本提示替代 `planning-execution-prompt-stage-i2-v0.1.0-oa-completion-02.md`，是 I2 当前唯一执行入口；提示 01/02、回执 01—04仅作证据追溯，不同时作为待办。按顺序读取：

1. `planning-review-stage-i2-v0.1.0-oa-completion-04.md`；
2. 本提示；
3. 回执 04 及 `evidence/i2-04/` 中本提示明确引用的锁定附件；
4. `ready/direction-stage-i2-low-code-form-closure.md` §4.3—§4.7、§7；
5. 正式 terminal contract 与 Validator。

本提示已撤回“四类引用必须经同一公开删除入口分别命中”的规划过严要求。需求方向、角色权限和 Git 门禁其余部分不变。

## 2. 唯一剩余原子

父子映射：E0b2→E0b2a 已锁定 + E0b3；E2c2→E2c2a 已锁定 + E2c3；E5b2→E5b2a 已锁定 + E5b3；E6b2→E6b2a/E6b2b 已锁定 + E6b3a/E6b3b；E7b2→E7b2a 已锁定 + E7b3。仅以下六项可执行。

| 原子 | 正向目标断言 | 反向零残留断言 | 固定对象 | 允许替代 | 合法停止条件 |
|---|---|---|---|---|---|
| E2c3 | 已发布 target/main 上真实目标记录正向引用提交与回读成功；missing record 返回 1217；伪造非 ID 结构返回 1402 | 两个负向前后 record/draft/instance totals 完全相等，目标记录不变 | 一个 main form、一个 target form、一个真实 target record | 运行实例销毁可新建并登记映射；不得用“目标表单未发布”替代 record/shape 校验 | 无外部依赖，不得停止 |
| E5b3 | 启用态从正式流程发起入口启动一次成功；同 form 停用后同入口明确拒绝 | 停用请求后 instance/task 增量均 0，启用态既有实例仍可读 | 同一 formKey/processDefKey 与启用态 instance/task | 不要求再做四类独立删除分支；已锁定 E5b2a直接沿用 | 无外部依赖，不得停止 |
| E6b3a | admin 经正式表单导入入口导入一行，查询回读同一行 | filler/viewer/nobody 导入拒绝且记录数不增，无权字段不泄漏 | 同一 form、admin 与一个非 admin、同一 `.xlsx` | 若入口不存在，缺失即 I2 产品缺口，补齐受控入口后验证；不能以 NOT_APPLICABLE 关闭 | 无外部依赖，不得停止 |
| E6b3b | 两个不同非零/零租户上下文各有真实动态表对象，本租户读取成功 | A→B、B→A 的读写均拒绝，双方 before/after count 不变 | tenantA/tenantB、各自 userId/formKey/recordId | 优先真实登录；若产品入口确无，允许服务端上下文集成运行，但原始 stdout 必须打印全部字段和值 | 只有真实登录工具失败且上下文替代也无法运行并保存原始失败时 |
| E7b3 | 同一 form/oldVersion 上建立 draft/record/process/task/approval；撤权后 admin 发布 newVersion；旧对象仍按 oldVersion/oldValue 可读，新提交体现 newVersion/newValue | 被撤权主体对旧 record/draft 仍为 403/空；新定义不改写旧记录、实例、审批显示或快照 | 单一 formKey、old/new version、draftId、recordId、processInstanceId、taskId | 运行实例销毁可重建完整单链；不得拼接 E3b 或另一 form 的 process/task | 无外部依赖，不得停止 |
| E0b3 | 前五包全部通过后冻结最终三仓候选、terminal、manifest 与回执 | 回执末行 payload 与 Validator input 逐字节相等；账本无虚假 COMPLETED/BLOCKED/remaining=0 | 最终候选与回执 05 | 现有候选命令格式可沿用；发生代码变化必须重生候选和受影响门禁 | 仅正式 Git/Validator 工具真实失败并保存 stderr/exit |

## 3. 已锁定且禁止重验

- 验收 02/03 的 S-DEV-CAPTCHA-01、E0a/E0c/E1、E2a/E2b/E7a、E3a/E3b、E4a/E4b1、E5a/E5b1、E6a/E6b1、E8a/E8b继续锁定。
- 验收 04 的 E2c2a、E4b2、E5b2a、E6b2a、E6b2b、E7b2a继续锁定。
- 不重采 PC/移动/审批既有链、公式矩阵、数据源超限/扫描、附件伪造、删除保护、flowStart 权限对照、viewer 投影和撤权读拒绝。
- 新实现若触及锁定路径，只复验直接受影响断言并写明失效原因。

## 4. 六份独立证据包

新证据只写入 `product/v0.1.0-oa-completion/receipts/evidence/i2-05/`。每个包必须包含 `object-map.json`、原始响应/输出、`verdict.json`；`verdict.json` 的每个布尔字段必须由同包原始文件直接决定，不能引用回执自述。

### 4.1 E2c3 包

目录：`e2c3/`

必需文件：

- `object-map.json`
- `target-detail.json`：`code=0,status=PUBLISHED,targetRecordId`
- `positive-request.json`、`positive-response.json`、`positive-readback.json`
- `missing-before.json`、`missing-request.json`、`missing-response.json`、`missing-after.json`
- `forged-before.json`、`forged-request.json`、`forged-response.json`、`forged-after.json`
- `verdict.json`

`verdict.json` 必须恰有：`positiveControlPass`、`missingCode1217`、`forgedCode1402`、`missingZeroSideEffect`、`forgedZeroSideEffect`、`sameObject`，全部为 `true`。

### 4.2 E5b3 包

目录：`e5b3/`

必需文件：`object-map.json`、`enabled-start-request.json`、`enabled-start-response.json`、`enabled-instance.json`、`disable-response.json`、`disabled-before.json`、`disabled-start-request.json`、`disabled-start-response.json`、`disabled-after.json`、`existing-instance-after.json`、`verdict.json`。

`verdict.json` 必须恰有：`enabledStartCreatedOne`、`disabledStartRejected`、`disabledInstanceDeltaZero`、`disabledTaskDeltaZero`、`existingInstanceReadable`、`sameFormAndProcess`，全部为 `true`。

### 4.3 E6b3a 包

目录：`e6b3a/`

必需文件：`object-map.json`、`permission-definition.json`、`import-file.sha256`、`before-count.json`、`admin-import-request.txt`、`admin-import-response.json`、`admin-import-readback.json`、`nonadmin-before.json`、`nonadmin-import-response.json`、`nonadmin-after.json`、`verdict.json`。

`verdict.json` 必须恰有：`adminAuthorized`、`adminImportSuccess`、`adminImportedRowReadable`、`nonAdminRejected`、`nonAdminZeroSideEffect`、`sameFormAndFile`，全部为 `true`。

### 4.4 E6b3b 包

目录：`e6b3b/`

必需文件：`object-map.json`、`tenant-a-own-read.json`、`tenant-b-own-read.json`、`a-before.json`、`a-read-b.json`、`a-write-b.json`、`a-after.json`、`b-before.json`、`b-read-a.json`、`b-write-a.json`、`b-after.json`、`raw-command.txt`、`raw-stdout.txt`、`raw-stderr.txt`、`raw-exit.txt`、`verdict.json`。

若采用上下文集成替代，`raw-stdout.txt` 必须直接打印 `tenantA`、`tenantB`、两个 recordId、四个跨租户 code、四个 before/after count；测试退出 0 或另写摘要不能替代这些值。`verdict.json` 必须恰有：`twoDistinctTenants`、`ownReadsPass`、`crossReadsRejected`、`crossWritesRejected`、`tenantAZeroSideEffect`、`tenantBZeroSideEffect`，全部为 `true`。

### 4.5 E7b3 包

目录：`e7b3/`

必需文件：`object-map.json`、`old-definition.json`、`before-record.json`、`before-draft.json`、`before-instance.json`、`before-approval-view.json`、`revoke-response.json`、`revoked-record.json`、`revoked-draft.json`、`new-definition.json`、`old-record-after.json`、`old-draft-after.json`、`old-instance-after.json`、`old-approval-after.json`、`new-submit.json`、`new-record-readback.json`、`verdict.json`。

`object-map.json` 中 formKey、record/draft/process/task 必须互相勾稽；审批证据的 businessKey 必须等于 old recordId。`verdict.json` 必须恰有：`singleObjectChain`、`revokedSubjectDenied`、`newVersionPublished`、`oldRecordStable`、`oldDraftStable`、`oldInstanceStable`、`oldApprovalStable`、`newSubmissionUsesNewVersion`，全部为 `true`。

### 4.6 E0b3 包

目录：`e0b3/`

必需文件：三仓 `head/branch/status/diff-stat` 原始文件、`task-owned-crosscheck.md`、最后实现/测试/行为时间、受影响门禁 raw/exit、`terminal-input.json`、`terminal-stdout.txt`、`terminal-stderr.txt`、`terminal-exit.txt`、`terminal-verbatim-cmp-exit.txt`、`verdict.json`。

`verdict.json` 必须恰有：`allFiveBusinessPackagesPass`、`candidateAfterLastChange`、`affectedGatesPass`、`terminalValidatorPass`、`terminalEmbeddedVerbatim`、`manifestPass`、`truthfulWorkItems`，全部为 `true`。

## 5. 允许范围与执行顺序

| 维度 | 三级提示唯一范围 |
|---|---|
| 允许读取 | 验收 04、本提示、回执 04 的锁定附件、I2 方向、相关 Server 实现/工程宪法、terminal contract |
| 允许修改 | 仅在行为证明缺口时修改现有表单导入入口/`FormImportExportService` 及直接 controller/DTO/测试；若 E2c3/E5b3/E7b3 暴露缺陷，仅修改对应引用校验、状态/发起、快照读取的直接实现与测试；新增 `evidence/i2-05/`、回执 05 |
| 禁止修改 | 旧回执/旧 evidence/规划审查、主方向、knowledge/memory/todo 正式状态、Web 非受影响路径、I3+、无关工作树 |
| 执行顺序 | 建立一份共享对象图 → E2c3 → E5b3 → E6b3a/E6b3b → E7b3 → 受影响门禁 → E0b3 terminal → manifest → 回执 05 |
| 禁止事项 | `NOT_CAPTURED/NOT_APPLICABLE/LOCKED_PRIOR_EVIDENCE` 占位符、测试名代替原始值、跨表单拼接、未关闭项写 COMPLETED/BLOCKED/remaining=0、重验锁定项 |

E6b3a 若确认入口缺失，这属于本阶段动作权限产品缺口，继续实现，不需要 Planner 再授权。E5b3、E7b3 均无外部依赖。E6b3b 的服务端上下文替代已明确授权，不得只报告真实登录入口困难。

## 6. 终态、manifest 与回执封装

所有业务包的 `verdict.json` 全 true 后才生成唯一 `terminal-input.json`。正式 Validator 的 stdout/stderr/exit 与 input 一同纳入 manifest。随后生成并回读 manifest，最后写回执正文并逐字节附加：

```text
ENGINE_TERMINAL <terminal-input.json 的单行 JSON 原文>
```

必须对“去掉 `ENGINE_TERMINAL ` 前缀后的回执末行”与 `terminal-input.json` 做实际 `cmp`，把退出码保存为 `e0b3/terminal-verbatim-cmp-exit.txt`。该 cmp 可在临时回执候选上完成；最终回执不得再改 payload。manifest 排除自身和 manifest 回读文件，但必须包含六包原始证据、六个 verdict、terminal 四件套与 cmp 结果。

如果任一业务 verdict 不是全 true：不得生成 `EXECUTION_SUBMITTED + remaining=0`。只有满足正式 contract 的真实外部阻塞才可提交 `BLOCKED`；授权内未实现、未采集、入口缺失或对象拼接失败均不是外部阻塞。

## 7. 相对提示 02 的方法变化

- **删除**：删除已通过的 E4b2、附件伪造、删除保护、flowStart 权限、viewer 投影和撤权访问控制；撤回无法通过公开状态机分别命中的四引用分支要求。
- **原子化**：将 E6 拆为“授权导入”和“跨租户原始行为”两包；E7 只保留同对象流程/定义历史链；E0 只保留最终真值封装。
- **替代路径**：每个缺口一份独立目录和固定布尔 verdict；跨租户要求测试直接打印对象和值；引用负向必须先有正向控制；terminal 必须与回执末行 cmp。
- **提交条件**：六个 verdict 全字段为 true、manifest 回读 0、terminal cmp 0 且 work_items 与事实一致，才允许提交回执 05。

## 8. 全部为是才允许提交

| 门禁 | 是/否 | 唯一判据 |
|---|---|---|
| E2c3 全通过 |  | `e2c3/verdict.json` 全 true |
| E5b3 全通过 |  | `e5b3/verdict.json` 全 true |
| E6b3a 全通过 |  | `e6b3a/verdict.json` 全 true |
| E6b3b 全通过 |  | `e6b3b/verdict.json` 全 true |
| E7b3 全通过 |  | `e7b3/verdict.json` 全 true |
| E0b3 全通过 |  | `e0b3/verdict.json` 全 true |
| 六包对象无拼接 |  | object-map 与 businessKey/recordId/version 相互一致 |
| 最终终态真实 |  | Validator=0、cmp=0、remaining 与 work_items 一致 |
| 证据封装冻结 |  | manifest 回读=0，回执后无附件改写 |

## 9. 回执与合法状态

追加回执：

`product/v0.1.0-oa-completion/receipts/stage-i2-v0.1.0-oa-completion-05.md`

回执每项只写 `原子 → 原始附件 → 实际结果 → 边界`，末行必须是唯一 `ENGINE_TERMINAL`。合法提交状态仍为 `VERIFYING / EXECUTION_SUBMITTED`；Executor 不得写 I2 `PASSED/COMPLETED`、阶段三值、核销 P 编号、提交/推送 Git、移动方向或发布版本。

