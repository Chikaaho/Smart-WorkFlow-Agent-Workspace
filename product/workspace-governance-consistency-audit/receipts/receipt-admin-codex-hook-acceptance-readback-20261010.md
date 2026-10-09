# Codex Hook 验收当前状态回读

2026-10-10，Admin；仅 HK-C。依据[规划复核](planning-review-zcode-codex-hook-failures-20261010.md)，保留既有实现验收与 18 组件、70 公共契约、真实隔离 app-server 同 thread 同 turn 自动续行验证结论。本次仅核对当前真实工作区生效状态。

## 当前证据

北京时间 **2026-10-10 07:50:48 +08:00**，以本机已安装 Codex app-server 对 `E:\code\Smart-WorkFlow-Agent-Workspace` 执行一次 `hooks/list`，完成初始化后只读查询，没有创建会话或修改信任。脱敏、可回读的[最小结果与生命周期证据](codex-hook-acceptance-readback-20261010.json)记录：

- `readback_result=success`、`request_count=1`。
- 项目 Hook：`enabled=true`、`trustStatus=modified`、`source=project`。
- 当前定义 `currentHash=sha256:18ecf395895e2e65f1060e65172f62ae890a40481f80dfdb640ee439f553cb91`，与修复回执中的定义一致。
- 配置错误数为 0。查询进程 PID 44888 关闭 stdin 后正常退出，`process_exit=0`、`process_ended=true`，未遗留本轮查询任务。

原始 RPC 结果保存在本地 `evidence/hook-acceptance-20261010/hooks-list.json`，不纳入 Git。没有重跑 18/70 或隔离矩阵，没有开展 ZCode 或业务操作。

## 验收边界与剩余动作

**当前事实仍为：Codex 实现及真实隔离宿主派发验证已通过；真实工作区新声明的宿主信任尚未完成。** 本次结果来自当前查询，不沿用昨晚快照，也不以 `enabled=true` 替代 `trusted`。由于本次仍为 `modified`，不进入仅在已信任后开展的真实工作区自然派发提取分支；没有新增原桌面线程已恢复生效的证据。

依据[管理员职责](../../../roles/admin.md)“工作区 hook 的宿主信任评审由 Owner 在宿主界面完成，管理员不代持信任”，保留 Owner 在宿主界面审阅并信任上述精确声明的待办。信任后可一次有界回读状态与现有自然派发证据；本轮不代修改 `trusted_hash`，不重复索取实施授权。

本批次仅新增本回执与最小 JSON 证据，按 `system.md` §0.8.1 向既有跟踪分支普通提交推送；历史回执和 Planner 裁决保持其原始时点。
