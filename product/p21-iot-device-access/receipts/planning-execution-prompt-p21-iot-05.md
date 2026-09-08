# P21 IoT 设备接入三级后续收敛提示 05

> 日期：2026-09-08  
> 当前状态：VERIFYING  
> 唯一依据：`planning-review-p21-iot-06.md`  
> 本提示替代：`planning-execution-prompt-p21-iot-04.md`；提示 04 及更早材料仅作追溯  
> 当前唯一 Executor 修正入口：本文件

## 一、权威输入与锁定范围

只读取本提示、第六轮审查、`completion-p21-iot-06.md` 及审查点名的 H3b/H9/H10 附件。主方向仅在核对原语义时读取，不重新展开历史待办。

L1—L33 全部锁定。尤其禁止重跑 Owner Broker、ACK、三策略、类型映射、租户隔离、设备开关、前后端全量门禁、r2 manifest，以及 H10c 针对 completion06 的旧校验场景；completion07 仅按 H10d 要求运行一次终态 Validator。后端全仓测试的锁定真实值为 **1182 tests / 0 failures / 0 errors / 0 skipped**；43 只是旧回执转录错误。

## 二、唯一剩余缺口矩阵

H3b 拆分为已锁定 H3b1（三来源保存/刷新）和剩余 H3b2（候选排除）。其他原子 ID 保持不变。

| 原子ID | 失败事实 | 完成条件与反向断言 | 对象身份 | 最小充分证据 | 下一动作/合法停止 |
|---|---|---|---|---|---|
| H3b2 | fixed 图未打开候选集合，只有摘要称不合格设备缺席 | 原生 DOM/accessibility snapshot 显示目标设备下拉已展开、全部 option；Owner温感存在，设备 `999999999999999999` 不存在 | 流程定义 `2097131608510832642`、Owner温感 `2097131606828916738` | `final-h3b-r3/candidate.snapshot.json`、`network.json`、`verify.log`；network 必须带 eligible 响应中的候选 ID 集合 | 用 CUA 打开既有 fixed 配置下拉并直接导出状态；真实浏览器工具无法导出 DOM/截图且有原始错误时才可 BLOCKED |
| H9b | 四图未显示 HEALTHY/AUTH_FAILED、结果或掩码 | 两个连接分别点击测试后，原生页面状态明确含 HEALTHY/SUCCESS 与 UNHEALTHY/AUTH_FAILED；凭证字段只见掩码，错误连接不得显示成功 | owner connection `2097131605679677442`；bad connection `2097135932003618817` | `final-h9b-r3/owner.snapshot.json`、`bad.snapshot.json`、`network.json`、`verify.log` | 对两行执行测试后立即导出可访问性/DOM；若 toast 短暂，导出测试后列表行和可见 alert；工具真限制才 BLOCKED |
| H9c | Java/JS 图为同一纯黑图 | 两次试运行后的原生页面状态分别显示受控副作用拒绝、脚本/执行 ID；不得出现真实发布或下行动作 | Java `2097131615104278529`；JS `2097131612029853698`；沿用 L23 API 对象 | `final-h9c-r3/java.snapshot.json`、`js.snapshot.json`、`network.json`、`verify.log` | 用 CUA 点击后直接导出页面状态；不再要求系统截图；原生 DOM 与原生截图均真实不可用且有工具错误时才 BLOCKED |
| H9d | 规则/列表/详情三图为同一纯黑图 | 原生页面状态依次显示指定规则、trigger 列表与 trigger 详情；详情 ID、instance、formSnapshot 与 L23/L29 同一对象 | rule `2097230132959371265`；trigger `2097230429886734338` | `final-h9d-r3/rule.snapshot.json`、`trigger-list.snapshot.json`、`trigger-detail.snapshot.json`、`network.json`、`verify.log` | 用同一浏览器会话逐页导出；列表文字或 API 单独输出不可替代详情弹窗状态 |
| H9e | 八图为同一纯黑图 | 四个 tab 的原生状态均显示激活标签、目标行；点击后详情弹窗可见且 ID 与 L23 锁定对象一致；无空 tab/串对象 | message `2097232717019734018`、command `2097231817148588033`、scriptExec `2097235395296747521`、trigger `2097230429886734338` | `final-h9e-r3/states.jsonl`（每个 tab/详情一条原生快照）、`network.json`、`verify.log` | 在同一会话依次点击四 tab/行并直接保存原生快照；API 文本与人工摘要不可替代 |
| H10a-R | completion06/verify 把最后模块 43 误写成全仓总数 | 新回执只转录 12 个模块汇总之和 1182/0/0/0；不得改写旧回执或重跑测试 | `final-h10a-r2/backend-full.log` 当前锁定文件 | `final-h10a-report-r3/summary-lines.txt`、`aggregate.txt`、`verify.log`，由命令从锁定日志生成并回读 | 机械汇总；若结果不是 1182/0/0/0，保留真实差异，不得手填 |
| H10d | terminal/ledger 把未关闭浏览器项写成全部完成 | `completion-p21-iot-07.md` 与 ledger 逐项一致；只有 H3b2/H9b—H9e 全通过才允许 remaining=0；browser_status 与原生工具结果一致 | 本轮唯一 terminal 与 r3 账本 | `final-h10d-r3/ledger.json`、`compare.log`、`validator.exit`、`verify.log` | 最后冻结 completion07，再生成/比对账本并运行终态 Validator；任一浏览器项未过则如实保留 actionable，不能提交全完成 |

## 三、取证方法变更

- 删除：H1/H2/H3a/H4b/H7/H9a/H10a 行为/H10b/H10c，以及 H3b 三来源保存刷新；这些已转 L25—L33。
- 原子化：H3b 只剩候选排除 H3b2；H10a 只剩报告转录 H10a-R。
- 替代路径：停止使用 `screencapture` 或其他已经生成纯黑图的系统截屏。优先使用浏览器/CUA 工具原生 accessibility/DOM snapshot；原生 screenshot 清晰可读时也可作为补充，但不是必需。
- 可判定提交条件：snapshot 必须包含采集时间、URL、当前激活控件、目标行/弹窗的可见文本与对象 ID；文件内容必须来自工具原始结果，不得手写 `observed` 摘要冒充原生快照。

## 四、读取、修改与顺序

| 维度 | 内容 |
|---|---|
| 允许读取 | 本提示、第六轮审查、completion06、H3b/H9/H10 点名附件及完成浏览器操作所需实现/工程配置 |
| 允许修改 | 仅确证的新 UI 缺陷、r3 证据包、`completion-p21-iot-07.md`；禁止覆盖历史回执、审查和 r2 附件 |
| 允许命令 | 真实浏览器/CUA、前端请求日志导出、锁定 Maven 日志机械汇总、终态账本/Validator 校验；不重跑已锁定业务链和全量测试 |
| 执行顺序 | H3b2→H9b→H9c→H9d→H9e→H10a-R→写并冻结 completion07→H10d 账本/Validator→禁止再改 completion07 |
| 代码变化 | 若原生页面复验发现实际产品缺陷并修改代码，只运行该变化对应的最小工程门禁，并明确哪一锁定快照因此失效；不得无理由重跑全部 |

## 五、提交门禁

- [ ] H3b 展开的候选原生状态同时证明合格存在、不合格 ID 缺席？
- [ ] H9b 两种结果与掩码均在原生页面状态中可见？
- [ ] H9c、H9d、H9e 的每个目标页面/弹窗都有不同且可读的原生 snapshot，不再出现同哈希纯黑图？
- [ ] snapshot 是工具原始结果，包含 URL、控件/文本和对象 ID，而不是 `observed` 自述？
- [ ] H10a-R 从锁定日志机械得到 1182/0/0/0，且没有重跑？
- [ ] completion07 冻结后 ledger、Validator、remaining 与 browser_status 全部一致？
- [ ] 新证据未包含明文账号口令、Token 或其他秘密？

全部为是才允许提交 `completion-p21-iot-07.md`。工具真实限制须附原始失败结果，并在已穷尽原生 DOM、accessibility 与原生 screenshot 替代后按契约报告 `BLOCKED`；不得再次以纯黑图、人工摘要或 HTTP 200 宣称页面已完成。Executor 不得写 `PASSED/COMPLETED` 或进入阶段三。
