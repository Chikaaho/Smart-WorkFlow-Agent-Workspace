# Web 0.3.7 补丁 · 规划验收（planning-review-037-01）

日期：2026-11-10｜规划（Planner）｜依据：`execution-037-01.md`、`execution-037-02.md`、`receipts/evidence/` 截图与 JSON

## 1. 结论

**部分通过。** 0.3.7 已发布并部署，发布事实成立。W-d、许可证 L1—L3、R4、R5 通过并锁定；W-a 节点样式通过，连线和画布缩放不合格；W-b 修复方向对，但演示环境证据换了对象，需补测原场景；R3 `sample-b.png` 不合格；W-c 按停止条件停下，Owner 已裁决发 Server 0.4.1 + Web 0.3.8。未过项和新增项全部转入后续方向 `product/approval-record-patch/ready/direction-server-041-web-038.md`，本方向归档。

## 2. 逐项裁决

| ID | 裁决 | 依据 |
|---|---|---|
| W-a 节点样式 | 通过（锁定） | `w-a-node-styles.json`：7 个节点 5 类各有边框色与底色；`readme-agent-graph.png` 属性面板「LLM 调用」可用 |
| W-a 连线与可读性 | **不通过 → 0.3.8 W-a2** | `readme-agent-graph.png`：图是从左到右排的，但每条连线都从源节点底部接到目标节点顶部，在节点上下方绕出小弧线，「LLM 调用→结束」「条件分支→结束」两处弧线贴着节点边框；画布默认缩放下节点文字约 7px（CSS），只占画布中部一小块，读不清 |
| W-b | **证据对象不符 → 0.3.8 W-b2** | 原缺陷是 `/workflow/task/:id` 上表单很高时面板被压成 0。演示环境证据用的是「已办任务」列表的详情弹层，表单只有一个字段（`w-b-uat-1440.json` url=`/workspace/processed`），没有触发条件；本地 mock 注入 2000px 的结果只能作参考。实现无需重开，补一次原路由、长表单的只读测量 |
| W-c | 停止，Owner 已裁决 | 回执 037-01 §6 事实成立；Owner 2026-11-10：发 Server 0.4.1 + Web 0.3.8 |
| W-d | 通过（锁定） | `w-d-uat-times.json` 8 个时间均为 `yyyy-MM-dd HH:mm`，`hasT=false` |
| 列表“发起时间” ISO | 新增 → 0.3.8 W-e | 回执 037-01 §5.2；与 W-d 同类，用户可见 |
| R1 agent-graph | 随 W-a2 重拍 | 当前图带着连线问题已进三份 README |
| R1 approval-detail | 随 W-c 拍 | — |
| R2 | 通过（锁定放置方式） | 三仓同文件、raw 200 |
| R3 sample-b | **不通过 → 0.3.8 R3b** | `readme-sample-b.png`：实例已通过，侧栏却高亮「待办任务」；流程图缩得很小，挤在画布上方，下方约 60% 是空网格，节点字读不清 |
| R4、R5 | 通过（锁定） | 「临界」已改；禁用词 0 命中，外链 14 条 200 |
| L1—L3 | 通过（锁定） | 两仓 `license.spdx_id=MIT`；pom/package.json 已声明 |
| 发布 | 成立 | tag `0.3.7`=`a6781c8`，Release `439939910` Latest，资产 6,198,405 B；入口 `index-jYV2b5yF.js`，根/资产/challenge 200 |

## 3. 授权与流程记录

- tag 由 `97bfa14` 移到 `a6781c8`、替换 Release 资产，以及 CI 安装改用 `registry.npmjs.org`：Owner 2026-11-10 在规划会话中确认两项都批准过。
- 执行方在规划验收（阶段 3）之前就合并发版了。Owner 已认可本次结果，不追溯处理；后续方向写明先验收、后合并。
- `memory/` 合计 20,561 B，超过 20,000 B 上限，在后续方向第一步压缩。
- Server README 合并提交的 CI（develop `42760022678` 重跑、main `42760040390`）结论还没回传，在后续方向第一步回读。

## 4. 七阶段（0.3.7）

评估、实施、合并、发版、发布后同步已完成；验收本记录完成（部分通过，余项转出）；结束。**7/0/0**。0.3.7 不计功能数。
