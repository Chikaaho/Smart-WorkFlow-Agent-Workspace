# P60 I3 二级执行补充提示 02

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-11  
> 依据：`planning-review-stage-i3-v0.1.0-oa-completion-03.md`  
> 下一回执：`stage-i3-v0.1.0-oa-completion-05.md`

## 1. 替代关系与精确输入

本提示**替代一级提示 01，成为唯一当前执行入口**。一级提示、回执 01—04、审查 01—03仅作追溯，不同时作为待办；I3 正式方向不变。

执行只需读取：

1. I3 正式方向；
2. 规划验收 03；
3. 本提示；
4. 回执 04；
5. `i3-04` 中以下定位附件：`final-candidate-fingerprint.txt`、G1a/G1b 三份浏览器文本、`g6_g11/step20.json`、`g8_dual/*.json`、`g12_g13/step21.json`、`g14_g16/step22.json`、`g15_idents/identity-matrix.json`、`g16_ledger.json`、`credential-redaction.txt`。

禁止重新展开 G4b、G5、G17b 和 manifest 哈希完整性；这些原子已锁定。

## 2. 唯一剩余原子矩阵

| 原子 | 最新失败事实 | 唯一完成条件 | 最小原始字段/附件 |
|---|---|---|---|
| G17a | 回执 hash `76e7...`，指纹附件 hash `40a75...` | 所有修复、测试、打包完成后只冻结一次；启动日志逐 PID 记录同一 JAR hash，之后不再改代码/重打包；所有行为附件引用同一 snapshotId | source/diff hash、JAR/Web hash、package 时间、PID/端口/DB、每步 snapshotId |
| G1a | 交互步骤是叙述，刷新只回读 ID | 浏览器实际完成拖入、移动、建/调连线、选择、删除、撤销、缩放/平移/适配、属性保存与刷新；前后 node/edge/坐标/端点/config/canvas 可比较 | 事件级原始记录或连续截图/DOM、保存请求响应、刷新 graph 字段对照 |
| G1b | 最终仍报 FIXED_USER 未实现，无成功校验 | 明确面板字段语义并修复；一次返回多错误、逐项定位正确对象；填入合法配置后同一草稿校验为 0 且可发布 | 错误 HTTP/DOM、定位前后 selected ID、成功 HTTP/DOM、发布结果 |
| G2/G3 | 图/version 行为未绑定最终候选 | G1 草稿同图贯穿保存/校验/发布/版本图/定义与实例查看；版本冻结、挂起/激活、安全删除、失败零部署仍成立 | 工具生成 graph hash/字段 diff、definition/version/deployment/instance IDs |
| G4a | 无真实 FAILED 状态 | 构造真实失败实例，并与当前/完成/取消/未经过一起证明节点和边状态映射；失败不能用 WITHDRAWN/DISCARDED 代替 | 每种状态的实例/节点/轨迹 ID、浏览器 DOM/截图、服务端状态回读 |
| G6/G7 | trace 为空；RETURN 缺表单/取消原因 | 四动作在普通/会签保持枚举分离，轨迹/通知/意见非空；RETURN 新轮次、可改范围、重走路径、取消原因可回看 | 每动作 requestId、action、task、instance、trace、notify、opinion；RETURN round/formScope/cancelReason |
| G8 | 修正矩阵尚未绑定最终候选 | 最终候选上重放最小模式正反和双进程重复/竞争；未达阈值保持 RUNNING，全部败者无 500，结算/推进/终态唯一 | 每票前后 completed/positive/total/status，双 PID 请求结果，最终票/动作/实例计数 |
| G9a | 表态后加签仍 PENDING，无取消 | 串行与并行均完成正向、取消、越权、失效、重复；表态后状态和顺序真实变化 | sign IDs、seq、before/after status、cancelReason、HTTP code |
| G9b | 重复和越权均 code 0 | 重复与越权明确拒绝且零第二副作用；取消/失效人员成立；原终态不变 | HTTP code、行数 before/after、原终态、cancelReason |
| G10a | 委托后 assignee 为空 | 展示 delegate 后 owner/assignee，受托人完成后回归原责任人确认或配置的受控完成；全过程意见/轨迹可回看 | task owner/assignee/status 每阶段、两个身份请求、action/trace |
| G10b | 缺范围/过期/停用/跨租户 | 正向代理、流程/节点范围、时间前/中/后、撤销对既有和新任务、停用、跨租户、冲突/循环/自我全部有确定结果 | rule scope/time/status、task assignee、audit、HTTP、零串办回读 |
| G11 | comm_row/trace 为空 | WITHDRAW/COMMUNICATE/DISCARD 的正负/重复、沟通独立记录、关闭任务、轨迹、通知、取消原因和单一终态齐全 | 三类 requestId 对象链；comm row、trace row、notify row 非空 |
| G12a | 仅 AUTO_APPROVE | 对产品实际启用的提醒、催办、升级及自动策略逐类真实触发；至少一例通知发送失败而审批合法结果不回滚 | deadline/config/version、扫描前后、traceType、notify failure、instance/action status |
| G12b | 两条 SQL UPDATE 冒充调度竞争 | 两个真实应用实例同时执行调度入口/扫描器竞争同一 deadline，只认领并产生一次合法效果 | 两 PID 调度日志、deadline before/after、action/notify/instance 行数 |
| G13a | 八类负向未运行 | 在隔离注册表/测试配置注册受控故障函数，运行超时、异常、非法/跨租户用户、非法/超限输出、重复调用、失败策略与审计；不增加生产脚本入口 | 函数 ID/version、输入摘要、结果/错误码、调用次数、audit、生产注册表反向扫描 |
| G13b | script-entry=false，审计 `{}` | handleResult 正向写白名单变量；越权变量/超限/异常/重复被拒或幂等；审计非空；生产能力端点和注册表无任意脚本执行入口 | 变量 before/after、HTTP/错误、audit row、能力端点/注册表扫描 |
| G14a | 目录来自前端常量，拒绝仅为代码声明 | 从 P57/I2 服务端权威能力响应生成全组件矩阵；每个禁止类型用参数化真实 validate/publish/构造请求证明双拒绝 | 能力端点原始响应、生成矩阵、每类响应码/零部署/零动作汇总 |
| G14b | 缺加签/补签/退回轮次 | 普通、会签、加签、补签、退回轮次五类均执行初始化、服务端校验、提交、历史回显；主表单前后逐字段不变；版本变化后旧意见不漂移 | 五类 task/round/action IDs、init/source version、opinion snapshot、main-form diff |
| G15 | ID/tenant 为空，业务角色同质，出现 500 | 身份响应中 userId/tenantId/role 非空且职责可区分；页面/深链/API 权限一致；无权/跨租户全部为确定 4xx 业务结果、零 500/零副作用 | 身份表、权限资源、各职责正向和无权/跨租户负向请求、对象行数 |
| G16 | 上游存在空/错误字段 | 由上述场景自动生成总账，requestId 串起任务、实例、轮次、参与人/代理、意见、轨迹、通知和持久化；不得出现必需字段空值 | machine-generated ledger + completeness assertions + duplicate/concurrent count assertions |
| G17c | raw transcript 仍含 Bearer/JWT；无 Validator 附件 | 立即不可逆脱敏 i3-03/i3-04；新包不写凭证；保存真实 Validator stdout/stderr/exit；回执十字段与剩余账本一致，所有计数只出现一个值 | 扫描命令/文件清单/LIVE=0、validator input/output/exit、manifest count、terminal JSON |

## 3. 允许修改范围

- 允许修改：上述失败事实直接涉及的流程设计器、审批动作/会签、加补签、委托/代理、调度、节点函数、意见校验/历史、身份权限和审计实现及其测试。
- 允许新增：隔离故障函数测试资产、最终候选冻结/证据采集脚本、`evidence/i3-05/`、回执 05。
- 安全例外：必须不可逆脱敏 `evidence/i3-03/`、`evidence/i3-04/` 中现存 Authorization/JWT；脱敏后重新生成两目录 manifest。不得把原凭证复制到备份或新附件。
- 禁止修改：I3 正式方向、Planner 审查、已确认正式状态、功能数、清单、P 编号及已锁定功能代码。

## 4. 允许命令与固定执行顺序

1. **立即脱敏**：只列命中文件名和数量，不输出凭证正文；不可逆替换后扫描 JWT/Bearer 形态为 0，并重建 i3-03/i3-04 manifest。
2. **修复直接反证**：先关闭 G1b、G6/G7、G9—G16 的产品/证据缺口；每项聚焦测试通过后再进入下一阶段。
3. **工程门禁**：运行受影响聚焦测试、迁移全链、Server/Web 正式全量门禁和最终 package；失败必须保留原始流并继续修复。
4. **冻结候选**：在所有代码/构建完成后生成一次 snapshotId 和源码/JAR/Web 指纹；此后禁止改代码、禁止重打包。
5. **行为采集**：用冻结产物启动两个真实进程，依次采 G1—G16 剩余行为；每个附件写 snapshotId。可并行的仅是不共享业务对象的只读采集。
6. **最终收尾**：清理并回读 → 生成 i3-05 manifest → `shasum -c` → 写 terminal-contract → 运行真实 Validator → 保存 stdout/stderr/exit → 最后写回执 05。

允许使用浏览器、真实 HTTP/SQL、双进程隔离运行、聚焦/全量测试、迁移、打包、哈希、扫描、Validator 和受控清理。禁止用人工 verdict、同形 SQL、代码存在或“复用同一链”替代规定行为。

## 5. 每个原子必须保存的原始字段

回执正文仍只写四要素：`原子 → 文件/位置 → 实际结果 → 边界`。原始附件至少保留：

- `snapshotId`、时间、PID/端口/DB/定义/实例/任务/用户；
- 请求方法、URL、脱敏请求体、响应码/业务码；
- 查询语句或查询标识、原始行、before/after count；
- 浏览器动作前后 DOM/截图或事件记录；
- 测试/构建/迁移/扫描/Validator 的 stdout、stderr、exit；
- 清理前后及 manifest 工具回读。

## 6. 相对一级提示新增与收紧

- **删除**：G4b、G5、G17b、manifest 哈希完整性从待办删除，禁止重验。
- **原子化**：G17a 提升为所有运行证据的前置门；G17c 分成凭证、Validator、唯一计数三个可直接判断的结果；G9—G16 按现有空字段/错误响应逐项关闭。
- **替代路径**：节点函数负向允许隔离注册表/测试配置故障函数，不要求生产开放注入；身份可由最少用户兼任不冲突职责，但必须有非空身份和差异权限。
- **方法改变**：门禁和 package 前置，冻结后才采行为；不再“采证过程中反复替换 JAR”。调度竞争必须走两个实际扫描器，不接受同形 SQL。
- **提交判定**：所有 JSON/查询字段与 verdict 同向，正文不再含“未完成/待下轮/需方向裁决”，所有可执行项为 0；否则不得提交 Planner。

## 7. 提交前核对矩阵

- [ ] i3-03/i3-04/i3-05 对未脱敏 Bearer/JWT 的扫描均为 0？
- [ ] 回执、指纹、进程启动、行为附件和门禁只有一个 snapshotId/JAR hash？
- [ ] G1b 合法配置校验为 0，设计器全部动作有前后状态？
- [ ] G4a FAILED 与其他四态均有真实实例和轨迹映射？
- [ ] G6—G11 所有必需 trace/comm/audit/status 非空，重复/越权不再 code 0？
- [ ] G8 未提前结算且竞争零 500？
- [ ] G12 是真实双扫描器行为并覆盖提醒/催办/升级/通知失败？
- [ ] G13 所有正负边界已运行，script 反向断言为 true、审计非空？
- [ ] G14 五类办理和服务端全组件矩阵均为真实行为？
- [ ] G15 身份字段非空可区分、无权/跨租户零 500？
- [ ] G16 总账 completeness assertion 为 0 缺失、重复/并发为单副作用？
- [ ] 清理、manifest、Validator 全部真实 exit 0，终态字段与回执无冲突？

全部为“是”方可提交 `stage-i3-v0.1.0-oa-completion-05.md`。合法状态仍为 `VERIFYING / EXECUTION_SUBMITTED`；若出现真实外部阻塞，必须按机器契约提供工具结果、替代路径和独立工作穷尽证据。

