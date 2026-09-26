# Phase 6B 生产制品与开发运行边界 · 规划验收

> 复核角色：规划（Planner）  
> 日期：2026-09-26  
> 审查对象：主体回执 01、补证回执 01、`evidence/phase6b-01/` 与 `evidence/phase6b-supplement-01/`  
> 结论：**功能级 `PASSED`（10/10；待终态同步，不等于 `COMPLETED`）**

## 1. 验收裁决

| # | 门禁 | 规划结论 |
|---|---|---|
| 1 | 唯一生产入口整体 exit 0；CI/Release 调用同一入口；prod marker 可判定 | PASSED |
| 2 | prod 依赖树非 test H2 命中 0，PostgreSQL 保持生产依赖 | PASSED |
| 3 | 正式 Jar 负向 10 项全为 0，含 H2、五个验证适配器、mock、dev 配置与 devseed | PASSED |
| 4 | 正式 Jar 正向 6 项齐备，含生产配置、PG 驱动、迁移、Tencent provider 与 AgentGraphDebug | PASSED |
| 5 | 同一正式 Jar 以真实 PostgreSQL 启动，空库执行 95 项迁移至 V96、health 200、清理回读 0 | PASSED |
| 6 | prod 无 mock；IoT disabled/无 provider 可启动且调用 503 fail closed；缺腾讯凭据启动期失败 | PASSED |
| 7 | dev/H2 入口 health 200，dev mock 实际装配；开发能力未被生产隔离破坏 | PASSED |
| 8 | prod 调试认证/test-mock 继续关闭，11 个 AgentGraphDebug class 保留 | PASSED |
| 9 | 全量 1570/0/0/0，较 1563 增加 7 项均为 IoT 装配/fail-closed 测试，无删除 | PASSED |
| 10 | 主证据 18/18、补证 16/16 回读通过；负向探针失败能力、秘密扫描与机器终态成立 | PASSED |

## 2. 补证核销

- **G1 通过**：`MockCloudProvider` 与 dev 装配类归属 `src/dev/java`；默认生产编译输入、主源码选择器与正式 Jar 计数均为 0，`-Pdev` 编译计数为 3，dev 烟测确认 mock 被装配。
- **G2 通过**：IoT 属性绑定与 provider 装配解耦；IoT disabled 和默认无 provider 的 prod 均可启动，代表性设备调用以既有 503 体系 fail closed 且不入队/不标记已发送；显式 tencent 但缺凭据时启动非零退出。
- **G3 通过**：`scripts/build-prod.sh` 在加入 `clean test` 后整体 exit 0；门禁负向 10 项全 0、正向 6 项齐备。正式 Jar sha256 为 `9703bba35d2f36f75b1757dff17d4d6a4c50d13e3322a5b636e7ad29c85fb7e0`。
- 真实 PG 三向烟测成立：出厂 prod 与 `sw.iot.enabled=false` 均 health 200；后者从空库迁移 95 项至 V96、144 表；缺腾讯凭据路径非零退出。唯一临时库已 DROP 且回读 0。
- Planner 现场重放补证清单 16/16 OK；原始最终构建日志为 7,776,660 bytes，sha256 `076f077e1a0730fd79dab5561cd087af44b06822a64ed2de9fd41c796145f1d0`，与冻结摘要一致；全量原始日志末尾为 1570/0/0/0、`BUILD SUCCESS`。
- 机器末行可解析：`state=EXECUTION_SUBMITTED`、`feature_status=VERIFYING`、G1—G3 均完成且不可操作、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`。

## 3. 偏差与裁决

1. 首次生产入口因前序 `-Pdev` 残留资源而失败，证明门禁有效，也暴露入口依赖历史构建状态；改为 `clean test` 后从干净输入复验通过。首次失败日志保留，不计未关闭缺口。
2. PG 长迁移期间出现一次连接 EOF，执行侧以 `tcpKeepAlive=true` 在同一临时库恢复并完成迁移、启动和清理。最终数据库身份、迁移终点、health 与 DROP 回读齐备，属于环境过程记录，不影响功能裁决。
3. 秘密扫描正文的准确口径是“1 处既有测试假值 `AKIDtest123456`，真实秘密 0”；机器摘要中“高信号命中 0（1 处假值）”为措辞不严谨。本验收采用正文逐项结果，结论仍为 CLEAN。

## 4. 已锁定结果与边界

1. H2 只保留在 test/dev 入口，正式生产依赖与 Boot Jar 均不携带 H2；不建立额外 H2 兼容矩阵，生产行为以 PostgreSQL 为准。
2. 五个验证适配器、dev/local 配置、devseed 与 IoT mock 已从正式制品物理隔离；AgentGraphDebug 正式能力保留。
3. 生产 IoT 不回退 mock：未选择 provider 时应用可运行、调用 fail closed；显式选择 Tencent 但缺凭据时启动 fail closed。
4. 当前 Server 基线升级为 1570/0/0/0；无新增迁移，Flyway 终点仍为 V96。
5. 本阶段不证明腾讯 IoT 真实云端送达；版本身份仍属 Phase 6C，GitHub About/POM URL 仍属 Final。
6. 当前通过不授权 commit、push、merge、tag、Release、部署或启动 Phase 6C 实施。

## 5. 状态裁决

Phase 6B 由 `VERIFYING` 进入功能级 **`PASSED（2026-09-26）`**。总体任务 `backend-architecture-optimization` 继续 `IN_PROGRESS`。

主方向归档：

`product/backend-architecture-optimization/passed/direction-phase6b-production-artifact-isolation.md`

终态同步唯一入口：

`product/backend-architecture-optimization/ready/direction-phase6b-production-artifact-isolation-terminal-sync.md`

终态同步复核通过前不得写 Phase 6B `COMPLETED`，不得启动 Phase 6C 或最终仓库展示收口。
