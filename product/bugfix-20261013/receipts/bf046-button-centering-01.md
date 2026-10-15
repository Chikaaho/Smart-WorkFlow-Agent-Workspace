# BF20261013-046 执行回执：按钮 / 徽标文字居中（含全局巡检）

2026-10-15｜执行者提交（fix-loop 持续修复批次）。Owner 反馈：**「加一个，我发现很多未居中的按钮，都要设置居中」**（截图红框：表单设计器「关联流程」面板的「新建流程」「查询」「草稿」徽标）。

## 一、问题性质与成因

红框三处与同类页面都源自 fixture 迁移期的写法：按钮/徽标给了**定宽**，但用 `text-align: left` + `justify-content: flex-start` 把文字按「设计稿示意位置」钉在左边——定宽之下文字就明显偏左。同类还有两处位移 hack。

## 二、已修复（本批 5 处）

| 页面 | 控件 | 原因 | 修法 |
|---|---|---|---|
| `RelatedProcessesPanel`（表单设计器-流程设计） | 「新建流程」（140px）、「查询」（88px） | `text-align:left + justify-content:flex-start` | 改 `center`（Owner 红框① ②） |
| 同上 | 「草稿 / 已启用」状态徽标（84px） | `justify-content:flex-start + text-align:left` | 改 `center`（Owner 红框③） |
| `MyInstances`（我发起的） | `＋ 新建`（86px） | 绝对定位 `span` + `text-align:left`（文字贴按钮左缘，实测 dx −19） | 改 `center` |
| 同上 | 状态徽标（定宽 72px） | `.el-tag__content` 块级左对齐（dx −17） | 内容 `text-align:center` |
| `PortalHome`（我的门户） | 「查看」（64px） | `.el-button > span { position:relative; left:18px }` 位移 hack（文字被推到右缘，dx +18） | 删除该 hack（按钮本就居中） |

## 三、全局巡检（回答「很多」）

**方法**：浏览器内对页面所有**可见 `button` 与 `.el-tag`** 逐一测量——取元素内**文字节点**的 `Range.getClientRects()` 合并盒中心，与控件盒中心比较，`|dx|>3px` 即判偏离；排除「图标+文字组合按钮」（文字天然偏移是设计，如「＋ 新建流程」）、列表项/树行/卡片等**语义上左对齐**的整行控件。

**范围**：30 条路由/页面，覆盖两套外壳（管理端 / 工作台）与主要列表页：
`/workflow/defs`、`/workflow/instances`、`/workflow/monitor`、`/workflow/center`、`/workflow/catalog`、`/workflow/catalog-admin`、`/workflow/todo`、`/workflow/processed`、`/workflow/my-cc`、`/workflow/my-instances`、`/workflow/analytics`、`/workflow/batch-approval`、`/workflow/handover`、`/workflow/templates`、`/workflow/approval-form`、`/workflow/workspace-card-types`、`/workflow/defs/{id}/design`（流程设计器）、`/form/form-def-list`、`/form/txn-action`、`/form/designer/{id}?tab=processes`（表单设计器-关联流程）、`/system/user|role|menu|dept|dict|post`、`/notify/template|rule|channel|record|preference|batch-send`、`/job/list`、`/iot/connections`、`/agent/conversations/list`、`/agent/executions/list`、`/agent/tool`、`/workspace`、`/workspace/todo|processed|my-drafts`、`/portal`。

**结果**：同批修复上表 5 处；其余命中均为合法左对齐（流程中心树行「全部 1」、catalog-mini 流程卡片、门户指标卡片、图标+文字按钮如「＋ 新建流程 / 返回表单列表 / 设置」）。**修复后复核 dx 全 0**。

> 机制说明（非本批引入）：`text-align/justify-content` 只影响**内容**排布；本次偏左的真正观感来源是「定宽 + 左对齐」组合。图标+文字按钮的文字偏移属设计预期，不在修复范围。

## 四、验证

- Web 四门：lint 0 错 3 警（既有）、typecheck 0、vitest **1522** 通过 3 跳过、build ✓。
- 实景复核（应用内浏览器 1280×720）：
  - 关联流程面板：「新建流程 / 查询 / 草稿·已启用」实测 dx = 0（截图 evidence/bf046-panel-centering.png）；
  - 我发起的：「＋ 新建 / 已通过」徽标 dx = 0（截图 evidence/bf046-my-instances-centering.png）；
  - 我的门户：「查看」按钮 dx = 18 → **0**。
- BF037~040 的版式口径未回退（本次只改文字排布，未动几何/内距/表头底色）。

## 五、提交

- Web：codex/bugfix-20261013 `34d54c5`（与 BF042~045 同批；本项为其中「按钮/徽标居中」部分）。
- 根仓：台账 BF20261013-046 行 + 本回执 + 证据索引。

## 六、状态

**待 Owner 点验**。若 Owner 在其他页面仍看到未居中控件，请截图指认具体页面/控件名——巡检脚本按「文字盒中心」判定，语义上左对齐的整行控件（列表项/树行/卡片）默认不在修复范围，可单独判定。
