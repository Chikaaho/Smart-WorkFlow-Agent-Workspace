# 补证回执 · 生产环境权限控制修复与全流程复验（2026-08-31）

> 前置回执：`production-sw-closedloop-verification-20260831.md`（首轮闭环验证）。
> 触发：Owner 复核发现「用户加不了，全流程验收不成立」，要求对用户/角色/部门/权限控制/流程流转全面复验。

## 1. 本轮新发现并修复的问题（2 项）

### Bug 4【权限控制失效·阻断】非超管永远拿不到页面级权限
- **现象**：新建用户（绑「管理员」角色）登录后，角色列表报「加载角色列表失败」（403/500），任何 `system:*` 写操作全部 access denied；GUI 新建角色「保存失败」。
- **根因**：`sw-biz-system-biz/UserDetailsProviderImpl` 权限装配只收集 `menu_type=2`（按钮）的 permission；而 V15 把 `system:user:list`/`system:role:list` 等放在 `menu_type=1` 页面节点上 → 非超管永远缺 list 权限。
- **修复**：装配改为「已授权菜单上 permission 非空即计入，不限 menu_type」（对齐若依惯例），同步更新类注释与方法注释。
- **验证**：系统模块 210 测试全过（Failures=0 Errors=0）；accept01（管理员角色）权限集 9 → 33，含 `system:user/role:create|update|delete`。

### Bug 5【生产数据缺口】CRUD 按钮权限菜单整批缺失
- **现象**：修复 Bug 4 后仍 403——库里根本没有 `system:*:create|update|delete` 菜单行，角色编辑器权限树无从勾选。
- **根因**：V2 曾种子按钮菜单（id 100-112），但生产库 sys_menu 是 V15 列风格（title/hidden），V2 风格（status/visible）的行从未落库——首轮回执 O5「生产 schema 与迁移链漂移」的具体显现。
- **修复**：新增 Flyway 迁移 `V45__system_crud_button_perms.sql`（postgresql + h2 双方言）：幂等补 6 个按钮菜单（id 300-305，父菜单按 permission 定位，兼容两代种子 id 差异）并授予角色 2（管理员），延续 V31「admin 角色全量菜单」语义。
- **验证**：生产库 6 行菜单 + 6 行 role_menu 落库；H2 上下文 210 测试全过（V45 在测试链执行）。

### 部署注意事项（非缺陷）
`LoginUser` 以 userId 为键缓存在 Redis，TTL = access token 有效期（15 分钟）；权限变更后最长 15 分钟才对已登录用户生效（文档已写明 evict 用于立即生效场景）。本轮验证时手工 evict 后立即生效。观察项 O6：角色授权变更是否应触发 evict，留给规划裁决。

## 2. 部署动作

- 本地 clean 重建（发现增量 package 未纳入新字节码，改用 clean）：`MAVEN_OPTS="-Xmx2g" mvn -q clean package -DskipTests -pl sw-bootstrap -am`；部署 class 复核 `javap -c UserDetailsProviderImpl.class | grep -c getMenuType` = 0（修复在包内）。
- scp_personal 上传 → `server.env` source → stop/start → health 200（ready ≈120s）。生产当前 jar 为含 Bug4/5 修复版本。前端无改动，沿用上一轮部署。

## 3. 全流程复验结果（行为证据）

| 校验项 | 结果 |
|---|---|
| 用户新增 | ✅ GUI（admin）建 accept01「创建成功」；GUI 建 limited01「创建成功」；列表可见 |
| 新用户登录 | ✅ accept01 / limited01 均可登录（API + GUI） |
| 角色新增 | ✅ GUI（accept01）建「验收普通角色」accept_normal「创建成功」（修复后） |
| 部门新增 | ✅ GUI（accept01）建「验收部门」accept_dept「创建成功」 |
| 权限控制-授权侧 | ✅ accept01 roles=[admin] perms 33 项（含 system CRUD）；`POST /system/role` code 0 |
| 权限控制-受限侧 | ✅ limited01 roles=[accept_normal] **perms=[]**；用户列表 API 403；GUI 无菜单落地 /sw/404 |
| 流程流转-跨用户 | ✅ accept01 填报提交「提交成功，流程已发起」→ admin 待办出现 → admin 审批通过 → accept01 收件箱收到「您的申请已通过」（WF_APPROVED） |
| 回归（首轮结论） | ✅ 表单设计/发布、流程定义/发布、jsonb 写入、字典状态、SPA 深链接均未回归 |

## 4. 遗留观察项（累计）

- O1 表单填报页无菜单入口（沿用首轮）。
- O2 中文 formKey 与填报输入框无 label（沿用首轮）。
- O5 生产 schema 与迁移链漂移（V2 按钮菜单缺失已由 V45 在生产补齐；其余漂移如 sw_form_config DDL 未入链仍存在）。
- O6 权限变更不主动 evict LoginUser 缓存，最长延迟 15 分钟生效。
- O7 无权限用户登录落地 /sw/404，无「无权限」提示页。
- O8 部门/岗位/字典控制器未挂 @PreAuthorize（仅 user/role 有方法级鉴权），权限粒度不一致。

## 5. 本轮修改文件

- `Smart-WorkFlow-Server/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/security/UserDetailsProviderImpl.java`（权限装配去 menu_type 过滤 + 注释）
- `Smart-WorkFlow-Server/sw-bootstrap/src/main/resources/db/migration/postgresql/V45__system_crud_button_perms.sql`（新增）
- `Smart-WorkFlow-Server/sw-bootstrap/src/main/resources/db/migration/h2/V45__system_crud_button_perms.sql`（新增，同 SQL）

均未提交。生产数据留有验收痕迹：用户 accept01/limited01、角色 accept_normal/probe_role、部门 accept_dept、流程实例与通知。
