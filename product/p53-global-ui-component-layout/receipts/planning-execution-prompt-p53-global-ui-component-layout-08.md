# P53 执行补充提示 08（最终移动态、证据分层与公共终态）

> 下发角色：规划（Planner）→ 执行（Executor）  
> 日期：2026-09-21  
> 功能：p53-global-ui-component-layout  
> 状态：`VERIFYING`  
> 唯一依据：`planning-review-p53-completion-10-not-passed.md`  
> 替代关系：**本提示替代提示07，成为唯一当前执行入口；提示01—07及旧回执只作证据指针，不同时作为执行待办。**

## 1. 唯一目标与权威输入

只关闭补充07的最终收尾缺口：修正375最终用户态、把DESIGN_FIDELITY与FORMAL_FLOW证据分层并绑定既有真实行为证据、按公共协议提交terminal。不得重做已锁定的对象清单、颜色库存或31节点视觉工程。

权威输入仅为：

- `planning-review-p53-completion-10-not-passed.md`；
- 本提示；
- 上一版提示07与主方向`ready/direction-p53-global-ui-component-layout.md`；
- 补充01/03中已锁定的真实行为证据指针；
- 补充07及`evidence/p53-review-07/`中已通过的07a—07c和当前失败截图。

下一份完成回执为`receipt-p53-supplement-08.md`；新证据写入`receipts/evidence/p53-review-08/`，不得覆盖review-07。

## 2. 唯一剩余原子账本

| 原子ID | 失败事实 | 完成条件（正向断言） | 必要反向断言 | 对象身份 | 最小充分证据 | 允许替代 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|---|
| `P53-EV-07d-R1a` | 375移动表单顶部文字/层级重叠；移动登录语言入口贴边错位；现validator只检查横向滚动 | 最终375×812登录、流程、通知、表单四页可见且可用；登录入口在安全区内；表单返回、标题、面包屑/说明无碰撞，主要操作可达 | 无文本/控件几何相交、无裁切、无横向滚动；内部key不得与用户标题堆叠造成不可读；触控目标不回退 | 最终源码指纹；匿名登录页；T0授权测试身份与真实可访问移动表单对象 | 四张headed PNG、DOM bounding boxes/碰撞检测、URL/身份/对象、hScroll/触控/pageErrors、人工复核结论 | 可更换已销毁表单对象，但须登记新旧key及真实可达依据 | 修正最小响应式/呈现缺陷，重采四页 | 仅真实外部环境不可恢复且安全替代穷尽；普通CSS可修问题不是阻塞 |
| `P53-EV-07d-R1b` | 当前所谓正式流启用`sw.design-fixture-id`、mock验证码和mock任务，网络索引为空；登录页还展示未授权租户/记住/忘记密码 | 明确分层：fixture制品只标`DESIGN_FIDELITY`；最终`FORMAL_FLOW`使用真实后端、真实身份/权限/对象并有可回读请求。登录正式态不出现主方向禁止能力；11类路由通过“既有锁定真实行为证据 + 最终视觉快照 + 影响分析”逐类绑定 | FORMAL_FLOW中无design-fixture session/query/env标志、无mock对象ID、无空网络索引冒充真实流、无未授权登录能力；不得把设计演示态升级为生产能力 | 最终源码指纹；补充01/03的锁定身份/对象；本轮受影响的登录与移动表单对象 | 分层manifest、11类绑定/影响表、受影响真实headed复验、非空`/api/*`网络索引、登录禁止项DOM=0、源指纹前后相同 | **禁止无条件重跑完整11类业务链**：未触及行为路径者直接引用补充01/03；只重跑登录/移动表单及影响分析无法确认的路径 | 先拆分证据层级，再做最小真实复验与绑定 | 真实后端/凭据不可用且既有锁定证据也无法完成绑定时可按单原子如实BLOCKED；fixture可运行不构成替代 |
| `P53-EV-07d-R1c` | 自造`p53-terminal-*.v1`，回执无公共物理末行 | 使用公共`agent-coding-engine.executor-terminal.v2`；公共validator exit0并roundtrip一致；回执物理最后一行是唯一`ENGINE_TERMINAL {...}` | 不新增schema，不用功能专用validator替代公共validator；terminal之后无正文/空白外内容 | `receipt-p53-supplement-08.md`与review-08最终证据 | terminal input/stdout/stderr/exit/roundtrip、公共validator真实输出、回执物理末行回读 | review-07自造terminal仅作失败历史，不可复用为通过证据 | 在R1a/R1b和最终门禁完成后生成公共terminal | 只有公共validator本身真实不可用且工具结果、替代穷尽时才可阻塞 |

父子关系：提示07的`P53-EV-07d`拆为上述三个原子；`07a/07b/07c`已关闭，不再属于当前账本。

## 3. 锁定项与禁止重验项

- 锁定07a：31/31生产对象、正式路由/组件身份、`usesAlternateRenderPath=false`。
- 锁定07b：声明色1096/1096、`unmapped=0`、`fail=0`、最大RGB差3。
- 锁定07c：四family 31/31与现有glyph/结构遮罩结果。
- 锁定补充01/03真实行为：登录契约、菜单权限、审批候选、任务/意见及真实请求；只有实现变化触及对应路径或无法确认最终快照关系时才复验受影响项。
- 禁止再次尝试Figma MCP、重抽SVG颜色、重做全量31节点。若移动修复触及某个共享组件，只重采影响表命中的节点；无影响则直接引用review-07。

## 4. 读取、修改、命令与顺序

| 维度 | 内容 |
|---|---|
| 允许读取 | 本提示/审查10、主方向、提示07、补充01/03/07及其明确证据指针、Web实现与测试、公共terminal契约 |
| 允许修改 | 仅移动响应式/登录正式态能力呈现所需的生产前端代码、影响到的测试/采集脚本、新review-08证据与补充08回执 |
| 允许命令 | 受影响前端测试与最终typecheck/Vitest/build/lint/visual verify；真实后端只读或授权测试对象操作；visible headed浏览器；公共terminal validator；指纹/清单回读 |
| 执行顺序 | 建立影响表 → 修R1a及登录正式边界 → 四移动页最终采集 → 组合复用旧真实链并最小复验R1b → 受影响门禁与指纹 → 公共terminal → 唯一回执 |
| 禁止事项 | 修改Server/API/权限语义；重开07a—07c；用mock/fixture冒充FORMAL_FLOW；扩大成登录产品新能力；覆盖历史证据；改P53/P61状态；提交中间回执 |

## 5. 相对提示07的变化

- **删除了什么**：删除对象manifest、颜色、glyph及31节点的执行待办；删除“完整重跑11类真实业务链”的隐含要求。
- **原子化了什么**：只把07d拆为移动用户态、证据分层/真实绑定、公共terminal三项。
- **替代路径是什么**：真实业务证明采用“补充01/03锁定证据 + 最终视觉快照 + 变化影响表”，只对登录/移动表单及无法确认的路径做最小真实复验。
- **提交条件如何判定**：四移动页无碰撞且正式边界正确；FORMAL_FLOW非fixture且网络可回读；公共terminal通过并位于回执物理末行；三个原子全部关闭。

## 6. 逐项证据包格式

回执每项只写：

`原子ID → 原始文件/位置 → 实际结果 → 边界/复用指针`

原始日志、截图、网络记录和影响表单独存放。DESIGN_FIDELITY与FORMAL_FLOW必须在manifest中使用不同层级标签；同一制品不得同时承担两层结论。

## 7. 提交前自检与合法终态

- [ ] 四个375×812页面均来自最终源码，人工可见无重叠/贴边/裁切，机器碰撞与hScroll为0？
- [ ] 正式登录态的租户、记住、忘记密码等未授权入口DOM计数为0？
- [ ] FORMAL_FLOW未启用设计fixture、未使用mock对象，真实网络索引非空？
- [ ] 11类路由均已在绑定表中指向“有效锁定真实行为证据 + 最终视觉证据”，只重跑实际受影响项？
- [ ] 影响表证明07a—07c未失效；若有命中，是否仅重采命中节点且仍通过？
- [ ] 最终typecheck/Vitest/build/lint/visual verify、源指纹与计数可回读？
- [ ] terminal是否为公共v2 schema、公共validator exit0，且回执物理末行唯一合法？
- [ ] `remaining_actionable_count=0`且未改变P53/P61状态？

全部为“是”后提交`receipt-p53-supplement-08.md`，状态保持`VERIFYING`、`next_action_type=WAIT_PLANNER`。若仍有授权内可执行项则继续执行；只有真实外部阻塞且安全替代与独立工作均穷尽时，才可按公共契约如实提交`BLOCKED`。
