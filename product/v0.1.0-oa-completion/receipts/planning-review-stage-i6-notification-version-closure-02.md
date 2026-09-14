# P60 I6 通知与版本收口规划审查 02：VERIFYING

> 审查角色：规划（Planner）  
> 日期：2026-09-14  
> 审查对象：`completion-stage-i6-notification-version-closure-02.md`  
> 前置审查：`planning-review-stage-i6-notification-version-closure-01.md`  
> 结论：**VERIFYING；新增部分锁定，同类缺口第二次未闭合，触发一级执行补充提示**

## 1. 总体裁决

回执 02 提供了可采信的新增行为证据：双 JVM 文件库恢复、模板版本与渲染聚焦测试、部分租户隔离、H2 旧库升级、独立 compile 门和两项前端专项测试。因此不要求重做这些精确对象。

但回执仍把相邻证据外推为父级缺口闭合，并将真实浏览器、多身份全场景和候选固定留给“Planner 验收阶段”。Planner 不代替 Executor 运行这些验收行为；它们必须先由执行层提交证据。G1/G2/G3/G4/G6/G8/G9 连续第二轮仍属同类缺证据或对象不匹配，按 `roles/planner.md` §7.1 下发一级补充提示：

`planning-execution-prompt-stage-i6-notification-version-closure-01.md`

## 2. 新增锁定项

在审查01的 L1—L7 基础上新增以下锁定项；无实现变化或反证时禁止重验：

| 锁定项 | 本轮行为证据与边界 |
|---|---|
| L8 持久恢复单轮 | 两个独立 Surefire JVM 共用文件 H2；同一业务消息 ID 从 attempt 1 恢复追加 attempt 2，不新增业务通知。只锁定重启后恢复一轮，不证明审批事务不回滚或重试耗尽终态 |
| L9 模板版本不可变 | 集成测试证明 v1 投递后发布 v2，历史消息仍引用 v1 |
| L10 缺失变量 | 缺失变量在发送前失败且收件箱 0 行；不外推到未知、类型、长度及其他非法变量 |
| L11 HTML 净化子集 | `<script>`、有/无引号事件属性及 `javascript:` 输入的实际净化断言；不外推到方向要求的全部 URL/载体边界 |
| L12 规则历史与回落 | 规则停用后回落 IN_APP，订阅变化不改写既有投递 |
| L13 I6 租户隔离子集 | 跨租户模板读取 NOT_FOUND、规则列表为空、订阅隔离；不外推到写、重试、详情、回执和深链 |
| L14 H2 旧库升级 | 文件 H2 V58→V90 保留指定旧消息、模板、尝试 ID 与语义；不外推 PostgreSQL |
| L15 compile 与新增前端测试 | Server `mvn -q compile` exit 0；新增渠道/偏好两个 spec，Web 130 files、1185 passed+3 skipped |
| L16 当前全量快照 | Server 1357/0/0/0，Web 四门 exit 0，基于回执02候选；后续相关代码变化时仅受影响证据失效 |

## 3. 未通过项诊断

| 缺口 | 最新失败事实 | 诊断分类 | 裁决 |
|---|---|---|---|
| G1 | 恢复测试没有审批动作/流程状态对象；仅到 attempt 2，未证明耗尽终态；显式 BLOCK 仍可能回滚节点步骤 | 证据对象不匹配 + 实际产品语义冲突 | G1b 单轮恢复锁定；其余拆为 G1a/G1c |
| G2 | 只测缺失变量与部分 HTML 输入；完整规则 CRUD、接收人、渠道组合和权限未证 | 缺证据 | 已过子集锁定；拆为 G2e/G2f/G2g |
| G3 | 部分跨租户读取不能替代全部资源读写/重试/详情/深链；目标有效解析、HTTP最小暴露和零残留未证 | 证据对象不匹配 | 拆为 G3d/G3e/G3f |
| G4 | 明确未运行真实浏览器；“需要 Planner 指定或 Owner 环境”没有真实工具限制结果 | 缺证据 | 本地真实后端与浏览器链属于授权内工作，拆为 G4a/G4b |
| G5 | 五渠道无真实结果；Provider 通知主体权威仍无可用映射 | 外部条件 + 独立产品缺口 | 拆为可独立的 G5a 与依赖 Owner 的 G5b |
| G6 | 通知单行/恢复对象不能替代实际流程事件和多身份同对象链 | 证据对象不匹配 | 拆为 G6a/G6b |
| G7 | 只有 H2 V58→V90；方向明确要求 H2 与 PostgreSQL | 缺证据 | H2 锁定，只剩 G7b |
| G8 | manifest 仍为骨架且 SHA 未回填；不能推迟到功能 PASSED 后的阶段三 | 规划顺序被误解 + 缺证据 | 更正口径：候选固定是功能验收前置，保留 G8a |
| G9 | 仅渠道与偏好两个新 spec；收件箱、规则、移动、深链与权限显隐仍无聚焦测试 | 缺证据 | compile锁定，只剩 G9b |

## 4. 关键口径更正

1. I6 方向 §3.2 明确：运行时 Provider 失败只形成可重试失败投递，不回滚已经合法提交的审批业务；纯通知节点完成持久入队后推进。Executor 不能自行把显式 `BLOCK` 解释为可回滚已合法审批。若 `BLOCK` 仅用于发布前配置校验，应以该边界实现和验证；运行时发送失败不得回滚业务。
2. G4/G6 的真实浏览器与多身份场景是 Executor 的验收证据，不是 Planner 代跑事项。只有实际工具返回不可用、替代路径穷尽时才可报告工具限制；“后端未启动”不是外部阻塞。
3. G8 固定候选与完整 manifest 属于 E15 功能验收标准，必须在 I6 `PASSED` 前完成。阶段三只同步 Planner 已裁决的终态值，不负责补功能验收缺口。

## 5. 当前结论

- I6：`VERIFYING`；P60：`IN_PROGRESS`。
- 计数、开放 P 编号、ADV64 均不变。
- 当前唯一执行入口：`planning-execution-prompt-stage-i6-notification-version-closure-01.md`。
- 下一回执：`completion-stage-i6-notification-version-closure-03.md`。
- G5b 外部条件未到位不允许宣称五渠道通过；但 G1a/G1c、G2e/G2f/G2g、G3d/G3e/G3f、G4a/G4b、G5a、G6a/G6b、G7b、G8a、G9b 均为授权内可继续项。

