# P21 IoT 设备接入第八轮规划验收（PASSED）

> 验收角色：规划（Planner）  
> 验收日期：2026-09-08  
> 当前输入：`completion-p21-iot-08.md`  
> 上一裁决：`planning-review-p21-iot-07.md`  
> 功能结论：**PASSED**  
> 阶段三入口：`../ready/direction-p21-iot-device-access-terminal-sync.md`

## 一、最终结论

P21 本轮方向 A1—A8 全部通过功能级验收。第七轮已锁定 L1—L39，并确认全部产品行为闭合；第八轮唯一待验原子 H10d-R4 已按指定生命周期完成，终态附件没有再次覆盖已锁定行为。P21 从 `VERIFYING` 晋级为 `PASSED`，但在阶段三持久状态同步经 Planner 复核前，不得写为 `COMPLETED（规划已确认）`。

腾讯 IoT 的真实账号、真实 RequestId 和物理设备现场联调继续按 Owner 明确裁量免验；该边界不等于宣称真实腾讯云端已经验证。自建 MQTT 主链已使用 Owner Broker 完成真实收发。

## 二、H10d-R4 独立核验

| 检查项 | 独立结果 | 结论 |
|---|---|---|
| 固定输入集合 | `behavior.sha256` 恰覆盖提示 06 指定的 16 个 r3 行为附件 | PASSED |
| 当前哈希 | Planner 在 `receipts/evidence/` 下重新执行 `shasum -c final-h10d-r4/behavior.sha256`，16/16 均为 `OK` | PASSED |
| 输入早于回执 | 最晚固定输入 `final-h9e-r3/states.jsonl` 为 17:17:50；completion08 为 17:36:26 | PASSED |
| 后置封装顺序 | ledger 17:36:37、Validator 17:37:09、compare/stat/verify 17:38:57，均晚于冻结回执 | PASSED |
| terminal 与 ledger | `feature_status`、`browser_status`、`remaining_actionable_count`、19 个 `work_items` 独立机器比较 exit=0 | PASSED |
| 终态语义 | 19 个工作项均 COMPLETED 且不可执行，remaining=0，browser_status=OPERABLE | PASSED |
| Validator | `validator.exit` 为 0 | PASSED |
| 秘密扫描 | Owner 明文口令在 completion08、H10d-r4 与固定行为包中精确扫描无命中 | PASSED |

## 三、功能验收总账

| 范围 | 最终裁决 | 已锁定依据 |
|---|---|---|
| A1 后台设备与连接管理 | PASSED | 连接健康/认证失败、脱敏、设备状态与流程接入开关、权限四态及租户隔离 |
| A2 自建 MQTT 真实收发 | PASSED | Owner Broker 的真实 CLI/服务端双向收发、Topic 拒绝、解析失败、重连恢复与去重 |
| A3 物模型与 Topic | PASSED | 属性/事件/行为、版本发布、类型正反例、Topic 映射及腾讯通用契约回归 |
| A4 JavaScript 与 Java 脚本 | PASSED | 双语言真实宿主函数链、独立执行记录、越权/超时/资源隔离及 dry-run 零副作用 |
| A5 事件/阈值发起流程 | PASSED | 真实 MQTT 上报、规则触发、表单类型映射、流程实例、幂等及三种失败策略 |
| A6 流程选择设备并执行 | PASSED | FIXED/FORM_FIELD/VARIABLE 三来源、合格候选、单命令关联、ACK 终态及失败策略 |
| A7 权限、隔离、审计与恢复 | PASSED | 200/403/401/400、跨租户零串读写、六类审计、异常隔离和恢复 |
| A8 整体行为与回归 | PASSED | 原生页面状态、运行详情、后端 1182/0/0/0、前端门禁、Flyway 与终态完整性 |

## 四、后续状态

1. 主方向归档到 `product/p21-iot-device-access/passed/`。
2. 阶段三只机械同步唯一终态值，不修改实现、不重跑产品行为或工程测试。
3. 当前正式功能数仍为 43、清单仍为 ✅36/🟦26/⬜28，直到阶段三回执通过最终复核后才落为新值。

