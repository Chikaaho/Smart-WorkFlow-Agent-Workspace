# i6-05 对象总账本（三级提示03 · 初始固定）

> 采集日期：2026-09-14。此账本先于 R1—R6 行为取证建立；所有对象值脱敏，号码、口令、token、Provider secret 不进入本目录。

## 1. 最后实现前源码指纹

- Workspace HEAD：`bb2f47fca4602e393ecfd593269c906c652405e8`（当前工作区另有 Planner 新增/修改治理文件，执行不覆盖）。
- Server HEAD：`e941d74ffb3e5388e1b3ac3efb234d4634436aea`（`develop`，初始 clean）。
- Web HEAD：`0a746e3d6e0e0aaa0c4ee8633c58c75c295546d6`（`develop`，初始 clean）。
- 数据库口径：现行迁移终点 H2/PG 均为 V92；R1—R6 取证前不改代码、迁移、依赖或配置。

## 2. 固定租户与身份别名

- T100：租户管理员 A（沿用 `u1_100`）、无权用户 B（沿用 `u3`）；规则读取/管理正负链固定在该租户。
- T200：隔离对照租户；R2 使用 T100/T200 各两名用户，号码只记录服务端身份摘要，不记录明文。
- R3 复用 T100 的 A/B，并复用通知模板 TV、规则 RV1、失败消息 MF、失败尝试 AF；实际页面对象以第一次真实回读为准。
- R5：新建并固定单一流程实例 PR，包含发起人、审批人 S1/S2、代理/受托人 D、抄送人 C、无关用户 U0；所有角色均须在同一 PR 内出现。
- R6：新建抄送场景 CP，固定模板版本 V1/V2、规则 CR、接收人 C；新旧消息 ID 在首次回读后追加登记。
- R4：从 R3/R6 的真实消息中选择单一消息 MC 及其流程实例 PC；选择完成后只允许在该 MC/PC 上做 PC↔H5 取证，不跨实例拼接。

## 3. 原子绑定与取证规则

| 原子 | 固定对象/边界 | 成功前不得宣称 |
|---|---|---|
| R1-RULE-VIEW | T100/A、B、规则 RV1 | 管理员规则列表/页面闭环 |
| R2-PHONE | T100/T200 两用户组、PHONE resolver 身份来源 | PHONE 六格矩阵/零副作用 |
| R3-ADMIN-UI | T100/A、B、TV、RV1、MF、AF | 六类真实管理页面闭环 |
| R4-CROSS-CLIENT | 单一 MC/PC、同一授权身份与撤权状态 | PC/H5 同对象一致 |
| R5-ROLE-CHAIN | 单一 PR、A/S1/S2/D/C/U0 | E16 完整角色链 |
| R6-COPY-TEMPLATE | 单一 CP、CR、V1/V2、C | 抄送统一事件/规则/模板版本 |

- 每个原子目录必须含 `command.txt`、`stdout.log`、`stderr.log`、`exit-code.txt`、`objects.md`、`actual.md`；浏览器/数据库按三级提示追加 URL、视口、网络、截图、DB 身份等字段。
- R1—R6 任一实现变更都要在本账本追加新源码指纹，并只重验直接受影响的锁定项；不得修改 i6-04 历史证据。
- R7 只能在 R1—R6 和受影响门禁完成后执行；候选语义分离 `workspaceSourceHead`、`manifestArtifactSha256` 与 `evidenceCommit`。
- R8 在 R1—R7 全部 YES 前不裁决为合法外部阻塞。

## 4. 最后实现前后的候选指纹

- Workspace source head：`bb2f47fca4602e393ecfd593269c906c652405e8`；生成候选时工作树为 dirty，未伪装为 clean。
- Server source head：`e941d74ffb3e5388e1b3ac3efb234d4634436aea`；当前工作树包含已验收 I6 源码与 Flyway 全链断言对齐。
- Web source head：`0a746e3d6e0e0aaa0c4ee8633c58c75c295546d6`；当前工作树包含已验收通知分页适配。
- 受影响验证：Server 全量 1361/0/0/0；Web 1185 passed、3 skipped；Flyway H2 15/15、PostgreSQL 12/12。
- `evidenceCommit`：`null`（本次不创建提交，不执行 push/tag/Release）。
