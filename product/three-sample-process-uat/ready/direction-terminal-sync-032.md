# 三示例流程返修（0.3.1/0.3.2）：终态同步

2026-11-08｜规划 → 执行｜依据 `receipts/planning-review-05-passed.md`（功能 PASSED）。返修方向已移至 `passed/`。合并和发版已完成，不再重做。

**前置条件**：Owner 追认 Web `0.3.2` tag 同版本覆盖后再执行。功能数沿用 0.3.0 的 Owner 口径“不登记”，保持 51；如 Owner 另有决定，规划会改本表。

## 1. 唯一终态值清单

| 字段 | 值 |
|---|---|
| 功能状态 | 三示例流程（0.3.0 + 返修 0.3.1/0.3.2）`PASSED`；规划终态复核后为 `COMPLETED` |
| 已完成功能数 | 51，不变 |
| 清单计数 / P / 问题 | M59/18/13=90、ADV1/7/56=64、实际 P63、问题 57，不变；本版不核销 P 编号 |
| 验证基线集合 | [] |
| 发布事实 | 正式/部署 0.3.2；Server tag `0.3.2`=`de8ec017`、Web tag `0.3.2`=`3b0043f`（同版本覆盖，Owner 追认后写“已追认”）；UAT build.version=0.3.2；0.3.0、0.3.1 tag 不变 |
| 遗留 | 审查 05 的三项小问题、应用包缺口（意见表单定义、触发器脚本、Agent 图、IoT 规则）、UAT 根分区约 98%，写入 `todo/application-bundle-import-export.md` 或需求池观察区 |
| 活动功能 | 无 |
| 当前唯一下一动作 | 同步完成后为“Planner 终态复核 0.3.2” |
| 方向目录 | 主方向、返修方向均在 `passed/`；本文件在 `ready/`，复核后由规划移至 `passed/` |

## 2. 同步范围

knowledge（current-status、0.3.1/0.3.2 功能文件）→ memory 三个文件 → 需求池当前段 → README、CHANGELOG、version.json 中受影响的部分。memory 单文件 <5KB、总量 <20KB。

## 3. 回执

写入 `receipts/terminal-sync-032-01.md`：覆盖矩阵（入口、写入值、回读结果）、memory 字节数、提交 SHA。不重跑测试，不碰 tag、Release 和 UAT。
