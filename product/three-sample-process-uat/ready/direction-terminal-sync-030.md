# 0.3.0 三示例流程：阶段三终态同步与发布后同步

2026-11-07｜规划 → 执行｜依据 `receipts/planning-review-03-passed.md`（功能 PASSED）。主方向已移至 `passed/`。本文件是当前唯一执行入口，第③、⑥阶段同步一次做完（合并和发版已经完成，不再重做）。

Owner 2026-11-07 确认：追认 0.3.0 tag 同版本覆盖；本版**不登记**为新的正式功能，功能数保持 51。全部值已定，直接执行。

## 1. 唯一终态值清单（执行方不得自行计算或改值）

| 字段 | 值 |
|---|---|
| 功能状态 | 三示例流程/0.3.0 `PASSED`；规划终态复核通过后为 `COMPLETED` |
| 已完成功能数 | 51，不变（Owner 定不登记） |
| 清单计数 | M59/18/13=90、ADV1/7/56=64，不变 |
| P 编号 | 本版不核销；已核销集合不变，P35 部分，P20 未核销；实际 P63 |
| 问题数 | 57，不变 |
| 里程碑/明细 ID | 不新增正式功能 ID；knowledge 功能文件与版本记录中登记 0.3.0 交付内容：应用“运营与风险管理工作台”（灾备演练审批：会签、动态并行、抄送、预约 MQTT；校园出入口异常：Agent 检索知识库加联网搜索后自动分 P0/P1 建单并通知；MES 温度三档研判：Agent 判快速升温、超停机阈值时建单，缓慢升温只记录）；平台修复：审批人空值 500、字典项导入丢失、MQTT payload 二次序列化、Agent 工具入参信封和 businessKey 超长、程序化实例详情表单回退、工作台知识库卡片 |
| 验证基线集合 | []（正式基线不变更） |
| 发布事实 | 正式/部署 0.3.0；Server main `a0ac3a1a`、Web main `420e0f9`；tag 0.3.0 已覆盖重指（Owner 2026-11-07 追认，Release 说明保留覆盖记录）；UAT build.version=0.3.0、Flyway v0.2.9 |
| 活动功能 | 无 |
| 当前唯一下一动作 | 同步完成后为“Planner 终态复核 0.3.0” |
| 主方向目录 | `product/three-sample-process-uat/passed/direction-three-sample-process-uat.md` |
| 终态同步方向目录 | 当前 `product/three-sample-process-uat/ready/direction-terminal-sync-030.md`；规划复核后由规划移至 `passed/` |

## 2. 同步范围

- 先写 knowledge：`knowledge/current-status.md`，新建 `knowledge/features/0.3.0-three-sample-processes.md`（需写明 Agent 图 v7 和 IoT 规则映射的配置快照，因为应用包不含这两部分），以及受影响的历史记录。
- 再同步：`memory/state.md`、`handoff.md`、`features.md`；`todo/requirement-pool.md` 的当前段（改成规划验收通过的口径）；`todo/ch-apaas-project-update.md` §3 的三个场景（标记已在 0.3.0 落地）；根 README 和项目版本声明中受影响的部分。
- `product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md`、`product/v0.3.0-oa-completion/ready/` 中把 0.3.0 绑定到 P60 的表述：不改原文，在 knowledge/current-status 里注明“P60 发布版本顺延，0.3.0 已由三示例流程使用”即可。
- memory：每个短记忆文件 <5KB，总量 <20KB；回执写明压缩前后的字节数。
- 规划在本轮新增和移动的 product、memory、todo 文件，随本批一起提交并推送。

## 3. 回执

写入 `receipts/terminal-sync-030-01.md`，包含：覆盖矩阵（入口、写入值、回读结果）、memory 字节数、提交 SHA。不重跑测试，不碰 tag、Release 和 UAT。
