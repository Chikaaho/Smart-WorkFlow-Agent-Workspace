# p58-workflow-node-capabilities（P58 流程节点界面与具体能力优化）

> 正式功能；阶段三终态最终复核完成（2026-09-04）。
> 状态：功能级 **PASSED**（2026-09-04，规划功能级最终验收 `planning-review-p58-workflow-node-capabilities-08-passed.md`）→ 阶段三终态最终复核 **COMPLETED（已确认，2026-09-04）**（规划最终复核 `planning-final-review-p58-terminal-sync-01-passed.md` **PASSED**）。

## 功能目标

在 P57 统一节点扩展能力完成后，完善流程节点的通用选人配置、审批、会签、分支、抄送与通知能力，使节点配置、设计态交互、发布校验和运行语义通过统一节点契约形成完整业务闭环；并补齐审批意见低代码扩展与开发环境调试认证接缝。

## 交付范围（已锁定，证据见回执）

- 通用选人：固定用户、固定角色、流程表达式（前端可扩展 JavaScript 选择器）、流程适配器（后端 Bean）；节点在运行时解析为目标用户。
- 审批节点：单人审批候选范围，候选命中多人时任一人完成审批即结束。
- 会签节点：多人同时审批，支持全部审批（ALL）、任一审批（ANY）、比例审批（RATIO，按 ceil 结算）。
- 分支节点：普通条件分支，流程依据分支条件进入对应后续路径；非法/缺省分支发布被拒绝。
- 抄送节点：向通用选人命中全部用户去重发送抄送（含权限负向 403）。
- 通知能力：审批不通过（退回/驳回）通知；站内信为内置通知能力；预设统一第三方通知 SPI 与可验证扩展接缝（短信、飞书、钉钉、企业微信、公众号、小程序为接口范围，具体渠道实现与外部账号联调不属本功能交付）。
- 审批意见低代码扩展：默认"备注"字段；可选关联自定义低代码审批意见表单（通过/退回/驳回时填写提交）；轻量控件边界＋必填校验＋数据联动；受控 JavaScript 表达式联动初始化（读取流程数据，非任意脚本）；意见/动作/表单版本/提交数据/处理人关联流程实例与任务并可追溯（formId 级 v1/v2 不可变历史）。
- 开发环境调试认证：仅 dev/test profile＋显式开关＋本机回环来源，`Authorization: Bearer test_<userId>` 代表真实存在且启用的用户；生产及其他 profile 不可激活；不伪造租户/角色/权限、不写 Cookie、不生成正式 token、记录调试认证审计日志。

## 验收与证据链

- 功能级最终验收：`product/p58-workflow-node-capabilities/receipts/planning-review-p58-workflow-node-capabilities-08-passed.md`（**PASSED**；十六项主方向标准最终结论逐项锁定；G1—G3 隔离运行退出 0；生产排除扫描 21 个 JAR/336 个嵌套 JAR 及固定 Web dist 248 文件零命中；调试认证补充六项全部通过，直接读取认证存储的旧要求已撤回）。
- 规划审查链：`planning-review-p58-workflow-node-capabilities-01/02/…/07.md`、`planning-execution-prompt-p58-workflow-node-capabilities-01/02/…/07.md`。
- 执行回执：`execution-receipt-20260903.md`、`execution-receipt-20260903-debug-auth-01/02/03.md`、`execution-receipt-20260904-z1-z9-05.md`、`execution-receipt-p58-e1-e6-20260904-06.md`、`execution-receipt-p58-f1-f3-20260904-07.md`、`execution-receipt-p58-g1-g3-20260904-08.md`（原始输出与运行标识见 `receipts/attachments/`）、阶段三回执 `p58-stage3-terminal-sync-20260904.md` 及已确认收尾补充 `p58-stage3-terminal-sync-supplement-20260904.md`。
- 历史归档：主方向、开发调试认证补充方向与阶段三方向均已归档 `product/p58-workflow-node-capabilities/passed/`（direction-p58-workflow-node-capabilities.md、direction-p58-development-debug-auth.md、direction-p58-terminal-sync.md）。

## 规划终态裁决（验收 08 锁定）

- P58 功能级 **PASSED（2026-09-04）**，十六项标准全部通过；阶段三终态最终复核 **PASSED**（`planning-final-review-p58-terminal-sync-01-passed.md`），**COMPLETED（已确认，2026-09-04）**，第 **41** 个正式功能。
- P58 正式基线：后端 **1035/0/0/0**（全量 152 份 Surefire 报告，BUILD SUCCESS）；前端 **117 files passed + 1 skipped / 1110 tests passed + 3 skipped**（typecheck/lint/build 退出 0，lint 47 warnings / 0 errors）；Flyway **H2 V49（49）/ PG V49（48）**（全链退出 0）。
- 附加验收证据：回执 08 G1—G3 隔离运行退出 0、生产排除扫描通过；临时探针不加入正式测试计数（不改 1035、不增加功能数）。
- P58 **已核销/完成**；P58 不对应既有 Mxx-Fxx 明细，90 项明细状态零变化；清单 **✅34/🟦23/⬜33**（34+23+33=90）；功能数 **40→41**；无活动正式功能。
- 边界（后续各轮不得改写）：第三方渠道为 SPI/隔离 Adapter 证明，非厂商账号联调；意见 JS 为受控表达式，非任意脚本；FAILED 任务为明确失败＋禁止继续处理边界，不声称引擎任务全部自动清理；**非零租户用户当前没有受支持登录入口是认证产品边界，不属于 P58 完成声明**；P59 及后续业务需求未选择，不自动启动。
## 知识库全量整理映射（2026-09-04 追加，不改写 P58 当时裁决）

> 本节为 knowledge-full-reconciliation 对账轮追加：P58 当时「不对应既有 Mxx-Fxx 明细、90 项明细状态零变化」的历史裁决不改写；规划裁决 F2—F6 将 P58 已覆盖子集对应的五行清单项登记为 🟦（部分实现），P34/P35/P37/P38/P39 保持未核销，功能数 41 不变。

| 清单项 | 状态（本轮） | P58 已交付子集 | 剩余范围 |
|---|---|---|---|
| M04-F01-03 会签规则 | 🟦 | ALL/ANY/RATIO 会签结算、独立意见、取消语义 | 原明细完整规则（含一票否决）覆盖待确认（P34） |
| M04-F07-01 流程规则 | 🟦 | 受控条件表达式、条件分支 | 超时处理、自动审批/自动通过规则（P35） |
| M06-F01-01 通知渠道 | 🟦 | 站内信、统一渠道 SPI 及已验收扩展接缝 | 真实厂商渠道、配置开关及账号联调（P37） |
| M06-F02-01 通知模板 | 🟦 | 可复用通用消息模板与变量渲染（P36 已核销） | 按渠道配置内容与变量（P38，不新编号） |
| M06-F03-01 通知规则 | 🟦 | 内置审批事件、通知节点触发 | 用户可配置规则、订阅设置（P39） |

完整双向映射见 `knowledge/feature-reconciliation-index.md`；当前清单计数 ✅34/🟦28/⬜28 以 `knowledge/current-status.md` 与 `Smart-WorkFlow-Server/功能清单.md` 为准。
