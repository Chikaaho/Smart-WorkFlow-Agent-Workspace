# P53 功能级验收审查 03：未通过

> 审查角色：规划（Planner）  
> 日期：2026-09-17  
> 功能：p53-global-ui-component-layout  
> 审查对象：`receipt-p53-supplement-02.md`、`evidence/p53-review-02/executor-02/`、`evidence/p53-review-02/browser-artifacts/`  
> 验收结论：**本次未通过**  
> 功能状态：`VERIFYING`  
> 后续唯一入口：`planning-execution-prompt-p53-global-ui-component-layout-02.md`

## 1. 裁决

本轮确认 `P53-EV-01a` 已关闭：最终 `gate-final-lint.log` 只有 `$ eslint .`，退出码为 0，原始输出、0 errors / 0 warnings 口径与最终源码指纹能够勾稽。该原子自本审查起锁定，不再复验。

其余五个原子仍不能判定通过。原因不是产品行为全部缺失，而是最终快照的正式证据没有封装完成，并且受影响视觉矩阵仍有真实失败：

1. `receipt-p53-supplement-02.md` 与 `terminal-payload.json` 明确写明 `formal_browser_acceptance=false`；`executor-02` 对菜单、审批人选择、意见弹窗、桌面壳和移动页均只提交 facts，没有正式 PNG、截图哈希或最终快照像素结果。执行方也明确承认 facts 不能替代 PNG。
2. 同一目录较早的 `browser-artifacts/*.png` 证明 PNG 落盘路径客观存在，并展示了菜单、审批人选择、意见弹窗、桌面壳及四个 375 页面；但这些图采于 11:29—11:57，最终源码指纹形成于 13:05，且没有截图前后同指纹回读，属于快照过期，不能代替最终证据。
3. 较早截图 facts 与最新 facts 存在直接差异：旧图对应 Portal 顶栏 `rgb(111,45,255)`、Admin 顶栏 `rgb(23,32,51)`；`executor-02/ev3-desktop-shell-facts.json` 写为 `rgb(64,54,154)`、`rgb(17,27,59)`。因此旧 PNG 明确不是最新 facts 所描述的同一视觉快照。
4. `visual-update.log` 最终为 **61 passed / 17 skipped / 10 failed / exit 1**。失败覆盖管理端壳、流程中心、数据列表、任务详情、发起流程、表单设计器和流程设计器；其中管理壳、流程中心、任务详情、流程设计器直接属于本轮剩余原子。后续 27 passed / 5 skipped 的聚焦集合只覆盖壳子集，不能把全量受影响矩阵的真实失败改写为通过。
5. “data:image 导航被策略拒绝”只证明该导出尝试不可用，不证明截图工具整体不可用。既有 `browser-artifacts/*.png` 已提供反证；在未复用已成功的落盘路径、也未尝试可见 headed 浏览器直接写 PNG 前，不满足合法工具阻塞条件。

不得核销 P53、不得移动主方向、不得进入阶段三或恢复 P61。

## 2. 原子裁决与失败分类

| 原子 | 本轮裁决 | 最新事实 | 分类 | 下一轮要求 |
|---|---|---|---|---|
| P53-EV-01a | **通过并锁定** | lint exit 0，原始输出无 warning/error，口径为 0/0 | 已关闭 | 禁止重验；仅引用本审查与最终日志 |
| P53-EV-02a | 未通过 | 最终快照只有菜单 facts；旧展开态 PNG 早于最终指纹且顶栏视觉已变化 | 快照过期 + 缺证据 | 在最终指纹下重采两张展开态 PNG并生成哈希/对象 facts |
| P53-EV-02b | 未通过 | 真实候选链 facts 与旧 PNG 可见，但最终包无同快照 PNG；全量视觉中流程设计器用例失败 | 快照过期 + 受影响回归失败 | 最终快照重采候选弹窗、回填、保存/校验及网络索引；关闭对应视觉失败 |
| P53-EV-02c | 未通过 | 真实意见对象 facts 与旧 PNG 可见，但最终包无同快照 PNG；全量视觉中任务详情用例失败 | 快照过期 + 受影响回归失败 | 最终快照重采展开态与 Escape/焦点回返；关闭对应视觉失败 |
| P53-EV-03a | 未通过 | 最新 facts 声称几何合格，但无最终 PNG/alpha；旧 PNG 与最新顶栏颜色不一致；全量矩阵相关项失败 | 快照过期 + 缺证据 + 受影响回归失败 | 最终快照四页 PNG、像素/几何 facts、哈希及全量视觉 exit 0 |
| P53-EV-04a | 未通过 | 最新 facts 声称背景/对比度合格，但无最终四页 PNG与中心 alpha；旧图未与最终指纹绑定 | 快照过期 + 缺证据 | 最终快照四页 PNG、alpha/对比度/hScroll/触控 facts与哈希 |

本次没有新增需求，也没有把工具限制计成产品缺陷。可见行为的旧图可以作为定位与采集方法参考，但不能作为最终快照通过证据。

## 3. 继续锁定的通过项

- 新锁定：`P53-EV-01a`，最终 lint 为 0 errors / 0 warnings。
- 继续锁定：设计资产 64/64；SSO 租户口径；真实登录、会话、工作台、门户、动态分类、数据列表、审批命令、表单提交、字段清单、无角色深链拒绝与 T100 撤权链。
- 继续锁定：节点13无虚假入口、节点31不实现、动态分类不写死、不新增 Server 契约、P61保持排期等待。
- typecheck、Vitest、build 本轮最终快照结果可沿用；视觉矩阵因全局布局/样式变化且已有 exit 1 反证，不锁定为通过。

## 4. 升级处理

一级提示已明确要求“PNG、facts、原始输出和最终指纹同对象同快照”，本轮仍以 facts 和任务内可见截图说明替代最终 PNG，并把可继续尝试的截图归档路径报告为阻塞；同类证据封装问题在一级提示后继续存在。

按 `roles/planner.md` §7.1 下发二级提示：

`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-02.md`

该提示替代提示01，成为唯一当前执行入口。下一轮只验收 `P53-EV-02a/02b/02c/03a/04a`；`P53-EV-01a` 及其他锁定项不得重新展开。
