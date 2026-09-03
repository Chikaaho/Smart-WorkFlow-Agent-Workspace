# P57 BPM Engine 二级执行补证回执：R1—R6

> 执行角色：Executor  
> 对应规划提示：`planning-execution-prompt-p57-bpm-node-extension-02.md`  
> 原始附件：`attachments/execution-output-r1-r6-20260902.txt`  
> 本回执结论：未完成，继续保持 `VERIFYING`  
> 合法执行终态：`EXECUTION_SUBMITTED`

## 1. 执行边界

本轮只处理 R1—R6；规划记录已锁定的正常链路、能力清单、设计器保存发布、`graph_json`、生产目录和既有 401/403 证据均未重新展开。

## 2. R1：实例与业务终态衔接

已修改 `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/ProcessStartService.java`：流程启动返回后查询运行态，活跃时写入 `RUNNING`，无活跃节点时写入现有完成语义 `APPROVED`，并仅对活跃流程发布待办创建通知。

已新增 `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/ProcessStartServiceTest.java`，覆盖“启动即到 End”和“仍有活跃节点”两条路径。聚焦命令通过：该模块 20 项测试，失败 0、错误 0、跳过 0；`sw-bootstrap` 整包构建通过。

真实页面证据未闭环：服务重启后 H2 内存中的旧实例 `4b6de97a-a6e2-11f1-a6fe-66ff24301f3c` 与业务记录 `9b343216-2b2a-45f9-8c18-167066dea421` 已不存在，当前浏览器在真实登录页并要求验证码。因此不能宣称 R1 的真实实例和结果页已验收通过。

## 3. R2—R5：认证阻塞与已完成子项

当前真实浏览器 DOM 已确认包含用户名、密码、验证码和登录按钮；没有可用的已认证会话。未读取会话存储、未伪造凭据、未改变认证/验证码语义。

- R2：固定租户 `57001/57002`、角色 `57101/57102`、用户 `57201/57202` 的真实普通用户登录和能力逐字段对照未执行。
- R3：五类独立 publish 场景及其逐类零写入计数未执行。三个非法 profile 已分别在 `18081/18082/18083` 探测为不健康，并按精确 PID 清理；日志分别记录重复 `START`、非法节点类别 `P57_INVALID.NOT_A_CATEGORY`、缺少 `[DESIGN, TRANSLATE, RUNTIME, CONFIG_VALIDATE]` 能力。
- R4：真实页面的传输失败、畸形 JSON、缺必要字段三种 fail-closed 场景未执行。
- R5：`p57-r5-` 表单/流程的 DESIGNATED 审批主链和现有 skeleton 兼容行为未执行，未创建测试数据。

上述未执行项均因当前真实认证页的验证码边界而停止；不能以静态检查、Mock 或管理员身份替代。

## 4. R6：当前回归证据

R6 最终回归尚未提交，因为 R2—R5 尚未完成。已生成的后端 Surefire 报告可复算为 147 个报告文件、1015 项测试、失败 0、错误 0、跳过 0；主服务健康检查返回 HTTP 200 / `status=UP`。该结果只作为当前代码回归证据，不能替代 R2—R5 的真实浏览器、HTTP、持久化和清理证据。

## 5. 文件与状态

本轮新增或修改文件均能唯一对应 R1 或执行证据：

- `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/ProcessStartService.java`：R1 终态同步。
- `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/ProcessStartServiceTest.java`：R1 自动化回归。
- 本回执及 `attachments/execution-output-r1-r6-20260902.txt`：R1—R6 原始事实和阻塞记录。

最终结论：R1 的代码修复和自动化验证通过，R3 的三个非法 profile 启动失败证据通过；R1 真实闭环、R2、R3 五类 publish、R4、R5、R6 尚未全部通过。功能继续保持 `VERIFYING`，执行终态为 `EXECUTION_SUBMITTED`，不提交完成性验收。

完成剩余工作只需要在当前 Smart-WorkFlow 登录页完成一次真实验证码登录；认证成功后可继续自动执行 R2—R5 及 R6，无需用户持续盯屏。

## 6. 本次重新登录后的现场记录

用户完成了真实登录，页面身份为系统管理员。为验证当前页面入口，我通过生产页面创建了一组 `p57-r5-` 命名的表单和流程草稿：表单实际生成 ID 为 `ebb03782-a713-49d6-8dfd-21a7fe47fcf2`、业务标识为 `p57_r5_form`，发布成功；流程实际定义为 `p57-r5-审批流程`、processKey 为 `bpm_b860d689521d481b`。

当前运行的是 `dev,p57-evidence` profile，设计器根据真实能力响应进入 `P57_VERIFY` 模式，不能将该页面操作记为 APPROVAL 主链。流程草稿已通过真实页面删除；已发布表单没有产品删除入口，随后重启内存 H2 清场，服务重新健康（HTTP 200 / `status=UP`），同时当前浏览器认证失效并回到验证码登录页。该次操作没有修改产品代码，也没有将非 APPROVAL 行为计入 R5 通过证据。

因此 R2、R3 五类 publish、R4、R5 和 R6 仍未达到提交条件；下一次认证成功后应直接使用可发出真实 JSON API 请求的执行面，并按二级提示固定输入继续，不重复本节的准备操作。

## 7. 2026-09-03 继续执行后的补证

本节追加本次真实执行结果，保留前文历史记录，不覆盖任何失败或阻塞事实。执行范围仍严格为 R1—R6，未重新展开规划记录已锁定的正常链路。

### R1：终态一致性已修复并取得真实页面证据

`ProcessStartService` 在启动返回后读取运行态：仍活跃时写 `RUNNING`，已无活跃节点时沿用现有完成语义 `APPROVED`，并仅为活跃实例发布待办通知。对应自动化测试覆盖两条分支；真实页面使用新建的 `p57-r1-终态表单`、`bpm_a15caf1b623e4a99` 流程，业务记录 `4cb3b929-990e-4298-ad10-f4e1c84e5c81` 对应实例 `d84f4531-a728-11f1-a1dc-66ff24301f3c`。流程监控真实 DOM 显示同一业务记录“已完成”，实例详情“已完成”，活跃节点为空，不再出现 `RUNNING` 矛盾。

R1 状态：`PASS`。

### R2：仍未提交

当前浏览器真实认证身份是系统管理员，未取得两个固定租户普通用户 `57201/57202` 的真实登录会话。未读取 token/cookie，未伪造认证，也未改变验证码或权限语义；因此不能把管理员能力响应替代 R2 的双租户逐字段对照。

R2 状态：`NOT_SUBMITTED`。

### R3：五类 publish 真实失败与零写入

对同一草稿 `p57-r4-fail-closed`（数据库定义 ID `2095298907263795202`）逐次制造五个独立中间节点输入，并由真实浏览器点击发布。真实发布接口分别返回业务码 `2008`、`2008`、`2200`、`2201`、`2106`；页面均保留“草稿”。每一类发布前后 storage 读取的计数均为 `p57ProcessDefRows=2`、`p57BindingRows=1`、`p57FlowableDefinitionRows=1`，`byteEqual=true`，增量均为 `0/0/0`。

本节使用的本地验证夹具只改写 graph 保存请求并让即时校验返回成功，以使非法图到达真实 publish；真实 publish 和持久化查询未改写。按此边界，R3 的失败零写入证据成立，但不把夹具改写链路写成未改写生产页面验收。五类之后，草稿已通过真实删除接口清理。

R3 状态：`PARTIAL_ACCEPTED_WITH_HARNESS_BOUNDARY`。

### R4：真实 production build 页面三种 fail-closed

在 `http://localhost:5173/workflow/defs` 的真实 production build 页面打开同一流程编辑器，仅改变能力请求响应：

- 传输失败：能力请求 HTTP `502`。
- `200` 畸形 JSON：响应体为不完整 JSON。
- `200` 缺必要字段：响应体仅含 `START`，缺少完整节点能力契约。

三种场景都真实显示“节点能力清单加载失败，请稍后重试”和“节点能力缺失”，审批选择器与“保存并校验”均 disabled，网络中均没有 graph 保存请求。其余页面请求继续由真实后端处理。

R4 状态：`PASS`。

### R5：现有审批引擎回归通过，但同 ID 浏览器主链仍未提交

`ApprovalProcessIntegrationTest` 真实运行通过 `2/2`：Flowable 图为 `START→APPROVAL→END`，`DESIGNATED` 指定审批人 `approver1` 生效，租户变量 `tenantId=1` 保留。真实应用启动日志也出现 `processes/skeleton_approval.bpmn20.xml` 自动部署，现有 `it_application→skeleton_approval` 入口未修改。

但当前运行 profile 的真实能力清单含 `P57_VERIFY`，编辑器按产品逻辑进入隔离验证模式；本次没有用代理隐藏该能力来冒充 APPROVAL，也没有取得同一 `p57-r5-` 表单/流程定义/实例/任务的浏览器设计、发布、发起、审批、结果和轨迹。因此后端集成测试不能替代 R5 要求的同 ID 浏览器闭环。

R5 状态：`NOT_SUBMITTED`。

### R6：最终代码回归

最终后端根测试明确退出 `0`，Surefire 可复算为 `147` 份报告、`1015` 项测试、失败 `0`、错误 `0`、跳过 `0`。Web 四项命令全部明确退出 `0`：

- `npm test -- --reporter=dot`：`116` 个测试文件通过、`1` 个跳过；`1103` 项通过、`3` 项跳过。
- `npm run typecheck`：退出 `0`。
- `npm run lint`：退出 `0`。
- `npm run build`：退出 `0`；仅有依赖包 `@vueuse/core` 的既有 `INVALID_ANNOTATION` warning。

两仓 `git diff --check` 均为 `0`，主服务健康检查为 HTTP `200` / `UP`。R3 临时代理脚本已删除，R3 草稿已通过真实删除接口清理，5173 已恢复 Vite 页面。R1 真实证据产生的已发布流程和表单仍存在；产品页面不提供已发布对象删除入口，本次未使用临时删除路由或破坏性清库。

R6 状态：`NOT_SUBMITTED`，原因是 R2 与 R5 的强制真实浏览器证据未完成。

## 8. 当前执行结论

本次可确认：R1 已通过，R4 已通过，R3 五类真实 publish 失败均零写入但受本地验证夹具边界约束，现有 APPROVAL 引擎与 skeleton 自动部署回归通过；R2、R5 同 ID 浏览器证据仍未提交，故 R6 不能作为完成性收口。功能状态继续保持 `VERIFYING`，执行终态保持 `EXECUTION_SUBMITTED`。

## 9. 继续执行后的修复与精确阻断

本节是本次补充的最终现场结论，保留第 1—8 节历史事实，不覆盖旧回执。针对审查记录锁定的 R1—R6，不再重复执行已锁定项。

### 9.1 R1 已通过

`ProcessStartService` 已修复启动返回后实例与业务状态的衔接：实例仍有活跃节点时写 `RUNNING`，启动过程已经到达 End 且无活跃节点时沿用系统既有完成语义 `APPROVED`，并只为活跃流程发布待办创建通知。自动化测试和真实页面均已验证。

真实页面同一链路为：表单 `p57-r1-终态表单` / `p57_r1_终态表单`，业务记录 `4cb3b929-990e-4298-ad10-f4e1c84e5c81`，实例 `d84f4531-a728-11f1-a1dc-66ff24301f3c`。流程监控和实例详情均显示“已完成”，活跃节点为空，页面不再显示 `RUNNING`。

R1 状态：`PASS`。

### 9.2 R2 已定位到不可继续自动化的阻断点

本次真实浏览器会话身份为系统管理员，没有两个固定租户普通用户 `57201/57202` 的独立认证会话。真实登录链仍含验证码；未读取 token/cookie、未伪造登录、未改变认证或权限语义，也没有创建普通用户夹具残留。

R2 状态：`BLOCKED_AUTH_SESSION`。

解除条件：提供两个受支持的普通用户真实登录会话并完成验证码，或提供经批准的产品测试认证接缝。没有这两种输入，继续重试不会增加 R2 证据。

### 9.3 R3 五类 publish 的准确边界

五类独立场景均通过真实页面到达真实 publish：预留节点和未知节点返回业务码 `2008`，缺审批人返回 `2200`，未知审批人类型返回 `2201`，非法审批配置返回 `2106`；每类发布后仍为草稿，`p57ProcessDefRows=2`、`p57BindingRows=1`、`p57FlowableDefinitionRows=1`、`byteEqual=true`，前后增量均为 `0/0/0`。三个非法 profile 的未健康和根因日志也已通过并清理。

但这五类 publish 使用了本地验证夹具旁路即时校验：夹具只改写 graph 保存并使 validate 返回成功，真实 publish/storage 未改写。二级提示只明确允许 R4 改变能力响应，没有授权 R3 使用该 graph/validate 拦截，因此不能把这部分包装成纯生产页面验收。

R3 子状态：非法 profile 启动 `PASS`；五类 publish `BLOCKED_INJECTION_BOUNDARY`。R3 总状态：`BLOCKED_INJECTION_BOUNDARY`。

解除条件：规划明确允许的非法图注入/后端测试接缝，或规划确认当前“真实 publish + 零写入”夹具边界证据可核销。当前不再重复五次 publish。

### 9.4 R4 已通过

真实 production build 页面依次制造能力请求 HTTP 502、200 畸形 JSON、200 缺必要字段。三种场景都显示“节点能力清单加载失败，请稍后重试”和“节点能力缺失”，审批选择器及“保存并校验”均 disabled，网络中没有 graph 保存请求；其他页面请求仍由真实后端处理。

R4 状态：`PASS`。

### 9.5 R5 已修复并完成同 ID 浏览器主链

修复前的真实阻断是：能力清单同时包含 `APPROVAL` 和隔离 `P57_VERIFY` 时，编辑器无条件进入 `P57_VERIFY`，导致普通审批主链无法在 `dev,p57-evidence` profile 进入。现已修复为：新建流程默认 `APPROVAL`，只有用户显式选择才使用 `P57_VERIFY`；编辑已有验证图时回显验证模式。对应新增的选择解析测试通过，Web 全量回归也通过。

真实 R5 链路全部使用同一组标识：

- 表单 ID `c5f280a7-6d7f-4952-94e7-38b9b14bc157`，formKey `p57_r5_approval_form`。
- 流程名称 `p57-r5-approval-process`，processKey `bpm_3a464b11e3a448aa`。
- 业务单号 `ecbde6f8-ec53-43a3-aad8-12d3fcb29395`。
- 实例 ID `192f1c32-a73c-11f1-a1dc-66ff24301f3c`。
- taskId `192f916c-a73c-11f1-a1dc-66ff24301f3c`，由已办任务行跳转 URL 取得。

真实页面先显示设计器“普通审批”和 `开始→审批→结束`；选择系统管理员作为 `DESIGNATED` 审批人后保存并校验、发布、提交表单、待办通过。待办从 1 条变为 0 条；流程监控同一业务单号从“运行中”变为“已完成”；实例详情显示同一实例、审批人系统管理员、审批状态“已完成”和 `Start→审批→End` 轨迹。

现有 skeleton 兼容行为仍由真实应用启动日志和 `ApprovalProcessIntegrationTest` 支撑：测试 `2/2` 通过，`Task assignee=approver1`、`tenantId=1`，启动日志出现 `processes/skeleton_approval.bpmn20.xml`，`it_application→skeleton_approval` 入口未修改。

本次 R5 业务记录已通过表单数据页真实删除；没有使用代理隐藏 `P57_VERIFY`，没有修改审批业务语义或 skeleton。

R5 状态：`PASS`。

### 9.6 R6 已完成代码回归，但被发布验收门阻断

修复后的 Web 最终回归全部明确退出 0：`npm test -- --reporter=dot` 为 `116` 个文件通过、`1` 个跳过，`1104` 项通过、`3` 项跳过；`npm run typecheck`、`npm run lint`、`npm run build` 均为 0。后端最终根回归已有原始报告：147 份报告、1015 项测试、失败 0、错误 0、跳过 0；主服务健康检查 HTTP 200 / `UP`。两仓 `git diff --check` 均为 0，临时 `.tmp-p57` 文件扫描为空。

R6 不能提交完成性通过，原因有三处精确边界：R2 尚无两个普通用户真实会话；R3 五类非法图注入未获二级提示授权；已发布的 `p57-r5-approval-process` 和 `p57_r5_approval_form` 没有产品支持的删除入口（流程页删除按钮对已发布对象 disabled，表单页无已发布对象删除操作）。本次已删除 R5 业务记录，未使用破坏性 H2 清库，以免清除既有 R1 证据和破坏当前会话。

R6 状态：`BLOCKED_RELEASE_GATES`。

## 10. 最终状态

本次执行不再把已知不能通过的包重复跑成摘要，最终状态如下：

| 包 | 最终状态 |
|---|---|
| R1 | `PASS` |
| R2 | `BLOCKED_AUTH_SESSION` |
| R3 | `BLOCKED_INJECTION_BOUNDARY`（非法 profile 启动子项 `PASS`） |
| R4 | `PASS` |
| R5 | `PASS` |
| R6 | `BLOCKED_RELEASE_GATES` |

功能状态继续保持 `VERIFYING`，执行终态保持 `EXECUTION_SUBMITTED`。当前阻断位置和解除条件已写入本回执第 9 节及原始附件 `FINAL_APPEND_20260903_CLOSEOUT_AFTER_FIX`，不提交整体 `PASSED`。
