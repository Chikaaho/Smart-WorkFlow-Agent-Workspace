# P60 I5 Owner 自验交接包对象固化提示 10

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-14  
> 当前状态：I5=`VERIFYING / OWNER_HANDOFF_EVIDENCE`  
> 下一回执：`stage-i5-v0.0.3-oa-iteration-11.md`

## 1. 权威输入与替代关系

本提示以 `planning-review-stage-i5-v0.0.3-oa-iteration-10.md` 为最新审查输入，替代提示 09 作为唯一当前执行入口；提示 09 及更早版本仅作追溯。

审查 10 已锁定三个 `G8-DOC-*`、飞书单点修复、22/22、295/295、官方文档对照和秘密零残留。本轮缺口分类为 **缺证据/对象 manifest 不完整**，不是实现缺陷。

## 2. 唯一剩余缺口矩阵

父项 `G8-OWNER-HANDOFF` 拆为以下两个稳定子项：

| 原子 ID | 失败事实 | 完成条件 | 必要反向断言 | 对象身份 | 最小充分证据 | 允许替代 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|---|
| G8-HANDOFF-READBACK | product 证据未回读 Owner 手册与配置样例的实际非秘密内容 | 生成一份脱敏回读证据，逐 Provider 显示配置样例的字段名、`enabled=0`、占位/空 secret 状态；逐章节显示手册确实覆盖控制台项、系统配置、HTTPS 回调/白名单、启用顺序、绑定/已绑定登录/解绑/失败恢复、预期结果、清理、问题定位和安全红线 | 回读中无真实或疑似 secret/token/code；不得只列标题或再次转述“已完成” | iteration-10 工作树中的两份 `docs/sso/` 交付文件 | 一份 product evidence 内的非秘密逐项回读；工具 exit 与扫描结果 | 可引用审查 10 已锁定配置键和零秘密结果 | 用只读工具按字段/章节生成回读并检查完整性 | 文件不存在或回读发现实际缺项；如是则仅修正文档后重新回读 |
| G8-HANDOFF-MANIFEST | 原 manifest 只覆盖 5 个 evidence 文件 | 新 manifest 至少逐路径覆盖 Owner 手册、配置样例、`FeishuSsoProviderClient.java`、新增回读证据和本轮 fingerprint；工具生成并 `sha256sum -c` 全部 OK | manifest 排除自身；不得手抄哈希；不得把整体 tree hash当逐文件替代 | 与 iteration-11 最终工作树一致的上述 5 类文件 | manifest、verify stdout、verify exit=0、最终 tree 指纹 | 审查 10 已锁定的旧测试日志无需重新纳入或重跑 | 在最终回读后生成 manifest 并实际校验 | 路径不存在或候选在校验后变化 |

两个子项全部通过才关闭 `G8-OWNER-HANDOFF`。

## 3. 锁定项与禁止重验

禁止重新访问官方文档、修改三 Provider 协议实现、重跑 `SsoAuthServiceTest`、system-biz 回归、真实 Provider 调用或其他 I5 门禁。若回读只发现手册/样例文字缺项，只修正文档并重新执行本提示两项静态证据；若发现真实代码反证，停止并如实提交差异，不擅自扩大范围。

## 4. 允许范围与执行顺序

| 维度 | 内容 |
|---|---|
| 允许读取 | 审查 10、提示 10、iteration-10 证据、两份 `docs/sso/` 交付文件、飞书修改文件，仅用于回读和哈希 |
| 允许修改 | 手册/配置样例中回读确认的缺项；`evidence/i5-11/`；iteration-11 回执 |
| 允许命令 | 文件只读回读、字段/章节检查、秘密扫描、SHA-256 manifest、最终 tree 指纹 |
| 执行顺序 | 建账本 → 回读两份交付物 → 必要时只补文档 → 零秘密检查 → 生成最终候选指纹 → 生成逐文件 manifest → 校验 → iteration-11 |
| 禁止事项 | 业务代码修改、重跑测试、外部调用、真实凭据、开始 I6/小程序、推送、写 I5 `PASSED/COMPLETED` |

## 5. 相对提示 09 的变化

- **删除**：删除已通过的官方文档对照、三 Provider 实现核对、飞书修复和所有测试任务。
- **原子化**：`G8-OWNER-HANDOFF` 拆为内容回读与逐文件 manifest 两项。
- **替代路径**：用 product evidence 内的脱敏内容回读解决 Planner 不得进入 coding 仓库读取交付正文的角色边界。
- **提交条件**：回读逐项完整且无秘密，交付物逐文件 manifest 全部 OK，最终候选无后续漂移。

## 6. 回执与终态

iteration-11 每项只保留 `原子 ID → 原始证据位置 → 实际结果 → 边界`。完成后 `G8-HANDOFF-READBACK`、`G8-HANDOFF-MANIFEST`、父项 `G8-OWNER-HANDOFF` 可写 `COMPLETED`；真实三 Provider 链仍写 `WAIT_OWNER_ACCEPTANCE`。I5 保持 `VERIFYING`，等待 Planner 对交接包验收及 Owner 后续真实链裁决。
