# 持续修复问题台账

2026-10-13｜当前开放收集；发布集合尚未冻结。

原始反馈可直接用自然语言、截图或复现过程提交，由 Planner 整理；功能缺失、行为不符与体验优化均接收。新 ID 从 BF20261013-001 开始。现有问题 0 项，这只表示尚未收到具体反馈，不代表任务完成。

| ID | Owner 原始反馈/日期 | 实际与预期 | 影响/优先级 | 验收标准 | 状态 | 执行证据/规划结论 |
|---|---|---|---|---|---|---|

条目状态使用：待澄清、待执行、执行中、待验收、已通过、Owner 延期。执行自验只进入待验收；新反证或相关变更可重开受影响项。延期须保留 Owner 决定及未验证范围。每批验收锁定已过项与证据引用。

## 运行与修复循环（Owner 2026-10-13 指令）

- **点验环境**：本机运行一套 Server（8080，local profile=远程 PG `sw_apaas_local`，凭据经环境变量注入不落盘）+ Web（5173，vite 代理 8080）；启动前已核实无其他实例（8080/5173 零监听，无需 kill）。日志 `/tmp/bugfix-20261013/`（server.log / web.log / build.log）。
- **修复循环**：Owner 反馈问题 → 本台账登记编号（BF20261013-NNN）→ Executor 在两仓 `codex/bugfix-20261013` 修复 → 修复完成即重启 Server（`mvn -pl sw-bootstrap -am package -DskipTests` 后 `java -jar`，Web vite 热更一般无需重启）→ 台账记实际结果与编号对应批次 → 该修复批次提交推送两仓 `codex/bugfix-20261013`，供 Owner 上位点验。
- 编号与批次一一对应记录于上表"执行证据"列与各仓提交信息；发布集合冻结前所有修复累积在修复分支。

当前执行收尾入口：receipts/planning-review-branch-init-01.md R-GIT-01（回执 branch-init-close-01.md，2026-10-13 完成）；整体方向：ready/direction.md；开发声明：ready/development-declaration.md。
