# Codex Hook 授权后恢复核实回执

2026-10-10，Admin，仅 HK-C。Owner 在本会话最新回复“已授权”后，恢复一次当前状态核实；保留此前挂起记录及[07:50 回读](receipt-admin-codex-hook-acceptance-readback-20261010.md)的原始时点，不修改宿主信任或现有 Hook 配置。

## 当前信任状态

北京时间 **2026-10-10 20:48:17 +08:00**，本机已安装 Codex app-server 对真实工作区执行一次 `hooks/list`：`enabled=true`、`trustStatus=trusted`、`source=project`，配置错误数为 0；定义 hash 仍为 `sha256:18ecf395895e2e65f1060e65172f62ae890a40481f80dfdb640ee439f553cb91`。

这是当前只读回读结果。此前 `modified` 是历史快照，已不能作为当前未信任的事实；**宿主信任待办解除**。未获取信任状态改变的具体时点，也不推断信任由本轮查询产生。管理员没有修改 `trusted_hash`。

[最小证据](codex-hook-authorized-resume-readback-20261010.json)记录实际查询、精确进程身份和退出结果：只调用一次 `hooks/list`；未创建会话、未重跑测试；查询进程 PID 2288 关闭 stdin 后正常退出，`process_exit=0`、`process_ended=true`。原始结果仅本地留存在 `evidence/hook-acceptance-20261010/owner-authorized-resume/hooks-list.json`。

## 现有自然派发证据边界

仅有界读取现有 `.codex/governance/runtime/codex/audit.jsonl` 与 `validator.jsonl`，每文件上限 64 KiB；实际分别 33,686 和 15,304 字节。最小证据保存行数、最新事件时点、文件摘要和读取范围。

入口最新事件为北京时间 2026-10-09 23:40:27，Validator 最新事件为 23:40:31；两份记录均无此前 2026-10-10 07:50 回读之后的事件。历史尾部没有可唯一关联当前自然派发的完整会话证据，不能把旧受控记录升级为已信任后原桌面线程的自然派发验证。本次查询不触发 Stop，不人为新建任务或循环等待补证。

**本轮核实完成：当前声明已被宿主信任；既有修复、18 组件、70 公共契约及真实隔离 app-server 同线程自动续行的通过结论保留。当前自然派发尚无新增可归属证据，不宣称原桌面线程链路已重新验证。** 若后续产生自然 Stop 或 Owner 报告新故障，可按具体事件核查。本轮不再催办信任或重复回读，不开展 ZCode、业务操作或新隔离矩阵。

已更新[HK-C 当前交接](../../../todo/admin-zcode-codex-hook-failures-20261009.md)，保留旧挂起与未信任事实为历史。此批次仅提交本回执、最小 JSON 证据及待办的 HK-C 当前补充段，普通 Git 收尾沿既有授权。
