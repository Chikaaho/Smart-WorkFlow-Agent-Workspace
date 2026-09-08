# P21 IoT 设备接入三级零裁量执行提示 03

> 日期：2026-09-08  
> 当前状态：VERIFYING  
> 触发依据：`planning-review-p21-iot-04.md`  
> 本提示替代：`planning-execution-prompt-p21-iot-02.md`  
> 当前唯一 Executor 修正入口：本文件

## 一、权威输入与替代关系

本提示是二级提示后同类失败的三级入口。提示 02 及更早提示、四份 completion 与旧附件只作追溯，不同时作为执行待办，也不得复制到新证据包冒充本轮输出。

Executor 只需读取：

1. `planning-review-p21-iot-04.md`；
2. 本提示；
3. 主方向 A1—A8，仅在核对原验收语义时读取；
4. 本提示点名的旧附件，仅用于确认失败事实或锁定项；
5. 实现与工程配置，仅限修复下列未通过子原子。

本提示不改变需求方向、角色权限和腾讯实网免验边界，不代写实现方案。

## 二、三级证据封装总规则

剩余每个子原子必须创建一个独立目录 `evidence/final-<原子ID小写>/`，目录内至少包含：

- `index.json`：对象 ID、环境、源码指纹、开始/结束时间、执行命令数组、原始文件数组、正向断言、反向断言、`verdict`；
- `raw.*`：工具直接产生的完整 stdout/stderr、HTTP、SQL、JSONL 或浏览器网络导出；
- `verify.log`：机器检查本包必填字段、文件存在、无省略号/截断标记、断言全部为真的实际输出。

禁止手工在 Markdown 中转录原始结果。包内不得引用其他 final 包来补本包缺项；旧锁定证据只能在 `index.json.lockedEvidence` 中引用。任一正向或反向断言为 false、原始文件为空、出现截断/省略号、对象不一致或 `verify.log` 非零，本包 `verdict` 必须为 false，该原子不得写 `COMPLETED`。

## 三、唯一剩余原子矩阵

拆分映射：H3→H3a/H3b；H4→H4a/H4b；H9→H9a—H9e；H10→H10a—H10d。H1、H2、H5—H8 保持原 ID。已转 L14—L17 的部分不再进入剩余原子。

| 原子 | 最新失败事实与分类 | 正向目标断言 | 反向零残留断言 | 固定对象 | 独立证据包与机器字段 | 下一动作 / 合法停止 |
|---|---|---|---|---|---|---|
| H1 | 摘要、`...`、无命令/exit/前后计数；缺证据 | 合法 Topic 收到唯一 nonce，越界 Topic 返回服务端拒绝 | evil 收到数=0；message/command/trigger 三项 before=after | `owner-mosquitto`、`g1a-topic-probe`、新 nonce | `final-h1/`；raw 必含 CLI 版本、完整命令（秘密脱敏）、两个订阅输出/exit、六个前后计数；index 六项断言 | 用支持的 CLI 参数重新执行；CLI 真故障时换另一 MQTT CLI 并保留故障原文，均不可用才按契约 BLOCKED |
| H2 | 重复 ACK 覆盖结果与时间；实际产品缺陷 | 第一次 ACK 把指定命令从 BROKER_ACK 置 SUCCESS 并保存 commandId/correlationId/result/replyTime | 第二次 ACK 后状态、result、replyTime、版本及业务副作用计数完全不变；其他命令完全不变 | 新命令、`dev-owner-01`、新 correlationId | `final-h2/`；raw.jsonl 固定 before/ack1/after1/ack2/after2/other-before/other-after；verify 比较持久字段并输出逐字段 equality | 先修复终态 ACK 幂等，再取一个新命令完整序列；未修复不得提交 |
| H3a | 三策略无策略名，附件无 FAILED；对象不匹配 | BLOCK=FAILED、CONTINUE=SUCCESS 且有实例、MANUAL=PENDING 且无实例，每条明确 strategy/configId/triggerId | 三条不得串策略；每策略一次输入只生成预期一条 trigger/实例 | 同模板、三个独立规则/nonce、同一不可用设备故障 | `final-h3a/`；raw.jsonl 每行含 strategy、输入、trigger、instance、error、countBefore/After；verify 逐策略判定 | 隔离逐个执行，禁止从无标签历史行推断；行为不符先修实现 |
| H3b | 截图选中流程变量却声明 FORM_FIELD，且缺合格设备过滤/三来源保存网络流；对象不匹配 | 浏览器分别选择 FIXED、FORM_FIELD、VARIABLE，合格设备列表仅含已发布且可接入设备，每种保存后刷新回读一致 | 不合格设备不出现；失败保存无成功提示且配置不变 | 模板 `bpm_27eb397eab224743`、`dev-owner-01`、一个明确不合格设备 | `final-h3b/`；每来源独立 before/selected/saved/reloaded 截图或 DOM、真实 request/response、设备候选列表；index 标注当前选中值 | 用浏览器逐来源重取，不接受一个来源截图代表三种；浏览器真实不可用方可按契约 BLOCKED |
| H4a | 只校验数字格式，并主动排除存在性/权限；实际产品缺陷 | 有权限且存在的引用 ID 发布成功 | 不存在 ID、另一租户/无权 ID 均受控 4xx，规则/trigger/实例计数不增 | `iot_alert_form` 当前版、登记一个可见引用与一个无权引用 | `final-h4a/`；raw.http 含三个同构请求响应，raw.sql/json 含对象身份和三组前后计数 | 补齐 REFERENCE 对象校验契约；若表单缺引用目标元数据，修复本方向必要元数据，不得降为“数字即可” |
| H4b | BOOL/DATE/REFERENCE 请求响应仍为手工摘要；缺证据 | BOOL、DATE 各一正一反，REFERENCE 格式一正一反，均有完整原始 HTTP | 所有反例均无规则版本/trigger/实例新增且无 500 | 同表单、同一规则族、新 nonce | `final-h4b/`；raw.http 保存请求与完整响应，raw.counts 保存每例前后值；verify 断言状态和零新增 | 直接保存 HTTP 客户端原始输出，禁止转录；L15 formData 不重验 |
| H5 | Java action PENDING、无结果，缺 correlationId 链；缺证据 | JS execution→event→publish command 及 Java execution→action command→ACTION_RESULT 全部以 ID/correlationId 串联，Java action 达终态 | 两语言不得共用 execution/event/command 身份；任一失败不得写 SUCCESS | `owner-js-forward` v2、`owner-java-forward` v3；对象销毁才登记新版本 | `final-h5/`；raw.jsonl 每对象一行完整字段，含 executionId/script/version/eventId/commandId/correlationId/status/result | 让设备对 Java action 返回结果后导出完整链；只保留 PENDING 不满足 |
| H6 | 200/400 响应截断且无逐请求计数；转录错误 | admin、受限、未认证、畸形四次完整响应分别 200/403/401/4xx | 后三次各自前后连接数不增；无 500；响应无秘密 | 原用户与同一新 body/nonce | `final-h6/`；四个独立 raw HTTP 文件保留完整头/体/exit，四组 raw counts；verify 检查 body hash 相同（畸形例除外）和零新增 | 用 `curl -D/-o/-w` 或等强度方式直接落盘，不再拼接行 |
| H7 | 测试日志只有测试统计，四象限未直接输出；缺证据 | t0→t0、t88→t88 自身读写逐项成功 | t0→t88、t88→t0 逐项读 null、写 0；各自列表无对方对象 | 真实 PG `smart_workflow`、TenantContext、同 code 不同 ID | `final-h7/`；raw.test 必须逐行打印 8 个断言的 tenant/object/expected/actual，raw.sql 显示清理前对象与清理后不可见；verify 计数=8 全真 | 修改验证资产输出断言值后重跑；测试类名和 Tests run 不能替代行为行 |
| H8 | 只有五类、缺 objectType、74 行身份/时间/关联无效；实际产品缺陷/对象不匹配 | 本轮固定六类动作各恰取一条，字段 actor/systemIdentity、action、objectType/objectId、result、time、correlationId 全部有效 | 六行均无秘密；不得用 tenantId/0/none 代替 correlationId；重试原/新命令关联不丢失 | 本轮新建六类动作对象 | `final-h8/`；raw.csv 必须恰含表头+6 行，raw.retry.json 完整，raw.secret-scan.log 输出 0；verify 检查六类集合和所有非空字段 | 补本方向必要审计记录后，用限定 nonce 查询；不得导出全历史混充 |
| H9a | off/on 图片同哈希且都为 ON；对象不匹配 | 浏览器实际 ON→OFF→刷新仍 OFF→ON→刷新仍 ON | 每次失败不得反转；两状态截图/DOM 值和响应不同 | `dev-owner-01` | `final-h9a/`；四阶段 DOM/截图、两次真实 request/response、数据库终值；verify 检查 off/on 图哈希不同 | 重新执行实际开关，不接受复制图片 |
| H9b | 连接测试仅结果页，缺点击前后与真实响应文件 | 点击测试显示进行态并得到与 API/持久状态一致的最终分类 | 错误连接不得提示成功；凭证始终掩码 | `owner-mosquitto` 与 `owner-bad-pw` | `final-h9b/`；两对象 before/during/after、network request/response、状态回读；verify 比较 UI/API | 浏览器分别执行健康与错误连接 |
| H9c | 脚本交互沿用旧静态图和手写 200 | 浏览器分别完成 JS/Java 试运行与发布，显示真实 execution/version/状态 | 失败脚本不得显示发布成功；凭证/脚本运行环境秘密不泄露 | 两个锁定脚本版本或登记新版本 | `final-h9c/`；每语言 before/action/after、network 原文、执行详情；verify 四操作全真 | 仅补浏览器交互，L10 基础语言行为不重验 |
| H9d | 规则交互用 JSONL 代替浏览器行为 | 浏览器发布规则并查看对应 trigger 详情，状态与 API 一致 | 发布失败不改为 PUBLISHED；错误 trigger 不显示 SUCCESS | 一条新规则和新 trigger | `final-h9d/`；before/after/详情 DOM或截图、network 原文、API回读；verify ID 一致 | 执行一条完整浏览器链 |
| H9e | 运行记录只引用旧总览截图 | 浏览器进入消息/命令/脚本/流程触发四 tab，并打开各一条当前对象详情 | tab 不得空壳或串对象，详情 ID 与 API 相同 | 本轮 H1/H2/H5/H3a 对象 | `final-h9e/`；四 tab DOM/截图、四详情、network/API；verify 四个 ID 关联 | 使用本轮对象重取；L16 重试按钮不重验 |
| H10a | 前端附件只有摘要，代码变化后缺原始流；缺证据 | 最后源码快照下 typecheck/lint/test/build 全部真实 exit=0，lint 如实记录 warnings | 任一非零不得写通过，门禁后源码指纹不变 | Web 最后快照 | `final-h10a/`；四个 raw stdout/stderr+exit、before/after fingerprint、verify | 在所有实现完成后最后执行；无前端变化仍需证明与已锁快照相同，否则重跑 |
| H10b | manifest 21 项与终态 evidence 集合不一致；转录错误 | manifest 覆盖本轮全部 final 包、回执和最终门禁文件，工具校验全 OK | evidence−manifest 与 manifest−evidence 均为空；manifest 排除自身 | `completion-p21-iot-05.md` 的 evidence 集合 | `final-h10b/`；manifest、校验原始输出、双向集合差 raw 文件；verify 三项全真 | 所有包完成后工具生成，不手工选 21 项 |
| H10c | Validator 日志仍只有 exit；缺命令/stdout/stderr | 保存 Validator 输入、完整命令、stdout、stderr、exit，输入与回执末行逐字相同 | 非零或输入不同不得提交；不得用单行 exit 替代 | completion05 末行 terminal JSON | `final-h10c/`；input.json、command.txt、stdout.log、stderr.log、exit.txt、compare.log；verify | 在 completion05 草稿末行生成后执行；Validator 失败先按诊断修复 |
| H10d | 清理附件为文字清单，终态错误清零；缺证据 | 限定临时秘密文件与本轮临时进程实际检查不存在/无监听；终态仅把真实通过原子写完成 | 任一缺口 false 时 remaining 不得为 0；不得写 PASSED/COMPLETED | 本轮真实临时路径/端口与 H1—H10 账本 | `final-h10d/`；raw.cleanup 为实际 `test/lsof` 等输出和 exit；raw.ledger.json 与 terminal work_items 对比；verify | 最后清理并机器比对账本；有可执行失败继续，不得交回等待 Planner |

## 四、锁定项与禁止重验

锁定 L1—L17。L1—L13 见 `planning-review-p21-iot-03.md`，L14—L17 见 `planning-review-p21-iot-04.md`。本轮明确删除：三来源命令身份、流程实例 formData、命令重试基础交互、最后快照后端全仓门禁。

只有实现触及依赖路径、出现直接反证或快照无法确认时才重验受影响锁定项，并在对应 final 包 `index.json.lockInvalidation` 写出依据。纯证据封装修正不触发全量业务回归。

## 五、对象、范围与执行顺序

| 维度 | 约束 |
|---|---|
| 允许读取 | 最新审查、本提示、主方向必要条目、点名旧附件、上述原子相关实现与工程配置 |
| 允许修改 | H2/H3a/H4a/H5/H8 暴露的最小产品缺陷；H1—H10 验证资产、final 独立证据包和新回执 |
| 允许命令 | Owner Broker 受控 CLI、真实 HTTP/API/PG、TenantContext 集成运行、真实浏览器、受影响工程门禁、哈希/集合/Validator/清理检查 |
| 禁止修改 | 主方向、四轮 Planner 审查、旧提示/旧 completion/旧 evidence、正式状态、无关功能与腾讯实网边界 |
| 固定顺序 | 建立子原子账本→修产品缺陷→H1/H2/H3a/H4a/H5/H8→其余行为包→浏览器包→最后门禁→manifest/清理/Validator→机器总检→completion05 |

所有场景先建立采集点，再执行，最后清理。对象销毁时在对应 `index.json` 登记旧/新 ID，不得默默替换。

## 六、相对提示 02 的方法变化

- **删除**：L14 三来源命令、L15 formData、L16 重试基础交互、L17 后端全仓门禁，以及既有 L1—L13。
- **原子化**：H3 拆为策略与 UI，H4 拆为引用对象语义与类型原始流，H9 拆为五个独立浏览器行为，H10 拆为前端门禁、全集 manifest、Validator、清理/账本。
- **替代路径**：不再接受汇总 Markdown、全历史 CSV 或单张截图；改为每个缺口独立目录、工具原始流、固定字段 `index.json` 和机器 `verify.log`。H8 从全历史 128 行改为本轮六类各一行；H7 由测试总数改为逐象限实际值；H10 由固定“21 项”改为 evidence 集合双向差为空。
- **提交条件**：全部 final 包 `verdict=true`、所有 `verify.log` exit=0、总账本与终态 work_items 一致时才允许提交；任一为否则继续执行，真实外部阻塞才按契约 BLOCKED。

## 七、提交门禁

追加 `completion-p21-iot-05.md` 前必须由工具生成总检结果，且以下全部为“是”：

- [ ] H1 合法/evil 原始 CLI 与三项前后计数完整？
- [ ] H2 重复 ACK 后所有持久字段和副作用计数完全不变？
- [ ] H3a 三策略带身份且分别 FAILED/SUCCESS/PENDING，H3b 三来源 UI 与资格过滤真实？
- [ ] H4a 存在/无权/不存在引用对象正反成立，H4b 类型 HTTP 与零新增完整？
- [ ] H5 Java action 已有结果且双语言完整 correlation 链？
- [ ] H6 四态完整 HTTP 与逐请求零新增成立？
- [ ] H7 八个四象限实际值可见且全部符合？
- [ ] H8 恰六类、字段完整、零秘密、重试关联完整？
- [ ] H9a—H9e 每项均为本轮真实浏览器交互、网络响应和对象回读？
- [ ] H10a—H10d 原始门禁、全集清单、Validator、清理和账本全部一致？

任一为否时不得追加“自验全部通过”回执，不得把该项写 `COMPLETED` 或 `remaining_actionable_count=0`。若确有真实外部阻塞，必须提供工具失败原文、已尝试替代、解除条件与独立工作穷尽证据，并按现有终态契约提交 `BLOCKED`；不得以等待 Planner 代替继续执行。

Executor 不得自行进入 `PASSED/COMPLETED` 或阶段三。
