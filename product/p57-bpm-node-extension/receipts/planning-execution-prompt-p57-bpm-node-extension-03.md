# P57 BPM Engine 统一流程节点扩展能力三级零裁量提示 03

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 触发原因：二级提示后R2、R6仍未闭环，且发现验证fixture进入生产源码  
> 当前功能状态：VERIFYING  
> 完成提交合法终态：EXECUTION_SUBMITTED  
> 无法取得Z1外部认证输入时合法功能状态：BLOCKED

## 1. 唯一权威输入

只读取以下规划输入：

1. `product/p57-bpm-node-extension/ready/direction-p57-bpm-node-extension.md`
2. `product/p57-bpm-node-extension/receipts/planning-review-p57-bpm-node-extension-04.md`
3. `product/p57-bpm-node-extension/receipts/planning-execution-prompt-p57-bpm-node-extension-03.md`
4. `product/p57-bpm-node-extension/receipts/execution-supplement-r1-r6-p57-bpm-node-extension-20260902.md`
5. `product/p57-bpm-node-extension/receipts/attachments/execution-output-r1-r6-20260902.txt`

其他审查、提示和回执只作历史，不得重新带入已锁定范围。

## 2. 唯一剩余证据包

### Z1：两个租户普通授权用户

固定身份：tenant `57001/57002`、role `57101/57102`、user `57201/57202`，每个角色只具有`workflow:def:view`。

唯一通过条件：

- 两个普通用户分别通过真实受支持认证链建立独立会话；
- 两次真实`GET /api/workflow/defs/node-capabilities`均为HTTP 200；
- 完整JSON逐字段一致，只包含系统节点能力，不包含租户业务数据；
- 证据绑定用户名、tenantId、权限、会话时间、HTTP状态和响应hash；
- 验证后按固定ID清理用户、角色和租户fixture。

禁止读取/伪造token或cookie，禁止绕过验证码，禁止新增临时认证入口或修改认证/权限语义。若缺少两个真实认证会话，本包必须写`BLOCKED_AUTH_SESSION`，不得提交第五次近似证据。

### Z2：验证资产不进入生产产物

必须处理并核对：

- `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/verification/`
- `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/P57EvidenceController.java`
- 所有`p57-evidence`、`p57-invalid-*`生产resources、自动配置入口和正式jar内条目。

唯一通过条件：

- 隔离节点、非法translator、证据控制器、fixture账户接口和验证profile仅存在于测试源集、测试fixture模块或明确排除在生产构建产物之外的验证源集；
- `jar tf sw-bootstrap/target/*.jar`及生产class目录扫描对`P57Evidence`、`P57_VERIFY`、`P57_INVALID`、`P57_MISSING`、`p57-evidence`、`p57-invalid-`全部零命中；
- 默认和正式生产配置零引用；
- 已锁定行为由测试资产继续覆盖，但不得重新生成浏览器证据。

### Z3：P57测试数据安全清理

固定对象至少包括：

- R1：`p57-r1-终态表单`、`p57_r1_终态表单`、`bpm_a15caf1b623e4a99`、业务记录`4cb3b929-990e-4298-ad10-f4e1c84e5c81`、实例`d84f4531-a728-11f1-a1dc-66ff24301f3c`；
- R5：formId`c5f280a7-6d7f-4952-94e7-38b9b14bc157`、formKey`p57_r5_approval_form`、processKey`bpm_3a464b11e3a448aa`、businessKey`ecbde6f8-ec53-43a3-aad8-12d3fcb29395`、instanceId`192f1c32-a73c-11f1-a1dc-66ff24301f3c`、taskId`192f916c-a73c-11f1-a1dc-66ff24301f3c`；
- 所有`p57-r2-`、`p57-r3-`、`p57-r4-`、`p57-r5-`fixture和临时代理/路由。

只允许两种清理方式：

1. 证明当前H2实例是P57专用、无非P57持久数据后，重启/重建该临时H2实例；或
2. 使用现有受支持产品接口精确删除固定P57对象。

若环境含非P57数据且产品接口不支持删除，禁止直接SQL级联、清库或新增生产删除后门，必须写`BLOCKED_SAFE_CLEANUP`。清理后对表单、流程定义、业务记录、实例、任务、Flowable部署/定义及固定前缀执行零残留查询。

### Z4：最终代码状态回归

只在Z2完成、Z3完成或合法阻塞后执行：

- Server根整体测试；
- P57聚焦测试；
- Web test、typecheck、lint、build；
- 两仓`git diff --check`；
- 生产jar/class/resources的Z2零命中扫描；
- P57临时文件、凭据、fixture接口、临时路由和测试数据残留扫描。

必须记录完整命令、工作目录、HEAD、原始输出附件、退出码、可复算报告数/测试数和最终diff文件清单。Z4不能替代Z1。

## 3. 已锁定通过项

E6、R1、R3、R4、R5已经通过。禁止重跑、重述或在新回执中复制它们的证据；新回执只允许一句“沿用规划验收04锁定结论”。

## 4. 允许修改文件

- 仅允许移动/删除生产源码中的P57验证fixture及修复相应测试引用；允许修改与这些测试资产直接关联的P57测试文件和构建配置。
- 不再允许修改统一节点契约、生产注册/翻译/校验业务逻辑、ProcessStartService、workflow正常/失败逻辑或APPROVAL业务语义。
- 只允许新增一份`execution-supplement-z1-z4-*.md`和一份对应原始附件。

## 5. 强制执行顺序

1. 先记录两仓HEAD、status和diff文件；完成Z2并构建正式jar，执行零命中扫描。
2. 判断H2是否P57专用，按Z3允许方式清理；不能安全清理则立即记录`BLOCKED_SAFE_CLEANUP`，禁止扩权。
3. 尝试Z1真实双会话；缺少用户完成验证码时记录`BLOCKED_AUTH_SESSION`，禁止再次用管理员或夹具替代。
4. 在最终文件状态执行Z4并保存原始附件。
5. 若Z1—Z4全为PASS，提交`VERIFYING / EXECUTION_SUBMITTED`回执供Planner验收；若Z1或Z3合法阻塞，提交`BLOCKED`回执并明确唯一解除条件。

## 6. 每包原始字段

每包必须逐项给出：`INPUT_IDS`、`COMMAND/ACTION`、`RAW_OUTPUT_PATH`、`HTTP_STATUS`（适用时）、`DB_BEFORE/AFTER/DELTA`（适用时）、`POSITIVE_ASSERT`、`ZERO_RESIDUE_ASSERT`、`EXIT_CODE`、`CLEANUP_RESULT`、`PACKAGE_STATUS`。

Z1额外给出两个普通用户的响应hash和逐字段diff；Z2额外给出jar/class/resources三类扫描；Z3额外给出环境专用性证明和各表零残留；Z4额外给出报告文件数及测试计数。

## 7. 全部为是门禁

| 检查项 | 完成回执必须为“是” |
|---|---|
| 两个租户普通授权用户分别真实认证，能力JSON逐字段一致 | 是 |
| 验证节点、非法translator、证据控制器和验证profile不进入生产jar/class/resources | 是 |
| P57测试对象按安全方式清理且所有相关表/前缀零残留 | 是 |
| 最终代码状态下Server/Web回归、diff-check和残留扫描全部通过 | 是 |
| 新回执没有重述E6/R1/R3/R4/R5 | 是 |
| 未修改认证、权限、P58、正式状态、P57核销或正式基线 | 是 |

若任一项不是“是”，禁止提交完成性回执；只能如实提交`BLOCKED`及唯一解除条件。
