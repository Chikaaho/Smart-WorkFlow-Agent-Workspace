# P21 IoT 设备接入二级执行补充提示 02

> 日期：2026-09-08  
> 当前状态：VERIFYING  
> 触发依据：`planning-review-p21-iot-03.md`  
> 本提示替代：`planning-execution-prompt-p21-iot-01.md`  
> 当前唯一 Executor 修正入口：本文件

## 一、替代关系与精确输入

本提示替代提示 01。提示 01、三份 completion 回执和前三轮审查仅作证据追溯，不同时作为执行待办。

Executor 只需读取：

1. `planning-review-p21-iot-03.md`；
2. 本提示；
3. 主方向 A1—A8（仅在需要核对原标准时读取）；
4. `completion-p21-iot-03.md` 与 `evidence/g3-round3.md` 中本提示明确引用的位置；
5. L1—L13 证据仅作锁定指针。

不重新展开腾讯实网、Broker 基础收发、凭证脱敏、基础去重/恢复、后端全量、沙箱单测、七页静态渲染、状态 HEALTHY/ONLINE、基础流程动作页、NUMBER/DICT、双语言可区分输出或 chaos 隔离。

## 二、唯一剩余原子矩阵

映射：G1a→H1；G1b剩余→H2；G2a/G2b剩余→H3；G3a/G3b剩余→H4；G4a剩余→H5；G5a→H6；G5b→H7；G5c→H8；G6b→H9；G6c→H10。

| ID | 失败事实 | 完成条件（正向） | 反向断言 | 固定对象 | 唯一可接受证据 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|
| H1 | G1a CLI 命令因 `-C` 参数失败，越界拒绝为空 | 使用 CLI 实际支持参数完成合法 Topic 订阅并输出唯一 nonce；同一脚本对越界 Topic 返回完整错误 | 越界订阅收到 0 条且消息/命令/trigger 前后计数不增 | `owner-mosquitto`、`g1a-topic-probe`、合法/evil Topic | `h1-topic.stdout.log`：版本、命令（秘密脱敏）、开始/结束时间、合法 nonce、越界错误、CLI exit、三个前后计数 | 先 `--help` 确认参数，再重取，不复用失败流 | 工具本身持续故障需真实输出与另一 MQTT CLI 等强度替代 |
| H2 | EVENT 已通过，ACTION_RESULT 成功仅自述 | 对一条指定 `BROKER_ACK` 命令发布 ACTION_RESULT，完整回读同 commandId、correlationId、旧状态、新状态、设备结果；未知 commandId 保持失败 | 不修改其他命令，重复 ACK 不重复副作用 | 一条新命令及 `dev-owner-01` | `h2-action-result.jsonl`：创建/发布/ACK输入/命令前后详情/重复ACK/其他命令零变化 | 新建唯一 nonce 命令并完成 ACK 正反序列 | 无合法停止例外 |
| H3 | UI基础存在，但三来源 SQL 全是 `var_action`，MANUAL 未跑 | UI 弹窗展示三来源、合格设备、能力、参数、触发、BLOCK/CONTINUE/MANUAL；FIXED/FORM_FIELD/VARIABLE 各保存回读并各生成一条带 `sourceType` 的命令；三失败策略各有实际结果 | 不合格设备不出现；每实例仅一命令；失败不显示成功 | 同一流程模板、`dev-owner-01`，三个实例、三策略对象 | `h3-ui/` 截图或DOM+网络响应；`h3-sources.jsonl` 每行含 sourceType/config/instance/command/correlation/result；`h3-strategies.jsonl` 三策略 | 先补可辨识 sourceType/策略结果，再用浏览器与API重取 | 无合法停止例外；MANUAL 不得写代码路径替代 |
| H4 | 只证 NUMBER/DICT；REFERENCE 与流程表单详情缺原始流 | REFERENCE 合法 ID 通过，无权/不存在 ID 拒绝；若 BOOL/DATE 是当前表单支持类型，各取一正一反；同一合法触发从流程实例详情回读完整 formData | 拒绝场景实例/trigger 不增；不得用 trigger 快照替代流程 formData | `iot_alert_form` 当前版本、固定引用对象、一个新实例 | `h4-contract.jsonl` 包含表单定义、发布请求/响应、触发请求/响应、前后计数、实例详情原文 | 直接导出真实 HTTP，不在回执手抄 | 权威表单定义确无某类型时，附件展示定义后只豁免不存在类型；REFERENCE 仍须处理现有能力 |
| H5 | 双语言发布已锁定，但 Java 详情截断，宿主函数对象关联不足 | JS 与 Java 完整执行记录分别关联其下行命令；JS `fun_emitEvent` 关联事件；Java `fun_invokeAction` 关联设备命令和结果，ID/版本/状态完整 | 两脚本不得互相冒名；任一宿主调用失败不能写 SUCCESS | `owner-js-forward` v2、`owner-java-forward` v3 或登记替代版本 | `h5-scripts.jsonl` 由 API/SQL 直接导出，禁止省略号；包含 scriptId/code/version/executionId/commandId/eventId/correlation/status | 只补完整对象关联，不重跑可区分 CLI 或沙箱 | 对象已销毁可新建版本并登记映射 |
| H6 | 四态仅摘要，缺合法 body、完整响应和零变化 | admin 同合法 body 业务允许；受限同 body 403；无认证 401；畸形 body 受控 4xx；四次均有 HTTP 状态、业务 code 与前后计数 | 受限/未认证/畸形请求零新增；不得出现 500 | user1、user3、`h6-probe-<nonce>` | `h6-auth.http` 原始请求头摘要/body/响应/exit + `h6-counts.txt` 前后 SQL/API | 用同一 body 顺序执行四态 | 无合法停止例外 |
| H7 | 只做 tenant0 负向，tenant88 无正向上下文 | tenant0/tenant88 同形对象在各自 TenantContext 下都能读写自己且看不到/改不了对方；t0 API 与 SQL 结果一致 | 双向零串读、零串写 | PG `smart_workflow`、tenant0/88、同 code 不同 ID | `h7-tenant-test.log` 真实集成运行 + `h7-tenant.sql.log` 前后回读；必须出现 t0→t0、t0→t88、t88→t88、t88→t0 四象限 | 使用提示01允许的 TenantContext 集成入口，不扩展登录 | 非零租户登录不可用不构成阻塞；集成工具失败按真实结果自修复 |
| H8 | 当前域记录缺完整审计字段，重试响应截断 | 六类动作每行具 actor/systemIdentity、action、objectType/objectId、result、time、correlationId；重试原命令与新命令完整关联 | 密码/秘密与完整敏感 payload 零出现 | 本轮固定六类对象 | `h8-audit.csv` 由查询工具直接导出 + `h8-retry.json` 完整响应；列头与零秘密扫描输出 | 若域表缺字段则仅补本方向必要审计字段/记录 | 不要求通用 P40；但不能用缺列业务表冒充审计 |
| H9 | 页面证据仍无关键按钮与网络索引 | 浏览器完成流程动作弹窗三来源切换与保存、连接测试、设备接入开关、Topic 编辑、脚本试运行/发布、规则发布/触发记录、命令重试；每项前后状态与真实网络响应相符 | 无假按钮、错误成功、明文凭证；失败操作不改变状态 | admin、当前 P21 对象 | `h9-browser.md` 操作索引 + 每项前/后截图/DOM + request/response 文件；只截关键区域 | 复用已有静态页，不重拍列表 | 浏览器可操作，不成立能力阻塞 |
| H10 | 无证据清单/哈希；lint 7 warnings 与“0 warning”冲突；Validator 只有 exit 文本；终态错误清零 | 生成仅含本轮 H1—H10 附件的清单与哈希并回读通过；如实记录 lint 7 warnings 或提供修复后实际 0 warning；保存 Validator 输入、命令、stdout/stderr、exit；终态所有原子与证据一致 | 不出现截断行/省略号、手抄哈希、虚假 COMPLETED；临时秘密文件实际不存在 | 最后源码指纹、Server/Web、终态 JSON | `h10-manifest.sha256`+校验输出、`h10-gates.log`、`h10-validator-input.json`、`h10-validator.log`、`h10-cleanup.log` | 后端代码变化则重跑后端门禁；未变化可沿用 L13并证明指纹一致 | 外部工具失败须留原始结果；有可执行项继续，不提前交回 |

## 三、已锁定项与失效规则

锁定 L1—L13，详见 `planning-review-p21-iot-03.md` §二及 `planning-review-p21-iot-02.md` §二。二级回执只允许列锁定 ID 和证据指针，不复制执行过程。

只有以下情况重验对应锁定项：实现改动触及其路径、新证据直接反证，或无法证明最后源码/环境与锁定快照一致。若失效，回执必须先写“锁定项失效依据”，再给受影响最小回归；不得整包重跑。

## 四、精确文件与命令范围

### 允许修改

- H3：流程设备动作配置前后端、相关迁移/测试。
- H4：IoT 表单契约及流程表单回读相关实现/测试。
- H6：IoT Controller 鉴权/参数错误处理的必要实现/测试。
- H8：P21 IoT 域审计必要字段、记录、迁移/测试。
- H1/H2/H5/H7/H9/H10：原则上只新增验证资产、证据和新回执；真实行为暴露缺陷时可修改对应最小路径并记录。

### 禁止修改

- 主方向、三轮 Planner 审查、提示01、旧 completion/旧 evidence。
- 已完成正式功能状态、P21 `PASSED/COMPLETED`、无关业务、腾讯实网边界。
- 未获授权的 Git 提交/推送、部署和全库破坏性清理。

### 允许命令

- MQTT CLI `--help` 与 Owner Broker 受控 pub/sub；秘密继续通过安全环境注入。
- dev/PG 启动、真实 HTTP、浏览器、限定 P21 对象的 SQL/集成验证。
- 受影响模块与工程宪法要求的最终门禁、终态 Validator。
- 工具生成 SHA-256 清单并实际校验；限定临时对象/秘密文件清理和回读。

## 五、固定执行顺序

1. 建立 H1—H10 账本并记录源码、进程、数据库、对象指纹。
2. 修复 H3/H4/H6/H8 的产品缺口；不得先采证后改代码。
3. 最后代码快照下按 H1→H2→H3→H4→H5→H6→H7→H8→H9 顺序采集，H7 与浏览器准备可并行。
4. 逐文件检查无截断、省略号和秘密；发现失败原样保留并修复后追加新文件，不覆盖。
5. 执行 H10 工程门禁、manifest/哈希回读、清理回读、Validator。
6. 只有提交前矩阵全部为“是”才追加 `completion-p21-iot-04.md`。

## 六、相对提示 01 的新增与收紧

- **删除**：G4b、G6a 及 L1—L13 全部已通过范围，不再执行。
- **原子化**：只保留 H1—H10；将 EVENT 与 ACTION_RESULT、基础 UI 与三来源运行、类型校验与表单详情、四态鉴权与双租户分别拆开。
- **替代路径**：G1a 改为先读 CLI `--help` 后工具直出；G5b 改为四象限 TenantContext 集成运行；G6c 改为 manifest+哈希+Validator 输入/输出闭环。
- **提交条件**：每项指定文件、字段、对象、正向/反向断言；任何附件出现失败命令、空输出、截断、省略号或缺象限，该原子保持未完成。

## 七、提交前核对矩阵

| 检查 | 必须为是 |
|---|---|
| H1 合法 nonce 实际收到，evil 错误非空、零消息/零副作用 | [ ] |
| H2 指定命令 ACK 前后、重复 ACK 和其他命令零变化完整 | [ ] |
| H3 UI 三来源与三失败策略均有真实配置/运行结果，含 MANUAL | [ ] |
| H4 REFERENCE 正反例与流程侧完整 formData 均有原始响应 | [ ] |
| H5 JS/Java/事件/行为完整 ID 关联，无截断 | [ ] |
| H6 200/403/401/4xx 同 body，拒绝请求零新增且无 500 | [ ] |
| H7 双租户四象限读写均有真实结果 | [ ] |
| H8 六类审计列完整，秘密零出现，重试响应完整 | [ ] |
| H9 七类关键交互与流程动作网络响应已索引 | [ ] |
| H10 manifest 校验、最后门禁、清理、Validator 与终态一致 | [ ] |

任一为“否”时继续执行或按真实外部阻塞提交契约状态，不得把该原子写 `COMPLETED`。Executor 不得自行进入 `PASSED/COMPLETED`；完成后保持 `VERIFYING` 等待 Planner。
