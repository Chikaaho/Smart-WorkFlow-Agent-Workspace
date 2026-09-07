# v0.0.2 OA 完善 — 执行回执 01（自验通过，待规划验收）

2026-09-07；执行角色。方向：`product/v0.0.2-oa/ready/direction-v0.0.2-oa.md`（L 级，READY）。本回执对应完成回执 `completion-v0.0.2-oa-01.md`，逐项对照 A1—A7 提交行为证据、工程验证与剩余边界；A8（README/发布收口）按方向 §6.7 待功能收口确认后执行。**功能状态自验为实现+验证完成（VERIFYING 待审），不自行判定 PASSED/COMPLETED，不核销 P 编号。**

## 1. 交付概览

七个交付段全部实现（第 7 段 README/发布按方向顺序留待收口阶段）：

| 段 | 范围 | 交付 |
|---|---|---|
| 1 | P55 前后台分层 | 前台/后台页面归属清单（`Web/src/foundation/area.ts`）、守卫后台准入（非服务端认可管理员深链→/403）、侧边栏按区域过滤、顶栏「进入后台/返回前台」、三类身份统一落地 `/workspace` |
| 2 | P4 流程中心 | 单层分类 CRUD+受约束删除、事项目录普通/管理双视角、服务端解析绑定、分类/搜索不泄漏不可见事项（`sw_bpm_category`、`BpmCatalogService`、`ProcessCatalog.vue`、`ProcessCatalogAdmin.vue`） |
| 3 | P4 个人办理 | 抄送我的（本人过滤/去重/时间检索/稳定分页/只读详情贯通表单快照+进度+意见）、催办（发起人/活动任务/10 分钟冷却/实例结束拒绝/记录留痕/`FOR UPDATE` 串行化+唯一键兜底） |
| 4 | P54 工作台 | 四组件（待办/我发起的/抄送/常用事项）、显隐/排序/常用事项选择、租户+用户独立持久化、默认布局回落、恢复默认（`sys_user_workspace`、`WorkspaceHome.vue`） |
| 5 | P2 表单子集 | MULTISELECT/ATTACHMENT/IMAGE/LABEL 四控件（前后端）、静态默认值（仅新建无值应用）、显隐联动（EQ/NE/EMPTY/NOT_EMPTY×ALL/ANY、无环校验、**服务端复算过滤隐藏载荷**、草稿保留原输入）、附件走 storage 且下载按对象权限（`WorkflowAttachmentController`） |
| 6 | P3 通知闭环 | 发送记录分页/筛选、单条关联尝试流水（`sw_notify_send_attempt`）、失败重发（仅 FAILED、`FAILED→RESENDING` 条件更新并发单受理）、权限串 `notify:record:view/resend` |
| 7 | README/版本 | 未动（按 Owner 顺序待功能收口后统一执行） |

## 2. A1—A7 逐项行为证据

证据文件：`receipts/evidence/api-evidence-*.txt`（真实 API 调用留档）+ `ui-*.png`（真实浏览器截图，5174 dev + SW_DEBUG_AUTH_ENABLED 调试身份）。后端 dev profile（H2）真实起服。

- **A1 前后台（达标）**：employee002/test_1 双真实身份。`GET /workflow/categories`（employee）→403「无权限」；`GET /notify/records`（employee）→403；普通目录仅返回可见事项（`names=[v0.0.2请假审批V2]`），admin 同接口含受限事项（`[受限审批, 请假审批V2]`）——泄漏反向排除成立。浏览器：admin 登录落地 `/workspace`、顶栏「进入后台」、后台侧栏切后台菜单组+「返回前台」（ui-workspace/ui-catalog-admin.png）。
- **A2 流程中心（达标）**：分类创建/归属调整/受约束删除全真实调用（删除有归属分类→400「分类下仍有 1 个事项，须先解除归属再删除」）；目录/数量/搜索经服务端可见性过滤（受限事项对 employee 零泄漏）；选择事项进关联表单（UI 流程中心卡片→去填报）。分类删除约束、普通/管理双视角证据见 `api-evidence-final.txt`。
- **A3 抄送与催办（达标）**：真实链（V4 流程 START→APPROVAL(用户1)→COPY(员工)→END）：提交→RUNNING；urge#1→`ACCEPTED 已通知待办人:[1]`；urge#2→`COOLDOWN 约599秒`；非发起人→403；审批通过后 COPY 真实产生抄送（employee copies total=1），本人详情贯通 formData（历史变量快照）+进度+意见；他人查抄送→403；结束实例 urge→`REJECTED 实例已结束`。见 `api-evidence-urge-copy.txt`、`api-evidence-copy-resend.txt`。
- **A4 工作台（达标）**：admin 保存布局→`custom:true`；employee 同接口→默认 `custom:false`（两用户独立）；恢复默认后→`custom:false`；无权限组件不查询、失效事项不渲染为入口（`WorkspaceHome` 收敛逻辑+ui-workspace.png）。
- **A5 表单（达标）**：发布含四新控件+默认值+规则的表单；隐藏场景（tags=年假）提交载荷中的 proof 被**服务端过滤**（读回 `proof:null`），reason 空值应用默认值「年假」；可见场景（tags=出差）proof 保留（JSON 持久化）；浏览器实测选择「出差」后「证明材料」实时出现（ui-form-linkage.png）、默认值回填（ui-form-render.png）；LABEL 无物理列；旧表单（无规则）回归由既有测试承担。
- **A6 通知（达标）**：批量发送（recipientCount=1）+记录查询；FEISHU（无适配器）→FAILED（failureReason 留存）；重发→仍 FAILED 且尝试流水增至 2 条（原始失败+重发尝试同留）；employee 重发→403。并发单受理由条件更新（FAILED→RESENDING）保证 + `NotifyRecordServiceTest` 单测。
- **A7 整体兼容（达标）**：同一 v002_leave 表单从目录→填报→发起（flowStart 命令异步真实启动）→审批→抄送→催办→通知记录全链真实对象贯通（见 `api-evidence-final.txt`/`api-evidence-urge-copy.txt`）；历史绑定/草稿/普通异步与 P0 回查路径未改动核心语义，回归由全量后端测试（1145 项 0 失败）覆盖；既有主链（低代码表单 8 类控件、审批意见、退回）未改动行为。

## 3. 工程验证（门禁原始结果）

- **后端**（`MAVEN_OPTS="-Xmx2g"`）：全仓 `mvn test` 退出码 0；Surefire **178 份报告 / 1145 tests / 0 failures / 0 errors / 0 skipped**（基线 174/1128 之上净增：FormVisibilityRulesTest 7、BpmUrgeServiceTest 4、BpmCategoryServiceTest 4、NotifyRecordServiceTest 2；迁移全链测试计数基线同步更新为 H2 58/PG 57）。`sw-bootstrap` 链测试单独复跑 42/0/0/0。
- **前端**（`NODE_OPTIONS="--max-old-space-size=2048"` 四连全绿）：typecheck ✓、lint ✓（0 error）、test **123 files passed+1 skipped / 1164 tests passed+3 skipped**、build ✓。新增 `visibility-rules.spec`（4）、`area.spec`（7）；更新 8 个断言旧行为的既有用例（守卫后台准入、落地工作台、12 类型注册表、mock 菜单夹具幂等 id），断言强度只对齐新语义未弱化。
- **迁移**：V56（bpm：分类表+事项归属列+催办记录表）、V57（notify：发送尝试流水）、V58（root：sys_user_workspace+菜单/权限种子 320—325），H2/PG 双份，全链迁移测试通过。

## 4. 执行中发现并修复的真实缺陷

1. **LABEL 字段在发布/查询/更新/子表路径漏豁免**（列名映射抛异常导致含 LABEL 表单发布 500）——四处调用点补齐豁免。
2. **工作台恢复默认失效**（MyBatis-Plus updateById 忽略 null 字段）——改 LambdaUpdate 显式 set null。
3. **显隐 EQ/NE 对多选列表语义歧义**——两端统一为「选中项包含/不包含」包含语义。
4. **抄送详情在实例结束后 500**（运行时变量不存在）——新增 `BpmTaskFacade.getHistoricVariables` 历史变量口回退。

以上修复均有对应真实行为复验（修复后重跑证据链）。

## 5. 偏差与剩余边界

- **偏差**：①编译互斥期间检测到用户遗留 vite 进程（基本空闲），按「等待并重检」执行但未无限阻塞，串行化了我方所有重型命令并记录该解释性偏差；②A3 抄送详情的表单快照取自流程历史变量（与审批意见初始化同源），非动态宽表直读（跨模块红线）。
- **未实施（按方向保留候选）**：转办/委托/加签/撤回/完整流程版本管理/挂起激活（P4 后续）、P34/P35、P2 计算公式/外部数据源/表单删除/列表配置持久化、P53/P21/Agent-RAG/OpenAPI/多租户登录/SSO/P59 三场景。
- **已知限制**：①重发中断（进程崩溃）会停留 RESENDING，不自动恢复（同步重发窗口极小，留待运营处理）；②NOTIFY user/page 端点 500 为既有缺陷（本轮未触碰，已单独留证）；③`/form/def/by-key` 查询偶发不一致亦为既有路径，夹具改用分页查找；④A8 文档收口、两仓候选提交与 v0.0.2 发布严格按方向 §6.7 后置，未触碰 main、未打标签、未推送。
- **杂散文件辨明**：`f-cfg*.json`/`graph.json`/`fixtures02.env`（工作区根与 Web 仓）为 2026-09-05 P4 验证期遗留的表单/流程 JSON 测试载荷与 fixture，属上一会话验证资产，按要求保留未清理。
- **候选身份**：本回执全部证据产生于本地 develop 工作区（Server@d5d0adb+本round改动、Web@1864d8a+本round改动）+ 本地起服实例，非发布候选；候选冻结与版本绑定待 A8 阶段。

## 6. Git

本地 `develop` 提交（不推送）：Server `feat(oa): v0.0.2 OA 流程中心/催办/抄送/表单子集/通知闭环`；Web `feat(oa): v0.0.2 OA 前后台分层/工作台/流程中心/表单新控件/通知记录`。远程合并、推送与 v0.0.2 标签未执行，待 Owner 对应授权。
