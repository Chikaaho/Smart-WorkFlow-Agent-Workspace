# P60 I3 三级零裁量执行补充提示 03

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-11  
> 唯一依据：`planning-review-stage-i3-v0.1.0-oa-completion-04.md`  
> 下一回执：`stage-i3-v0.1.0-oa-completion-06.md`

## 1. 唯一入口与删除项

本提示替代二级提示 02，是唯一当前执行入口。旧提示、回执和审查只作证据指针，不同时作为待办。

从待办中删除并禁止重验：G4a、G4b、G5、G13a、G17b、i3-04 manifest 哈希完整性。新包不得复制这些证据。

新证据根固定为：`product/v0.1.0-oa-completion/receipts/evidence/i3-06/`。每个剩余原子一份独立目录；正向、反向和对象身份全部为“是”才允许提交。

## 2. 零裁量原子包

### Z0 — G17c 凭证清零包

- 完成条件：i3-03/i3-04/i3-05/i3-06 的 JWT、Authorization Bearer、access/refresh token 正文命中均为 0。
- 反向断言：不得把凭证移到备份、压缩包、/tmp 或新日志；不得输出凭证正文。
- 必需文件：`Z0/scan-command.txt`、`Z0/hit-files-before.txt`（仅文件名）、`Z0/hit-count-after.txt`、四目录重建后的 manifest/校验结果。
- 提交门：任一 after count 非 0，停止提交并继续脱敏。

### Z1 — G17a 最终候选与最终门禁包

- 完成条件：所有代码修复结束后执行 Server 全量、Web typecheck/lint/test/build、迁移全链、最终 package；全部原始流和 exit 位于 Z1。随后冻结唯一 snapshotId/JAR/Web/source hash，冻结后零代码修改、零重打包。
- 反向断言：不得引用 `/tmp` 日志；不得使用 a/b 混合快照；不得只跑模块回归替最终全量。
- 必需文件：各门禁 `command/stdout/stderr/exit`、可复算测试计数、`candidate.json`、`post-freeze-change-scan.txt`。
- 提交门：任何门禁非 0、原始流缺失或出现第二 snapshotId，禁止后续行为采集。

### Z2 — G1a/G1b/G2/G3 设计到发布包

- 正向断言：在冻结候选真实浏览器内完成拖入、移动、建立/调整连线、选择、删除、撤销、缩放、平移、适配、属性编辑、保存、刷新恢复；非法图一次返回多错误并定位，合法图 0 错误并发布；同图贯穿版本/部署/查看。
- 反向断言：不能用外部 PUT 构造设计器动作；属性面板不得显示 `[object Object]`；发布失败零部署，已发布版本不覆盖。
- 必需文件：`Z2/actions.json`（每步 before/after nodes/edges/x/y/source/target/config/canvas）、连续截图或事件记录、脱敏 HTTP、graph hash 对照、版本/deployment/instance 表。
- 提交门：动作列表任一项没有前后值或使用外部 API 代做，Z2 不得标完成。

### Z3 — G6/G7 审批语义与退回包

- 正向断言：APPROVE/DISAPPROVE/RETURN/REJECT 在普通与会签中枚举、任务、意见、轨迹、通知、终态一致；RETURN 建新轮次并证明可改范围、路径重走、取消原因和历史回看。
- 反向断言：DISAPPROVE 不得落 REJECT；任何必需 trace/notify/opinion 不得为空；非法目标/重复/越权零副作用。
- 必需文件：每动作独立 requestId 对象链和 RETURN 的 form before/after/scope。
- 提交门：空字段计数必须为 0。

### Z4 — G8 会签与双进程包

- 正向断言：最终候选上 ALL/ANY/RATIO/VETO 最小正反；逐票前后 total/completed/positive/status；同任务重复及同结算边界双进程竞争只有一次合法副作用。
- 反向断言：未达阈值不得终结；HTTP 500=0；重复票/推进/终态=0。
- 必需文件：两 PID 同一时间窗原始请求、每票 SQL、最终断言。
- 提交门：不得引用 frozen-a 或旧 step4 摘要。

### Z5 — G9/G10/G11 生命周期动作包

- 正向断言：串/并行加签及补签覆盖完成、取消、越权、失效、重复；委托覆盖受托办理与回归/受控完成；代理覆盖范围、时间前中后、撤销既有/新任务、停用、跨租户；撤回/沟通/废弃对象链完整。
- 反向断言：表态后不得 PENDING；重复/越权不得 code 0；assignee/comm/trace/audit/cancelReason 不得为空。
- 必需文件：每类一份 JSON，包含 before/after 行和真实身份；`Z5/assertions.json` 汇总所有空值/错误成功/第二副作用计数为 0。
- 提交门：只说明“复用同一链”不通过。

### Z6 — G12 调度包

- 正向断言：提醒、催办、升级、实际启用自动策略均真实触发；至少一例通知失败而审批结果不回滚；两个最终候选进程在同一时间窗扫描同一个 deadline，恰一认领/一动作/一通知/一终态。
- 反向断言：B 进程日志不得为空；不同轮次各成功不能冒充竞争；同形 SQL 不接受；重复动作=0。
- 必需文件：A/B 完整调度日志、共同 deadline ID、扫描开始/结束、DB before/after、通知失败注入结果。
- 提交门：必须看见两个 PID 对同一 deadline 的扫描事实和唯一结果。

### Z7 — G13b handleResult 包

- 正向断言：合法白名单变量真实写回且审计非空；越权变量、非法名、超限、异常、重复调用分别有确定拒绝/幂等行为。
- 反向断言：状态机、表单、权限不能被绕过；生产能力端点/注册表任意脚本入口=0。
- 必需文件：每例输入、变量 before/after、错误码、调用计数、audit row、生产反向扫描。
- 提交门：不能只引用实现正则或单测类名。

### Z8 — G14 意见表单包

- 正向断言：组件目录来自服务端权威能力 HTTP 响应；每个允许/禁止项由参数化真实请求证明；普通、会签、加签、补签、退回五类均有初始化、提交、快照、历史回显和主表单逐字段零变化。
- 反向断言：禁止项 config/validate/publish/提交层按契约全部拒绝；补签必须存在 SUPPLEMENT_SIGN 快照；RETURN 必须 code 0 且 round 非空；main form before/after 不得为空。
- 必需文件：服务端能力响应、矩阵生成结果、五类独立对象 JSON、版本变化前后快照 hash。
- 提交门：出现 code 2308、空 round、空 supplement snapshot 或空 form diff，Z8 失败。

### Z9 — G15/G16 权限与总账包

- 正向断言：管理员、发起人、审批人、转入人、受托人、代理人、沟通人、无权、跨租户使用非空身份；每项职责有页面/深链/API 正向和至少一个非职责负向；总账以 requestId 串起全部对象。
- 反向断言：HTTP 500=0、跨租户泄漏=0、无权副作用=0、必需字段空值=0、重复/并发第二副作用=0。
- 必需文件：身份/权限资源表、正负矩阵、machine ledger、完整性断言；不能选择性忽略 trace actor、opinion snapshot 或 command chain。
- 提交门：总账任何 empty/duplicate/leak/error500 计数非 0，Z9 失败。

### Z10 — G17c 终态封装包

- 完成条件：i3-06 manifest 排除自身/缓存并覆盖全部附件；实际计数只出现一个值；terminal payload 原文件进入包；Validator 对该原文件运行并保存 command/stdout/stderr/exit；回执 JSON 与 payload 哈希一致。
- 反向断言：不得引用 `/tmp` payload；不得用空输出+手写 exit 替代命令绑定；不得在存在未完成原子时写 remaining=0。
- 必需文件：`manifest.json`、`manifest-verify.*`、`terminal-payload.json`、`validator-command.txt`、`validator-stdout.txt`、`validator-stderr.txt`、`validator-exit.txt`、payload hash 对照。
- 提交门：Z0—Z9 全部 PASS 后才生成 Z10。

## 3. 固定执行顺序

1. 立即完成 Z0，不等待业务修复。
2. 修复 Z2/Z3/Z5/Z6/Z7/Z8/Z9 的直接产品反证；聚焦测试失败就继续修复。
3. 执行 Z1 全部门禁、package 并冻结；冻结失败不得采行为。
4. 在唯一冻结候选上依次采 Z2—Z9；不得热替换 JAR、修改源码或重打包。
5. 完成环境清理（引用已锁定 G17b 方法即可），生成 Z10 并运行 Validator。
6. 只有 Z0—Z10 全部 PASS 才提交回执 06；否则继续执行，或在真实外部阻塞且独立工作穷尽时按契约提交 `BLOCKED`。

## 4. 允许与禁止

- 允许修改：仅剩余原子直接涉及的设计器、动作、调度、函数、意见、权限/审计代码与测试；安全脱敏既有证据；新增 i3-06 和回执 06。
- 允许命令：聚焦/全量测试、迁移、package、浏览器、真实 HTTP/SQL、双进程调度、扫描、哈希、Validator、受控清理。
- 禁止：改需求方向或正式状态；重验锁定项；近似证据；外部 PUT 代替设计器交互；SQL 代替调度器；源码枚举代替能力响应；`verdict` 覆盖真实失败字段；保留秘密；把可执行缺口写成等待 Planner。

## 5. 相对二级提示的升级

- 删除 G4a、G13a 两个新锁定项及此前锁定项。
- 将每个剩余缺口强制为独立目录和独立 PASS/FAIL 门，不再接受一个大 JSON 选择性汇总。
- 把已发生的近似替代明确封死：外部 PUT、同形 SQL、源码枚举、跨轮 PID、`/tmp` 日志/载荷均不可接受。
- 提交条件从“矩阵自述完成”收紧为 Z0—Z10 原始正反断言全部为是；任何实际字段与 verdict 相反即禁止提交。

合法功能状态仍为 `VERIFYING`，合法 Executor 提交状态为 `EXECUTION_SUBMITTED`；Planner 未通过前不得写 PASSED/COMPLETED、核销编号或晋级正式基线。

