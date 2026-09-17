# P53 执行补充提示 03（三级，Owner 视觉复核修订）

> 角色：规划（Planner）下发 → 执行（Executor）  
> 日期：2026-09-17  
> 功能：p53-global-ui-component-layout  
> 状态：`VERIFYING`  
> 最新审查：`planning-review-p53-completion-05-not-passed.md`  
> 提示级别：三级  
> 替代关系：**本提示替代提示02及提示03的 lint-only 旧内容，成为唯一当前执行入口；验收01—05和既有回执只作追溯，不同时作为执行待办。**

## 1. 本轮目标与输入

Owner 已直接确认当前界面与设计稿还原度明显不足，尤其颜色。不得把“页面可用”“截图已落盘”“alpha=255”或实现对自身 Playwright 基线 0 failure 当作 UI 还原通过。

执行前只把以下内容作为权威输入：

1. `product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-05-not-passed.md`；
2. 本提示；
3. `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout.md`，尤其 §2、§4.1、§4.5—§4.7、§5、§9；
4. `product/p53-global-ui-component-layout/receipts/receipt-p53-supplement-03.md` 与 `product/p53-global-ui-component-layout/receipts/evidence/p53-review-03/terminal-payload.json`，仅用于复用已证明的行为对象和现有最终指纹；
5. 设计源：优先 Figma file `mbEKPcZv9pcchmElQanR5E` / page `0:1`；MCP 不可用时才使用已锁定 `docs/ui/png/` 与 `docs/ui/svg/`。

唯一新回执：`product/p53-global-ui-component-layout/receipts/receipt-p53-supplement-04.md`。  
独立证据根目录：`product/p53-global-ui-component-layout/receipts/evidence/p53-review-04/`。

## 2. 本轮原子账本

| 原子 | 要解决的唯一问题 | 唯一可接受结果 |
|---|---|---|
| `P53-EV-00a-R1` | 参考源权威性 | 真实尝试只读 Figma MCP；可用则保存 file/page/node 身份与读取结果并优先对标，真实不可用才保存失败结果并切换到锁定本地图片；不得口头声称不可用 |
| `P53-EV-05a-R1` | 颜色还原度 | 建立设计色→令牌→computed style→截图稳定区采样的四向映射；品牌、导航、背景、文字、边框、状态、浮层和 Element Plus 色阶均有正反向结论，必要无障碍偏差有逐项说明 |
| `P53-EV-05b-R1` | 整体 UI 还原度 | 32 节点处置矩阵逐项复核；适用实现/状态均有参考与最终运行图成对证据，字体、间距、尺寸、圆角、边框、阴影、图标、层级、对齐、响应式和浮层位置达到方向阈值 |
| `P53-EV-01a-R1` | 最终源码快照 lint | 所有视觉修复结束后，在新最终指纹下 lint exit 0、0 errors、0 warnings，且 lint 前后源码指纹完全一致 |

审查04已经证明的菜单/审批人/意见弹窗真实行为、身份、URL、请求与焦点事实继续锁定；本轮必须重采它们受影响的**视觉**，但只有实现触及行为代码或契约时才重跑对应业务链。

## 3. 参考源获取：MCP 优先、图片兜底

### 3.1 必须先尝试 MCP

在修改实现前，尝试当前环境实际可用的只读 Figma MCP，读取指定 file/page 的节点结构、设计属性和可用截图/渲染信息。将结果写入：

- `reference/reference-source.json`：工具名、调用时间、file key、page/node、result=`AVAILABLE|UNAVAILABLE|PERMISSION_DENIED|OBJECT_NOT_FOUND`、非敏感错误摘要；
- `reference/figma-node-map.json`：可用时记录32节点与运行时处置的映射、节点ID、名称、尺寸和关键视觉属性；
- `reference/figma-captures/`：工具支持时保存可回读参考图或其稳定资源指针。

MCP 可用时，以对应 Figma 节点为主参考，并用锁定导出图做身份/差异交叉检查。不得跳过 MCP 尝试直接宣称图片已足够。

### 3.2 只有真实不可用才退回图片

若 MCP 返回不可用、权限拒绝或目标不可读，保存真实工具结果后，立即使用锁定的 `docs/ui/png/` 与 `docs/ui/svg/`，不得把 MCP 不可用报告为阻塞。生成 `reference/local-design-index.json`，记录32组文件路径、尺寸、SHA-256及节点映射。

若 MCP 与锁定导出图在布局、颜色或节点身份上存在实质冲突，不得自行挑选更容易通过的一方；保存差异并停止该冲突原子，回报 Planner 裁决。无冲突项继续推进。

## 4. 修改前差异审计

先以当前运行界面建立 `current-audit/`，不得先改代码再补写差异：

1. 逐项填写 `current-audit/node-fidelity-matrix.md`：32节点、处置类型、参考源、运行页面/状态、视口、当前截图、颜色差异、几何/字体/效果差异、是否需修复；节点31按方向保持未来参考，不得造假入口。
2. 生成 `current-audit/color-token-audit.json`：设计颜色、用途、设计来源位置、当前令牌、运行时 computed style、截图稳定区域坐标/RGB、差异及结论。
3. 优先核对固定基线：品牌主色 `#6F2DFF`；深色导航 `#17213A` / `#19233B`；正文、交互、状态色与 Element Plus 派生色必须来自单一令牌源并满足方向对比度。
4. 保存当前运行截图，和参考图使用相同或可解释的视口、裁切与缩放。禁止调整参考图色相、饱和度、亮度来迁就实现。

## 5. 修复和最终对标

### 5.1 修复顺序

1. 统一品牌/导航/语义/Element Plus 颜色令牌和真实消费路径；
2. 修正全局字体、字号、字重、行高、间距、圆角、边框、阴影与图标；
3. 修正全局壳、导航、侧栏、内容宽度及页面族布局；
4. 修正组件状态、菜单、弹窗、浮层和响应式；
5. 最后修页面级例外。不得为每页建立平行品牌色或散落硬编码补丁。

### 5.2 颜色硬门禁

- 对纯色稳定区域，从参考与最终截图的内部区域取样；主样本不得落在文字/图标抗锯齿边缘。
- 设计色、令牌值和 computed style 对固定纯色应精确一致；截图采样每个 RGB 通道差值原则上不超过3。超出即失败。
- 因 WCAG 2.1 AA 做最小调整时，必须记录原设计值、调整值、前后对比度、适用组件和必要性；不能以“可访问性”为由整体换色。
- 禁止只改十六进制常量却没有证明真实组件消费；禁止截图滤镜、后处理或图片覆盖伪造颜色。

### 5.3 整体还原硬门禁

- 每个适用节点至少保存 `reference` 与 `final` 成对图；尺寸、缩放、视口、语言和状态必须可勾稽。
- 对稳定区域执行参考图→最终图的像素/结构差异；沿用方向 §4.7 阈值：顶栏≤0.5%、侧栏≤0.5%、主区≤2%、en-US长文本区≤3%。
- 仅真实动态文本、时间、ID、头像或服务端数据允许遮罩；`comparison-mask-index.json` 必须记录矩形、原因和面积。导航、容器、按钮、表单、卡片、弹窗、颜色和关键结构禁止遮罩。
- 无论差异比例是否合格，关键元素越界>1px、遮挡>4px²、关键容器位置偏差>2px、断点错误、状态缺失、颜色硬门禁失败均直接失败。
- Playwright 当前基线只能承担回归稳定性。禁止通过 `--update-snapshots` 把低还原实现更新成新基线后据此宣称设计还原通过；只有外部设计对标已经通过，才允许更新受影响的内部基线，并保留更新前失败与更新理由。

最终材料写入：

- `final/node-fidelity-matrix.md`；
- `final/color-fidelity.json`；
- `final/reference-runtime-pairs/`；
- `final/comparison-results.json`；
- `final/comparison-mask-index.json`；
- `final/browser-evidence-index.md`。

## 6. 最终验证顺序

1. 所有视觉修复完成，生成最终源码指纹；
2. 按实际影响运行 typecheck、Vitest 与 build；
3. 先在外部设计对标中证明颜色和整体还原通过；
4. 再更新受影响的内部视觉基线，并执行一次无 `--grep`、单 worker 的全量视觉验证，必须 failed=0、exit=0；更新与验证日志分开保存；
5. 在最终源码指纹运行 `pnpm lint`，stdout/stderr/exit分开保存，工具统计0 errors/0 warnings；
6. lint 后重算源码指纹，必须与 lint 前一致；
7. 校验全部证据索引、回执与 terminal payload 后提交。

若修复触及已锁定行为代码，插入对应的最小真实浏览器复验；正式浏览器证据仍须用户可见、可交互、`headless=false`。后台/无头比较只承担视觉差异计算，不升级为正式业务行为通过。

## 7. 允许范围与禁止事项

| 维度 | 约束 |
|---|---|
| 允许读取 | 最新审查、本提示、主方向、补充03回执/证据、Figma MCP只读结果、锁定设计包、Web源码与测试/视觉配置 |
| 允许修改 | Web视觉令牌、样式、布局、相关组件与受影响验证资产；新证据与补充04回执 |
| 禁止修改 | Server、数据库/API契约、认证/租户/权限语义、P61、P60发布身份、历史回执/审查/证据、P53状态 |
| 禁止替代 | 功能可用替代还原度；内部自基线替代设计源；MCP口头不可用；只给拼图/缩略图；滤镜/整页图片/SVG背景伪装实现 |
| 范围控制 | 只修 P53 设计还原及其直接回归；设计稿无真实能力的元素仍按方向省略或诚实呈现，不新增业务能力 |

## 8. 回执与 terminal 必填字段

- `reference_source`、`mcp_tool`、`mcp_result`、`figma_file_key`、`figma_page_id`、`fallback_used`；
- `reference_identity_hashes`、`node_count_total=32`、`node_count_compared`、`node_count_non_runtime`；
- `color_tokens_total`、`color_tokens_passed`、`color_tokens_failed`、`color_accessibility_exceptions`；
- `comparison_regions_total`、`comparison_regions_passed`、`comparison_regions_failed`、`masked_area_ratio`；
- `source_before_fingerprint`、`source_final_fingerprint`、`lint_before_fingerprint`、`lint_after_fingerprint`；
- typecheck/Vitest/build、视觉 update/verify、lint 的命令、exit、passed/failed/skipped及原始日志路径；
- `formal_browser_acceptance`、身份、URL、视口、对象、网络与最终PNG索引；
- 四个 work items 的状态、`remaining_actionable_count`、`independent_work_exhausted`、`next_action`、`next_action_type`、`progress_fingerprint`、`progress_basis`、`stop_reason`、`tool_results`、`browser_status`。

## 9. 全部为是才允许提交

- [ ] 已真实尝试 Figma MCP；可用时优先使用，不可用时保存了工具结果再转图片？
- [ ] 32节点均有处置，所有适用实现/状态都有参考与最终运行图成对证据？
- [ ] 品牌、导航、背景、文字、边框、状态、浮层和 Element Plus 色阶已完成四向颜色勾稽且失败为0？
- [ ] 字体、尺寸、间距、圆角、阴影、图标、层级、对齐、响应式和浮层位置达到方向阈值？
- [ ] 动态遮罩逐项登记，关键结构和颜色未被遮罩？
- [ ] 未用更新后的内部自基线替代外部设计对标？
- [ ] 受影响门禁、全量视觉验证与最终快照 lint 均通过，lint 前后指纹一致？
- [ ] 已锁定行为只按影响复验，未扩张 Server/P61/P60/业务能力？
- [ ] 四个原子全部完成、remaining=0、terminal校验通过？
- [ ] P53仍为 `VERIFYING`，未自行写 `PASSED/COMPLETED`、未归档、未恢复P61？

有授权内可修复项时不得停止。MCP 不可用时本地设计包是既定替代路径，不得据此报告 `BLOCKED`。提交后等待 Planner 独立复核。
