# 0.2.4 阶段三终态同步与发布链

2026-11-06｜Planner→Executor｜XL。依据：`product/0.2.4/receipts/planning-review-024-03-passed.md`（功能 PASSED）。主方向已归档至 `product/0.2.4/passed/`。本文件是当前唯一执行入口，执行方连续完成第③—⑥阶段，不逐阶段等待批复。

Owner 2026-11-06 确认：发布版本 **0.2.4**；本版登记为**第 51 个正式功能**。

## 1. 唯一终态值清单（执行方不得自行计算或改值）

| 字段 | 值 |
|---|---|
| 功能状态 | 0.2.4 功能 `PASSED`；规划终态复核通过后为 `COMPLETED` |
| 已完成功能数 | 51（旧值 50 + 1） |
| 清单计数 | M59/18/13=90、ADV1/7/56=64，不变 |
| P 编号 | 本版不核销；已核销集合 P2/P4/P9/P15/P19/P29/P34/P47/P65 不变，P35 部分，P20 未核销；实际 P63 |
| 问题数 | 57，不变 |
| 里程碑/明细 ID | 新增 0.2.4 功能条目一条（README 示例二校园大门流量异常研判、示例三 MES 温度研判；通用能力：IoT 规则启动 Agent 研判、失败升级（级别和双渠道通知）、Agent 内部工具（流程发起、流程查询、通知）、渠道凭据密文配置）；不改动其他 ID |
| 验证基线集合 | []（正式基线不变更） |
| 活动功能 | 0.2.4 交付（发布链），没有其他活动功能 |
| 当前唯一下一动作 | 第③阶段同步完成后为“第④阶段 feature→develop→main”；全部完成后为“Planner 终态复核 0.2.4” |
| 主方向目录 | `product/0.2.4/passed/direction-024-readme-examples-2-3.md` |
| 终态同步方向目录 | 当前 `product/0.2.4/ready/direction-terminal-sync-024.md`；规划复核后由 Planner 移至 `passed/` |

## 2. 第③阶段：同步

- knowledge 优先：`knowledge/current-status.md`、功能文件（新建 `knowledge/features/0.2.4-*.md`）以及受影响的历史记录，然后同步 `memory/state.md`、`handoff.md`、`features.md`，`todo/requirement-pool.md` 当前入口，以及根 README/项目版本声明中受影响的部分。
- memory：每个短记忆文件 <5KB，总量 <20KB；回执写明压缩前后的字节数、保留摘要和移除范围。
- 提交覆盖矩阵（`roles/executor.md` §4.5）：入口、写入值、回读结果。
- 规划已暂存的 `git mv`（ready→passed）随本批一起提交。

## 3. 第④—⑥阶段：合并、发布、发布后同步

- ④ 两仓 feature→develop→main。合入 main 前，核实发布配置中的版本为 0.2.4（含版本默认值、回退值、制品/镜像命名），按既定要求完成种子压缩和版本收敛；Server 跑全量门禁，偶发失败族单独列出；Web 跑四连；根 gitlink 指向两仓发布后的分支头。
- ⑤ 沿既有通道发布 tag/Release 0.2.4 并部署 UAT。部署前：核对 UAT 仓外 `sw.notify.channels.*` 键位（前缀修正后这组键位会开始生效，避免意外启用或配置错误），处理磁盘余量（当前 1.6G，92%）；部署后检查 health，Flyway 到 V0.2.9。版本、制品和部署结果分别记录。
- ⑥ 按发布后的实际事实再同步一次：分支/提交、tag、制品、UAT 版本、DB 版本、功能摘要、下一动作。
- 秘密：OpenRouter、Command Code 的 Key 和 163 授权码不得进入任何提交、回执、日志或制品；推送前检查暂存区。
- 不做：改写 Git 历史、强推、触碰 `smart_workflow_f1v4b` 和用户的 8080/5173、清理 Owner 保留的隔离环境。

## 4. 回执

- `receipts/terminal-sync-024-01.md`：第③阶段的覆盖矩阵和 memory 字节数。
- `receipts/execution-release-024-02.md`：④—⑥的合并 SHA、门禁结果、tag、CI、UAT health、Flyway 版本和发布后同步矩阵。
- 进度按整版七阶段报告。遇到真实阻塞时按终态契约提供工具结果，并继续做不受阻塞的工作。
