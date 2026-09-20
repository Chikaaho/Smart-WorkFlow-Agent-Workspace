# P53 执行补充提示 07（证据一致性、文字分层与生产视觉终结）

> 下发角色：规划（Planner）→ 执行（Executor）  
> 日期：2026-09-19  
> 功能：p53-global-ui-component-layout  
> 状态：`VERIFYING`  
> 唯一依据：`planning-review-p53-completion-09-blocked-not-accepted.md`  
> 替代关系：**本提示替代提示06，成为唯一当前执行入口；提示01—06及阻塞回执01只作历史与证据指针，不同时作为执行待办。**

## 1. 唯一目标与输入

从review-07的生产组件改造继续，修正证据工具的布尔语义、颜色统计和文字栅格分层，在最终源码上达到31/31生产对象比较通过，再完成真实桌面/移动流程、最终工程门禁和有效terminal。不得再次用工作量、边际收益、渲染噪声或仍有明确下一动作的状态提交`BLOCKED`。

权威输入仅为：

- `planning-review-p53-completion-09-blocked-not-accepted.md`；
- 本提示；
- 主方向 `ready/direction-p53-global-ui-component-layout.md`；
- `receipt-p53-blocked-01.md`与`receipts/evidence/p53-review-07/`中的可复用进度；
- review-04锁定设计资产及哈希。

下一份且唯一允许的完成回执为`receipt-p53-supplement-07.md`；继续使用`receipts/evidence/p53-review-07/`，失败尝试追加保留，不覆盖历史运行。若实现发生新变化，所有最终断言必须来自变化后的最后快照。

## 2. 唯一剩余原子账本

| 原子ID | 失败事实 | 完成条件 | 反向断言 | 最小充分证据 | 下一动作 |
|---|---|---|---|---|---|
| `P53-EV-07a` | 对象manifest字段语义反转、17条正式路由为空，虽validator exit0但不可直接判定 | 31条均有effectiveRoute、productionComponentIds、dataInjection；字段统一为`usesAlternateRenderPath=false`，机器计数`alternate_render_path_count=0` | 不得用`true`表示“没有替代路径”；不得只凭根class声称组件身份 | 新manifest、validator源码/输出、单值exit0；31条浏览器DOM组件标记为空替代路径 | 先修证据schema与validator并重跑 |
| `P53-EV-07b` | 颜色max RGB diff=218，33条deviation被自动免失败 | 从SVG声明属性生成规范化设计样式清单；每个适用设计角色映射生产token、computed值和定点runtime样本，unmapped=0、unresolved=0、fail=0；普通纯色RGB≤3 | 禁止从PNG抗锯齿色生成伪令牌；禁止deviation自动PASS；禁止随机稀疏点错过细线后用说明豁免 | canonical-style-inventory、映射表、合成色/细线定点采样、机器汇总、单值exit0 | 重写颜色抽取和校验后重跑，不再尝试MCP |
| `P53-EV-07c` | 当前最终文件为23/31，b/c均exit1，回执25/31已失真 | 更正glyph方法后四family 31/31通过、failed_regions=0、四exit0；文字DOM指标与容器几何通过 | 非文字结构、颜色、边框、图标、按钮、表格、画布不得进入glyph遮罩；不允许放宽2%区域阈值 | runtime/diff/DOM/masks/comparison/family summary/exit；机器回读31节点唯一汇总 | 先重算文字遮罩，再继续修所有非文字失败 |
| `P53-EV-07d` | 06d未执行，正式流、移动、after指纹、最终门禁和terminal缺失 | 最终指纹下11类正式路由、必要状态、4个375×812页面通过；typecheck/Vitest/build/visual verify/lint、前后指纹与terminal全通过 | 无page error、横向溢出、基线掩盖外部失败、缺文件引用或回执/证据计数冲突 | 正式capture manifest、截图/事实/网络索引、最终门禁原始流与单值exit、terminal input/stdout/stderr/exit/roundtrip | 仅在07a/b/c全0后执行完整收尾 |

父子映射：提示06的06a→07a，06c→07b，06b→07c，06d→07d。

## 3. 文字比较方法（本提示授权的规划更正）

允许把纯字形栅格差异从非文字像素中分离，但必须同时满足：

1. glyph遮罩由机器自动生成，只能取DOM文字`Range`行框与参考图中落在对应行框邻域的字形连通域并集；边界吸收最大4px。
2. 每页glyph/raster总遮罩仍≤12%；topbar、sidebar和main分别报告覆盖率。
3. 关键结构遮罩保持0：卡片、表格、边框、按钮、图标、画布、节点、连线、弹窗、遮罩层和颜色面不得被文字遮罩吞并。
4. 每节点至少核对标题、正文、次要文字、按钮/标签四类的字体族、字号、字重、行高、文字容器x/y/w/h；几何偏差≤2px。
5. 比较器必须同时输出`glyph_mask_reason`、原始行框、扩展后边界和被排除的非文字候选；任何自动遮罩越界即该节点失败。

该方法只吸收设计PNG与浏览器字体光栅化差异，不允许吸收布局和视觉实现差异。pad=4不是无条件全页膨胀，而是上述受限glyph边界的最大值。

## 4. 无生产能力的设计演示项

视觉层允许在测试会话中通过mock/API数据注入设计演示记录，前提是：

- 使用同一个生产通用组件和同一DOM/样式路径；
- 不新增生产节点类型、种子、权限、路由或可提交的假能力；
- 不用session/query/env切换专用页面或组件；
- 正式真实后端流程仍证明这些能力不会作为可用入口出现。

因此，IoT指令、Agent等设计演示项若只是palette/workbar的受控数据状态，可在DESIGN_FIDELITY层注入同一生产列表组件以验证布局；FORMAL_FLOW层必须保持真实能力边界。若生产通用组件不能承载，使用诚实禁用/不可用占位保留设计信息层级和足迹，不得留下大面积结构缺口。

## 5. 颜色校验方法

Figma MCP不可用事实已锁定，本轮直接使用锁定SVG/PNG：

1. 规范清单只读取SVG元素/样式中的`fill`、`stroke`、`stop-color`、`flood-color`、opacity、gradient和filter声明，并按节点、视觉角色和完整RGBA/效果参数去重。
2. PNG只用于交叉验证，不从抗锯齿、阴影扩散或半透明混色像素反向制造独立token。
3. 半透明色按设计前景、alpha和实际背景计算预期合成RGB，再与runtime采样比较；渐变记录全部stops/angle/opacity并定点采样；阴影记录rgba/offset/blur/spread。
4. 1—2px细线必须从DOM/SVG几何定位实际线段中点采样，同时回读computed/SVG属性；不能使用覆盖大盒子的稀疏网格。
5. 只有主方向允许的无障碍文字前景调整可以形成`adjusted`记录，且必须包含原值、调整值、对比度、作用域和设计节点；其他超差一律计fail。
6. 汇总至少输出`declaredDistinct/mapped/applicable/notApplicable/unmapped/unresolved/pixelSampled/maxRgbDiff/fail`。`notApplicable`必须绑定主方向明确省略的设计元素，不能代替未命中的生产颜色。

## 6. 锁定项、范围与顺序

| 维度 | 内容 |
|---|---|
| 锁定进度 | review-04设计身份；MCP不可用fallback；family-a/d当前通过结果；生产组件树改造方向 |
| 允许修改 | P53生产令牌、公共布局、正式页面/组件、数据/状态fixture、比较器与review-07证据 |
| 禁止修改 | Server、数据库/API、认证/租户/权限/流程语义、历史证据、P60、P61、P53功能状态 |
| 执行顺序 | 07a证据schema → 07b颜色方法 → 07c glyph重算与生产视觉修复 → 31/31复核 → 07d真实流/移动/最终门禁 → terminal/唯一回执 |

若公共样式或组件变化影响已通过节点，必须重采受影响family；不得以“此前通过”跳过快照失效。

## 7. 中间汇报与合法停止

过程进度只追加到`progress.jsonl`，写后继续执行。以下均不是阻塞：

- family仍有exit1；
- 需要继续逐元素调色或调布局；
- 字体/浏览器栅格存在差异但本提示的glyph方法尚可使用；
- 实验次数多、耗时长、收益变小、单轮上下文结束；
- 已经列出下一动作或可以修改生产视觉/验证资产继续推进。

禁止提交中间回执、阶段汇报、部分完成包、`WAIT_PLANNER`或再次用`EVIDENCE_GAP`包装授权内工作。

只有以下两类终态合法：

1. 07a—07d全部完成，`remaining_actionable_count=0`，提交`receipt-p53-supplement-07.md`和通过validator的terminal包；
2. 真实外部权限/凭据/不可恢复环境/授权外动作阻塞，且安全替代与全部独立工作已穷尽，提交可由实际工具结果复核的`BLOCKED`。

## 8. 提交前自检

- [ ] manifest是否31条effectiveRoute完整且`usesAlternateRenderPath=false`？
- [ ] 颜色是否来自声明属性而非PNG混色去重，且无自动豁免bucket？
- [ ] 适用纯色runtime RGB是否每通道≤3，渐变/阴影/alpha是否按效果参数验证？
- [ ] glyph遮罩是否严格限定字形、最大4px、总覆盖≤12%、结构遮罩0？
- [ ] 文字字体与容器几何是否逐项通过？
- [ ] 四family是否来自最终快照且31/31、failed_regions=0、四exit0？
- [ ] 真实11类路由、4移动页面、最终门禁、after指纹是否完整？
- [ ] 回执计数是否由当前文件机器生成并回读，引用文件是否全部存在？
- [ ] terminal是否有input/stdout/stderr/单值exit与roundtrip，且与回执完全一致？
- [ ] 是否未改P53状态、未执行P61、未提交中间汇报？

任一答案为否，继续执行，不提交。
