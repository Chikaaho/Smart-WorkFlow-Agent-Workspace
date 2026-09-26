# Phase 6A · 在线守门、Knowledge 兼容性与机器终态补证执行单

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-25  
> 状态：READY  
> 性质：首次补证提示；不重做已通过的依赖治理主体

## 1. 权威输入与替代关系

- 最新审查：`planning-review-completion-phase6a-01-verifying.md`
- 主体回执：`completion-phase6a-dependency-version-enforcement-01.md`
- 主方向：`../ready/direction-phase6a-dependency-version-enforcement.md`
- 本提示是 Phase 6A 当前唯一执行入口；主体方向和旧回执仅作证据指针，不同时作为重新执行全部门禁的待办。

本提示不改变需求方向，不授权生产功能扩展、Phase 6B/6C、Git 写操作或仓库展示收口。

## 2. 唯一剩余缺口矩阵

| ID | 失败事实 | 完成条件 | 反向断言 | 最小充分证据 | 合法停止条件 |
|---|---|---|---|---|---|
| G1 | `phase6a-validate-online.txt` 实为首次失败日志 | 最终快照执行 `MAVEN_OPTS="-Xmx2g" mvn -B validate`，exit 0、32 次 Enforcer、`BUILD SUCCESS` | 不覆盖/删除首次失败日志；不以离线日志或台账文字替代 | 新的完整在线成功日志、exit、32 次计数、sha256 与现场回读 | 网络/仓库服务真实不可用且重试与离线诊断已穷尽时按契约报告 |
| G2 | Knowledge 无测试，缺 Tika/PDFBox/Spring AI 行为锚点 | 增加最小离线兼容性测试：Knowledge 以 PDFBox 生成内存 PDF，再经 Tika 实际解析并断言哨兵文本；Agent 以现有或最小测试实际装配/调用 Spring AI 类型并断言结果 | 不用纯类存在扫描、dependency tree、编译成功或 mock 名称替代行为；不访问外网 | 测试资产、定向原始日志、明确的正向断言；随后后端全量 `mvn -B -o test` 全绿 | 若当前库 API 无法形成上述路径，保留编译/运行错误并提出同强度内存替代，不得降低为结构扫描 |
| G3 | 主体回执无 `ENGINE_TERMINAL` | 新补正回执最后一个非空物理行为 `ENGINE_TERMINAL {json}`，字段与实际文件/结果一致 | 不改写旧回执，不写 `PASSED/COMPLETED` | 末行解析回读、证据哈希清单与 check、秘密扫描 | 无；格式与证据封装均在授权范围内 |

## 3. 已锁定项与禁止重验项

- 锁定：Step A 2845 行版本中性；五项业务 POM version 为 0；32/32 effective POM；离线 validate；负向探针；15 项最终零分叉；scope/exclusion 完整性；POI/IoT/Storage/BPM 既有回归；旧证据 24/24 哈希与秘密扫描。
- G1 只补最终在线成功运行，不重做负向探针、dependency tree 或 effective POM。
- G2 增加测试资产后，必须运行新增定向测试及后端全量门禁；这是快照变化导致的必要复验，不授权修改生产代码。若测试暴露真实生产兼容缺陷，停止并如实回执，不得顺手适配生产代码。
- 不重新展开 Phase 3/4/5、H2 专项兼容、真实云外呼或 PostgreSQL 行为验证。

## 4. 允许范围与执行顺序

| 维度 | 内容 |
|---|---|
| 允许读取 | 主方向、最新审查、本提示、Phase 6A 既有回执/证据、相关 Maven 配置与测试/调用代码 |
| 允许修改 | `sw-basic-knowledge` 与必要的 `sw-basic-agent` 测试资产；若现有测试类路径不足，可最小增加已受 BOM 管理的 test-scope 测试依赖；另可新增 Phase 6A 证据目录与补正回执。不得修改生产代码或生产依赖 |
| 允许命令 | 定向 Maven 测试、最终在线 `validate`、最终离线全量 `test`、哈希/计数/秘密扫描、只读 Git 身份检查 |
| 执行顺序 | 建立 G1—G3 账本 → 补 G2 测试 → 定向测试 → 全量离线测试 → 最终在线 validate → 冻结新证据 → 回读 → 写补正回执与机器末行 |
| 禁止事项 | 覆盖旧失败日志、重写旧回执、真实云调用、修改 Phase 6B/6C、降低 Enforcer、添加 skip/exclusion 规避、commit/push/merge/tag/deploy |

全量门禁应不低于 **1560 tests**，failures/errors/skipped 均为 0；实际新增数按日志说明，不以预估代替事实。所有 Maven 命令使用 `MAVEN_OPTS="-Xmx2g"`，后端重型命令串行。

## 5. 证据封装

新增目录建议：

`product/backend-architecture-optimization/receipts/evidence/phase6a-supplement-01/`

至少包含：工作区身份、G1 在线成功原始日志及 exit、G2 定向原始日志、最终全量摘要与原始日志 sha256/字节数/行数、测试计数、测试资产 diff、秘密扫描、证据 sha256 清单及实际 check 输出。大体积运行日志可保留在临时工作目录，但其 hash、可审计摘录与本轮现场回读必须进入正式证据；不得提交构建产物或凭据。

每项回执只写：

`缺口 → 原始文件/位置 → 实际结果 → 边界`

## 6. 首次提示的收敛说明

- 删除：已通过的 6A 主体实现与 24 项旧证据不再重做。
- 原子化：只剩 G1 在线成功证据、G2 指定兼容行为、G3 机器末行。
- 替代路径：真实外网不在验收范围，G2 使用内存 PDF 与离线 Spring AI 行为测试。
- 可判定提交条件：G1 exit 0/32 次/BUILD SUCCESS；G2 定向与全量均绿色且有行为断言；G3 末行可解析；新证据哈希回读全 OK、秘密扫描 CLEAN。

## 7. 补正回执与终态

新增：

`product/backend-architecture-optimization/receipts/completion-phase6a-dependency-version-enforcement-evidence-supplement-01.md`

旧回执不改写。补正回执状态保持 `EXECUTION_SUBMITTED` / `feature_status=VERIFYING`，不得写 `PASSED`、`COMPLETED` 或启动 Phase 6B。

最后一个非空物理行必须是可解析的 `ENGINE_TERMINAL {json}`，至少满足：

- `role=executor`、`state=EXECUTION_SUBMITTED`、`task_level=XL`；
- `receipt` 指向本补正回执，`evidence` 指向本轮真实附件；
- `feature_status=VERIFYING`；
- G1/G2/G3 的 `work_items` 均为 `COMPLETED` 且不可操作；
- `remaining_actionable_count=0`、`independent_work_exhausted=true`；
- `next_action_type=WAIT_PLANNER`、`stop_reason=WAITING_FOR_PLANNER`；
- `progress_basis`、`tool_results` 与实际命令/文件一致；`browser_status=NOT_APPLICABLE`。

提交前逐项回读；任一缺口未关闭时继续授权内工作，真实工具阻塞才按契约如实报告。
