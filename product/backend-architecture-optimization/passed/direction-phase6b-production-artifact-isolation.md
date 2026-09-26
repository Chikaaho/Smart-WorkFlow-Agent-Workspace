# Phase 6B · 生产制品与开发运行边界

> 下发角色：规划（Planner）  
> 指定实施角色：执行（Executor）  
> 所属总体任务：`backend-architecture-optimization`  
> 对应候选：BAO-08 + BAO-10  
> 任务等级：XL  
> 状态：PASSED（规划功能验收通过，2026-09-26）  
> 日期：2026-09-25

## 1. 目标

建立可复算的正式生产构建入口，使生产 Boot Jar 只包含生产运行所需代码、配置和数据库能力；H2 与验证适配器保留在 test/dev 运行边界。生产数据库行为以 PostgreSQL 为权威，H2 只承担轻量、快速的数据交互辅助验证。

阶段按三个可独立回滚步骤实施：

1. 固化正式生产构建入口和 CI 制品门禁；
2. 分离 H2、dev/local 配置与 devseed 资源；
3. 分离明确的 dev-only 类并修正 IoT mock provider 的环境归属。

## 2. 正式生产构建入口

1. 保留稳定 Maven `prod` profile，并提供仓内唯一、可复用的生产构建入口；GitHub Release workflow 必须显式调用该入口，不能依赖操作者记忆传参。
2. 生产构建应先复用已通过的全量测试门禁，再以 `prod` profile 生成 Boot Jar；若打包步骤跳过测试，CI/脚本必须在同一最终源码快照先执行完整测试，不能只生成制品。
3. 正式 Boot Jar 必须有可机器识别的生产身份（例如 Manifest 中稳定的 production build marker）；制品检查脚本必须在发布前执行并 fail closed。
4. 默认开发构建与正式生产制品不得混称；回执必须记录唯一命令、输出路径、hash、大小、Manifest 标记和 CI 实际引用位置。

## 3. H2 与资源边界

1. `sw-bootstrap` 的生产运行时依赖树和正式 Boot Jar 中不得包含 `com.h2database:h2`；现有测试模块的 `scope=test` H2 可保留。
2. 提供明确的 dev/local Maven 运行入口，为本地启动供应 H2 运行时依赖、`application-dev.yml`、`application-local.yml` 和 `db/migration/devseed/**`；这些资源不得进入正式生产 Boot Jar。
3. 生产 Boot Jar 必须保留 `application.yml`、`application-prod.yml`、PostgreSQL 驱动和生产迁移资源，并能使用真实 PostgreSQL 启动。
4. H2 只做 dev/local 启动烟测和具体使用点验证；本阶段不建立额外的全量 H2 兼容矩阵。事务、锁、迁移、方言和生产行为结论以 PostgreSQL 运行证据为准。
5. MySQL 等其它数据库驱动是否属于正式支持范围不在本阶段裁决；不得借 BAO-08 顺手删除未经审计的生产数据库能力。

## 4. dev-only 代码与 IoT provider

1. 以下已确认验证适配器必须从正式生产制品物理隔离，不以文件名前缀作为唯一安全边界：
   - `P58DebugNotifyController`；
   - `P58DebugNotifyChannelAdapter`；
   - `P58DebugParticipantAdapter`；
   - `VerificationRunner`；
   - `BpmVerificationRunner`。
2. 优先采用 dev source/resource 根、dev-only module 或等强度的构建结构，使生产编译输入天然不可见；精确 profile 排除只能作为辅助门禁，不能成为唯一归属机制。
3. `MockCloudProvider` 只归属显式 dev/test/mock 运行入口。正式 `prod` 配置不得默认选择 mock，生产制品不得包含该实现；IoT 未启用或真实 provider 配置不足时按既有错误体系 fail closed，不得模拟成功。
4. `AgentGraphDebug*` 是带权限控制的正式产品能力，必须保留在生产制品；禁止使用 `*Debug*`、`*Mock*` 等宽通配误伤正式功能。
5. `DebugAuthentication*`/`DevProperties` 现有非 dev/test 启动期 fail-closed 约束不得弱化；若不移动这些安全守门类型，回执需以生产上下文证明 test-mock 关闭且调试认证不可激活。

## 5. 验收门禁

1. **生产入口真实执行**：仓内生产构建入口 exit 0；CI/Release workflow 显式调用同一入口并在上传前执行制品门禁。Manifest/等价 marker 能区分正式生产制品。
2. **生产依赖树**：`prod` profile 下 H2 runtime 命中 0；不得通过删除 PostgreSQL 或改为 test scope 换取绿色。
3. **Boot Jar 负向清单**：正式制品内以下均为 0：
   - `BOOT-INF/lib/h2-*.jar`；
   - 五个 dev-only 顶层类型及其嵌套类；
   - `MockCloudProvider`；
   - `application-dev.yml`、`application-local.yml`；
   - `db/migration/devseed/**`。
4. **Boot Jar 正向清单**：`application.yml`、`application-prod.yml`、PostgreSQL 驱动、生产 Flyway migrations、正式 IoT provider 与 `AgentGraphDebug*` 均存在；不得以过宽排除换取负向清单绿色。
5. **生产上下文**：以正式 Boot Jar、`prod` profile、隔离端口和真实 PostgreSQL 启动成功；记录数据源产品名/驱动、Flyway 终点、健康状态和关闭结果。连接值只来自既有 `PG_*` 环境变量，日志与证据不得出现值。
6. **IoT fail-closed**：生产上下文中 `MockCloudProvider` Bean 数为 0；IoT 关闭或真实 provider 不可用时，代表性设备操作不能返回模拟成功。不得改变公开 HTTP 成功/失败模型。
7. **dev/local 可用**：显式 dev/local 入口下 H2 依赖、dev/local 配置、devseed 和五个验证适配器可用；完成一次隔离 H2 内存启动烟测。该烟测只证明开发入口未被边界拆分破坏。
8. **安全与正式 Debug 能力**：prod 上下文调试认证/test-mock 不可激活；`AgentGraphDebug*` 的既有权限与路由门禁保持通过。
9. **回归**：后端全量 `MAVEN_OPTS="-Xmx2g" mvn -B -o test` 不低于当前 **1563**，failures/errors/skipped 均为 0；新增/删减测试逐项解释。生产打包与测试串行执行。
10. **可复跑证据**：保存生产/开发构建命令、依赖树、Jar 内容正反清单、Manifest、PG 启动、H2 dev 烟测、IoT/安全断言、CI 路径、全量测试摘要、hash 回读和秘密扫描；哈希清单现场回读全部通过。

生产制品检查应形成仓内可复用自动门禁，并至少包含一个临时制品负向探针：向临时副本/临时 Jar 注入任一禁止项后，门禁必须非零失败；探针不得污染正式工作树或最终制品。

## 6. 边界与停止条件

- 不处理 Maven 版本表达式、34 个 POM 父版本、develop/main/tag 身份（Phase 6C）。
- 不修改 GitHub About、根 POM canonical URL 或最终展示项。
- 不改业务功能、公开 API、数据库模型、生产迁移、groupId/artifactId；不重打历史 Release。
- 不 commit/push/merge/tag/Release/部署，不停止当前常驻服务；验证进程使用隔离端口并在证据冻结后清理。
- 若 dev-only 物理隔离需要修改生产调用方或造成公开行为变化，停止并单列，不得退回仅靠宽通配命名排除。
- 若真实 PostgreSQL 不可达，保留实际工具错误并穷尽非破坏性诊断；不得用 H2 绿色替代生产启动证据。

## 7. 回滚

- Step 1：回滚生产构建入口、Manifest 标记、制品门禁与 workflow 调用；
- Step 2：回滚 H2 scope/profile 和 dev resource 归属；
- Step 3：回滚 dev-only 源归属及 provider/profile 配置。

三步分别记录修改文件与回滚语义；已经生成的 Boot Jar 必须重新构建才能反映回滚，不得把旧制品作为回滚结果。

## 8. 完成回执

提交：

`product/backend-architecture-optimization/receipts/completion-phase6b-production-artifact-isolation-01.md`

回执状态先写 `EXECUTION_SUBMITTED`，不得自行写 `PASSED`、`COMPLETED` 或启动 Phase 6C/最终展示收口。最后一个非空物理行必须是合法 `ENGINE_TERMINAL {json}`。
