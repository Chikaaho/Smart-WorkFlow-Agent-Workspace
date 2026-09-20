# P53 执行补充提示 06（生产对象一致性与真实页面视觉收口）

> 下发角色：规划（Planner）→ 执行（Executor）  
> 日期：2026-09-18  
> 功能：p53-global-ui-component-layout  
> 状态：`VERIFYING`  
> 唯一依据：`planning-review-p53-completion-08-not-passed.md`  
> 替代关系：**本提示替代提示05，成为唯一当前执行入口；提示01—05仅作历史与已锁定证据指针，不同时作为执行待办。**

## 1. 唯一目标与权威输入

把设计还原落实到用户实际访问的生产页面和生产组件树，并在该对象上关闭颜色、31节点视觉比较、真实流程与最终门禁。受控 fixture 只允许固定 API 数据、时间和组件状态，不得切换到另一套页面、组件树或专用视觉样式。

只按以下输入执行：

- `planning-review-p53-completion-08-not-passed.md`；
- 本提示；
- 主方向 `ready/direction-p53-global-ui-component-layout.md`；
- `receipt-p53-supplement-06.md` 与 `receipts/evidence/p53-review-06/` 中本审查锁定的证据；
- review-04 锁定的设计来源、本地 SVG/PNG 与哈希。

本提示不改变产品范围，不授权 Server、数据库/API、认证、租户、权限或流程语义变更。下一份且唯一允许的完成回执为 `receipt-p53-supplement-07.md`，最终证据根为 `receipts/evidence/p53-review-07/`。

## 2. 唯一剩余缺口矩阵

| 原子ID | 失败事实 | 完成条件（正向断言） | 必要反向断言 | 对象身份 | 最小充分证据 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|
| `P53-EV-06a` | 31/31设计比较均通过非空 `sw.design-fixture-id` 触发专用渲染路径 | 每个节点均由其正式路由对应的生产页面/生产组件树渲染；fixture只注入数据、时间、身份和状态 | 无 session/localStorage/query/环境标志选择平行页面、平行组件或专用视觉样式；生产构建与测试渲染的组件身份一致 | 31节点、11个正式路由、最终源码指纹 | 31节点对象清单＋浏览器运行时组件/DOM身份清单＋机器断言 `alternate_render_path_count=0`；至少对01/07/09/15/21/28/29提供同路由受控数据与真实数据的成对可见截图 | 先盘点并收敛渲染对象，再进入视觉比较 | 仅真实外部工具/权限阻塞且替代路径已穷尽 |
| `P53-EV-06b` | review-06的31/31只证明设计样板，不证明真实页面完成还原 | 在生产组件树上重跑 family-a/b/c/d：31/31通过、`failed_regions=0`、四个单值exit0；状态变体复用同一生产组件 | 不得以专用 design component、截图背景、全页SVG或大遮罩通过；关键结构遮罩=0 | review-04锁定设计节点＋最终源码下的生产组件树 | reference/runtime/diff、DOM字体/几何、masks、逐节点comparison、family汇总与exit；阈值沿用提示04 | 按公共壳→页面族→状态变体顺序连续修复并重采 | 同上 |
| `P53-EV-06c` | 颜色包仅覆盖node09/node13的9个fixture采样点 | 建立32节点去重后的稳定视觉颜色/渐变/阴影令牌全清单；每个设计值映射到生产CSS令牌、生产组件computed值和runtime采样，`unmapped=0`、`fail=0`、RGB每通道差≤3 | 无 fixture-only CSS、逐页平行品牌变量、静默漏项；颜色不能只以图片采样或声明值通过 | 当前Figma节点属性（如可用）或review-04锁定SVG/PNG；最终生产页面 | 一次Figma MCP尝试结果＋fallback说明；机器生成的distinct/mapped/unmapped计数、四向记录、生产元素定位、runtime采样与单值exit | 优先尝试MCP；不可用时立即使用锁定SVG/PNG，不等待、不阻塞 | MCP不可用本身不是阻塞；只有两种来源均无法读取且已穷尽替代才可阻塞 |
| `P53-EV-06d` | review-06真实流证明功能可用，但没有把真实页面与视觉比较绑定；后续源码变化会使最终门禁快照过期 | 最终指纹下11个正式路由和必要状态均以真实身份/接口完成可见浏览器复验；4个375×812页面通过；受影响自动化、build、内部视觉verify、lint和指纹全部通过 | 无 page error、横向溢出、不可达主操作或基线更新掩盖外部失败；不得把受控数据截图冒充真实业务流 | 最终源码、admin/T0真实身份、真实对象ID、可见浏览器 | 正式capture manifest、URL/身份/对象/视口/网络索引、代表截图；最终门禁原始流、单值exit、before/after指纹 | 外部比较全0后再做正式流与最终门禁 | 全部四原子完成，或真实外部阻塞满足契约 |

父子映射：提示05的颜色原子并入 `P53-EV-06c`；四family原子并入 `P53-EV-06a/06b`；移动、lint、fingerprint与terminal并入 `P53-EV-06d`。旧原子只作追溯。

## 3. 颜色来源顺序

按 Owner 最新要求执行：

1. 先尝试使用 Figma MCP 读取当前文件/节点的颜色、渐变、阴影与不透明度属性；保存工具结果与节点身份。
2. MCP不可用、权限失败或缺少所需属性时，不等待、不提交阶段报告，立即回退到 review-04 已锁定的 SVG/PNG；SVG用于属性与几何，PNG用于稳定内点交叉采样。
3. 两种来源冲突时登记冲突并以可追溯的当前Figma属性为主；若MCP不可用，则以锁定SVG属性为主、PNG采样校验。品牌主色 `#6F2DFF` 与无障碍边界不变。
4. 清单必须覆盖全局用户端/管理端导航、侧栏、页面背景、表面、边框、输入、主次文字、主操作、hover/active、success/warning/danger/info、遮罩、阴影及设计中实际出现的渐变；按设计属性去重，不以任意固定条数替代全覆盖。

## 4. 锁定项与禁止重验项

- review-04的设计文件身份、哈希和节点映射锁定；除本提示授权的一次MCP属性读取外，不重新定义设计范围。
- review-06比较器算法、glyph自动遮罩、≤12%遮罩上限以及 topbar≤0.5%、sidebar≤0.5%、main≤2%、关键几何≤2px继续复用。
- 真实后端业务语义、菜单权限、审批候选、意见详情、P60发布身份和P61机器契约锁定；相关实现未变化时不得重复做无关全链验证。
- 若生产组件改造触及既有交互，只复验受影响路径；最终源码变化后，外观截图、内部视觉基线、build/lint和指纹必须重取。

## 5. 读取、修改、命令范围与顺序

| 维度 | 内容 |
|---|---|
| 允许读取 | §1列出的方向、审查、回执、证据；Web实现与工程配置；锁定设计资产；可用的Figma MCP属性 |
| 允许修改 | P53涉及的生产视觉令牌、公共布局、正式页面/组件、仅用于数据/状态注入的测试fixture、视觉测试与review-07证据 |
| 禁止修改 | Server、数据库/API、认证/租户/权限/流程语义、历史回执/证据、P60、P61、P53功能状态 |
| 允许命令 | MCP读取尝试、可见浏览器采集、比较器、静态扫描、typecheck/Vitest/build/visual/lint、指纹与terminal校验 |
| 执行顺序 | 生产对象盘点与收敛 → MCP或图片取色 → 生产令牌/页面修复 → 31节点比较 → 真实桌面/移动流 → 自动化与内部视觉 → lint/指纹 → terminal/唯一回执 |

以下均禁止：

- 用 session/localStorage、query、环境变量或测试路由选择视觉专用页面/组件树；
- 为节点单独复制页面结构或创建只服务截图的视觉实现；
- 把 fixture 数据写入生产种子或伪造业务成功；
- 在外部31节点比较未全部exit0前更新内部视觉基线；
- 删除失败尝试、扩大遮罩、放宽阈值或用说明文字解释 false 为 PASS；
- 提交中间回执、阶段汇报、部分完成包或 `WAIT_PLANNER`。

## 6. 相对提示05的变化

- **删除了什么**：不再把“31个专用视觉fixture通过”视为完成条件，也不继续要求在该对象上调阈值。
- **原子化了什么**：把剩余工作收敛为生产对象一致性、生产组件视觉、全量生产颜色、最终真实流与门禁四个原子。
- **替代路径是什么**：fixture只控制数据/状态；设计比较直接作用于生产组件树。颜色来源改为“先MCP、不可用即锁定SVG/PNG”。
- **提交条件如何判定**：四原子全部完成、`alternate_render_path_count=0`、31/31生产对象比较通过、颜色`unmapped=0/fail=0`、最终门禁与terminal通过，才允许提交。

## 7. 证据包格式

回执正文每个原子只写：

```text
原子ID → 原始文件/位置 → 实际结果 → 边界
```

原始流分别保存，不合并或手抄。review-07至少包含：

- `render-object-manifest.json`：31节点、正式路由、生产组件身份、数据注入方式、`alternate_render_path=false`；
- `render-object-validate.exit`：单值0，汇总 `alternate_render_path_count=0`；
- `color/color-source-attempt.json`、全量去重颜色清单、四向映射、机器汇总与单值exit；
- 四family的runtime/diff/DOM/masks/comparison/summary/exit；
- 真实桌面与移动capture manifest、截图、事实与网络索引；
- 最终typecheck、Vitest、build、internal visual verify、lint、before/after fingerprint；
- terminal payload、stdout/stderr、单值exit和回读校验。

## 8. 中间提交与合法终态

执行过程可以持续追加 `progress.jsonl`，写后立即继续下一动作。出现测试失败、仍需调色、某family未过或任务耗时较长时，均不得停止或向 Planner 汇报阶段状态。

下一次 Planner 只接收两种结果：

1. 四原子全部完成，`remaining_actionable_count=0`，提交 `receipt-p53-supplement-07.md` 与有效 terminal payload；
2. 发生真实外部阻塞，工具结果、替代来源、替代路径与独立工作全部穷尽，按契约提交 `BLOCKED`。

## 9. 提交前自检

- [ ] 31节点是否全部来自生产页面/生产组件树，而非视觉专用分支？
- [ ] `alternate_render_path_count=0` 是否有机器输出与单值exit0？
- [ ] fixture是否只固定数据、时间、身份和状态？
- [ ] 四family是否31/31通过、`failed_regions=0`、四个exit0？
- [ ] 颜色是否先尝试MCP、失败后使用锁定图片，且distinct=mapped、unmapped=0、fail=0？
- [ ] 颜色computed与runtime样本是否来自生产组件？
- [ ] 真实桌面11路由、必要状态和4个375×812页面是否属于最终指纹并通过？
- [ ] 外部比较是否先于内部视觉基线更新？
- [ ] typecheck/Vitest/build/视觉verify/lint、前后指纹和terminal是否全部通过？
- [ ] 是否没有中间回执、阶段汇报终止、`WAIT_PLANNER`、P53状态修改或P61执行？

任一答案为否，继续执行，不提交。
