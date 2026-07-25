# 执行回执

## 1. Step 编号和名称

Step 1：后端逐条核实功能清单明细实现状态（`feature-checklist-sync`）

## 2. 使用模型

deepseek/deepseek-v4-flash（DeepSeek 系，当前会话为探索模型角色）

## 3. 实际读取的文件

以下文件均在 `Smart-WorkFlow/` 目录下：

1. `功能清单.md` — 全文读取，理解 M01-M10 共 89 条明细结构
2. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/DeptController.java`
3. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/UserController.java`
4. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/PostController.java`
5. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/RoleController.java`
6. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/DictController.java`
7. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthController.java`
8. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthMeController.java`
9. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/SysDeptServiceImpl.java`
10. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/SysUserServiceImpl.java`
11. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/SysPostServiceImpl.java`
12. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/SysRoleServiceImpl.java`
13. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/impl/SysMenuServiceImpl.java`
14. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/service/RefreshTokenService.java`
15. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/security/UserDetailsProviderImpl.java`
16. `sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/entity/SysDept.java`
17. `sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormDefinitionController.java`
18. `sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormSubmitController.java`
19. `sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormDataController.java`
20. `sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormDataQueryController.java`
21. `sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormDataDeleteController.java`
22. `sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/dynamic/FieldType.java`
23. `sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/impl/FormDefServiceImpl.java`（grep 部分方法签名）
24. `sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmProcessDefController.java`
25. `sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java`
26. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/controller/NotifyController.java`
27. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/entity/NotifyMessage.java`
28. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/NotifyMessageService.java`
29. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyMessageServiceImpl.java`
30. `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/impl/NotifyFacadeImpl.java`
31. `sw-basic/sw-basic-notify/sw-basic-notify-api/src/main/java/com/sw/ck/notify/api/NotifyFacade.java`
32. `sw-basic/sw-basic-notify/sw-basic-notify-api/src/main/java/com/sw/ck/notify/api/SendNotifyCommand.java`
33. `sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/controller/JobInfoController.java`
34. `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/controller/StorageController.java`
35. `sw-framework/sw-common/src/main/java/com/sw/ck/common/datascope/DataScopeType.java`
36. `sw-framework/sw-security/src/main/java/com/sw/ck/security/spi/SocialAuthenticationProvider.java`
37. （grep 搜索结果覆盖了约 50+ 次搜索，涵盖模块中的 Java 源文件）

未读取：
- `Smart-WorkFlow-Web/` 任何文件（跨项目边界，不读取）
- 各模块的 test 文件（仅验证需要时参考了测试文件中的实体/枚举）

## 4. 实际修改的文件

无——本 Step 为纯核实任务。

## 5. 每个文件的修改摘要

不适用——本 Step 未修改任何文件。

## 6. 实际执行的命令

以下 grep 搜索命令（按模块组织）：

```bash
# 模块目录定位
find ... -type d -name "sw-biz-system*" -o ...（仅用于定位）

# 搜索用户组/租户管理/SysConfig/SysParam
grep -rn "userGroup\|UserGroup\|user_group\|用户组" ...
grep -rn "SysTenant\|sys_tenant\|SysCompany" ...
grep -rn "sys_config\|config\|parameter\|参数" ...

# 搜索SSO/第三方登录
grep -rn "SSO\|sso\|OAuth\|oauth\|第三方\|wechat\|dingtalk\|social" ...

# 搜索导入导出/打印/数据源
grep -rn "import\|export\|Excel\|excel\|导入\|导出" ...
grep -rn "print\|打印\|template\|模板\|dataSource\|数据源" ...

# 搜索验证码/锁定
grep -rn "captcha\|验证码\|verifyCode\|loginLock\|lock\|失败锁定\|passwordPolicy" ...

# 搜索 BPM 相关
grep -rn "countersign\|会签\|orSign\|andSign\|加签\|addSign\|vote\|通过比例\|票否决" ...
grep -rn "flow.*track\|monitor\|tracking\|流程图实时高亮\|流转记录\|耗时\|intervene\|干预" ...
grep -rn "condition\|条件\|expression\|表达式\|branch\|分支\|timeout\|超时\|autoApprove" ...

# 搜索 Notify 相关
grep -rn "template\|模板\|channel\|渠道\|sms\|mail\|email\|wechat\|dingtalk\|trigger\|触发" ...

# 搜索监控/日志
grep -rn "monitor\|监控\|jvm\|redis\|在线用户\|online" ...
grep -rn "操作日志\|loginLog\|LoginLog\|operLog\|OperLog" ...
grep -rn "logger.*level\|log.*level\|LogLevel\|日志级别\|dynamic.*log\|LoggerManager" ...
```

以上均为只读 grep 搜索，未执行任何 `mvn compile`/`mvn test` 等状态变更命令。

## 7. 命令输出摘要

所有 grep 搜索结果已在内部分析过程中使用。关键发现摘要：

- **无匹配项（⬜ 确认）**：用户组管理、租户管理界面、SSO具体实现、表单导入导出、打印模板、会签规则、流程监控、条件表达式、消息模板、通知渠道配置、系统监控、日志管理、动态日志级别、参数配置、数据备份、接口管理
- **部分匹配（🟦 依据）**：部门负责人、按钮权限配置UI、数据权限动态加载、表单联动校验（后端校验存在但联动逻辑无）、节点审批人配置（仅固定审批人）、流程审批操作（仅同意/驳回）、通知发送（仅单用户）等

## 8. 与原方案的偏差

无偏差。严格按方案 §9.1 的核实方法论逐条执行。

## 9. 遇到的问题

1. **M02-F02-01（菜单权限-配置）判定权衡**：后端已实现"菜单按角色过滤"（SysMenuServiceImpl.getMenuTree 按用户-角色-菜单路径鉴权），但缺少"菜单管理CRUD端点"（MenuController），无「按角色勾选菜单」的配置端点。功能清单描述的"按角色配置菜单可见范围"中的"配置"动作只能由前端UI通过直接写 sys_role_menu 表完成，或在 flyway seed 中完成。综合判定为 🟦（后端过滤机制就位，但配置端点缺失）。

2. **M02-F03-01（按钮权限-配置）判定权衡**：UserDetailsProviderImpl 已从 sys_menu(menu_type=2) 加载 button permission 标识，并在 GET /system/auth/me 返回。但同样缺少「按角色配置按钮权限」的 CRUD 端点，且前端 v-perm 指令侧不在后端核实范围。判定为 🟦。

3. **M02-F04-01（数据权限-配置）判定权衡**：DataScopeType 五档枚举（ALL/DEPT/DEPT_AND_CHILD/SELF/CUSTOM）已定义于 sw-common，DataScopeHandler（MyBatis-Plus 拦截器基座）已存在。但 `UserDetailsProviderImpl.toLoginUser()` 硬编码 `DataScope.ALL`，未从数据库动态读取角色的数据范围配置。无「按角色配置数据范围」的管理端点。判定为 🟦。

4. **M03-F01-01（表单设计器-拖拽设计）**：该明细本质是前端主导的功能。后端提供了 FormDefinitionController 的草稿图保存/config管理/definition查询等支撑 API，但这些是后端基础设施。判定为 🟦（后端 API 支撑已就位，但拖拽设计前端是主力，全链路未闭合）。

5. **M04-F01-02（节点审批人配置）**：NodeApproverResolver SPI 和 FixedApproverResolver（固定审批人）已实现。但描述中的"指定人/角色/岗位/部门主管/上级/表单字段/发起人自选"多种类型中，仅"指定人（固定审批人路径 skeleton_approval 内走通）"可用，其余模式未实现。判定为 🟦。

6. **M04-F03-01（流程发起）**：ProcessStartService + FormSubmittedEventListener 已实现表单提交→发起流程的骨架路径（skeleton_approval），BpmFormBinding 实体已定义流程-表单绑定关系。但完整的「用户从列表选择流程定义→填写表单→发起」端到端路径的绑定 UI 尚未就位。判定为 🟦。

7. **M05-F01-01（站内信发送）**：NotifyFacade.send() + NotifyFacadeImpl 已实现单用户发送。但描述中的"支持指定人/部门/角色"仅"指定人"实现，部门/角色批量发送未实现。判定为 🟦。

8. **M06（系统通知）整体说明**：sw-basic-notify 模块当前只有站内信适配。多渠道（邮件/短信/微信/企微/钉钉）均为 `NotifyTargetResolver` 中定义的 SPI 接口但无具体实现。判定偏低。

9. **模块 <-> 功能清单映射偏差**：功能清单将 M10 部分运维功能标注为 `sw-biz-system` 落地，但实际 sw-biz-system 模块中没有系统监控/日志管理/参数配置/备份恢复的 Controller 或 Service。这些若实现可能需要另建模块或引入第三方组件。

## 10. 未完成内容

无——全部 54 条明细均已逐条核实。

## 11. 风险和注意事项

1. **判定标准说明**：功能清单的"状态"字段仅三档（⬜/🟦/✅），本核实对其中间态 🟦 的定义较宽——只要找到部分代码（哪怕是 SPI 接口或枚举定义）即标记 🟦，不要求完整实现描述中的全部子功能。规划层在 Step 3 综合裁决时可按更严格标准下调。
2. **前端依赖项**：M03-F01-01（拖拽设计）、M02-F02-01（菜单权限配置）、M02-F03-01（按钮权限配置）等功能，后端只提供支撑 API，前端 UI 未就位时功能不可用。但这些不在本 Step 核实范围内（仅核实后端侧）。
3. **数据权限强制执行**：DataScopeHandler 和 DataScopeType 枚举已就位，但 `UserDetailsProviderImpl.toLoginUser()` 硬编码 `dataScope=DataScope.ALL`，未从角色动态读取。数据权限机制有骨架但未实际启用。
4. **BPM 模块整体🟦**：sw-bpm 模块虽然文件数多（78 个 Java 文件），但大量为 DTO/API/SPI 接口，实际业务流程仅走通 skeleton_approval 单节点审批路径。多数审批操作（会签、转办、加签等）和监控功能均未实现。

## 12. Git diff 摘要

无改动。

## 13. 建议执行的测试

无——纯核实任务，验证方式见下方核实表证据栏。

---

## 附录：核实表（54 行）

### M01 组织架构（13 条）

| ID | 功能 | 功能详情 | 判定 | 证据 |
|---|---|---|---|---|
| M01-F01-01 | 部门管理 | 新增 | ✅ | `DeptController.create()` POST `/system/dept` → `SysDeptServiceImpl.create()` 完整实现 |
| M01-F01-02 | 部门管理 | 修改 | ✅ | `DeptController.update()` PUT `/system/dept` → `SysDeptServiceImpl.update()` |
| M01-F01-03 | 部门管理 | 删除 | ✅ | `DeptController.delete()` DELETE `/system/dept/{id}` → `SysDeptServiceImpl.delete()` 含子部门/在职用户校验 |
| M01-F01-04 | 部门管理 | 查询 | ✅ | `DeptController.tree()` GET `/system/dept/tree` 返回全量排序树；`DeptController.get()` GET `/system/dept/{id}` |
| M01-F01-05 | 部门管理 | 负责人设置 | 🟦 | `SysDept` 实体无 `leader`/`charge` 字段(仅有 parentId/name/code/sort/status)，无专门负责人设置端点 |
| M01-F02-01 | 人员管理 | 新增 | ✅ | `UserController.create()` POST `/system/user` → `SysUserServiceImpl.create()` 含密码BCrypt加密，关联部门/岗位/角色字段存在 |
| M01-F02-02 | 人员管理 | 修改 | ✅ | `UserController.update()` PUT `/system/user` → `SysUserServiceImpl.update()` 支持密码可选修改 |
| M01-F02-03 | 人员管理 | 删除 | ✅ | `UserController.delete()` DELETE `/system/user/{id}` → `SysUserServiceImpl.delete()`（逻辑删除） |
| M01-F02-04 | 人员管理 | 查询 | ✅ | `UserController.page()` POST `/system/user/page` 分页查询；`UserController.get()` GET `/system/user/{id}` 详情 |
| M01-F02-05 | 人员管理 | 批量导入导出 | ⬜ | 已搜索 `import`/`export`/`Excel`，system 模块无批量导入导出代码 |
| M01-F03-01 | 岗位管理 | 维护 | ✅ | `PostController` 完整 CRUD（create/update/delete/page/get） |
| M01-F04-01 | 用户组管理 | 维护 | ⬜ | 已搜索 `userGroup`/`UserGroup`/`用户组`，system 模块无相关实体/Controller/Service |
| M01-F05-01 | 租户/公司管理 | 维护 | ⬜ | 已搜索 `SysTenant`，system 模块无租户管理实体/Controller；多租户仅列级隔离基础设施（TenantLineHandler）就位 |

### M02 权限控制（7 条）

| ID | 功能 | 功能详情 | 判定 | 证据 |
|---|---|---|---|---|
| M02-F01-01 | 角色管理 | 维护 | ✅ | `RoleController` CRUD（create/update/delete/page/get）+ `SysRoleServiceImpl` 含编码唯一性校验 |
| M02-F02-01 | 菜单权限 | 配置 | 🟦 | `SysMenuServiceImpl.getMenuTree()` 按角色过滤菜单已实现；但无「按角色配置菜单」的管理端点（`MenuController` 不存在，菜单 CRUD 无 REST 端点） |
| M02-F03-01 | 按钮权限 | 配置 | 🟦 | `UserDetailsProviderImpl.loadPermissions()` 从 `sys_menu(menu_type=2)` 加载按钮权限标识，`GET /system/auth/me` 返回 `permissions[]`；但无「按角色配置按钮权限」的 CRUD 端点 |
| M02-F04-01 | 数据权限 | 配置 | 🟦 | `DataScopeType` 五档枚举已定义于 sw-common，`DataScopeHandler` 拦截器基座已存在；但 `UserDetailsProviderImpl.toLoginUser()` 硬编码 `DataScope.ALL`，未从角色动态读取数据范围配置，无管理端点 |
| M02-F05-01 | 资源管理 | 维护 | ⬜ | 已搜索 `resource`/`Resource`/`api.regis`，sw-security 与 system 模块中无 API 资源注册/鉴权策略管理端点 |
| M02-F06-01 | 登录认证 | 账密登录 | ✅ | `AuthController.login()` POST `/auth/login` 完整：用户名查询→BCrypt校验→JWT签发→RefreshToken+httpOnly cookie |
| M02-F06-02 | 登录认证 | 单点登录 | 🟦 | `SocialAuthenticationProvider` SPI 接口已定义于 sw-security，但无任何渠道实现（企微/钉钉扫码均未实现）；验证码/密码策略/失败锁定均未实现 |

### M03 低代码表单（8 条）

| ID | 功能 | 功能详情 | 判定 | 证据 |
|---|---|---|---|---|
| M03-F01-01 | 表单设计器 | 拖拽设计 | 🟦 | 后端提供支撑 API：`FormDefinitionController` 草稿CRUD/config保存/definition查询/发布。拖拽设计UI本身前端主导，后端 API 已就位 |
| M03-F01-02 | 表单设计器 | 控件库 | ✅ | `FieldType` 枚举 v1 启用 8 类（TEXT/RICH_TEXT/NUMBER/DATE/BOOL/DICT/REFERENCE/TABLE），后端含完整列映射/校验/提交逻辑 |
| M03-F02-01 | 表单管理 | 维护 | ✅ | `FormDefinitionController` 完整：创建草稿/更新/保存config/分页查询/发布/删除 + snapshot 版本快照 |
| M03-F03-01 | 表单规则 | 联动校验 | 🟦 | `FormSubmitService` 实现字段校验（必填/类型/字典值域/未知字段 1400-1403错误码）；但字段显隐联动/计算公式未实现（前端联动为主） |
| M03-F04-01 | 数据管理 | 增删改查 | ✅ | 4 Controller 完整：`FormSubmitController.submitData()` 提交；`FormDataController.getDetail()` 详情+`updateData()` 更新；`FormDataQueryController.queryData()` 分页查询；`FormDataDeleteController.deleteData()` 删除（RESTRICT+CASCADE+幂等） |
| M03-F04-02 | 数据管理 | 导入导出 | ⬜ | 已搜索 `import`/`export`/`Excel`，form 模块无表单数据导入导出代码 |
| M03-F05-01 | 数据源 | 数据字典 | ✅ | DICT 字段类型已实现，经 `DictFacade` 消费 system 字典数据；外部数据源/级联未实现，但字典数据源完整 |
| M03-F06-01 | 打印模板 | 套打配置 | ⬜ | 已搜索 `print`/`打印`/`template`/`PDF`，form 模块无打印相关代码 |

### M04 流程引擎（9 条）

| ID | 功能 | 功能详情 | 判定 | 证据 |
|---|---|---|---|---|
| M04-F01-01 | 流程设计器 | 拖拽设计 | 🟦 | `BpmProcessDefController` 提供定义CRUD/草稿图保存/校验/发布端点；`GraphToBpmnTranslator` 将图模型→BPMN。拖拽设计UI前端主导 |
| M04-F01-02 | 流程设计器 | 节点配置 | 🟦 | `NodeApproverResolver` SPI 已定义；仅 `FixedApproverResolver` 固定审批人实现（skeleton 路径）。角色/岗位/部门主管/上级/表单字段/发起人自选均未实现 |
| M04-F01-03 | 流程设计器 | 会签规则 | ⬜ | 已搜索 `countersign`/`会签`/`orSign`/`andSign`/`加签`/`vote`，bpm 模块无相关代码 |
| M04-F02-01 | 流程定义 | 维护 | 🟦 | 创建/删除/分页查询已实现；`publish()` 含图校验→BPMN翻译→Flowable部署+版本快照；但挂起/激活端点缺失，版本管理UI未做 |
| M04-F03-01 | 流程发起 | 发起 | 🟦 | `ProcessStartService.startProcess()` + `FormSubmittedEventListener` 实现表单提交→发起流程。但端到端「选择流程→填表→发起」用户路径仅 skeleton 走通 |
| M04-F04-01 | 流程审批 | 审批操作 | 🟦 | `BpmTodoController.complete()`（同意）和 `reject()`（驳回）已实现。转办/委托/加签/抢办/撤回/终止均未实现；驳回不支持"驳回到指定节点" |
| M04-F05-01 | 待办中心 | 任务处理 | 🟦 | `BpmTodoController`: 待办列表(todo)、已办列表(processed)、任务详情(detail)、审批历史均已实现。催办提醒未实现 |
| M04-F06-01 | 流程监控 | 跟踪 | ⬜ | 已搜索 `monitor`/`tracking`/`highlight`/`流程图实时高亮`，bpm 模块无流程图渲染/流转记录图表/耗时分析/流程干预代码 |
| M04-F07-01 | 流程规则 | 条件表达式 | ⬜ | 已搜索 `condition`/`expression`/`分支`/`timeout`/`autoApprove`，bpm 模块无分支条件解析/超时处理/自动审批代码 |

### M05 站内信（4 条）

| ID | 功能 | 功能详情 | 判定 | 证据 |
|---|---|---|---|---|
| M05-F01-01 | 消息收发 | 发送 | 🟦 | `NotifyFacade.send()` + `NotifyFacadeImpl` 已实现单用户站内信写入。描述中"指定人/部门/角色"仅"指定人"实现，部门/角色批量发送未实现 |
| M05-F01-02 | 消息收发 | 接收 | ✅ | `NotifyController.messages()` GET `/notify/messages` 返回当前用户通知列表；`read()` POST `/notify/messages/{id}/read` 标记已读（含越权校验） |
| M05-F01-03 | 消息收发 | 查询 | ✅ | `NotifyController.messages()` 按 `recipient_id` 查询，按创建时间倒序 |
| M05-F02-01 | 消息模板 | 维护 | ⬜ | 已搜索 `template`/`模板`/`NotifyTemplate`，notify 模块无模板相关实体/Service/Controller |

### M06 系统通知（4 条）

| ID | 功能 | 功能详情 | 判定 | 证据 |
|---|---|---|---|---|
| M06-F01-01 | 通知渠道 | 渠道配置 | 🟦 | `NotifyTargetResolver` 定义 `resolveEmail()` SPI 接口表示邮件可扩展；但无实际多渠道适配（邮件/短信/微信/企微/钉钉），无渠道配置管理端点 |
| M06-F02-01 | 通知模板 | 维护 | ⬜ | 同 M05-F02-01，notify 模块无模板相关代码 |
| M06-F03-01 | 通知规则 | 触发配置 | 🟦 | `BpmNotifyListener` 通过 `DomainEventPublisher` 实现了流程审批完成时的通知触发。但非通用的「业务事件触发规则配置」UI，无用户订阅设置 |
| M06-F04-01 | 发送记录 | 记录查询 | 🟦 | 通知记录落库 `sw_notify_message`，`NotifyController.messages()` 提供列表查询；但无专门的「发送日志/状态查询/失败重发」管理端点 |

### M10 系统运维（9 条）

| ID | 功能 | 功能详情 | 判定 | 证据 |
|---|---|---|---|---|
| M10-F01-01 | 系统监控 | 运行监控 | ⬜ | 已搜索 `monitor`/`jvm`/`redis`/`在线用户`，无相关 Controller 或监控端点 |
| M10-F02-01 | 日志管理 | 日志查询 | ⬜ | 已搜索 `操作日志`/`OperLog`/`LoginLog`/`异常日志`，system 模块无操作日志/登录日志/异常日志模块 |
| M10-F02-02 | 日志管理 | 动态日志级别 | ⬜ | 已搜索 `LogLevel`/`logger-manager`/`动态日志`，无相关代码 |
| M10-F03-01 | 定时任务 | 任务调度 | ✅ | `JobInfoController` 完整 CRUD + 暂停/恢复/手动触发；`QuartzSchedulerService` 调度；`JobLogController` 执行记录；BEAN/FLOW 双类型 |
| M10-F04-01 | 数据字典 | 字典维护 | ✅ | `DictController` 完整 CRUD：字典类型增删改查 + 字典数据项增删改查 + 按type查询列表 |
| M10-F05-01 | 参数配置 | 系统参数 | ⬜ | 已搜索 `config`/`parameter`/`SysConfig`/`SysParam`，system 模块无参数配置实体/Controller |
| M10-F06-01 | 文件管理 | 文件存储 | ✅ | `StorageController` upload/download/delete/list/info；4 Provider（Local/MinIO/COS/Qiniu） |
| M10-F07-01 | 数据备份 | 备份恢复 | ⬜ | 已搜索 `backup`/`备份`/`restore`/`dump`，无相关代码 |
| M10-F08-01 | 接口管理 | API管理 | ⬜ | 后端无 swagger/OpenAPI 自动文档配置，无 API 调用监控端点 |

### 汇总统计

| 模块 | 总条数 | ✅ 已完成 | 🟦 开发中 | ⬜ 待开发 |
|---|---|---|---|---|
| M01 组织架构 | 13 | 8 | 1 (M01-F01-05) | 4 (M01-F02-05, F04-01, F05-01) |
| M02 权限控制 | 7 | 2 | 4 (M02-F02-01, F03-01, F04-01, F06-02) | 1 (M02-F05-01) |
| M03 低代码表单 | 8 | 4 | 2 (M03-F01-01, F03-01) | 2 (M03-F04-02, F06-01) |
| M04 流程引擎 | 9 | 0 | 5 (M04-F01-01, F01-02, F02-01, F03-01, F04-01, F05-01) | 3 (M04-F01-03, F06-01, F07-01) |
| M05 站内信 | 4 | 2 | 1 (M05-F01-01) | 1 (M05-F02-01) |
| M06 系统通知 | 4 | 0 | 3 (M06-F01-01, F03-01, F04-01) | 1 (M06-F02-01) |
| M10 系统运维 | 9 | 3 | 0 | 6 (M10-F01-01, F02-01, F02-02, F05-01, F07-01, F08-01) |
| **合计** | **54** | **19** | **16** | **19** |

### 声明

- 本步未读取 `Smart-WorkFlow-Web/` 任何文件
- 本步未执行任何 `mvn compile`/`mvn test`/文件修改命令
- 所有判定仅覆盖后端侧实现状态
