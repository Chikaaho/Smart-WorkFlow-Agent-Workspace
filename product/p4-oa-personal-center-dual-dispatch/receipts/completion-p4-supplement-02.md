# P4 个人中心双通道补证回执 02

日期：2026-09-05（Asia/Shanghai）
角色：执行（Executor）
等级：XL
功能状态：VERIFYING（自验完成，待 Planner 独立复验）
承接：`receipts/planning-review-p4-02.md`、`receipts/planning-execution-prompt-p4-01.md`
最新范围：`receipts/planning-business-correction-p4-01.md`、`ready/flow-platform-capability-boundary.md`、`ready/direction-p4-oa-personal-center-dual-dispatch.md`

本回执是追加文件，不覆盖历史回执。执行口径已切换为：普通用户从已发布表单发起，服务端解析唯一合法发布绑定；本轮不建设流程中心分类、双视角页面或完整编排，保留并复用流程中台能力与接口契约。

## 1. 本轮执行结论

已完成方向纠偏及工程实现：

- 用户发起路径移除流程候选加载、流程选择 UI、流程 query/payload 入口；草稿只承接已发布表单，绑定由服务端解析并写入快照。
- 表单高级属性增加可见范围持久化与管理入口；空范围表示当前租户内全部，非空按用户命中；列表、定义读取、草稿保存与提交均走服务端权限判断。
- 保留流程定义、关联流程、表单定义、草稿/待办/我发起/已办、审批动作及现有 API；新增持久命令受理、普通异步通道、P0 独立优先通道和消费侧身份/权限复核。
- 修复已证实的受理事务可见性、payload 双重序列化、表单可见范围清空不落库、P0 消费侧权限以及迁移链断言问题。
- 用真实本地业务对象补证会签 `ANY`、指定历史节点退回、持久队列重启恢复、P0 正反权限与普通用户浏览器发起链。

未做且未冒称完成：线上式“入队后实时撤 P0 权限”窗口实验；独立消费者在同一实例上同时提交 NORMAL/P0 的竞态实验；正式环境/外部 Broker/真实设备验证；流程中心建设。

## 2. 读取、修改与证据位置

### 2.1 入口与方向

已读取：

- `system.md`
- `roles/executor.md`
- `product/p4-oa-personal-center-dual-dispatch/receipts/planning-review-p4-02.md`
- `product/p4-oa-personal-center-dual-dispatch/receipts/planning-execution-prompt-p4-01.md`
- `product/p4-oa-personal-center-dual-dispatch/receipts/planning-business-correction-p4-01.md`
- `product/p4-oa-personal-center-dual-dispatch/ready/direction-p4-oa-personal-center-dual-dispatch.md`
- `product/p4-oa-personal-center-dual-dispatch/ready/flow-platform-capability-boundary.md`

### 2.2 代码仓库改动范围

前端 `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web`：

- `src/modules/workflow/views/MyDrafts.vue` 及测试：改为已发布表单发起、服务端解析流程、真实草稿路径。
- `src/modules/form/views/FormRender.vue` 及测试：移除用户选流程参数，补齐草稿/提交/必填校验和回跳路径。
- `src/contracts/bpm.ts`、`src/modules/workflow/api/index.ts`、`src/modules/form/api/form-def.ts`：对齐草稿、命令、可见范围接口契约。
- `src/modules/form/views/FormDefList.vue` 及相关 mock/API 测试：增加管理端可见范围配置。
- `TaskDetail.vue`、`TodoList.vue`、`MyInstances.vue`、`MyProcessed.vue` 及对应测试：对齐个人审批入口和命令结果呈现。

后端 `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server`：

- 表单 API/服务/实体/迁移：`FormDefDTO`、`FormDefEntity`、`FormDefinitionController/Service`、`FormDataQueryService`、`FormDataUpdateService`、`FormSubmitService`、V54 可见范围迁移。
- BPM 命令与草稿：`BpmDraftController`、`DraftSubmitService`、`BpmCommandController`、`CommandAcceptService`、`BpmCommandService`、`BpmDraftService`、命令实体/Mapper/DTO。
- 统一执行链：`BpmCommandQueue`、`PersistentBpmCommandQueue`、`CommandDispatcher`、`DraftSubmitCommandHandler`、`FlowStartCommandHandler`、`TaskActionCommandHandler`、`TaskActionService`、`FlowStartPortImpl`。
- 菜单/权限与测试：V51 P0 权限迁移、V53 个人入口菜单迁移、表单/BPM/迁移/队列/控制器测试及受影响测试替身。
- 删除旧的表单提交事件监听路径，避免与持久命令路径重复启动；保留表单到流程的中台 facade/port 契约。

两仓均保留工作区既有未提交变更；本轮没有执行 `git commit`、`git push`、远程发布或生产操作。

## 3. 原子账本对照

证据强度说明：`真实` 表示本地服务真实 HTTP/DOM/持久化读回；`集成` 表示隔离 H2 与真实迁移/调度器；`测试` 只作为契约或未宣称真实场景的补充。下表是执行自验状态，不是 Planner 的正式 PASSED。

| 原子 | 当前自验结果 | 正向证据 | 反向断言/边界 |
|---|---|---|---|
| G1a | 部分覆盖，待独立复验 | 普通测试身份从已发布表单进入真实填报，保存、刷新恢复、提交后同一草稿/命令/实例可回查；浏览器对象见 `current-api-browser-20260905.md` | 本轮未把旧 admin 场景当普通用户证据；四入口全部生命周期仍需 Planner 按对象复核 |
| G1b | 自验通过 | 可见范围 restrict → business 列表命中、dispatcher 列表为空、按 key 返回无权/不存在语义；恢复空范围后 dispatcher 再次命中；管理端回读范围为 null | 未触达生产/跨租户真实库；原草稿撤权保留的完整浏览器链未重新宣称 |
| G1c | 实现完成，行为待复验 | 管理入口、表单-流程绑定与发布解析已实现；普通管理请求走权限守卫；接口/实现定位见 §4 | 未单独进行普通身份编辑请求的本轮实时反向录制；历史实例绑定不改写依赖代码和测试复核 |
| G2a | 部分覆盖，待复验 | 真实控件空值提交得到“请完善必填项后再提交”，草稿保持 EDITING、`commandId=null`、内容保留；正常填报由系统回填 `processDefKey` | 本轮未把旧“用户选流程”失效恢复演示继续沿用；新版确认/版本失效的完整 DOM 场景待独立复验 |
| G3a | 自验通过 | `p4_oa_consensus_20260905` 会签 `ANY`：两个活动任务，dispatcher 完成后实例 `APPROVED`、progress 空；business 重放返回业务 `404 任务不存在`，仅 dispatcher 有 ACTION | 使用隔离本地夹具，不代表历史生产数据；已办理者未被冒充为被取消者 |
| G3b | 自验通过 | `p4_oa_return_20260905`：a2 真实 RETURN 到 a1，返回 `code=0`，实例保持 `RUNNING`，重新生成 dispatcher 的 a1 待办，a1/a2 历史均可查 | 仅验证可构造的新隔离流程，未冒称旧历史库兼容 |
| G4a | 自验通过 | 文件 H2 进程 1 停止前命令 `PENDING` 且无实例；同库进程 2 重启后原 command `COMPLETED`、结果 record 可回查；完成待办后实例 `APPROVED`、progress/todo 均空 | 端口 18082/18083 为本地隔离服务；进程已停止，临时文件库未作为生产数据处理 |
| G4b | 部分覆盖，待复验 | 持久队列契约/竞争领取/P0 优先集成测试已通过，统一 `TaskActionService` 复用代码已核对 | 尚未用独立消费者对同一实例实时并发 NORMAL/P0；不以单 JVM 锁或不同空 payload 命令替代 |
| G5a | 自验通过 | dispatcher P0 发起草稿提交命令真实 `COMPLETED`，可回查 result/instance/todo；浏览器普通通道同样真实提交成功；目标测试覆盖事务提交先于消费 | P0 返回人工节点当前进度，不宣称等待整条人工流程或外部副作用完成 |
| G6a | 自验通过 | `GET /api/auth/me` 读回 business 仅业务权限、dispatcher 额外具备 `workflow:p0:dispatch`；迁移链实际执行 V51/V53 | admin 的 superAdmin 只作平台既有语义，不能代替显式 P0 授权证明 |
| G6b | 部分覆盖，待复验 | business 真实 P0 请求 HTTP 403 且草稿无 command；消费侧撤权由 `p0ShouldRejectWhenPermissionRevokedAfterAccept` 覆盖 | 未宣称真实“已受理后暂停消费者→撤权→恢复消费”窗口实验；因此不把 G6b 写成完整关闭 |
| G7a | 自验通过 | `BpmCommandQueueContractTest`、`PersistentBpmCommandQueueContractTest`、`CommandQueueIntegrationTest` 与 dispatcher 测试通过；默认 Spring 路径注入持久队列接口 | 替代 InMemory 仅作契约实现，不冒称外部 MQ |
| G8a | 自验完成，待 Planner 核对 | 代码范围、运行配置、回退边界、契约映射与新增证据已落盘；源仓状态保留未提交事实 | 本轮不生成 Git 提交指纹；未授权提交不被伪装为候选发布 |
| G8b | 自验通过 | 前端四门禁原始输出和最终复跑结果见 `current-verification-20260905.md` | 构建仅有 `@vueuse/core` Rolldown 警告，不计源码失败 |

## 4. 中台能力与接口契约映射（G8a）

| 能力 | 本轮复用/实现接口 | 权限与稳定标识 | 本轮状态 |
|---|---|---|---|
| 已发布表单可发起目录 | 前端 `form-def` published 查询；后端表单定义查询 | 服务端按 user/tenant 与 `visibilityScope` 过滤；`formKey`/`formVersion` 为稳定关联标识 | 已实现入口 |
| 填报上下文 | `FormDefinitionService`、`FormDataSubmitFacade`、`FlowStartPort` | 服务端解析唯一 active published binding；草稿保存 `formVersion` 与 `processDefKey` 快照 | 已实现 |
| 表单与流程管理 | `FormDefinitionController`、既有流程定义/关联流程 API、发布绑定逻辑 | 管理权限独立于普通发起范围；流程标识由服务端绑定 | 已实现必要管理能力；完整流程中心不在本轮 |
| 个人草稿 | `BpmDraftController`、`BpmDraftService`、`DraftSubmitService` | 本人/租户约束；保存不进审批；提交冻结并按 commandId 回查 | 已实现 |
| 发起与命令结果 | `/workflow/drafts/{id}/submit`、`/workflow/commands/{id}`、NORMAL/P0 command accept | commandId、commandKey、channel、status、result、instance/task 可关联；幂等由持久键保证 | 已实现 |
| 个人实例/待办/已办 | `BpmMyInstanceController`、`BpmTodoController`、`BpmMyProcessedController` | 个人记录、任务权限与动作审计独立判断；会签取消任务不增加本人 ACTION | 已实现必要个人入口 |
| 分类目录、双视角流程中心 | 仅保留方向契约，不新增空接口或空页面 | 后续仍需普通/管理视角分别过滤，分类不授予权限 | 仅规划，明确不在本轮 |

## 5. 实际验证命令与结果

后端目标测试：

```text
MAVEN_OPTS='-Xmx2g' mvn -q -pl sw-biz/sw-bpm/sw-bpm-process,sw-biz/sw-biz-form/sw-biz-form-biz -am -Dtest='FormDefinitionServiceTest,FormDefinitionControllerAuthorizationTest,CommandDispatcherTest,CommandDispatcherP0PriorityTest,BpmCommandQueueContractTest,PersistentBpmCommandQueueContractTest,CommandQueueIntegrationTest' -Dsurefire.failIfNoSpecifiedTests=false test
exit 0
```

迁移链目标测试：

```text
MAVEN_OPTS='-Xmx2g' mvn -q -pl sw-bootstrap -am -Dtest=FlywayFullChainH2Test,FlywayFullChainPostgresTest -Dsurefire.failIfNoSpecifiedTests=false test
exit 0
H2=54 migrations; PostgreSQL compatibility fixture=53 migrations
```

后端全量：

```text
MAVEN_OPTS='-Xmx2g' mvn -q test
exit 0
Surefire report scan: REPORT_FILES=169; NO_FAILURE_OR_ERROR_COUNTS
```

前端最终门禁：

```text
NODE_OPTIONS='--max-old-space-size=2048' pnpm typecheck  -> exit 0
NODE_OPTIONS='--max-old-space-size=2048' pnpm lint       -> exit 0
NODE_OPTIONS='--max-old-space-size=2048' pnpm test -- --run
  Test Files 121 passed | 1 skipped (122)
  Tests 1153 passed | 3 skipped (1156)
NODE_OPTIONS='--max-old-space-size=2048' pnpm build      -> exit 0
  1840 modules transformed; built in 14.15s
```

收口检查：三个仓库的 `git diff --check` 已无输出；验证资产及源仓状态均未通过 Git 提交固化，符合本次“不得自行提交/推送”的权限边界。

完整命令、构建及范围说明见：

- `Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/03/current-verification-20260905.md`
- `Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/03/current-api-browser-20260905.md`
- `Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/03/live-business-20260905.md`

## 6. 问题、风险与回退边界

- 本轮前端/后端均存在此前会话留下的未提交变更，已保留；不能以当前 `HEAD` 作为完整实现指纹。
- P0 与普通通道共享业务校验、任务权限、动作审计和实例顺序；P0 只改变调度优先级与等待方式，不等待人工流程终态。
- 受理中的 `sw_bpm_command`/`sw_bpm_draft` 不能直接回退到不识别对应表结构的旧消费者；停止调度器后需通过同库重启恢复，不能删除受理记录制造“清理完成”。
- 真实业务证据均为本地 loopback/H2/隔离身份；不覆盖外部 Broker、生产流量、通知/设备副作用或历史生产数据。
- G1a、G1c、G2a、G4b、G6b 留有明确复验边界，回执未把它们写成完整通过；是否接受替代强度由 Planner 按当前原子账本独立裁决。

## 7. Executor 自验结论

本轮已完成授权内的方向纠偏、实现、受影响回归、真实本地行为采集和追加回执；自验结论为：`VERIFYING`，等待 Planner 对每个原子及证据强度独立验收。Executor 不写 `PASSED`、`COMPLETED`，不核销 P4，不更新正式功能计数和阶段三终态。
