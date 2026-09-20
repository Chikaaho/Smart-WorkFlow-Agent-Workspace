# P53 执行补充提示 04（设计还原换路径收敛）

> 下发角色：规划（Planner）→ 执行（Executor）  
> 日期：2026-09-17  
> 功能：p53-global-ui-component-layout  
> 状态：`VERIFYING`  
> 唯一依据：`planning-review-p53-completion-06-not-passed.md`  
> 替代关系：**本提示替代提示03，成为唯一当前执行入口；提示01—03及验收01—06只作追溯，不同时作为执行待办。**

## 1. 唯一输入与输出

读取：

1. `product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-06-not-passed.md`；
2. 本提示；
3. `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout.md`；
4. `product/p53-global-ui-component-layout/receipts/receipt-p53-supplement-04.md`；
5. `product/p53-global-ui-component-layout/receipts/evidence/p53-review-04/` 中已锁定参考源、成对图、差异结果、最终截图和门禁日志。

禁止再次调用 MCP 或重建参考源。唯一新回执为 `receipt-p53-supplement-05.md`，新证据根为 `receipts/evidence/p53-review-05/`。

## 2. 唯一剩余缺口矩阵

父子拆分：`P53-EV-05b-R1 → P53-EV-05b-R1a/R1b/R1c/R1d`。

| 原子 | 失败事实 | 完成条件/正向断言 | 必要反向断言 | 对象身份 | 最小证据 | 合法停止条件 |
|---|---|---|---|---|---|---|
| `P53-EV-05a-R1` | 颜色四向账本字段大量为空且计数不一致 | 每个稳定视觉色均有 Figma节点属性、设计值、运行时 computed style、最终PNG内部采样；RGB每通道差≤3；summary由工具生成且计数一致 | 0空字段、0文字代替数值、0未裁决冲突、0失败 | 锁定Figma file/page + 最终源码指纹 | `color-source-map.json`、`color-runtime.json`、`color-samples.json`、机器汇总与exit | 仅Figma节点属性真实缺失且图片多点采样仍无法唯一判断时，提交精确节点冲突；其他均继续修复 |
| `P53-EV-05b-R1a` | 壳/入口页明显不一致 | 节点01/04/05/06/21/27的非文字结构、颜色、几何和排版全部通过 | 0结构遮罩、0未授权大面积空白、0内部基线替代 | 1440×1024设计态 fixture + 同节点Figma参考 | 6组成对图/diff、DOM几何表、比较JSON与exit | 无授权内停止条件 |
| `P53-EV-05b-R1b` | 数据/流程消费页明显不一致 | 节点02/03/19/20/22—26逐节点通过；无真实能力处保留相同布局足迹并展示诚实空态 | 不得用同一空态图替代多个设计状态；不得遮罩流程图/列表/卡片容器 | 同上；节点状态逐一固定 | 9组成对证据与独立结果 | 无授权内停止条件 |
| `P53-EV-05b-R1c` | 设计器/复杂浮层映射近似 | 节点07—18逐节点通过；16—18复用同组件但使用三个独立状态fixture；13不得以无关整页近似替代 | 0近似路由、0整块画布遮罩、0状态复用截图冒充 | 同一组件、不同设计状态对象 | 12组成对证据、状态映射、比较exit | 真实能力边界冲突时保留诚实受限组件并回报具体节点，不得自行映射到无关页面 |
| `P53-EV-05b-R1d` | 菜单原型映射未证明还原 | 节点28/29/30/32分别以真实用户端/管理端浮层状态对标通过；31维持N/A | 不得把28图复制为30、29图复制为32后直接写PASS | 真实菜单组件 + 原型状态fixture | 4组成对证据与比较exit | 无授权内停止条件 |
| `P53-EV-04a-R2` | 共享令牌/壳变化使旧移动证据过期 | 最终指纹下375×812登录、`/m/form/:formKey`、`/m/workflow`、`/m/notify`全部可读可用，无横滚/裁切，触控与对比度通过 | 0桌面缩放伪装、0透明/空白截图 | 同一最终源码、真实H5路由与对象 | 4张正式可见浏览器PNG、facts、触控/横滚/对比度结果 | 无授权内停止条件 |
| `P53-EV-01a-R1` | 当前lint快照会被视觉修复失效 | 所有修改完成后，最终指纹下lint exit0、0 errors、0 warnings，lint前后447文件指纹一致 | 不得沿用`cf4ac2…`日志，不得合并多次exit | 新最终源码指纹 | before/after manifest、stdout/stderr、单值exit、机器计数 | 首次真实lint失败后有可修项就继续修复 |

## 3. 已锁定项与禁止重验

- `P53-EV-00a-R1` 已通过：沿用 review-04 的 Figma metadata、33张参考图和64份本地设计身份；禁止再次调用 MCP。
- 菜单可达、审批人候选/保存/校验、意见详情、焦点回返、身份、URL、对象和网络行为已锁定。仅当本轮修改触及行为实现时做受影响最小复验。
- Server、数据库/API、认证、租户、权限、P60身份、P61机器语义全部禁止修改或重验。

## 4. 换路径：设计态 fixture 与结构比较分层

上一版直接把真实数据运行图与设计演示图做整页像素比较，导致真实文本、数据和字体栅格噪声混入结构差异；随后又错误地放弃外部门禁。本版改为两个互不替代的层：

### 4.1 `DESIGN_FIDELITY` 层

- 使用仅存在于测试/视觉环境的受控 fixture，把文本、条数、状态、时间、头像和组件状态固定到设计节点；不得进入生产数据或伪造真实业务成功。
- 每个节点在 Chromium 以1440×1024渲染，参考仍是锁定 Figma/PNG；生成 reference/runtime/diff 三件套。
- 比较器把文字 glyph 边界与非文字结构分开：文字以 DOM 的字体、字号、字重、行高、边界框验收；非文字区域执行像素与几何验收。
- 只有真实 glyph/raster 区允许自动生成遮罩。遮罩必须来自元素边界清单，不得手画大矩形；每页总遮罩≤12%，顶栏/侧栏的非文字背景遮罩=0，任何卡片、表格、画布、弹窗、按钮、导航或颜色区域不得遮罩。
- 无真实能力的设计内容在生产运行时使用诚实空态，但必须保留设计的信息层级与容器布局足迹；不得删掉整个区块形成大面积空白。fixture可承载设计演示内容，只用于视觉还原测试。

### 4.2 `FORMAL_FLOW` 层

- 使用真实身份、真实接口和真实数据验证最终页面没有因视觉修复回退。
- 该层不承担与设计演示数据逐像素一致；也不能反过来替代 `DESIGN_FIDELITY`。
- 正式浏览器仍须 `headless=false`、用户可见、记录URL/身份/对象/视口/网络索引。

## 5. 可判定的硬门禁

### 5.1 颜色

1. 当前可用 Figma MCP 的节点属性为视觉主源；锁定PNG多点采样用于交叉校验。不得再用单一网格点覆盖节点属性。
2. 每条颜色记录四项均非空：`figma_node_and_property`、`design_rgba`、`computed_css_value`、`runtime_sample_rgb`。
3. 渐变记录全部 stops/angle/opacity，并在固定5个坐标采样；阴影记录rgba/offset/blur/spread。
4. 设计值与运行样本RGB每通道差≤3；无障碍调整仅限文字前景色，并保留原值、调整值、对比度和作用域。
5. 如 Figma 节点属性与方向中的旧示例色冲突，按 Owner 最新“优先MCP”裁决：以当前Figma节点属性为视觉值；品牌主色仍固定 `#6F2DFF`，安全和WCAG边界不变。冲突必须登记，不能静默采样改色。

### 5.2 非文字结构与几何

- 对 glyph 遮罩后的非文字区域，顶栏差异≤0.5%、侧栏≤0.5%、主区≤2%；31个适用节点的所有适用区域 `failed_regions=0`。
- 关键容器、卡片、表格、画布、弹窗、按钮和导航的 x/y/w/h 与参考偏差≤2px；越界≤1px；关键遮挡≤4px²。
- 字体族、字号、字重、行高和文字容器边界逐项比较；每节点至少覆盖标题、正文、次要文字、按钮/标签四类。
- `design-compare.exit` 必须为单值0；比较JSON逐节点给出阈值、实际值和boolean，不允许另写说明把false解释成PASS。

### 5.3 内部基线与门禁顺序

外部 `DESIGN_FIDELITY` 比较exit0之前，禁止运行 `test:visual:update`。固定顺序：

1. 四个页面族外部比较全部exit0；
2. 最终正式浏览器桌面与移动证据完成；
3. typecheck、Vitest、build通过；
4. 运行内部视觉验证并保留失败；确因本轮合法设计修复产生的差异才更新基线；
5. 更新后无grep、单worker全量视觉verify failed0；
6. 最终lint；
7. lint后指纹回读；
8. 清单与terminal校验。

每次尝试使用独立目录和单值 `.exit`；禁止把 `1`、`0` 追加到同一个exit文件后只报告0。console warning与page error分开计数并如实提交。

## 6. 允许范围

| 维度 | 内容 |
|---|---|
| 允许读取 | §1输入、Web源码、视觉测试配置、锁定Figma/PNG证据 |
| 允许修改 | P53视觉令牌、布局、页面/组件展示层、测试专用design fixture、比较器与受影响视觉基线、新证据/回执 |
| 允许命令 | fixture渲染、图像/DOM比较、正式可见浏览器、typecheck/Vitest/build、内部视觉update/verify、lint、指纹与terminal校验 |
| 禁止事项 | 再调MCP、修改历史证据、把fixture数据带入生产、以内部基线替代设计对标、遮罩关键结构、近似页面映射、改功能状态、执行P61 |

## 7. 相对提示03的实质变化

- **删除了什么**：删除参考源重新获取、真实数据整页直接像素比较和已通过MCP原子。
- **原子化了什么**：把整体还原拆为四个页面族；新增因共享样式变化失效的移动视觉原子。
- **替代路径是什么**：改用设计态fixture固定内容，glyph/结构分层比较；真实浏览器单独证明业务不回退。
- **提交条件如何判定**：比较器必须给出31节点所有区域 `failed_regions=0` 和单值exit0；任何false不得由说明文字改写为PASS。

## 8. 每项证据包

每个原子独立目录，只写：

`原子ID → 原始文件/位置 → 工具实际结果 → 覆盖边界`

最低目录：

- `color/`；
- `family-a/`、`family-b/`、`family-c/`、`family-d/`；
- `mobile/`；
- `final-gates/`；
- `terminal-payload.json` 与校验 stdout/stderr/exit。

每个family必须包含节点清单、reference/runtime/diff、glyph mask来源、DOM geometry/typography、comparison JSON、单值exit。哈希、计数和summary均由工具生成并回读，不手抄。

## 9. 全部为是才允许提交

- [ ] 未重复调用MCP，参考源仍绑定已锁定file/page/node？
- [ ] 颜色每条四向字段均非空，数组数=summary数，失败为0？
- [ ] 31个适用节点均有独立状态证据，四个family比较exit均为单值0？
- [ ] 顶栏/侧栏/主区所有适用区域阈值通过，`failed_regions=0`？
- [ ] glyph遮罩由元素边界自动生成、每页≤12%，关键结构遮罩为0？
- [ ] 诚实空态保留设计容器足迹，未再出现大面积无结构空白？
- [ ] 375×812四页面属于最终源码指纹并全部通过？
- [ ] 外部比较通过后才更新内部基线，所有尝试和exit分开保存？
- [ ] 最终typecheck/Vitest/build/视觉verify/lint通过，lint前后指纹一致？
- [ ] 行为只按影响复验，未修改Server/P60/P61/功能状态？
- [ ] 所有work item完成、remaining=0、terminal校验通过？

Executor 不得自行写 `PASSED/COMPLETED`。有授权内可修复项时继续执行；只有真实外部阻塞且安全替代路径穷尽，才能按契约报告阻塞。
