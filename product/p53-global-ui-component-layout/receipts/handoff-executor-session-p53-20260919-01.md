# P53 执行会话交接 01（会话级交接，非完成回执）

> 交接角色：执行（Executor）
> 日期：2026-09-19
> 功能：p53-global-ui-component-layout　功能状态：**`VERIFYING`（未改动）**
> 性质说明：**本文档是执行会话间交接材料，不是 completion receipt，不声明任何终态，不核销 P 编号。**
> 唯一执行入口：`planning-execution-prompt-p53-global-ui-component-layout-07.md`（替代提示01—06）
> 唯一审查依据：`planning-review-p53-completion-09-blocked-not-accepted.md`
> 唯一完成回执名（未提交）：`receipt-p53-supplement-07.md`
> 过程全量留痕：`receipts/evidence/p53-review-07/progress.jsonl`（70 条，追加保留）

## 1. 任务清单与当前状态

| # | 任务 | 状态 |
|---|---|---|
| 1 | 07a：manifest schema 重写（effectiveRoute/productionComponentIds/dataInjection/usesAlternateRenderPath=false）+ validator | **代码完成并验证过 exit0**；最终快照后需重跑一次 `render-object-validate.mjs` |
| 2 | 07c：遮挡过滤器 + 设计几何评分法修复 → 诚实基线重算 | **完成**（见 §3 根因修复） |
| 3 | 07c：02 行距/面板头/筛选序改造 | **主体完成**（02 仍 FAIL≈0.034，余筛选卡高度与间距微调） |
| 4 | 07c：归因 10/28/30/32（旧伪影通过节点）+ 29/32 管理端菜单 topbar | **未开始** |
| 5 | 07c：03/19/20 任务详情表列偏移（dx13-21）+ 04 fixture 统计 32/24/6/2 | **未开始**（04 的 updateTime 格式已改） |
| 6 | 07c：06/27 登录/发起流程 + 05 门户大项 + 07-09/11-14 设计器族 | **未开始** |
| 7 | 07b：颜色管线复跑（unmapped=399@旧快照，随节点收敛下降） | **管线代码完成**，待 31/31 后复跑 |
| 8 | 07d：正式流 11 路由 + 4 移动页 + 门禁 + before/after 指纹 + terminal + `receipt-p53-supplement-07.md` | **未开始**（仅当 31/31 后执行） |

## 2. 当前诚实基线（最新一轮四族比较，机器可回读 `family-*/compare-runs.jsonl` 末行）

**PASS 7/31**：01、21、22、23、24、25、26
**FAIL 24**：

- family-a（exit1）：04、05、06、27
- family-b（exit1）：02、03、19、20
- family-c（exit1）：07、08、09、10、11、12、13、14、15、16、17、18（其中 15-18 的 topbar/sidebar 已转好，余 main 0.0246-0.0280 的弹窗内容度量与右栏当前节点卡样式）
- family-d（exit1）：28、29、30、32（29/32 管理端菜单 topbar 0.0071）

**重要认知**：旧口径“25/31”以及中间几轮 10/20/28/30 等节点的 PASS 含**坏遮挡过滤器伪影**（文字被丢弃→无配对→假通过）。现基线全部为诚实判定，不要与旧数字互比。

## 3. 本会话工具级根因修复（后续会话必须沿用，勿回退）

1. **遮挡判定**（`capture-nodes.mjs` domInventory）：沿 elementFromPoint 命中链找第一个真正绘制不透明背景（α≥0.999）且**不含目标文字**的元素才算遮挡；半透明弹窗遮罩（rgba(16,24,47,0.32)）之下的文字仍可见，不算遮挡。
2. **设计几何原点**（`design-geometry.mjs`）：候选原点评分法——根帧/各「全局顶部导航」帧/元素最小坐标，取使最多元素落入 1440×1024 的平移；弹窗复合稿（15-18 等）根帧不是页面原点。几何已全部重生成（`design-geometry/NN-design.json`）。
3. **比较器**（`compare-family.mjs` + `p53-glyph.mjs`）：glyph 遮罩=DOM 行框候选 ∩ 参考字形连通域（吸收≤4px、结构排除登记、覆盖率≤12% 分区）；文字度量门=横向 min(dx,dr)≤2（右对齐元比右缘）+ 双侧墨迹顶/高≤2px + 污染样本（墨迹超出盒+2px）豁免；行盒换算（DOM 内联盒→line-height 盒）。
4. **弹窗遮罩统一**（`tokens.css`）：设计三层 #10182F@0.116 叠加 ≈ 有效 0.32（实测白底反解），生产 `.el-overlay` 三条冲突规则已统一为 rgba(16,24,47,0.32)。

## 4. 流程操作手册

```bash
cd product/p53-global-ui-component-layout/receipts/evidence/p53-review-07/scripts
# 采集（需 5173 mock 在线）：单节点/family/全量
node capture-nodes.mjs 15 | node capture-nodes.mjs family-c | node capture-nodes.mjs all
# 比较（含设计哈希自检）：单值 exit 写 family-X/design-compare.exit
node compare-family.mjs a   # b / c / d
# 诊断（非证据）
node hotspot.mjs family-a/01 120 8 ; node zoom.mjs <seq> <familyDir> <x> <y> <w> <h> <out.png> [scale]
# 07a / 07b
node render-object-validate.mjs   # → ../render-object-validate.exit 单值
node color-inventory.mjs && node color-map.mjs && node color-validate.mjs   # → ../color/color.exit
```

- 改动公共样式/组件后：**重采受影响 family**，不得沿用旧快照。
- **采集运行期间禁止修改 Web 仓源文件**（Vite HMR 会污染截图/DOM）。
- 终态前门禁：`NODE_OPTIONS="--max-old-space-size=2048"` 下 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`。

## 5. 环境事实

- 端口：5173=mock（dev:mock，采集与比较用）、5174=真实后端代理、8080=Server。本会话均在线。
- 正式流身份（dev seed，`sw-bootstrap/.../h2/V4__seed_system_data.sql` 注释明示仅 dev）：`admin` / `admin123`；mock 验证码可从 data:image/svg+xml challenge 派生（`run-formal-p53.mjs` 已实现），环境变量 `P53_CAPTURE_USERNAME/P53_CAPTURE_PASSWORD/P53_CAPTURE_BASE_URL`。
- 设计资产锁定：`p53-review-04/reference/local-design-index.json`（SHA-256），compare-family 自检哈希漂移即停。
- Figma MCP 不可用已锁定（`color/color-source-attempt.json`），不再尝试。

## 6. 24 个 FAIL 节点的逐节点下一动作

| 节点 | 已知构成 → 下一动作 |
|---|---|
| 02 (0.034) | 面板头/表间距微调；筛选卡高度（发起时间区间无真实 API，保持诚实省略并记录） |
| 03/19/20 | 任务详情：表列头「操作/审批节点」dx13-21、「返回我的待办」dx17、附件名 dx19、标题 ink6——按列宽/内边距逐项收敛 |
| 04 | fixture 统计 32/24/6/2 + 设计示例行；表格「分类/实例数」列 Server 无字段 → 按方向 §4.2 诚实省略并记录；操作列「设置·更多」结构 |
| 05 | 大项：门户真实服务卡（流程中心/智能助手/设备中心/通知中心均有真实路由）+ I4 分析图面板 + 诚实省略（公告/知识/搜索/关注/趋势，方向 §4.3） |
| 06 | 登录页热点未分析，从 hotspot 起步 |
| 07-09 | 表单/流程设计器族，逐热点 |
| 10/28/30/32 | 旧伪影通过节点，先按新基线归因（像素 or 度量门）再修 |
| 11-14 | 设计器弹窗族：main 0.027-0.046，弹窗内容度量门为主 |
| 15-18 | topbar/sidebar 已过；余 main：右栏当前节点卡紫色描边 vs 设计无描边、弹窗内容度量 |
| 29/32 | 管理端菜单 topbar 0.0071（导航项文字与设计差异——注意：应用中心/数据中心无真实路由，按方向 §4.3 不得伪造入口，诚实省略并记录） |

## 7. 锁定项与禁止（提示07 §6，继续有效）

- 锁定：review-04 设计身份与哈希、MCP 不可用 fallback、生产组件树改造方向、P60/P61 与 P53 功能状态。
- 允许改：P53 生产令牌、公共布局、正式页面/组件、数据/状态 fixture、比较器与 review-07 证据。
- 禁止改：Server、数据库/API、认证/租户/权限/流程语义、历史证据、P60、P61、P53 功能状态。
- 禁止：无能力入口伪造（IoT 指令/Agent 等 palette/workbar 演示项按提示07 §4 的数据注入边界处理）、比较器阈值/遮罩放宽、`deviation` 自动豁免桶、PNG 抗锯齿造令牌。
- **合法终态仅两种**（提示07 §7）：①07a-07d 全完成 `remaining_actionable_count=0` → 唯一回执 `receipt-p53-supplement-07.md` + 过验 terminal 包；②真实外部阻塞且独立工作穷尽 → 可复核 BLOCKED。中间过程只追加 `progress.jsonl`，禁止中间回执/阶段汇报/WAIT_PLANNER。

## 8. 工作纪律教训（本会话实际发生）

1. **改 .vue 一律用 Edit/Write 工具**，禁止 bash 内联 node 字符串脚本注入——本会话两次打坏文件（MyInstances 模板尾部曾被误删，经 git diff + 先前读取重建恢复；ProcessDefList/TaskDetail 同样被坏过并已修复，最终 106/106 测试全绿佐证）。
2. 每轮修改后先 `vue-tsc` 再采集；受影响 spec 必跑。
3. progress.jsonl 追加用 bash heredoc 安全（UTF-8 已多次校验）。
4. 任何“通过”必须能被机器从当前文件复读（回执计数由当前文件机器生成——审查09反证第4条）。
