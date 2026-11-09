# 规划审查：P66 发布后同步补做（planning-review-final-03）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-final-04.md`；工作区提交 `4cb2988b`、`a09b6f33`（8 张截图、README、version.json、production-ops.md） |
| 依据 | `receipts/planning-review-final-02.md` §2（Z1—Z5） |
| 日期 | 2026-11-09 |
| 审查角色 | Planner |
| 结论 | **Z2、Z3 通过；Z1 有条件通过**：6 张图可以用，`agent-graph.png` 和 `approval-detail.png` 要处理；Z4 要等时间窗。发现 4 个 Web 缺陷，**建议单独开 Web 0.3.7 补丁，不阻塞 P66 终态**（待 Owner 裁决）。七阶段仍为 **5/1/1** |

## 1. Z2 回退演练：通过

- 用 UAT 0.4.0 库的只读快照在本机恢复，再用 0.3.2 jar 启动：exit 1，报 `FlywayValidateException: Detected applied migration not resolved locally: 0.4.0 ...`。这证明只换 jar 一定失败。
- `version.json` 和 `production-ops.md` §8.1、§9.1 已改为：停服 → 恢复 `pre040` dump → 换回 jar。这和 final-02 的判断一致。
- 全程没有动 UAT。

## 2. Z3 分支同步：通过

develop 已用普通推送快进到 `a4f6c278`，与 main 相同；annotated tag 对象 `6093c4cc` 没有移动；feature 分支保留。

## 3. Z1 截图：有条件通过

方法合格：Playwright 1440×900、DPR 2，输出 2880×1800，单张都在 500KB 以内，GitHub 回读 200。Planner 逐张看过：

| 图 | 判定 | 说明 |
|---|---|---|
| `workspace.png`（流程中心） | 可用 | 不再是空状态；列表里有 `0.1.5验收流程`、`流程版本1` 两个测试名，作首图略显粗糙，建议 Web 补丁后重拍，或者先在 UAT 上停用、隐藏这两个流程（属于数据操作，需 Owner 同意） |
| `form-designer.png` | 通过 | — |
| `workflow-designer.png` | 通过 | 65%，节点文字清楚 |
| `sample-a.png` | 通过 | 会签弹窗里有结构化意见全文，A 流程的特点清楚 |
| `sample-b.png` | 通过（瑕疵） | 71% 流程图里督办和上报分支看得清；最上面一行节点被裁掉半截，左侧菜单高亮在“待办任务”上，以后重拍时顺带修正 |
| `sample-c.png` | 通过 | 研判依据、结论、建议处置都在画面里，C 流程的特点清楚 |
| `approval-detail.png` | **不合格** | 和 `sample-a` 是同一实例、同一个会签弹窗，内容重复；而且“动作/意见”列 3 行都只显示“自定义审批表单”，看不到意见内容（见 W-c） |
| `agent-graph.png` | **不合格（产品缺陷）** | 节点没有卡片，只剩文字标签。根因经 DOM 实测已定位：Web 没有引入 Vue Flow 的 `theme-default.css`（见 W-a）。截图参数无法规避 |

## 4. 新发现的 Web 缺陷（建议归入 Web 0.3.7）

| 编号 | 缺陷 | 来源 |
|---|---|---|
| W-a | 智能体编排画布的节点没有外框和底色，节点显示成透明文字（缺 `@vue-flow/core/dist/theme-default.css`，或者缺项目自己的节点样式） | execution-final-04 §1.3 |
| W-b | 任务详情页 `/workflow/task/:id` 在 1440×900 下 `.instance-flow-panel` 高度为 0，流转记录和审批详情页签都看不到 | execution-final-04 §1.4 |
| W-c | 会签记录的“动作/意见”列显示意见表单名（“自定义审批表单”），而不是意见摘要；“所属部门”整列都是 `-` | Planner 看图发现 |
| W-d | 实例详情的发起时间、审批开始/完成时间显示 ISO 原文并带微秒 | final-02 Z5 |

W-a、W-b 会直接影响使用：用户看不清智能体编排，审批人看不到流转记录。这两项比 Z5 原来定的“观察区”级别高，建议尽快修。

## 5. 收尾方案（建议，需要 Owner 裁决）

**方案 A（推荐）：P66 先结束，Web 0.3.7 单独做。**
1. P66 的 README 先下掉 `agent-graph.png` 和 `approval-detail.png`，界面预览保留 6 张，智能体能力只用文字说明。等 Z4 补完，P66 就做终态复核，登记第 52 个功能。
2. 新开 **Web 0.3.7 补丁**（M，单仓 Web，不计功能数），修 W-a 到 W-d，发版并部署 UAT，然后重拍智能体编排图和审批详情图（可以顺带重拍首图和 B 图），放回 README。

**方案 B：等 Web 0.3.7 做完、截图齐全，P66 再终态复核。** P66 本身是后端多数据库功能，与这些 Web 缺陷无关；选 B 会让 P66 的收尾多等一个补丁周期，所以不推荐。

## 6. 下一步

- Owner 裁决方案 A 或 B。
- Z4：2026-11-10 17:16 以后补做，回执记为 `execution-final-05.md`。如果选 A，同一份回执里一并完成 README 下掉 2 张图并回读渲染。
- 之后由 Planner 做 P66 终态复核；Web 0.3.7 的方向等 Owner 裁决后再写。

## 7. Owner 裁决（2026-11-09）

1. **选方案 A**：P66 先结束。README 下掉 `agent-graph.png` 和 `approval-detail.png`，界面预览保留 6 张。
2. **Web 缺陷留到下一个补丁**：W-a 到 W-d 先登记到 `todo/web-ui-defects-20261109.md`，现在不开 Web 0.3.7，方向等下一个 Web 补丁时再写。
3. **测试流程不处理**：流程中心里的 `0.1.5验收流程`、`流程版本1` 不停用、不隐藏；以后截图和演示时不点开这两个流程。`workspace.png` 维持“可用”。

下一步：Executor 在 `execution-final-05.md` 里完成两件事：一是 README 下掉 2 张图（图片文件留在仓库里不删，只去掉引用和图注），并回读 GitHub 渲染；二是 2026-11-10 17:16 以后做 Z4。然后 Planner 做 P66 终态复核。
