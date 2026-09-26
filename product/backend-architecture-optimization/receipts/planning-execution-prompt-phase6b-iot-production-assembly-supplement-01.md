# Phase 6B · IoT 生产装配与最终制品补证执行单

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-25  
> 状态：READY  
> 性质：首次补充提示；只关闭 G1—G3

## 1. 权威输入与替代关系

- 最新审查：`planning-review-completion-phase6b-01-verifying.md`
- 主体回执：`completion-phase6b-production-artifact-isolation-01.md`
- 主方向：`../ready/direction-phase6b-production-artifact-isolation.md`
- 本提示是 Phase 6B 当前唯一执行入口；主体方向与旧回执只作已锁定证据和边界来源。

## 2. 唯一剩余缺口矩阵

| ID | 失败事实 | 完成条件 | 反向断言 | 最小充分证据 | 合法停止条件 |
|---|---|---|---|---|---|
| G1 | 正式 Jar 仍含 `MockCloudProvider`，prod 仍默认 mock | mock 实现只存在于 dev/test/mock 源与配置；正式编译/Jar 计数 0；dev 入口仍可用 | 生产选择器零 mock import/new/反射字符串；不得靠 Jar 精确排除留下悬挂引用 | 源归属清单、prod/dev 编译计数、正式 Jar 门禁、dev 定向行为 | 若现有公开契约要求生产 mock 成功才成立，保留调用证据并停止，不得改变契约 |
| G2 | IoT 关闭时生产上下文因强制依赖缺 Bean 而失败 | `sw.iot.enabled=false` 的 prod 上下文启动；provider/mock Bean 均为 0；代表性设备操作返回既有不可用失败，绝不模拟成功；启用但缺凭据继续 fail closed | 不允许全局放宽 Bean 缺失、伪造腾讯凭据、吞异常或返回成功 | IoT 装配定向测试、禁用调用行为、缺凭据行为、Bean 计数与错误类型 | 窄幅装配修正仍要求公开 API/数据库变更时，保留真实失败并停止 |
| G3 | 正式入口 exit 1，缺真实 PG 启动 | 最终 `scripts/build-prod.sh` exit 0；正式门禁全通过；正式 Jar 以 prod + IoT disabled + 真实 PG 隔离启动并 health 200，Flyway/驱动/关闭可回读 | 不用 H2、依赖树或源码扫描替代 PG；日志不得含连接值/临时安全值 | 构建原始日志、门禁、PG 启停日志与结果、全量测试、hash/秘密扫描、机器末行 | PG 真实不可达且非破坏性诊断穷尽时按契约如实报告 |

## 3. 实施边界

允许最小修改：

- `MockCloudProvider` 的源码/配置归属；
- `IotAutoConfiguration`、`TencentCloudProperties` 及当前阻断启动的 IoT-only 组件装配条件或 provider 获取方式；
- 与上述行为直接对应的测试、生产制品门禁和必要配置；
- 新补证目录与补正回执。

禁止：修改公开 API 签名、HTTP 成功/失败模型、数据库/迁移、真实腾讯调用逻辑、非 IoT 业务、Phase 6C/Final、Git/发布动作。不得将 mock 类保留在生产 Jar 后只改默认配置，也不得用精确 Jar 排除制造悬挂字节码。

推荐语义：生产 IoT 关闭时 provider 可缺省；需要 provider 的操作在调用点按现有异常体系明确失败。具体实现由 Executor 依据当前装配图最小调整，不强制某个注入 API。

## 4. 验证顺序

1. 建立 G1—G3 原子账本与修改前装配事实；
2. 完成窄幅装配修正并运行定向测试：prod-disabled、prod-enabled-missing-config、dev-mock；
3. 重跑 dev H2 隔离启动烟测，确认现有已锁定开发入口未被修正破坏；
4. 使用既有 `PG_*` 变量和唯一临时数据库/Schema、隔离端口启动正式 prod Jar；运行时所需 RSA/digest/JWT 等值只能现场生成并通过环境变量注入，禁止落盘或出现在日志；验证完成后仅清理本轮唯一对象并回读；
5. 执行最终全量 `MAVEN_OPTS="-Xmx2g" mvn -B -o test`，基线不低于 1563，0 failures/errors/skipped；
6. 执行仓内唯一生产构建入口，要求整体 exit 0；再独立回读正式门禁 0 失败、Manifest marker、Jar hash/大小；
7. 若修改过制品门禁脚本，重跑临时 Jar 负向探针；未修改则引用已锁定证据并证明脚本 hash 未变；
8. 冻结新证据、现场回读哈希、秘密扫描，最后写补正回执与机器末行。

重型 Maven 命令串行，不停止当前常驻服务。PG 证据只记录变量名、数据库产品/驱动、隔离对象的非秘密标识、Flyway 终点、health 与退出/清理结果。

## 5. 已锁定项

H2 生产 runtime 0、dev resources/source 边界、五个验证适配器物理隔离、生产正向清单、身份 marker、Release workflow 接入、负向探针、原全量 1563/0/0/0、原证据 18/18 均锁定。只有被 IoT 装配修正直接影响或最终制品必须重建的项目才重验。

## 6. 首次提示的收敛说明

- 删除：不重做 H2/profile、五个验证适配器和 CI 主体。
- 原子化：只剩 mock 归属、IoT 关闭/缺配置语义、正式入口与 PG 运行。
- 替代路径：无腾讯凭据时用 `sw.iot.enabled=false` 验证生产启动，以缺凭据定向测试证明启用路径 fail closed；不伪造外部账号。
- 提交条件：G1/G2/G3 全部有行为证据，正式构建入口和制品门禁 exit 0，PG prod health 200，全量绿色，哈希回读与秘密扫描通过。

## 7. 补正回执与终态

新增：

`product/backend-architecture-optimization/receipts/completion-phase6b-production-artifact-isolation-evidence-supplement-01.md`

旧回执和旧证据不改写。回执保持 `EXECUTION_SUBMITTED` / `feature_status=VERIFYING`；最后一个非空物理行必须是合法 `ENGINE_TERMINAL {json}`，G1—G3 均 `COMPLETED`、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`。不得自行写 `PASSED/COMPLETED` 或启动下一阶段。
