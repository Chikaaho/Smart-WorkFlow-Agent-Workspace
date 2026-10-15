# 应用中心与表单分类统一：执行侧探索回执

2026-10-15｜只读核对文档、Server/Web源码及本地Git；未查数据库/UAT，未运行验证、未改业务代码或Git。

## 结论

唯一活动规划为应用中心（L，4阶段0/1/3）；无业务应用实体。分类归流程事项，表单分类由Web派生。未查数据库，不能报告存量数量或迁移结果。

## 事实矩阵

1. **状态**：`knowledge/current-status.md:3`待复核字样已被较新复核取代，最终PASSED（`product/bugfix-20261013/receipts/planning-review-terminal-sync-015-close-01-passed.md:3-9`）。48、46/22/22=90、ADV64/问题57及P62功能完成、性能延期/OFF一致（`todo/requirement-pool.md:175`）。P64登记正文仍残留IN_PROGRESS/47，与标题完成冲突（`knowledge/features/p64-mes-advanced-orchestration.md:1-4`）；需求池为完成/48。

2. **模型/入口**：无业务应用实体；`sw_openapi_app`是第三方API应用。无独立目录实体；`BpmCategory`=`sw_bpm_category`为租户内单层名称/排序；`BpmProcessDef.categoryId`可空。表单无分类列；`FormDefList.vue:48-51,71-78`按事项formKey派生、同key取首项；多个定义可共用formKey，每租户每表单最多一个active绑定。流程发布版本冻结图/formVersion，实例留processKey/版本/formKey/recordId。入口`/portal`、`/workflow/catalog`；管理`/workflow/catalog-admin`；设计`/form/form-def-list`、`/form/designer/:id`、`/workflow/defs`。外部旧链接消费者未知。（Server实体：`BpmCategory`、`BpmProcessDefVersion`、`BpmInstance`、`BpmFormBinding`）

3. **权限**：目录列表/计数/直链按active绑定、已发布表单和发起可见性筛选；表单直链/提交查`visibilityScope`，空/null=userIds全租户可用，提交另需PUBLISHED。仅用户ID范围，不授予设计、审批或数据读取。设计需`form:design*`/`workflow:def:*`；待办按租户与办理人查询，动作服务端验权；实例详情限超管、监控、发起人、参与人、抄送人。数据查询需`form:data:query`及ALL/SELF/DEPT/DEPT_AND_CHILD/CUSTOM范围；ALL不加行限制，CUSTOM空集无数据。角色/部门范围登录快照，变更后刷新/重登生效；无应用ACL。（`BpmCatalogServiceImpl`、`FormSubmitService`、`FormDataScopeSupport`、`BpmInstanceController`；`knowledge/features/data-scope-enforcement.md:23,32,42`）

4. **存量/兼容**：未查库，未分类、重名、孤立/跨租户引用及实例数均未知。分类表无parent_id；服务按租户校验重名、删除前拦截仍被引用分类。Web把null分类先映射成0，而“未分类”判断只认无映射，静态上可能漏列（`FormDefList.vue:71-97`）。`/workflow/catalog/:processKey?`路由存在但页面未消费参数；内链存在，外部调用未知。迁移种子有H2/PostgreSQL；MySQL/Oracle仅README。

5. **引用保护**：事项可改分类/置空；有事项引用时拒删分类。流程仅无发布版本草稿可删，挂起版本只阻止新实例。表单仅草稿可删除；已发布表单可停用，保留历史/实例快照读取。应用/目录及其引用保护未实现。移动、禁用、删除/恢复时如何保留旧链接、表单归属和运行实例，待裁决。

6. **AC01—07及验证**：AC01无应用证据；AC02旧分类仅部分覆盖；AC03历史UAT有审批意见表单→流程→结果链（`uat-015-01.md:56-60`）；AC04有表单/实例/数据权限实现及测试，无应用ACL证明；AC05无存量映射；AC06有分类引用保护/测试，无应用目录回归；AC07有H2、PostgreSQL迁移资产。可复用Server `BpmCatalogServiceTest`/`BpmCategoryServiceTest`/`FormDataQueryServiceTest`/`FormDefinitionControllerAuthorizationTest`、Web `ProcessCatalog.spec.ts`；无表单目录/后台组件测试。最低验证组合为定向测试+AC01-06浏览器/越权请求；改Schema才跑H2/PG升级。历史基线非本次结果：Server 351类2051/3/0/27 BUILD FAILURE（3项既有MQTT/启动时序限制），Web 1534通过；未运行验证。

7. **Git（本地缓存、未fetch）**：根`develop-sw` `d050512d`→`origin/develop-sw` 0/0；7个已修改文件（memory六、requirement-pool），未跟踪`changed-files/`、方向目录、任务及本回执。Server `main` `d7d376f`→`origin/main` 0/0，本地`develop`同HEAD、跟踪`origin/develop`。Web `codex/bugfix-20261013` `3687d04`→同名origin 0/0，本地`develop`同HEAD、跟踪`origin/develop`。根gitlink与嵌套HEAD一致；本地develop可作分支起点，远端实时状态未知。规划文档限根仓精确暂存授权文件，不可整体暂存。

## 唯一下一动作

Planner读取回执，裁决可见范围、目录层级、迁移兼容及引用保护后定稿READY方向。存量计数需另行授权只读目标数据环境清点。
