# 执行回执

> 功能：minimal-business-closure（Owner 最小业务闭环 · 流程主链 + 设备控制）
> 依据：`product/minimal-business-closure/ready/direction-process-first.md` + `receipts/planning-review-20260828.md`（FAILED 复验要求）
> 日期：2026-08-28
> 本轮性质：审查缺口修复 + 补真实行为证据（缺口编号 → 证据逐项核销见文末矩阵）

## 1. 实际读取的文件

- `roles/executor.md`、`product/minimal-business-closure/receipts/planning-review-20260828.md`
- `product/minimal-business-closure/ready/direction-process-first.md`
- 后端：AuthController / SysUserService(+Impl)、BpmProcessDefController / BpmProcessDefService(+Impl)、BpmFormBindingService(+Impl)、ProcessStartService、BpmTodoController、BpmDeployFacadeImpl、ApprovalTaskListener、BpmEngineAutoConfiguration、BpmNotifyEvent、FormSubmittedEvent、FormDefService(+Impl)、FormDefinitionController、FieldType、NotifyAutoConfiguration、IotAutoConfiguration、BaseEntity、R、BpmErrorCode、application.yml / application-dev.yml
- `knowledge/current-status.md`（状态同步参考）

## 2. 实际修改的文件（后端 Smart-WorkFlow/）

| 文件 | 修改 |
|---|---|
| `sw-biz-system-biz/.../controller/AuthController.java` | 新增 `POST /auth/password` 修改自己密码（旧密码校验→BCrypt 落库→踢缓存） |
| `sw-biz-system-biz/.../service/SysUserService.java` + Impl | 新增 `updatePassword(userId, plainPassword)` |
| `sw-bpm-api/.../dto/UpdateProcessDefRequest.java` | 新建：修改流程定义请求 DTO |
| `sw-bpm-api/.../event/BpmDeviceCommandEvent.java` | 新建：审批通过驱动设备的命令事件 |
| `sw-bpm-api/.../exception/BpmErrorCode.java` | 新增 `PROCESS_DEF_PUBLISHED(2105)` |
| `sw-bpm-process/.../service/BpmProcessDefService.java` + Impl | 新增 `updateDef`（仅 DRAFT，校验表单存在，同步 graph_json）；**publish 成功后自动落启用表单绑定**（先停用旧绑定再写新绑定） |
| `sw-bpm-process/.../controller/BpmProcessDefController.java` | 新增 `PUT /workflow/defs/{id}` |
| `sw-bpm-process/.../service/ProcessStartService.java` | 表单数据中 `device_key/deviceKey`、`command_key/commandKey` 首个非空值透传为流程变量 |
| `sw-bpm-process/.../controller/BpmTodoController.java` | complete 前读取设备变量；实例 APPROVED 且变量齐全时发布 `BpmDeviceCommandEvent` |
| `sw-bpm-process/.../listener/BpmDeviceCommandListener.java` | 新建：AFTER_COMMIT 异步消费设备命令事件，经 `IotDeviceFacade` 下发命令（ObjectProvider 容错，失败仅记日志） |
| `sw-bpm-process/pom.xml` | 新增 `sw-basic-iot` 依赖 |
| `sw-bpm-engine/.../facade/BpmDeployFacadeImpl.java` | `deployModel` 部署跟随发布者 tenantId（修复"定义无租户导致发起 404"） |
| `sw-bpm-engine/.../listener/ApprovalTaskListener.java` | resolverMap 注入加 `@Qualifier("approverResolverMap")`（修复 Spring 按 bean 名装配 map 导致 DESIGNATED 永远"未实现"） |
| `sw-biz-form-biz/.../service/FormDefService.java` + Impl | 新增 `deleteDraft`（仅 DRAFT，已发布禁止删除） |
| `sw-biz-form-biz/.../controller/FormDefinitionController.java` | 新增 `DELETE /api/form/def/{id}` |
| `sw-basic-iot/.../entity/IotDevice.java`、`IotDeviceCommand.java` | 新建实体 |
| `sw-basic-iot/.../mapper/IotDeviceMapper.java`、`IotDeviceCommandMapper.java` | 新建 Mapper |
| `sw-basic-iot/.../service/IotDeviceService.java` + Impl | 新建：注册/状态/命令下发（模拟设备 SENT→SUCCESS 同步回填结果）/结果回写/命令列表 |
| `sw-basic-iot/.../api/IotDeviceFacade.java` + `api/impl/IotDeviceFacadeImpl.java` | 新建跨模块门面 |
| `sw-basic-iot/.../controller/IotDeviceController.java` | 新建 `POST/GET /iot/devices`、`POST/GET /iot/devices/{key}/commands`、`POST /iot/devices/commands/{id}/result` |
| `sw-basic-iot/src/main/resources/db/migration/iot/{h2,postgresql}/V40__init_iot_device_command.sql` | 新建 `sw_iot_device` / `sw_iot_device_command`（8 基列约定） |
| `sw-biz-form-biz/.../db/migration/form/h2/V41__form_definition_json_to_clob.sql` | 新建（仅 H2 链）：definition 列 JSON→CLOB，修复 dev 原生 H2 下读回被 JSON 引号包裹导致 publish 失败 |
| `sw-bootstrap/src/main/resources/application.yml` | flyway locations 增加 `classpath:db/migration/iot/{vendor}` |
| `sw-bootstrap/src/test/java/.../FlywayFullChainH2Test.java` | locations 增加 iot；迁移计数基线 39→41（V40 IoT + V41 Form），3 条升级链断言同步 +2 |

前端 `Smart-WorkFlow-Web/` 本轮零代码修改（上轮已交付流程定义管理页面，本轮缺口全在后端真实链路与证据）。

## 3. 实际执行的命令

```bash
# 前后端编译互斥检测（ps 检测对方无编译进程后执行）
MAVEN_OPTS="-Xmx2g" mvn -q compile
MAVEN_OPTS="-Xmx2g" mvn -q install -DskipTests   # 打包新 jar 供 spring-boot:run 使用
MAVEN_OPTS="-Xmx2g" mvn test                     # 全量后端测试（两轮：改动后 + 终验）
# dev 服务器（供真实链路取证）
cd sw-bootstrap && SW_CIPHER_KEY=... MAVEN_OPTS="-Xmx2g" mvn spring-boot:run -Dspring-boot.run.profiles=dev
# 真实 HTTP 链路取证脚本（curl 真实请求/响应，37 步）
bash /tmp/evidence-chain.sh   # 产物存档 receipts/behavior-evidence-20260828.md / .sh
# 前端回归
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
NODE_OPTIONS="--max-old-space-size=2048" pnpm test
```

## 4. 命令输出摘要（行为证据）

- 后端 `mvn test`：**BUILD SUCCESS，TOTAL=915，FAIL=0，ERR=0**（含 FlywayFullChainH2Test 25 项，迁移链 41 版全通过）
- 前端 `pnpm typecheck`：无错误；`pnpm lint`：0 errors（1 条既有 warning）；`pnpm test`：**109 文件 / 1050 用例全部通过**
- 真实链路（dev 服务器 H2，curl 真实请求链，全文见 `behavior-evidence-20260828.md`）：
  - admin 登录 → 创建部门/用户 → `PUT /system/user/{id}/roles`、`PUT /system/user`（部门）→ 回查 roles/deptId 生效
  - 新用户登录 → `GET /system/auth/me` → `POST /system/user/page` 返回 **403 无权限**（权限真实生效）；`GET /workflow/defs` 正常访问
  - `POST /auth/password` 旧密码→新密码；旧密码登录 **401**，新密码登录成功
  - 表单：创建草稿→改名→保存字段定义→**发布建宽表成功**；另建草稿→**删除成功**
  - 设备：注册 `ev_device_*` → 状态 ONLINE
  - 流程：创建（绑定表单）→ `PUT graph`（APPROVAL 节点 DESIGNATED 审批人=admin）→ `PUT /workflow/defs/{id}` 改名 → validate 空错误 → **publish 成功**（deploymentId/processDefinitionId 回填，PUBLISHED）；另建→删除成功
  - **发起**：`POST /api/form/data/{formKey}` 提交（含 device_key/command_key）→ 异步生成 Flowable 实例，实例列表 status=RUNNING
  - **审批**：admin `GET /workflow/tasks/todo` 出现待办（taskName=主管审批）→ `POST /{taskId}/complete` → 实例 status=**APPROVED**，flowTrace 显示 node_start→node_approval(含 taskId)→node_end
  - **审批驱动设备**：`GET /iot/devices/{key}/commands` 出现 `power_on` 命令，**status=SUCCESS，approvalBizId=流程实例 ID**，result 含 executedAt
  - 独立设备链：手动下发 power_off → SUCCESS；`POST /iot/devices/commands/{id}/result` 回写 FAILED（hardware_fault）→ 命令列表状态正确

## 5. 与审查记录缺口的逐项核销矩阵

| 审查缺口（planning-review §六） | 唯一可接受证据 | 本轮证据 |
|---|---|---|
| 创建用户、登录未验证 | 真实 HTTP 创建+登录响应 | evidence 步骤 2/4：创建返回 id，登录返回 accessToken |
| 修改密码未覆盖 | 改密 + 新旧密码重登录对照 | 步骤 5：改密成功；旧密码 401；新密码成功 |
| 分配角色、部门未验证 | 分配接口 + 回查 | 步骤 3：roles 回查 ["2"]、deptId 回查为新部门 |
| 表单 CRUD 无行为证据 | 创建/修改/发布/删除真实响应 | 步骤 7：四操作全部 code=0，发布建出宽表 |
| 流程 CRUD 仅 Mock、编辑只能改名 | 真实创建/改名/删除 + 发布 | 步骤 9：PUT 改名 code=0、DELETE code=0、publish PUBLISHED+deploymentId |
| 发起流程未证明真实实例 | Flowable 实例 ID + RUNNING 落库 | 步骤 10：processInstanceId=db177c47-…，status=RUNNING |
| 审批无完整链路 | 待办→通过→APPROVED→发起人可查 | 步骤 11/12：待办出现→complete code=0→实例 APPROVED→发起人视角可查 |
| 设备控制未实现 | 命令发送 + 执行结果返回 | 步骤 13/14：审批自动生成 power_on（SUCCESS+result+approvalBizId）；手动下发与失败结果回写均成功 |
| 测试门禁不能替代行为验收 | 行为证据为真实 HTTP 请求/响应 | 本回执第 4 节 + behavior-evidence 全文 |

## 6. 遇到的问题（均已修复）

1. dev `spring-boot:run` 使用 .m2 旧 jar → 全量 `mvn install` 后重启解决。
2. dev 原生 H2 的 JSON 列读回被引号包裹导致表单发布失败 → 新增 H2 专用迁移 V41（JSON→CLOB），与测试所用 PG 模式语义对齐。
3. `MODE=PostgreSQL` 会破坏 Flowable H2 建表 → 不采用，改走 V41 迁移。
4. Flowable 部署无租户导致按租户发起 404 → deployModel 携带发布者 tenantId。
5. ApprovalTaskListener 的 resolverMap 被 Spring 按 bean 名装配 → `@Qualifier("approverResolverMap")`。
6. 表单蛇形列名与透传驼峰不一致 → putFirstNotBlank 兼容双命名。
7. 前端 live 测试（tool-production-menu-chain-live）要求真实后端预置 tooluser/角色2菜单 → 已在 dev 服务器补种该前置数据（用户 + 角色菜单 212/213），测试由失败转为通过。

## 7. 未完成内容 / 边界说明

- 审查记录 §六要求"设备控制还必须证明设备命令发送和执行结果返回"与方向 §四"设备控制为下一轮单独任务"存在表述张力；本轮按审查记录（最新裁决）实现了**最小模拟设备链**并已贯通证据（方向 §四明确允许"可重复验证的模拟设备"）。真实设备协议接入（MQTT 出站、多设备类型）仍留待设备专项方向。
- 流程可视化图编辑器（bpmn-js Modeler）仍未实现（上轮已声明的边界，审查记录未将其列为复验缺口）。

## 8. 风险与注意事项

- `deployModel` 租户跟随发布者：BpmDeployRunner（骨架预置流程，启动期无登录态）路径未受影响（不经过该方法）。
- 模拟设备执行器为同步 SUCCESS；真实设备需替换 simulateExecute 为 MQTT 出站适配器。
- dev Redis 依赖 localhost:6379、SW_CIPHER_KEY 环境变量，服务器重启需按 §3 命令启动。

## 9. 记忆更新草稿（自验通过·待规划验收，不构成最终判定）

- state.md：`minimal-business-closure` 状态 IN_PROGRESS→VERIFYING（待规划复核）；测试基线：后端 915→915（无新增用例，含迁移计数断言基线修正 39→41）、前端 1050→1050（无变化）
- decisions.md：D_TBD：最小设备控制链采用模拟设备同步执行 + IotDeviceFacade 跨模块契约；表单绑定在 publish 时自动落启用绑定
- issues.md：无新增（H2 JSON 列读回包装问题已由 V41 迁移关闭）
- features.md：无最终状态变更（验收权在规划）

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/minimal-business-closure/receipts/execution-receipt-20260828.md","evidence":["后端 mvn test 全量 BUILD SUCCESS 915/915","前端 typecheck 通过 + lint 0 errors + 1050/1050 通过","真实 HTTP 链路 37 步证据存档 behavior-evidence-20260828.md","流程发布 PUBLISHED 且表单提交生成真实 Flowable 实例 RUNNING","审批人待办出现并通过 complete 后实例 APPROVED 发起人可查","审批通过自动下发 power_on 设备命令 SUCCESS 且 approvalBizId=流程实例 ID","设备命令手动下发与执行结果回写链路真实贯通"],"feature_status":"VERIFYING"}
