# P58 工作流节点能力执行回执 01

- 执行日期：2026-09-03
- 执行角色：Executor
- 执行状态：`EXECUTION_SUBMITTED`
- 功能状态：`VERIFYING`
- 上游文档：
  - `product/p58-workflow-node-capabilities/receipts/planning-review-p58-workflow-node-capabilities-01.md`
  - `product/p58-workflow-node-capabilities/ready/direction-p58-development-debug-auth.md`

## 1. 版本与工作区绑定

本轮实跑绑定以下当前本地 HEAD，未提交、未推送：

```text
Smart-WorkFlow             5b44220cc33ea0e61ec2dab3034eece10e43f2f9
Smart-WorkFlow-Server      451bd9a2dd979db574fbdb2923f26881ea11af8d
Smart-WorkFlow-Web         802971df711397a9d7c9bc20c6c8f5ba60ec70b0
```

后端与前端均在 `develop` 分支；根工作区保留本轮 P58 状态、记忆、任务池和新增回执变更。

## 2. 本轮实现结果

### 2.1 开发环境调试认证

- 认证入口只接受 `Authorization: Bearer test_<正整数>` 的调试令牌形状。
- 开关默认关闭，开发环境需显式 `SW_DEBUG_AUTH_ENABLED=true`；生产配置显式关闭。
- 仅当活动 profile 全部为 `dev`/`test` 且请求来源为真实 loopback 时生效；空 profile、生产 profile、混合 profile 与非 loopback 均 fail-closed。
- 调试令牌只提供用户 ID；每次请求仍通过正式用户、租户、状态、角色和菜单权限链回查，不创建用户、不提升权限。
- 接受与拒绝均输出结构化 `debug_auth` 日志，包含决策、调试 ID、用户 ID（可取得时）、路径、requestId、来源和原因；不记录密码、令牌全文或表单数据。
- 调整过滤器顺序，使正式 JWT 与开发调试认证共存，正常 JWT、Cookie 和未认证请求保持原有语义。
- `auth/me` 同时支持 `/api/auth/me` 与 `/api/system/auth/me`，用于真实认证链验收。

### 2.2 节点运行链修复

- 共识节点使用 Flowable `FlowableCollectionHandler` 解析统一参与人集合，并持久化 `flowable:collection`。
- 抄送与通知服务节点使用 Flowable `FieldExtension` 持久化 `nodeConfig`，运行委托从部署后的模型回读配置。
- 前端能力合同、节点能力清单、流程编辑配置、任务详情审批历史类型均完成同步；未知节点类型有明确不可用提示。

## 3. G1-G3 真实 API 证据

### G1 认证、身份和权限

受控开发后端使用 loopback API 实跑：

- `GET /api/auth/me` 携带有效调试令牌返回 200，并回显正式用户 `admin`、租户 `0`、超级管理员身份；同一链路无 `Set-Cookie` 和 `Authorization` 响应头。
- 正式创建并启用独立普通角色、查看者用户和操作者用户；两个真实用户的 `/api/auth/me` 分别回显各自用户 ID、角色和权限集合。
- 查看者读取 `/api/workflow/defs/node-capabilities` 返回 200，但创建流程返回 403；操作者读取流程定义返回 200，证明菜单权限进入正式授权链。
- 非法格式、未知用户、未携带令牌、停用用户、软删除用户均返回 401；关闭调试开关的独立开发实例对 `/api/auth/me` 与受保护流程接口均返回 401。
- 单元测试原始日志覆盖 `DISABLED`、`INVALID_FORMAT`、`NON_LOOPBACK_SOURCE`、`USER_NOT_FOUND_OR_INACTIVE`、`IDENTITY_INFRASTRUCTURE_ERROR` 和正式身份加载成功等决策原因。

### G2 设计、保存、发布和持久化

- 表单 `p58_e2e_20260903`：真实创建、配置、发布成功，物理表与版本信息已回读。
- 流程定义 `2095429441651548162`，processKey `bpm_954b84eca618489c`：START→APPROVAL→END 图保存后回读一致，图校验返回空错误列表，发布状态为 `PUBLISHED`，部署信息已回填。
- 最新组合流程回读确认节点类型包含 `START`、`APPROVAL`、`CONSENSUS`、`CONDITION`、`COPY`、`NOTIFICATION`、`END`；BPMN 回读包含共识 collection 和服务节点 `nodeConfig` field。

### G3 普通审批与历史

- 同一普通审批流程真实完成 APPROVE 与 REJECT 两条实例，分别回读 `APPROVED`、`REJECTED`，活动节点为空，已办查询可见。
- 两审批节点退回实跑返回前节点新待办；任务详情 `approvalHistory` 回读 APPROVE 与 RETURN、意见数据、意见表单 `p58-opinion`、版本 `1` 和退回目标。
- 任务详情包含流程变量、表单数据、审批人和流程实例关联，原任务完成后不再作为活动任务存在。

## 4. G4/G7 真实 Flowable/API 证据

### G4 共识

- 单一参与人共识探针定义 `2095435308643909633` 发布成功，BPMN 回读含 `flowable:collection` 与 `consensusParticipantResolver`。
- 组合流程 `2095439263100944386` 的真实正向链完成：普通审批 → 共识 → 金额条件 TRUE → 抄送 → 站内通知 → End。
- 组合实例 `4dcbe264-a777-11f1-9bfd-66ff24301f3c` 最终状态为 `APPROVED`，`activeNodeIds=[]`；Flowable/API trace 回读了普通审批、共识、条件 TRUE、抄送、通知和 End。
- 双身份 `ALL` 共识流程 `2095440835113500674` 真实创建并发布。实例 `3db9b1ed-a778-11f1-8169-66ff24301f3c` 下，管理员任务 `3dbb1193-a778-11f1-8169-66ff24301f3c` 与第二真实用户任务 `3dbbadd7-a778-11f1-8169-66ff24301f3c` 同时出现；两份任务详情分别回显不同 assignee。两个身份分别完成后，实例为 `APPROVED`、活动节点为空，双方待办均为 0。
- 双身份实跑日志确认两次完成请求分别由两个正式加载的用户上下文处理；全链路未写入 Cookie 或正式登录令牌。

### G7 组合服务节点与通知

组合实例的通知查询返回 4 条 `deliveryStatus=SUCCESS` 的站内消息，覆盖审批通过通知、组合通知、抄送消息和待办消息；组合业务键与流程实例已关联。

## 5. 浏览器证据边界

- 受控前端 `http://127.0.0.1:5174` 登录页真实渲染：用户名、密码、验证码和登录按钮均存在；页面没有调试令牌输入或调试认证 UI。
- 访问受保护流程路径真实重定向到登录页。
- 应用内浏览器直接访问 loopback 后端时返回 `net::ERR_BLOCKED_BY_CLIENT`；当前没有人工确认验证码，因此本轮没有写入伪造的浏览器登录成功证据。
- 因此，浏览器侧已完成页面与安全边界检查，认证后设计器/待办操作仍待可用浏览器会话和人工验证码确认后由 Planner 正式验收。

## 6. G8 回归门禁原始结果

### 后端

```text
聚焦：mvn -q -pl sw-biz/sw-bpm/sw-bpm-engine -am -Dtest='GraphToBpmnTranslatorTest,NodeTypeTranslatorPlugabilityTest' -Dsurefire.failIfNoSpecifiedTests=false test
FOCUSED_FINAL_EXIT=0

全量：mvn -q test
BACKEND_FULL_FINAL_EXIT=0
SUREFIRE_FILES=148 TESTS=1024 FAILURES=0 ERRORS=0 SKIPPED=0
```

全量输出同时包含 Flyway 1→49 完整迁移链、独立升级链和既有负向测试日志；总退出码为 0。

### 前端

```text
pnpm typecheck
WEB_TYPECHECK_EXIT=0

pnpm lint
WEB_LINT_EXIT=0
0 errors and 33 warnings

pnpm test
WEB_TEST_FINAL_EXIT=0
Test Files  116 passed | 1 skipped (117)
Tests       1104 passed | 3 skipped (1107)

pnpm build
WEB_BUILD_FINAL_EXIT=0
✓ built in 1.54s
```

Lint warning 为现有格式与重复导入提示；构建警告来自依赖包 `@vueuse/core` 的 Rolldown pure annotation，未导致构建失败。

## 7. 环境清理与剩余验收边界

- 本轮拥有的后端端口 `18080`、`18081`、`18082` 与前端端口 `5174` 已停止并确认无监听进程。
- 实跑使用 H2 内存库；服务停止后认证用户、角色、表单、流程、任务和通知探针数据不再保留。
- 调试开关仅由开发环境显式环境变量开启，仓库默认关闭；临时测试密钥未进入仓库。
- G4 的 ANY、RATIO、阈值边界、提前结算、并发、幂等、取消及失败终态矩阵，G5 的真假/默认与表达式负向矩阵，G6 的通道 SPI 失败/超时/幂等矩阵，以及浏览器认证后正向操作，未在本轮形成独立完整的真实证据。
- 本轮不把上述证据缺口写成已通过，也不改变旧规划回执；功能保持 `VERIFYING`，等待 Planner 按新方向进行正式验收和后续收口。

