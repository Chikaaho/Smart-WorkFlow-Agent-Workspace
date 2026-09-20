# P61 三级执行补充提示 03：最终证据零裁量收口

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-16  
> 功能：p61-user-facing-message-humanization  
> 等级：XL  
> 当前状态：IN_PROGRESS  
> 依据：planning-review-completion-p61-r10-04-failed.md

## 1. 唯一入口与输入

本提示替代 `planning-execution-prompt-p61-user-facing-message-humanization-02.md`，成为 P61 唯一当前执行入口。提示 01/02、审查 01—04、旧进展与旧 completion receipt 仅作证据追溯，不同时作为待办。

执行前读取：主方向、审查 04、本提示、`evidence/p61-r10-01/r7-f-snapshot-manifest.json`、`r9-s-evidence-index.md`、本提示引用的旧证据以及两仓工程宪法。不得修改历史审查或失败附件。

## 2. 零裁量总门禁

只建立以下 8 份独立证据包。每包中的正向断言和反向断言必须全部为 `true`；任一为 `false`、缺字段、对象错配或附件不可解析，均不得提交 completion receipt。

统一新证据根目录：`receipts/evidence/p61-r11-01/`。允许引用锁定证据，但本提示要求“最终快照重采”的项必须产生新附件，禁止覆盖 `p61-r10-01`。

| 包ID | 稳定原子ID | 唯一目标 | 提交条件 |
|---|---|---|---|
| P1 | R2c-I | 原子导入主计数诚实勾稽 | 四个主计数相加等于 total，连带回滚进入 failure 总数 |
| P2 | R2c-A/R2c-N | 批量审批与通知的可见混合失败 | 两个页面都真实显示成功+失败及安全逐项明细 |
| P3 | R2b-H | 八类失败与真实恢复 | 一份合法 JSON 逐类证明错误态、非空态、恢复动作和请求计数 |
| P4 | R3a-H/R3b-H | 字段显示名真实页面闭环 | HTTP 与 DOM 使用显示名，内部 key 零出现 |
| P5 | R4a-S/R4a-A/R4b-E/R8c-D | 最终进程下的泄漏、受众和 eventRef | 全部机器结果晚于最终服务启动且携同一 manifest/PID |
| P6 | R7-C/R7-P | 正式双语浏览器证据 | 有效 JSON、移动视口、登录成对、指定页面、网络索引、无遮挡 |
| P7 | R7-F/R9-S/R9-I | 快照与盘点可复算 | 启动/结束双 manifest 相等；144 个排除项逐项有依据 |
| P8 | R9-C | 十八项完成回执 | P1—P7 全通过、无移交项冒充零剩余 |

## 3. P1 — R2c-I 原子导入计数包

输出：`P1-r2c-i/summary.json`、真实响应原始流、可见结果面板 PNG/DOM、导入前后回读。

固定场景：官方模板，同一批次 3 行，其中 2 行格式合法、1 行格式非法；保持整批原子回滚，不改为部分提交。

必须全部为是：

- [ ] 响应和页面主计数均为 `total=3, success=0, failure=3, processing=0`，或等价字段且满足 `3=0+3+0`。
- [ ] 兼容字段 `errorCount=1` 如保留，明确只表示输入错误明细数；另有 `rolledBackCount=2` 或等价结构。
- [ ] 页面明确展示“输入错误 1、连带回滚 2”，并能查看第 4 行的安全字段显示名错误。
- [ ] 导入前后业务记录数一致，证明零落库。
- [ ] 响应、DOM 和截图零异常原文、零内部字段 key。
- [ ] 所有附件携 P7 最终 manifest ID、服务 PID、对象 ID、locale、timestamp。

禁止：改变原子事务语义；把 `0+1+0+2` 写成“四项计数”；仅用说明文字替代 failure 主计数。

## 4. P2 — R2c-A/R2c-N 可见混合失败包

分别输出 `P2-r2c-a/` 与 `P2-r2c-n/`，每份包含真实 HTTP、业务回读、页面 DOM、PNG、网络索引和 `summary.json`。

审批固定场景：同一批次 2 个任务，1 成功、1 受控失败。通知固定场景：同一批次至少 2 个接收对象，1 成功、1 不可投递或受控失败；不依赖真实外部 Provider。

每份必须全部为是：

- [ ] 页面实际显示 `total=2, success=1, failure=1, processing=0`；如使用其他总数，仍必须同时含成功和失败。
- [ ] 失败明细在页面真实可展开/可见，包含安全对象标识、category/errorKey 或自然消息。
- [ ] 页面计数与同一响应、同一批次业务回读一致。
- [ ] 失败明细零原始异常、栈、路径、租户秘密。
- [ ] PNG 捕获的是混合失败结果面板，不再用 2/2/0/0 全成功面板替代。
- [ ] 附件携最终 manifest ID、PID、batch/task/object ID、locale、timestamp、network index。

## 5. P3 — R2b-H 八类失败包

输出：`P3-r2b-h/results.json`、网络原始记录、代表截图、重试前后 DOM。

`results.json` 必须是单一合法 JSON，恰含：网络中断、超时、401、403、404、409/业务冲突、5xx、客户端响应解析异常 8 行。每行必须有：`scenario`、`injection`、`url`、`status/errorKey`、`errorVisible`、`emptyVisible`、`retryVisible`、`recoveryAction`、`requestCountBefore`、`requestCountAfter`、`recovered`、`manifestId`、`pid`、`timestamp`。

必须全部为是：

- [ ] 八行齐全；每行 `errorVisible=true`、`emptyVisible=false`。
- [ ] 401 跳登录并保留 redirect；403/404/客户端异常无无效重试；网络/超时/409/5xx 有正确恢复动作。
- [ ] 至少一个可重试场景在清除注入后点击重试，`requestCountAfter > requestCountBefore` 且 `recovered=true`。
- [ ] 公共 DOM 零解析原文、栈、路径、内部包名。
- [ ] 不再提交只有正常态 `errState=false, rows=1` 的附件作为矩阵证据。

## 6. P4 — R3a-H/R3b-H 字段显示名页面包

输出：`P4-r3a/`、`P4-r3b/`。固定同一表单版本、字段 label/key、权限身份与显隐规则对象。

必须全部为是：

- [ ] R3a：无筛选/编辑权限或不适用操作触发真实 HTTP 和页面提示，提示包含显示名。
- [ ] R3b：真实发布/填写路径触发显隐规则错误，设计器或填写页提示包含显示名。
- [ ] 每包保存响应、DOM、PNG、network index；内部 key 在响应与 DOM 中均为 0 命中。
- [ ] 未定义字段仅回显设计者自己的输入，不确认其他字段存在性。
- [ ] 附件来自 P7 最终 PID，不能只复用 13:54 前的 HTTP 结果。

## 7. P5 — R4/R8 最终运行安全包

输出：`P5-r4a-s/`、`P5-r4a-a/`、`P5-r4b-e/`、`P5-r8c-d/`。允许复用既有探针脚本和对象设计；必须在 P7 最终服务启动后重跑。

必须全部为是：

- [ ] 十一类泄漏源结果恰有 11 类覆盖映射，无空转；公共层标记/栈/路径/秘密零命中，授权诊断可定位。
- [ ] task、IoT、notify、SSO、open API 五类载体完成身份 A/B 正反；每项记录对象 ID、A 结果、B 结果。
- [ ] 同一个失败响应 eventRef 在同一 PID 的受保护日志/诊断载体完整匹配；不得拼接不同请求。
- [ ] R8c 授权页面显示安全摘要，无权身份 API/页面拒绝，DOM 零原始标记。
- [ ] 所有机器 JSON 的 `collectedAt` 晚于 manifest `service.startedAt`，并含 manifestId/PID。
- [ ] 对应页面证据带 network index、viewport、identity、tenant、object、locale、headless=false。

## 8. P6 — R7 正式浏览器包

输出：`P6-browser/browser-manifest.json` 与对应 PNG/DOM/network 附件。`browser-manifest.json` 必须是一个可标准解析的 JSON 对象，不能拼接多个顶层对象。

### 8.1 强制字段

每个页面记录：`family`、`url`、`locale`、`htmlLang`、`headless=false`、`browserSession`、`viewport`、`identity`、`tenant`、`object`、`screenshot`、`domArtifact`、`networkIndex`、`timestamp`、`keyLeak`、`oppositeStaticLanguageLeak`、`horizontalOverflow`、`verticalOverflow`、`overlapOrClipping`、`result`。

### 8.2 强制页面族

- 登录页 zh/en 最终成对，文件必须均在最终 manifest 之后生成。
- SSO/账户绑定、表单列表、表单设计、**表单填写/导入**、流程模板、**流程设计器**、待办、批量审批、通知记录/批量发送、任务日志、IoT 连接/脚本/设备、Agent 模型/工具、存储上传、系统列表、403/404/500。
- 移动 H5 `/m/workflow`、`/m/notify` 必须以实际 390×844 或等价明确移动视口采集；PNG 像素尺寸与登记视口一致，不接受 1280×720 替代。

### 8.3 视觉门禁

必须全部为是：

- [ ] 页面零 locale 键名、零静态混语；动态业务数据逐项登记。
- [ ] 顶栏用户名/头像、面包屑、表头、按钮和对话框无重叠、裁切、逐字异常断行或遮挡。
- [ ] 修复并重采审查 04 指出的顶栏、面包屑和通知表头；不能仅以 `scrollWidth == clientWidth` 判定无遮挡。
- [ ] 语言切换、刷新、重新登录均保持 Web、Server、Element Plus 一致；网络索引记录代表请求的 status/errorKey/eventRef。
- [ ] P1/P2 的失败/回滚面板也登记在本 browser manifest 中。

## 9. P7 — 最终快照与综合盘点包

输出：`P7-snapshot/start-manifest.json`、`end-manifest.json`、`manifest-check.json`、`inventory.json`、`web-exclusions.json`、门禁原始流。

执行顺序固定：完成所有实现 → 生成 start manifest → 构建并启动唯一 Server/Web → 完成 P1—P6 全部采集 → 运行正式门禁 → 生成 end manifest → 工具比较。

必须全部为是：

- [ ] start/end 对 Server/Web 的 HEAD、statusHash、diffHash、untrackedHash 完全一致。
- [ ] 构建产物哈希、服务 PID/启动时间、浏览器 session 在 P1—P6 中一致。
- [ ] 所有必须重采的 JSON `collectedAt > service.startedAt`。
- [ ] Server/Web 门禁按实际改动全部退出 0，计数由报告聚合；错误命令作为历史失败保留但不列为正式门禁项。
- [ ] inventory 分开报告 Server 与 Web 口径；5 枚举/127 常量、10 统一出口、4 安全出口、Web 229/354 基线均可勾稽。
- [ ] `web-exclusions.json` 恰含 144 条或最终实际数量，每条至少有 file、category、reason；汇总数与数组长度相等。
- [ ] 迁移/种子引用使用 `p61-r8b-01` 的 365 处分类，不再引用旧“DML 中文 0”。

## 10. P8 — 十八项完成回执

只有 P1—P7 每项自检全为 `true` 才能创建新的 completion receipt。回执必须逐条列 1—18：结论、对应包 ID、原始附件、对象/manifest、边界；锁定项只引用，不重跑。

必须全部为是：

- [ ] 不存在“部分完成、后续补、接近关闭、待规划确认”的当前执行缺口。
- [ ] 原子导入裁决使用本提示纠正后的口径；TEXT length 只作为范围外候选，不算 P61 待办；Provider 成功链继续明确延期，不写成待确认。
- [ ] `remaining_actionable_count=0` 与 P1—P7 实际结果一致。
- [ ] Executor 不写 PASSED/COMPLETED、不核销 P61、不移动方向、不进入阶段三。

## 11. 锁定项与禁止重验

锁定：标准 1—4、7、13 静态层、15、Server 1422/Web 1212+3 历史门禁；R2b 分类设计、R3/R4 实现设计、R9 枚举/出口计数。只有本轮代码触及对应路径才运行受影响回归，不重新设计或重复旧探索。

正确迁移结论锁定为 365 处分类；旧 0 命中附件只作失败追溯。真实 Provider 成功链不在 P61。TEXT length 不在 P61，不得顺手修复。

## 12. 允许范围、禁止事项与合法停止

| 维度 | 范围 |
|---|---|
| 允许修改 | P1/P2 计数与页面、P4 页面触发与呈现、P6 布局/响应式缺陷、验证脚本与新证据；P3/P5/P7 优先只重采，发现真实缺陷才修复 |
| 允许命令 | 本地服务/隔离库、真实 HTTP/必要 SQL、可见浏览器、正式门禁、清单/哈希/进程/端口回读 |
| 禁止修改 | 历史回执/附件、memory/knowledge/正式状态、P60 发布事实、远端分支/tag/Release、导入事务语义、TEXT length |
| 禁止证据 | 前快照结果冒充最终、多个 JSON 顶层拼接、DOM 摘要冒充网络索引、桌面画布冒充移动视口、全成功面板冒充失败下钻、汇总数冒充逐项排除 |

有任一包未全通过时继续执行，不得提交 completion receipt。只有真实秘密、MFA、人机验证、可见浏览器能力真实不可用或授权外动作，并且替代路径与独立工作全部穷尽，才可按既有机器契约报告 BLOCKED。

## 13. 相对提示 02 的变化

- **删除了什么**：撤回“导入必须同批部分成功”的错误口径；删除已锁定设计与历史门禁的重复验证。
- **原子化了什么**：剩余项收敛为 8 个独立证据包，每包有固定文件、字段、正反断言和全是门禁。
- **替代路径是什么**：用最终进程后的新机器附件、启动/结束双 manifest、合法浏览器 manifest、真实移动视口和混合失败面板替代前快照、自述与近似页面。
- **提交条件如何判定**：P1—P7 的所有复选项均为 true，start/end manifest 相等，P8 才可创建；否则继续执行或按真实契约 BLOCKED。
