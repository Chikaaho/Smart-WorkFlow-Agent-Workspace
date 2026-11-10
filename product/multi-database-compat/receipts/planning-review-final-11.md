# 规划审查：Z9 三份 README 文案重写与 Z8 死链（planning-review-final-11）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-final-05.md` §9（Z8、Z9）；工作区 `e09f75da`；Server main=develop=`0a4d28b5`，Web main=develop=`8c512f82` |
| 依据 | `receipts/planning-review-final-09.md` §2/§3；`receipts/planning-review-final-10.md` §2/§3 |
| 日期 | 2026-11-10 |
| 审查角色 | Planner |
| 结论 | **Z8、Z9 通过**。final-09 §2 授权由 Owner 确认，关闭。只剩 Z4（17:16 后）阻塞终态。七阶段仍为 **5/1/1** |

## 1. Z9：通过（Planner 按读者视角通读三份全文）

| 检查项 | 回读结果 |
|---|---|
| 内部用语 | 三份 README 搜 Owner/Planner/Executor/UAT/MVP/回执/门禁/终态/验收/返修/补丁/列车/口径/收敛/防腐/实例编号/sha256/Release id/已完成，Server、Web、根都是 **0** |
| 版本一节 | 三份都只剩当前版本、前后端搭配和一行 Releases/CHANGELOG 链接；Server 保留“降级前先恢复数据库备份”一句并链运维手册 |
| 标题与特性 | 标题不带状态；“能做什么 / 核心能力”每条一行，写的是用户能做什么；架构图改“设计器适配层” |
| 示例流程 | 每个一张图加一两句话，讲清业务场景；不再链内部文件 |
| 数据库表 | “数据库 / 版本 / 建库要求”三列，下方一句“六种已测试，达梦、人大金仓未测试（欢迎反馈）” |
| 快速开始 | 命令和配置与 Z7 实测版本一致，只删了过程性括号 |
| 篇幅 | Server 236→203 行，Web 154→131 行，根 199→169 行 |

篇幅没有压到 final-10 §2 第 10 条说的“一半到三分之二”。但多出来的主要是快速开始里的命令和配置示例，这部分是用户要用的，删了反而不好用。接受。

**小问题（不阻塞）**：Server README 第 37 行“临届停机线”是错字，应为“临界”。不为一个字单独合一次 main，和下次补图（`todo/web-ui-defects-20261109.md`）一起改。

## 2. Z8：通过

根 README 原来指向子仓的 11 个相对链接，全部改成了代码仓 `main` 的绝对链接。Planner 逐个请求三份 README 的全部链接和图片：网络抖动的几个重试后也是 200，没有 404。

## 3. 其他回读

- Latest：Server 指向 `0.4.0`，Web 指向 `0.3.6`。Z9 又触发了两轮 `build-<sha>`，Latest 没有被顶替。
- 两仓都只改了 `README.md`，没建 tag，没动 Release；Web 的 `vite.config.ts` 在途改动没碰。

## 4. 授权（final-09 §2 关闭）

Owner 2026-11-10 确认：“你说的那个是我授权的。”`--latest=false` 和重设 Latest 都属于授权范围内的操作，不算越权。

## 5. 下一步

- Executor：2026-11-10 17:16 以后只读补做 Z4，写进 `execution-final-05.md` §3。
- Planner：Z4 通过后做 P66 终态复核（正式登记第 52 个功能、方向文件移到 `passed/`、标记 COMPLETED）。
- 以后审 README，除了核对事实和链接，还要按读者视角通读全文（已写进 `memory/decisions.md`）。
