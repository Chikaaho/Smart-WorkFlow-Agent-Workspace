# 交接

2026-11-10｜Planner｜1.0.0 评估：search_task/v100-*。

## 当前

**Server 0.4.1 + Web 0.3.8（PUBLISHED）**：W-c 会签意见/部门、W-a2 画布连线与可读性、W-b2 长表单复测、W-e 列表时间、三张 README 图。

- **发布**：Server tag `0.4.1`=`09549a49`（Release `440170555`，`bootstrap-0.4.1.jar` 236,251,001 B sha256 `fe6ad3ed…`）；Web tag `0.3.8`=`6e9b7313`（Release `440173998`，`sw-web-dist-0.3.8.zip` 6,198,159 B sha256 `c61e0617…`）。Latest 已切到 0.4.1/0.3.8。
- **合并**：`fix/0.4.1-approval-history`、`fix/0.3.8-approval-record` → develop → main；两仓四项 CI success（Server 42789327773/42789343743，Web 42788699711/42788760585），已合入分支本地+远端删除。Server 首跑失败为工作流断言未随版本收敛，`99e7dad6` 修复。
- **UAT**：Server build.version=0.4.1、health UP、Flyway 33 行/max 0.4.0；Web `index-Cr8LY45m.js`，根/登录/健康 200。备份：`smart_workflow_20261110_1746_pre041.dump`、`bootstrap.jar.bak-pre041`、`server.env.bak-pre041`、`web.bak-20261110_1751_038pre`。
- **回执**：`product/approval-record-patch/receipts/execution-041-01.md`、`execution-041-02.md`；版本/同步见 `version.json`、`CHANGELOG.md`、`knowledge/current-status.md`。

## 待办/风险

- **下一动作**：Planner 复核阶段 4—6 与 UAT 证据，裁决阶段 7 结束。
- R3b 详情弹窗为 100vw，图内截图不显示侧栏；同轮另存 `r3b-entry.png` 证明「我发起的」高亮与 `XY-20261108-015` 行，回执如实说明。
- 隔离环境 18092/5274 已按精确 PID 停止；`smart_workflow_041` 暂留（阶段 7 后清理）。
- 本机 `smart_workflow_030`、`.runtime-030` 等 Owner 要求保留；`JavaSubprocessExecutor` 竞态见 `todo/iot-subprocess-output-race.md`。
- UAT 日志仍按 daily 轮转（`maxsize 100M` 仅 logrotate 运行时判定）；磁盘 66%（余 6.3G）。

## 更早历史

0.4.0/P66 多数据库兼容 `COMPLETED`（第 52 个功能，tag `0.4.0`=`a4f6c278`，Release `438918154`），Z1—Z9 完成；0.3.7 Web 补丁部分通过（W-a/W-b/W-d，tag `0.3.7`=`a6781c8`）。三示例流程 0.3.1—0.3.6 `COMPLETED`。

## 保留与保护

过程证据与截图不入 Git（`product/approval-record-patch/receipts/evidence/` 已 gitignore）；不清库（含 `smart_workflow_030`/`smart_workflow_041`/`smart_workflow_f1v4b`）；不读取或传播秘密；不动 Owner 的 reasonix、frp、ngrok；不覆盖 Web `vite.config.ts` 在途改动。
