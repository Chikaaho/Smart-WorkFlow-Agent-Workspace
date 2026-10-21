# 必要硬约束摘要

> 2026-10-21 更新；权威来源：`system.md`、`roles/*.md` 与当前产品方向。

- 必须先由用户显式声明且只认领一个角色；角色边界贯穿会话。
- Planner 不读 knowledge/业务代码；Executor 不作规划裁决；Admin 不碰业务实现与业务状态裁决。
- 当前状态单一源为 `knowledge/current-status.md`；终态机器契约与 Validator 分别为 `.codex/governance/terminal-contract.json`、`.codex/governance/validate-terminal.sh`。
- Smart-WorkFlow 的本机真实 PostgreSQL 验证参数统一从 Git 工作区外的 `~/.config/smart-workflow/pg.env` 读取，并由 `~/.zshenv` 自动加载。新会话先检查 `PG_HOST`、`PG_PORT`、`PG_USERNAME`、`PG_PASSWORD` 是否存在；变量齐全时不得再次向 Owner 索要连接值。
- 数据库连接值属于本机秘密：仓库文件、方向、回执、证据、命令文本和日志只允许引用变量名，不得写入或回显变量值。只有变量确实缺失或文件不可读且已完成本机检查时，才能报告环境输入缺失；不得把秘密复制进 Git 工作区。
- Owner 2026-10-08：Server/Web 从 develop 建立 `feature/xxx` 任务分支；工作区规划文档在现有分支维护。commit 保持 Angular/Conventional Commits 格式，中文短主题。
- Owner 2026-10-11：任务授权内、目标子仓提交已验证并已推送的常规 Git 指针调整，由代理自行核实决定并报告，不逐项请示。
- 验证按风险取最小充分证据，不默认新建整包哈希；同类两次不过先核口径/换方法，不用 XL 解释无效往返（`product/P64` 阶段Ⅱ复盘）。
- Owner 默认交付流程（2026-10-16）：①评估→②执行（自 develop 拉分支）→③验收与信息同步→④分支→develop→main（发布要求：种子/版本收敛）→⑤发版（版本必须用户确认）→⑥再次同步→⑦结束。只有 Owner 明确"不发版"才在③结束；已确认版本不重复询问。完整裁决：`product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`。
- 清单（0.1.7bug.md）自 2026-10-18 起仅本地留存（退出跟踪并忽略，历史已重写）；不得 `git add -f` 或新建受跟踪副本带回正文。语义 Release 经既有 git 凭据通道：不索要明文 token、不回显凭据值。

## 当前交付与运维约束（2026-10-21）

**0.1.10-bugfix PLANNING**（版本已确认，总 7 阶段 0/1/6）；**0.1.9 交付 COMPLETED（README 首例灾备演练，7/0/0）**，终审 `product/readme-first-example-acceptance/receipts/planning-final-review-terminal-sync-019-completed.md`。基线：根 `f2beb3be`、Server `2d6b8f1`、Web `2ac1a71`；正式发布 0.1.9（Server `74716dd`、Web `e967e24`），UAT 为回执时点 0.1.9（未实时复验）；开发 Server `0.1.9-SNAPSHOT`、Web `0.1.9`；DB V0.1.7。0.1.10 版本收敛留待发布阶段，不提前改版本来源。SYNC-01 IN_PROGRESS，待规划复核 `product/0.1.10-bugfix/receipts/baseline-sync-0110-01.md`。下列运维注意源自既有现场记录，2026-10-21 收尾核实仍适用。

- **UAT 启动硬边界**：`/opt/smart-workflow/server/start.sh` 自身不加载 `server.env`；必须 `cd /opt/smart-workflow/server && set -a && . ./server.env && set +a && ./start.sh`，否则 Druid 报 `SCRAM-based authentication, but no password was provided` 并退出（已记运维手册 §6.4/§8.1；未改脚本，建议后续加固）。
- **UAT 设备腿口径**：演示连接 `uat-mosquitto`（MQTT，127.0.0.1:1883，用户 `ch-paas`）单条下行主题 `sw/drill/{deviceKey}/cmd`（设备 `drill-room-a`，其 `connection_id` 于 2026-10-19 补为 `2111833803582910465`）；判定下发成功的现网证据＝预约 DISPATCHED＋命令 SENT＋`MQTT:<topic>:<msgId>`＋Broker 日志同秒客户端连接（Broker 不记 payload、订阅需认证，故 UAT 不取原文载荷；受控 Broker 的 payload 原件由 `IotNativeMqttDeferredDispatchPgTest` 提供）。
- **预约口径**：`field_drill_time` 按 Asia/Shanghai 本地墙钟解释；预约登记时到点已过 → 记录保留为 EXPIRED、不补发（`late_window` 只用于调度延迟）。
- **CI 时序族**：`P63ReservationBoundaryPgTest` 仍会抖动（2026-10-19 主提交 attempt1 11/2、纯文档提交 `823190e` 11/1；同提交本地 11/0），沿 `todo/p63-reservation-test-timing-stability.md` 跟踪，重跑即可；如实记录、不作为回退依据。
- **登录挑战链**：验证码为 PNG 位图、人工识读（禁摘要穷举）；挑战一次性消费、TTL 5 分钟；access token 15 分钟——批量复验注意时效。
- **历史使用问题**：2026-10-19 的未来时间选择和参与部门选择记录见 `todo/uat-drill-usability.md`；本轮业务已通过，收尾根据已有现场结果修正待办状态，不将旧现象继续当作当前结论。
