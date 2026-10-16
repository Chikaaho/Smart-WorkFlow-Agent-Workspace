# 0.1.6 在途发布进度回传（执行侧回执）

2026-10-16｜Executor｜响应 `search_task/release-016-progress-readback-20261016.md`；发布继续由 `product/0.1.6-release/ready/direction-release-016.md` 管理，本回传不暂停/不重启发布、未额外启动工程验证。正式回执：`product/0.1.6-release/receipts/release-016-01.md`（进度事实以该文件 §1—§9 为准）。

## 1. 五阶段状态（截至本回传时点）

| 阶段 | 状态 | 已有结果 |
|---|---|---|
| ①合入 develop | **完成** | 两仓 feature/application-center 快进合入并推送回读一致（Server `fd8b940`、Web `74d4be3`） |
| ②种子压缩与版本收敛 | **完成** | 双方言 `V0.1.6__baseline_seed.sql`（旧两文件逐字节拼接，段头完整性与等价性 IDENTICAL）；旧文件归档 `db/upgrade/0.1.6/legacy-0.1.5/`；新增 upgrade/transition 脚本（checksum h2 `-1890939561`/pg `-1768731444`，实跑回读一致）；pom/CI 断言/脚本/Web 包版本收敛 0.1.6；受影响测试已更新并复跑 |
| ③合入 main | **完成** | Server ff `d7d376f→e1aa67d`、Web ff `3687d04→3faaabd`，普通推送、远端回读一致 |
| ④0.1.6 发版 | **真实阻塞（两仓）** | Server CI run `38842087326` **失败**（sw-bootstrap 255/2/0/34：`P63ImmediateMqttBrokerPgTest`、`P63ReservationUnknownPgTest`＝0.1.5 起登记的两项外部受控资产缺失既有失败；fail-closed→无 Release/制品）；Web CI run `38841988314` 失败（`pnpm lint` 32 errors＝治理提交 `341b9a5` 恢复边界覆盖后暴露 15 文件既有跨模块 import 违规，含 1 处本轮新增）；语义 tag `0.1.6` 未创建、未覆盖/移动任何标签；两仓 main 均已含 0.1.6 内容 |
| ⑤信息同步与终审 | **进行中** | 本回传；knowledge/memory/todo 当前入口已按实际状态更新；两仓 README/功能清单/运维手册暂不改（发布未完成） |

## 2. 三仓 Git 事实（均普通推送后 `git ls-remote` 回读）

- Server：develop=`e1aa67d`、main=`e1aa67d`（一致）；`feature/application-center`=`fd8b940` 保留。提交链：`fd8b940` → `6a9383a`（迁移收敛+通道+测试）→ `e1aa67d`（版本收敛）。
- Web：develop=`3faaabd`、main=`3faaabd`（一致）；`feature/application-center`=`74d4be3` 保留。提交链：`74d4be3` → `341b9a5`（并发治理：eslint 模块清单修复，Owner 身份、已推送）→ `3faaabd`（包版本 0.1.6）。
- 根：`develop-sw` 保持规划分支；本批更新 gitlink 至两仓 main 并入库本回传/回执/Planner 文档。
- 未完成动作：Web 发布通道（阻塞）、语义 tag、UAT 交付、发布后终态同步。

## 3. 种子/存量衔接/制品/运行版本实际结果

- 种子：双方言可初始化（全新库 11 条=种子+10 R__、validate 通过、重复 migrate 0）；等价性双方言逐字节一致；checksum 回读与发布脚本登记一致。
- 存量衔接实测：S1（0.1.5 衔接未应用增量）双方言通过（升级脚本：增量+历史收敛、数据无损、目录=全新种子）；S2（已应用增量）双方言通过（transition 脚本）；恢复演练（备份→升级→空库恢复回 0.1.5→可再升级）1/0；反向回退边界按预期 fail。
- 制品：Server 端 CI fail-closed **无 Release 产物**；Web 端无（通道失败）。未做本地产物冒充发布。
- 运行版本：UAT 只读核验**仍为 0.1.5**（jar 内嵌模块 0.1.5、健康 200、DB versioned 终点=单条 0.1.5=S1 形态）；本任务未对 UAT 做任何变更，未执行部署/备份动作。尚未发生的明确未发生。

## 4. 真实阻塞与需要 Planner/ Owner 的事项

- 阻塞A（Server）：CI 全量门禁因两项外部受控资产缺失的既有失败（broker 18830 进程 / 对端 9778）fail-closed，无 Release 产物。需裁决：按既有"外部资产缺失按环境依赖隔离"口径为两项做条件跳过（测试设计变更，0.1.5 曾裁"不修"）；或在记录全量真实结果前提下按 0.1.5 先例执行记录在案的候选构建与制品门禁；或为 CI 提供受控资产。不得自行跳过门禁。
- 阻塞B（Web）：边界门禁红（32 项 `import/no-restricted-paths`）→ 需 Admin/Owner 完成违规整改或对门禁口径作明确裁决。
- 解除后由原发布方向继续：重推 main → CI 两仓产出发布 → 成对语义 tag → UAT 交付（UAT 用 `upgrade-to-0.1.6-from-0.1.5` 脚本）。除此之外无其他需要 Planner 解决的产品/验收口径问题；原方向已授权工作由本会话继续承接。
