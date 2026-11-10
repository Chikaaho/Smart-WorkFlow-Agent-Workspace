# Server 0.4.1 + Web 0.3.8 · 阶段 7 规划复核（planning-review-041-02）

日期：2026-11-10｜规划（Planner）｜依据：`execution-041-02.md`、`receipts/evidence/` 截图与 JSON、`multi-database-compat/receipts/execution-final-05.md` §3

## 1. 结论

**通过，本任务结束（COMPLETED）。** 两仓已合并、发版、部署演示环境，四项修复在演示环境复测成立，三张 README 图与版本已同步。R3b 示例 b 图的节点文字在 README 宽度下读不清，Owner 2026-11-10 决定保留现图，当作流程结构总览。Z4 回读无异常。方向归档 `passed/`。不计功能数。

## 2. 逐项裁决

| ID | 裁决 | 依据 |
|---|---|---|
| 合并与 CI | 通过 | Server 首轮 CI 失败在版本断言（硬编码 `0.4.0-SNAPSHOT`），`99e7dad6` 同批改四处后 develop `42789327773`、main `42789343743` success；Web `42788699711`、`42788760585` success；两个 fix 分支确认已并入后删除 |
| 发版 | 通过 | Server `0.4.1`=`09549a49`，Release `440170555`；Web `0.3.8`=`6e9b7313`，Release `440173998`；两仓 Latest 回读为 0.4.1/0.3.8，旧 tag 与 Release 未动 |
| 部署 | 通过 | 余 6.3G，部署前已备份 dump、jar、env、Web 目录；`build.version=0.4.1`、health 200、Flyway 33 行无新增；入口 `index-Cr8LY45m.js` |
| W-c | 通过 | `r1b-approval-detail.png`：会签弹窗 3 行，冯雪/运维保障部、杨帆/基础设施部、刘洋/网络与信息安全部，「动作/意见」为「标签：值」摘要。对象换成 `YJ-20261108-009`（演示环境没有 008），同一流程、同一会签链，接受 |
| W-a2 + A1 | 通过 | `r1a-agent-graph.png`：连线从源节点右侧接目标节点左侧，没有绕弧；`RAPID_RISE` 标签与节点文字同为 12.34px，看得清；节点配色没有回退。回执里的「1070px」是上一轮的笔误照抄，以 0.909 的占比为准 |
| W-b2 | 通过 | 表单 1218px，面板 447/445px，无横向溢出 |
| W-e | 通过 | 前 8 行均为 `yyyy-MM-dd HH:mm` |
| R1a、R1b | 通过 | 三仓同文件，raw 200，字节一致 |
| R3b | **Owner 接受现图** | `r3b-sample-b.png`：占宽 0.854，上下不裁，入口侧栏高亮「我发起的」。但这张图有二十来个节点，缩到能放下整图时节点文字约 6px，README 里读不清。Owner 定为保留现图，当作流程结构总览；图注下次改 README 时顺手改成「流程结构总览」，不单开一轮 |
| README 文字 | 通过 | 禁用词 0，外链 14 条 200，文档 CI 四项 success，Latest 未被顶替 |
| Z4 | 通过 | `df` 66%，logrotate 00:00:17 实际执行。观察见 §4 |

## 3. 收尾事项（执行方下次进场时顺手做，不阻塞结束）

- 删除 `receipts/evidence/` 下的 `uat-profile-041`（浏览器登录态）和 `captcha.txt`。这两个文件不进 Git，但留在本机没有用处。
- 克隆库 `smart_workflow_041` 由执行方决定是否清理，在交接里记一行。
- README 下次修改时，示例 b 图注改为「流程结构总览」。

## 4. 观察（未排期）

- 演示环境 Server 一天写出约 346M 日志（`server.log-20261110`）。logrotate 每天只跑一次，`maxsize 100M` 实际起不到作用，压缩后约 18M/天，保留 14 份，按当前余量撑得住。要控制的话，可以让 logrotate 每小时跑一次，或者查一下哪类日志写得最多。已登记需求池。
- IoT 实例「发起人」显示 `0`，沿用 `todo/web-ui-defects-20261109.md` 的登记。

## 5. 七阶段

评估、实施、验收、合并、发版、部署与同步、结束全部完成。**7/0/0**。
