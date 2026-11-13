# 当前状态摘要

2026-11-13｜规划｜**1.1.0 COMPLETED**（`planning-review-110-07.md`，七阶段 7/0/0，功能 56—58：G1 设计器重做、G3 人工/子图节点、G4 小尾巴）。方向归档 `product/v1.1.0-graph-designer/passed/`。当前无进行中版本，等 Owner 排下一项。

## 当前任务

无进行中。候选：P70 显示小修 + P71 按执行编号取消静默无效（建议合成 1.1.2 补丁，S，P71 优先）；P67 Graph 作为执行器（L，语义已定，`todo/p67-graph-as-executor.md`）；P68 外部 Java 工具（XL）。

## 1.1.0 摘要（已结束）

- 阶段 3 四轮验收：V1—V8、W1—W6、X1—X4；回执失实四次，后续要求逐张对照截图。
- 合并：两仓 feature→develop→main，CI 全 success；合并前修复 exclude 吞 4 个源文件与闩锁竞态（分支 CI 此前一直红）。
- 发版：Server tag `1.1.0`=`6d6bd666`（Release `443946002` Latest，jar 242,762,534 B）；Web `1.1.0`=`bf84989d`（`443883862`）、`1.1.1`=`3cc05844`（`444137262` Latest）。1.1.1 修设计器事件序号字符串比较，**Owner 2026-11-13 追认**。
- 部署：备份 `*_pre110`（dump 1,321,696 B）；Server 1.1.0、Flyway 35 行；Web 入口 `index-tFylQPt8.js`。G1/G3/G4 复测通过。
- 收尾：README `agent-graph.png` 83% 重拍（两端卡片略切，下次改 README 再拍）；CRLF→LF 还原（`fc604840`）；遗留等待执行已取消；隔离环境全清。
- 已知限制：子图超时不按父剩余时间、超时扫描单实例、DM8/Kingbase 仅静态、角色存编码。

## 边界与教训

- 未强推/未改历史/未动其他 tag 与 Release；演示环境未删未清。
- 回执须附分支 CI run 号，不能只报本机门禁；发版指令外的版本号先报告。
- 本机脚本写文件会把 LF 改成 CRLF，提交前核 `git ls-files --eol`。
- curl `--data-binary @file` 文件缺失会发空请求体；后台任务一律用绝对路径。
- UAT 健康路径 `/api/actuator/health`；超管导入须显式 `tenantId`。
