# 多宿主执行监督治理实施回执（阶段性）

> 实施角色：管理员（Admin）  
> 日期：2026-09-16  
> 方向：`product/multi-host-execution-supervision/ready/direction-multi-host-execution-supervision.md`  
> 结论：独立可执行工作已完成；真实 ZCode 发送与可见多窗口验收尚未满足，不提交完成结论

## 1. 已实施

1. 新增宿主外 `.codex/governance/execution-supervisor.py`：
   - task/host/workspace/thread/role 租约绑定；
   - 原子状态写入、单调 contract revision、事件幂等去重；
   - 统一调用既有 `validate-terminal.ps1/.sh`，不复制终态规则；
   - terminal contract 缺失、过期、倒退、无效或与宿主观察冲突时拒绝终止；
   - 精确 `next_action` 回注、重复指纹原子动作/切换路径/重规划收敛；
   - 用户暂停、恢复、取消；合法终态只放行一次；
   - loopback HTTP 服务和本地 bearer token；脱敏审计不记录 prompt、terminal payload、工具详情或秘密。
2. 新增统一 Host Adapter 契约、受治理任务控制入口及 Codex Stop 路由：
   - `host-adapter-contract.md`、`governed-task.ps1`、`supervisor-turn-ended.sh`；
   - `stop-gate.sh` 仅在启动入口已经提供稳定 task/thread/revision 时转入持久 Supervisor；未绑定兼容会话继续旧门禁，不猜测线程。
3. 新增 ZCode 结构化 Adapter：
   - app-server session/workspace 唯一匹配；
   - 0.16.x runtime preferences 反向请求处理；
   - `resume/read/subscribe/send`、stderr 持续排空、同 session event 回读；
   - 未知交互与权限请求 fail closed；
   - Supervisor 决策目标与发送参数不一致时拒绝投递。
4. 同步 `system.md`、`roles/executor.md`、`roles/admin.md`，确立 TURN_ENDED 与 TASK_TERMINATED 分离、Host Adapter 非裁决、错误线程 fail-closed 和跨进程恢复规则。

## 2. 验证结果

| 验证 | 结果 |
|---|---|
| Windows terminal contract | `49/49 passed` |
| Supervisor 隔离测试 | `13/13 passed` |
| ZCode Adapter 单元测试 | `4/4 passed` |
| Supervisor 真实子进程终止/重启 | `1/1 passed`，恢复原租约和精确 next_action |
| ZCode app-server list/resume/read | 通过，真实 session/workspace 回读成立 |
| ZCode 定向 send/readback | 未通过；`session/send=-32031`，新 app-server 无可用 provider |
| CUA 原生 ZCode UI | 不可用；当前工具面没有原生 app binding |
| Shell 终态契约测试 | 未运行完成；当前 Git Bash 缺少既有脚本硬编码的 `/usr/bin/jq`，Windows 同源 Validator 49/49 通过 |

隔离矩阵已覆盖：十个工作项连续五次 TURN_ENDED、缺失/过期/倒退/计数矛盾、自然语言完成声明无效、观察冲突、合法完成单次放行、真实 BLOCKED、重复指纹收敛、事件重放、错误线程、跨宿主相同裁决、暂停/恢复/取消、脱敏审计与跨进程恢复。

## 3. 十六条验收对照

| # | 状态 | 证据/差异 |
|---|---|---|
| 1 | PARTIAL | 隔离 Adapter 十项×五回合通过；真实 ZCode 五次回合尚未执行 |
| 2 | PASS-ISOLATED | 缺失、过期、revision 倒退、计数不一致均拒绝终止 |
| 3 | PASS-ISOLATED | 自然语言字段被忽略；实际观察冲突触发 reinject |
| 4 | PASS-ISOLATED | 合法完成只放行一次，重启后不复活 |
| 5 | PASS | 复用现有 Validator；真实 BLOCKED 需匹配 observation |
| 6 | PASS-ISOLATED | 原子动作→切换路径→replan |
| 7 | PARTIAL | session/workspace 唯一绑定已证；两个真实可见窗口零误投未证 |
| 8 | PARTIAL | Supervisor 实际进程重启恢复已证；ZCode/Adapter 实际崩溃恢复未证 |
| 9 | PASS-ISOLATED | 暂停无回注、恢复精确续行、取消不复活 |
| 10 | PARTIAL | 结构化 app-server 优于 GUI；真实发送被 provider 能力阻塞 |
| 11 | PASS-ISOLATED | Codex/ZCode 相同事件与合同得到同 decision/reason_code |
| 12 | PASS | 终态字段仍只来自 `terminal-contract.json`；Supervisor event 是宿主事件信封，不定义终态值 |
| 13 | PASS-ISOLATED | 可复算 64 位幂等键；重复事件只返回原决定 |
| 14 | PASS | Adapter 只发送 Supervisor 批准的精确 prompt；目标不一致拒绝 |
| 15 | PASS | status 暴露身份、revision、裁决、回注次数；审计脱敏 |
| 16 | PARTIAL | 自动化测试通过；真实 ZCode/Codex 整体验收未完成 |

## 4. 当前真实阻塞

- 实际工具结果：ZCode `session/send` 返回 `-32031`；`session/read` 显示会话模型为 `openai/gpt-5.6-sol`，新 app-server 的 model catalog 无可用 provider。
- 已尝试：CLI/headless prompt、app-server list、双路径 workspace 查询、runtime preferences 回应、精确 session resume/read、subscribe/send。
- 未采取：读取或复制 `C:\Users\hjxch\.zcode\v2\credentials.json`、API key、证书私钥；擅自切换模型；坐标点击 GUI。
- 解除条件：见 `zcode-capability-matrix-20260916.md` 的“最小条件”。

因此本回执是阶段性实施与阻塞证据，不是完成回执；方向文件保持在 `ready/`，不移动到 `passed/`。
