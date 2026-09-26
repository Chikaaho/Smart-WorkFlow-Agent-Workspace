# Phase 6C CI-friendly 版本身份 · 规划验收

> 复核角色：规划（Planner）  
> 日期：2026-09-26  
> 审查对象：主体回执 01、补证回执 01、纠正回执 02，以及三份 Phase 6C 证据包  
> 结论：**功能级 `PASSED`（10/10；待终态同步，不等于 `COMPLETED`）**

## 1. 验收裁决

| # | 门禁 | 规划结论 |
|---|---|---|
| 1 | 34/34 POM 版本表达式统一；根与 33 个子父版本均使用 `${revision}`，旧工程版本字面量为 0 | PASSED |
| 2 | develop 默认 effective version：32/32 精确为 `0.2.0-SNAPSHOT` | PASSED |
| 3 | release override：32/32 精确为 `0.2.0`，无 SNAPSHOT、空值、占位符或模块分叉 | PASSED |
| 4 | 唯一临时 Maven 仓 release install 成功；已安装 POM 32/32 可解析；仓外 consumer 离线解析 `sw-basic-iot-api:0.2.0` | PASSED |
| 5 | workflow 以 Maven effective version 驱动生产构建、制品标记、Release 标题/说明与上传制品名 | PASSED |
| 6 | 未解析 revision、release SNAPSHOT、单模块父版本分叉、Release 元数据不一致四向探针均有效注入并非零失败 | PASSED |
| 7 | `REVISION=0.2.0` 唯一生产入口整体 exit 0；Phase 6B 负向 10 项全 0、正向 6 项齐备，版本标记一致 | PASSED |
| 8 | 全量回归 1570/0/0/0；develop 测试与 release 构建串行，均 `BUILD SUCCESS` | PASSED |
| 9 | 本地/远端 branch/tag 只读回读；未创建 `0.1.1`/`0.2.0` tag/Release，未 deploy 或修改 refs | PASSED |
| 10 | 三份证据包可回读、哈希成立、秘密扫描无真实秘密，机器终态可解析 | PASSED |

## 2. 缺口核销

- **G1 已关闭**：父版本分叉探针原缺陷是相对路径集合脱离 `REPO_DIR` 后静默落空。修复后门禁逐文件检查 34 个 POM；临时完整树向 `sw-framework/sw-common/pom.xml` 注入 `0.1.0` 后 exit 1，并点名文件和值；正式树仍 PASS。
- **G2 已关闭**：release install 原始日志 1257 行、exit 0、32 项目 `BUILD SUCCESS`；installed gate 32/32。仓外 consumer 以唯一临时仓离线执行 `dependency:tree`，exit 0，并解析 `com.sw.ck:sw-basic-iot-api:jar:0.2.0:compile`。
- **G3 已关闭**：纠正证据冻结了实际 consumer POM，sha256 为 `2a92464cb36d26cdef660f515fd02e6feff76570f148e72484366c6896ea17ff`。Planner 回读确认 `<parent>` 块与 `relativePath` 均为 0，唯一 `com.sw.ck` 依赖是 `sw-basic-iot-api:0.2.0`；重跑日志 15 行且 `BUILD SUCCESS`。
- **G4 已关闭**：所有 install/consumer/探针结束后，唯一生产入口作为最后一步重建正式 Jar。证据冻结大小 216897994 bytes、sha256 `4fd3174c20a87a88e3a98a7638cb4f999527440030229c1aaeafbd72b0e1b0f1`，提交回执前现场重算一致；`build.profile=prod`、`build.version=0.2.0` 与期望一致。

上述缺口均已通过行为证据核销，不再重开实现、版本矩阵、业务测试或 Phase 6B 制品边界。

## 3. 证据计数与偏差裁决

1. 主证据包 `phase6c-01/`：19 个物理文件，其中 17 个哈希载荷；Planner 现场重放 17/17 OK。
2. 补证包 `phase6c-supplement-01/`：12 个物理文件，其中 10 个哈希载荷；Planner 现场重放 10/10 OK。上一回执所写 13 个物理文件由纠正回执更正，以现场计数 12 为准。
3. 纠正包 `phase6c-supplement-02/`：8 个物理文件，其中 6 个哈希载荷；Planner 现场重放 6/6 OK。
4. `6cs2-readback.txt` 的标题行把“6 个载荷 + 清单/回读 2 个”误写为“物理文件 7（6+2=7）”。这是单一算术转录错误：现场目录计数为 8，回执、机器终态与文件清单也均为 8，且 6 个载荷哈希全部通过。规划以现场计数 **8** 纠正该行，不将其升级为行为缺口。
5. 纠正回执最后一行 JSON 可解析：`state=EXECUTION_SUBMITTED`、`feature_status=VERIFYING`、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`、`browser_status=NOT_APPLICABLE`；五个工作项均完成且不可操作。
6. 对纠正回执与新证据包做高信号秘密文件扫描，命中文件数为 0；不记录或回显任何连接值。

## 4. 已锁定结果与边界

1. develop 工作树默认版本为 `0.2.0-SNAPSHOT`；正式构建必须显式使用 `0.2.0`。Flatten 采用 `resolveCiFriendliesOnly`，保证安装 POM 可被仓外消费者解析。
2. 版本值沿 Maven effective model、生产构建入口、正式制品 marker 和 Release 元数据同源；门禁对四类身份漂移 fail closed。
3. 当前 Server 验证基线保持 1570/0/0/0；无数据库模型或迁移变化，Flyway 终点仍为 V96。
4. 远端引用维持只读证据中的既有值；远端 develop 对象不在本地，因此不推断 ahead/behind。
5. 本阶段未执行 commit、push、merge、tag、Release、deploy 或 Final；功能级通过不授权这些动作。

## 5. 状态裁决

Phase 6C 由 `VERIFYING` 进入功能级 **`PASSED（2026-09-26）`**。总体任务 `backend-architecture-optimization` 继续 `IN_PROGRESS`。

主方向归档：

`product/backend-architecture-optimization/passed/direction-phase6c-ci-friendly-version-identity.md`

终态同步唯一入口：

`product/backend-architecture-optimization/ready/direction-phase6c-ci-friendly-version-identity-terminal-sync.md`

终态同步复核通过前不得写 Phase 6C `COMPLETED`、不得核销总体任务，也不得执行 Final。
