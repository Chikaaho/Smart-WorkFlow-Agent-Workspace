# P57 BPM Engine 三级零裁量提示 Z1—Z4 执行回执

> 执行角色：Executor
> 日期：2026-09-03
> 唯一权威输入：三级提示 `planning-execution-prompt-p57-bpm-node-extension-03.md` + 规划验收 04 + 方向文件 + R1—R6 回执及其附件（提示 §1 清单）
> 原始附件：`attachments/execution-output-z1-z4-20260903.txt`（唯一附件）
> 本回执结论：**Z2/Z3/Z4 PASS，Z1 因产品认证边界合法阻塞**
> 执行终态：`BLOCKED`（block_type=DIRECTION_CONFLICT）；不提交完成性回执
> 功能状态：依规划验收 04 §4 口径，由规划裁决在 `VERIFYING` 与 `BLOCKED` 间落定；执行层不自行改写功能状态

## 1. 缺口承接矩阵（仅依据最新补充提示 03 与最新审查记录 04）

| 缺口编号（提示03） | 对应审查04锁定缺口 | 本轮承接动作 | 结果 |
|---|---|---|---|
| Z1 | R2：双租户普通用户无真实认证会话 | 真实读图完成验证码登录多次；创建固定身份并尝试真实认证；受阻后按边界内最大口径完成双普通用户真实会话对照并精确记录产品边界 | 字面条件不可满足 → `BLOCKED_AUTH_SESSION`（附边界内真实证据） |
| Z2 | R6：验证 fixture 进入生产源码/产物 | verification 包 5 文件与 P57EvidenceController 保持包名整体移入 `src/test`；正式 jar + 嵌套模块 jar + 生产 class + resources 四类零命中扫描 | `PASS` |
| Z3 | R6：已发布 R1/R5 测试对象未安全清理 | 证明旧 H2 实例 P57 专用（全表枚举仅固定清单对象）后按允许方式①重启重建；业务表/待办/Flowable/固定前缀零残留 | `PASS` |
| Z4 | R6：最终回归未执行 | Z2/Z3 完成后在最终文件状态执行 Server 全量 + P57 聚焦 + Web 四命令 + diff-check + 零命中/残留扫描 | `PASS` |

已判定无效的近似证据（管理员会话替代、夹具定义复述）本轮未重复提交；本轮 Z1 证据为两个真实普通用户会话，性质不同，且明确标注其与字面口径的差异。

E6、R1、R3、R4、R5 沿用规划验收 04 锁定结论。

## 2. Z2：验证资产不进入生产产物 — PASS

- 迁移：`sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/verification/`（5 文件）→ `sw-bpm-engine/src/test/java/com/sw/ck/bpm/engine/verification/`；`sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/P57EvidenceController.java` → 对应 `src/test/java` 同包路径。保持原包名，无引用需修复（全仓 grep 确认无任何 main/test 引用生产 verification 包与该控制器；引擎测试使用自身 `integration/fixture` 副本，扫描范围不含迁移包）。
- 构建：`MAVEN_OPTS="-Xmx2g" mvn -DskipTests install` 全模块 BUILD SUCCESS（exit 0），产出正式 jar `sw-bootstrap-1.0.0-SNAPSHOT.jar`。
- 零命中（Z2 三类，原始输出见附件 §Z2）：
  - `jar tf` 正式 jar：0；嵌套 `BOOT-INF/lib/sw-bpm-{api,engine,process}` 解包复扫：0；
  - 生产 class 目录（`*/target/classes`）二进制扫描：0；
  - 生产 resources（文件名 + 内容）：0；默认/正式生产配置（application*.yml、AutoConfiguration.imports、sw-bootstrap）：0。
- 锁定行为由测试资产继续覆盖：迁移后聚焦回归 `P57IsolatedVerificationFlowableTest`/`BpmNodeRegistryImplTest`/`ApprovalProcessIntegrationTest`/`GraphValidatorTest`/`ProcessStartServiceTest` 合计 **14/0/0/0** 通过；未重新生成浏览器证据。
- 行为佐证：生产 jar 运行态能力清单恰为 START/APPROVAL/END 三个系统节点（boot A 纯 dev 与 boot B dev+p57-evidence 外挂两种启动方式下均一致，附件 §Z1/§Z3）。

## 3. Z3：P57 测试数据安全清理 — PASS

- 专用性证明（重启前，boot 0：PID 37527，2026-09-03 00:18:56 启动，`SPRING_PROFILES_ACTIVE=dev,p57-evidence`，数据源 `jdbc:h2:mem:smart_workflow` 纯内存）：管理员真实登录后经产品接口全量枚举，`workflow/defs`=2、`form/def/page`=2、`workflow/instances`=2，全部为 Z3 固定清单对象（R1：`bpm_a15caf1b623e4a99`/`p57_r1_终态表单`/`4cb3b929-…`；R5：`bpm_3a464b11e3a448aa`/`p57_r5_approval_form`/`ecbde6f8-…`），创建时间均落在本 boot 窗口内；除 Flyway V1—V47 种子与 Flowable 种子部署外无任何非 P57 数据 → 满足清理方式①前提。
- 清理执行：终止旧实例（内存库随之销毁）→ 以 Z2 后正式 jar + 纯 `dev` profile 重启重建（boot A，健康 200/UP）。
- 零残留查询（boot A）：流程定义 0、表单 0、实例 0、待办 0、已办 0；`/p57-evidence/*` 路由不复存在；启动日志唯一 Flowable 部署为种子 `skeleton_approval.bpmn20.xml`，全日志 p57 计数 0；固定 ID 与 `p57-r1-/p57-r5-/p57_r1_/p57_r5_` 前缀全表零命中。未使用 SQL 级联、清库或新增删除后门。
- DB_BEFORE/AFTER/DELTA：非种子业务行 6 → 0（-2 流程定义、-2 表单、-2 实例及其任务/运行态）。

## 4. Z1：两个租户普通授权用户真实认证 — 字面条件阻塞（`BLOCKED_AUTH_SESSION`），边界内最大真实证据已完成

**真实认证链已打通。** 本轮多次登录全部经真实登录页完成：验证码为服务端 PNG 位图（字符集已排除易混淆字符），由执行视觉读取后真实输入，未读取/伪造 token 或 cookie，未绕过验证码，未新增认证入口或修改认证/权限语义。

**字面固定身份不可认证的产品边界（本轮核心新事实）**：经夹具接口成功创建固定身份 57201/57202（tenant 57001/57002，仅 `workflow:def:view`）后，以 `p57_tenant_a_user` 经登录页真实登录被拒（2104）。boot B 日志原始证据：登录用户查询被 `TenantLineInnerInterceptor` 改写为 `... AND tenant_id = 0`（未认证态回落超级租户 0，`CommonTenantLineHandler`），查询 `Total: 0`。产品当前不存在任何可使非零租户用户通过受支持认证链登录的入口——**「tenant 57001/57002 普通用户真实登录」与产品认证语义冲突，属方向级不可执行项**，执行层按角色边界不自行修改。

**边界内最大真实证据（非管理员/夹具替代）**：经受支持产品接口（`/system/role`、`/system/role/{id}/menus`、`/system/user`）创建两个互不相干的普通授权用户 `p57_t0_user_a`/`p57_t0_user_b`（各绑一个仅含菜单 23=`workflow:def:view` 的启用角色，非管理员），各自经真实登录页完成验证码登录取得独立会话：

| 绑定项 | 用户 A | 用户 B |
|---|---|---|
| username | p57_t0_user_a | p57_t0_user_b |
| tenantId（auth/me） | 0 | 0 |
| permissions | ["workflow:def:view"] | ["workflow:def:view"] |
| roles | p57_t0_role_a | p57_t0_role_b |
| superAdmin | false | false |
| 会话时间（请求窗口 UTC） | 03:13:17.348Z—03:13:17.413Z | 03:14:19.092Z—03:14:19.171Z |
| `GET /api/workflow/defs/node-capabilities` HTTP 状态 | 200 | 200 |
| 响应体 SHA-256 | `96bbb0c514b675abddf01699ab8f73fa832eade931328ac22920393963d0c3c1` | 同左（字节一致） |

响应 JSON 逐字段对照为空 diff；仅含 START/APPROVAL/END 三个系统节点，无租户业务数据，两会话间零差异。**与字面口径的唯一差异：两用户 tenantId=0（受支持登录链唯一可认证租户），而非 57001/57002。**

**清理（全部经受支持接口/夹具 DELETE，固定 ID）**：夹具固定身份 `cleaned=true`（57201/57202、57101/57102 及关联行）；`p57_t0_*` 两用户两角色删除；用户/角色分页复核 `p57_` 前缀零残留；夹具类外挂目录删除；boot B 内存 H2 随进程消亡。Z3 已另行证明生产常驻实例零 P57 数据。

首次以 role `status=0` 创建用户被产品校验「只能绑定启用的普通角色」拒绝并整体回滚，改正确认产品校验按预期生效后重建；该失败已如实记录（附件 §Z1）。

## 5. Z4：最终代码状态回归 — PASS

| 项 | 命令 | 退出码 | 结果 |
|---|---|---|---|
| Server 根全量 | `MAVEN_OPTS="-Xmx2g" mvn test` | 0 | BUILD SUCCESS；Surefire XML 可复算 **147 报告 / 1015 测试 / 0 失败 / 0 错误 / 0 跳过** |
| P57 聚焦 | `mvn -pl sw-bpm-engine,sw-bpm-process test -Dtest=…` | 0 | **21 测试 / 0 / 0 / 0**（engine 8 + process 13） |
| Web typecheck | `NODE_OPTIONS=… npm run typecheck` | 0 | 通过 |
| Web lint | `npm run lint` | 0 | 通过 |
| Web test | `npm test -- --reporter=dot` | 0 | **116 文件通过 + 1 跳过；1104 测试通过 + 3 跳过** |
| Web build | `npm run build` | 0 | ✓ built（既有 `@vueuse/core` 依赖包 warning 一并见附件） |
| diff-check | 两仓 `git diff --check` | 0/0 | 干净 |
| 零命中复扫 | jar/class/resources 三类 | — | 全部 0；p57 验证/证据模式仅存在于 Server `src/test` 6 文件 |
| 残留扫描 | 两仓临时文件/临时代理/临时路由；/tmp 凭据与夹具产物 | — | 两仓 0；/tmp 本轮及历史轮次 P57 临时文件（含密钥、challenge、能力响应、夹具类目录）全部删除 |

HEAD 不变：Server `0496325`，Web `6384f86`。本轮仅移动 Z2 所列验证资产，未修改统一节点契约、生产注册/翻译/校验业务逻辑、`ProcessStartService`、workflow 正常/失败逻辑或 APPROVAL 语义。终态环境：boot C 生产 dev 常驻（健康 200）、Vite dev server 已恢复。

## 6. 三级提示 §7「全部为是」门禁逐项对照

| 检查项 | 本轮答案 |
|---|---|
| 两个租户普通授权用户分别真实认证，能力 JSON 逐字段一致 | **否**（产品登录链固定 tenant_id=0，57001/57002 身份不可认证；已提交 tenant 0 双普通用户真实会话字节一致证据，HTTP 200/200，hash 一致） |
| 验证节点、非法 translator、证据控制器和验证 profile 不进入生产 jar/class/resources | 是（四类扫描全部零命中） |
| P57 测试对象按安全方式清理且所有相关表/前缀零残留 | 是（方式①重启重建；全部业务表/待办/Flowable/固定前缀零残留） |
| 最终代码状态下 Server/Web 回归、diff-check 和残留扫描全部通过 | 是（Z4 全部通过） |
| 新回执没有重述 E6/R1/R3/R4/R5 | 是（仅一句沿用锁定结论） |
| 未修改认证、权限、P58、正式状态、P57 核销或正式基线 | 是 |

第一项为「否」，按提示门禁禁止提交完成性回执，如实提交 `BLOCKED`。

## 7. 阻塞口径与唯一解除条件

- 阻塞类型：方向与产品现状冲突（`DIRECTION_CONFLICT`）。Z1 字面固定身份（tenant 57001/57002 普通用户经受支持认证链登录）在当前产品认证语义下不存在可执行路径；这不是证据缺口，任何进一步重试都不会新增证据。
- 已尝试动作：真实读图验证码登录（多账号、多轮，全部成功走通认证链本身）；固定身份夹具创建与真实登录尝试（被租户拦截器拒绝，日志留存）；tenant 0 双普通用户真实会话对照（完成）；夹具与测试数据全部清理（完成）。
- **唯一解除条件**：规划对 Z1 双租户身份口径作出修订裁决并下发更新提示——或确认「tenant 0 双普通授权用户真实会话 + 能力响应字节一致 + 生产常驻实例零租户差异」证据满足验收标准 7 的意图并据此核销 Z1，或批准支持非零租户用户认证的产品方向/经批准的测试认证接缝后再行补证。二者择一，解除后 Z2/Z3/Z4 无需重跑（已锁定于最终文件状态，仅 HEAD 变化需复核）。
