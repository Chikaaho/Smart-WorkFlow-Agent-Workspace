# P53 执行补充提示 05（禁止中间提交，连续执行至合法终态）

> 下发角色：规划（Planner）→ 执行（Executor）  
> 日期：2026-09-17  
> 功能：p53-global-ui-component-layout  
> 状态：`VERIFYING`  
> 唯一依据：`planning-review-p53-completion-07-not-passed.md`  
> 替代关系：**本提示替代提示04，成为唯一当前执行入口；提示01—04仅作历史和技术证据指针，不同时作为执行待办。**

## 1. 唯一目标

从补充05已经建立的 design fixture 与比较管线继续执行，连续关闭全部剩余原子。**禁止再次提交中间回执、阶段汇报、部分完成包或 `WAIT_PLANNER`。**

下一次 Planner 只接收两种结果：

1. 全部原子完成，`remaining_actionable_count=0`，提交唯一完成回执与有效 terminal payload；
2. 发生真实外部阻塞，且工具结果、替代路径和独立工作均已穷尽，按契约提交 `BLOCKED`。

任务量大、仍在修复、测试失败、时间消耗、需要继续调样式均不是阻塞。当前已知状态没有外部阻塞。

## 2. 输入、输出与复用边界

只读取：

- `product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-07-not-passed.md`；
- 本提示；
- 提示04的 §4—§5（已锁定的 fixture 分层方法与技术阈值）；
- `receipt-p53-supplement-05.md` 和 `receipts/evidence/p53-review-05/`（进度起点）；
- 主方向及 Web 实现/验证资产。

禁止再次调用 Figma MCP；review-04 的参考源身份继续锁定。  
唯一允许的新回执：`receipt-p53-supplement-06.md`。  
最终证据根：`receipts/evidence/p53-review-06/`。review-05 只作过程输入，最终断言必须属于最后源码快照。

## 3. 唯一剩余账本

| 原子 | 当前起点 | 必须达到的完成值 |
|---|---|---|
| `P53-EV-05a-R1` | 颜色包未提交 | 四向字段全非空、RGB差≤3、机器计数一致、fail=0、单值exit0 |
| `P53-EV-05b-R1a` | family-a exit1，1/6完整通过 | 6/6通过、failed_regions=0、exit0 |
| `P53-EV-05b-R1b` | family-b exit1，0/9完整通过 | 9/9通过、failed_regions=0、exit0 |
| `P53-EV-05b-R1c` | family-c exit1，0/12完整通过 | 12/12通过、failed_regions=0、exit0；节点13不得近似映射 |
| `P53-EV-05b-R1d` | family-d exit1，0/4完整通过 | 4/4通过、独立状态fixture、failed_regions=0、exit0 |
| `P53-EV-04a-R2` | mobile目录为空 | 最终指纹下4个375×812真实可见浏览器页面全部通过 |
| `P53-EV-01a-R1` | 中间lint快照非终态 | 最终指纹lint exit0、0 errors/0 warnings、前后447文件指纹一致 |

技术阈值不变：glyph自动遮罩每页≤12%，关键结构遮罩=0；非文字区域 topbar≤0.5%、sidebar≤0.5%、main≤2%；关键容器偏差≤2px；内部视觉基线只能在全部外部 family exit0 后更新。

## 4. 连续执行顺序

1. 先修全局 topbar/sidebar 共性差异，重采全部受影响节点；
2. 依次将 family-a/b/c/d 推到单值exit0，任一exit1就继续修复，不得交回 Planner；
3. 完成颜色四向包并由机器回读 fail=0；
4. 在最终实现上完成桌面正式流与4个375×812移动正式流；
5. 运行 typecheck、Vitest、build；
6. 外部门禁已经全0后，才运行内部视觉 pre-update/update/verify；
7. 最终运行 lint 与前后源码指纹；
8. 生成完整清单、terminal payload并校验；
9. 只有全部自检为是，才写并提交 `receipt-p53-supplement-06.md`。

允许在证据根内持续记录 `progress.jsonl`，但记录后必须继续下一动作；不得因此结束回合或请求验收。

## 5. 中间提交零容忍门禁

出现以下任一项时，禁止创建回执、禁止写 `EXECUTION_SUBMITTED`、禁止写 `WAIT_PLANNER`、禁止停止：

- 任一 family `design-compare.exit=1`；
- 任一 work item 为 `PENDING/IN_PROGRESS/未执行/未通过`；
- `remaining_actionable_count>0`；
- 颜色、移动、最终门禁或 terminal 任一缺失；
- 仍存在可通过修改样式、fixture、比较器或验证资产继续解决的问题。

中间进展只能留在执行会话和 `progress.jsonl`；不得形成 `receipt-p53-supplement-*.md`，不得要求 Planner 复核。

## 6. 允许范围与锁定项

| 维度 | 内容 |
|---|---|
| 允许修改 | P53视觉令牌、布局、展示组件、测试专用fixture、比较器、受影响视觉基线、review-06证据与最终回执 |
| 禁止修改 | Server、数据库/API、认证/租户/权限语义、历史回执/证据、P60、P61、P53功能状态 |
| 禁止重验 | MCP参考源、未受视觉实现影响的菜单/审批人/意见详情业务行为 |
| 按影响复验 | 只有触及对应行为路径时才做最小真实浏览器复验 |

## 7. 相对提示04的实质变化

- **删除了什么**：删除“建好管线即可阶段提交”的任何解释空间；不重新展开已完成的参考源工作。
- **原子化了什么**：账本不变，新增对提交行为本身的单一门禁。
- **替代路径是什么**：技术方法继续沿用已证明有效的fixture管线；过程状态只写`progress.jsonl`并继续执行。
- **提交条件如何判定**：只认全部7个原子完成、所有exit为单值0、remaining=0及terminal校验通过；否则不得提交。

## 8. 最终证据与自检

最终包必须包含：颜色包、四family完整包、桌面/移动正式浏览器包、全部最终门禁、before/after指纹、terminal payload及其stdout/stderr/单值exit。失败尝试保留在独立attempt目录，不覆盖、不合并exit。

- [ ] 颜色fail=0？
- [ ] 四个family全部exit0、31/31适用节点完整通过、failed_regions=0？
- [ ] 所有遮罩和几何阈值通过？
- [ ] 4个375×812页面属于最终指纹并通过？
- [ ] 外部比较先于内部基线更新？
- [ ] typecheck/Vitest/build/内部视觉verify/lint全部通过？
- [ ] lint前后指纹一致？
- [ ] terminal全部work item完成、remaining=0、校验exit0？
- [ ] 未改P53状态、未执行P61？

只要任一答案为否，继续执行，不提交、不等待 Planner。
