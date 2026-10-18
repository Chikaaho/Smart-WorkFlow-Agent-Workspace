# 第41项线上返修追加回执 02：跨租户可见性差异定性（Owner 澄清后）

2026-10-18｜Executor。触发：Owner 2026-10-18 澄清"0 租户属超级租户，可以看到所有数据"。据此把 `reopen-041-01` §5 的"未解决差异"重新定性为**权限能力缺口**（产品当前无超级租户概念），并给出最小实现选项与授权请求。本轮**未改动任何隔离/权限/代码**（遵守方向"不能擅自关闭隔离"）。

## §1 现有实现（只读核实，可复核）

- 租户过滤是全局机制：`sw-framework/sw-common/.../config/mybatis/MybatisPlusConfig.java` 注册 `TenantLineInnerInterceptor(new CommonTenantLineHandler(tenantProperties, loginContextProvider))`。
- `CommonTenantLineHandler`（同目录）：
  - `getTenantId()`：取登录上下文 `tenantId`；上下文缺失即 fail closed 抛错；**无超级租户旁路**。
  - `ignoreTable()`：仅三种情况跳过——①认证装载期挂起（`TenantLineSuspension`）②非 master 数据源③`sw.tenant.ignore-tables` 白名单（`application.yml`：`sys_menu`、`sw_bpm_resource_policy`、`sw_bpm_resource_usage`、`sw_bpm_resource_reject_log`）。`sys_user/sys_dept/sys_role/sys_user_role/...` 一律追加 `tenant_id = 当前租户`。
- 用户列表路径：`UserController.page` → `SysUserServiceImpl.page` → `SysUserMapper.selectUserPage`（`SELECT * FROM sys_user WHERE deleted = 0` ＋ `@DataScope` 部门数据范围）＋ 拦截器追加 `tenant_id`。admin（tenant 0）→「共 1 条」，与 Owner 截图一致（线上实测）。
- 无"切换租户 / `X-Tenant-Id` / 租户选择器"能力；`sys_user.username` 全局唯一，登录解析走 `selectGlobalByUsername`（跨租户解析，仅登录前、过滤已挂起）——这是现存唯一"跨租户"读取路径，与"超级租户可见"无关。
- 既有产品契约与测试**以严格隔离为准**：`CrossTenantReadIsolationTest`（G6b「跨租户读隔离：A 不能读取/修改 B 租户对象」）、`I4CrossTenantServiceEntryTest`（R1「跨租户部门解析与用户交接确定拒绝＋零增量」）、工程宪法「反查 `tenant_id=?`：仅同租户参与判定（漏则跨租户串数据）」。→ 现状不是"回归坏了"，而是**该能力从未实现**。

## §2 确切差异

| 维度 | 现状 | Owner 预期（2026-10-18 澄清） |
|---|---|---|
| tenant 0 身份 | 与其它租户同等的列级隔离主体（仅见本租户） | **超级租户**，可见所有租户数据 |
| 系统管理页（用户/部门/角色等） | 仅本租户（admin→1 用户/1 部门） | 应可跨租户查看（含 9001/9002 的 14 用户/7 节点树） |
| 产品实现 | 无超级租户概念（代码、配置、测试均无） | 需新增能力（跨租户权限） |

## §3 最小实现选项（待授权，未实施）

- **A. 拦截器级旁路**（tenant 0 → 全局不过滤）：改动最小（`CommonTenantLineHandler.ignoreTable` 对 tenant 0 返回 true，或加等价开关）。**风险高**：①所有模块读写同时放开——读见全部租户；`update/delete` 丢失租户条件可跨租户修改；`insert` 不再自动注入 `tenant_id`（需显式值，否则约束失败）；②与既有隔离契约/测试（G6b、R1、宪法条文）直接冲突，须同步改契约与回归范围；③必须加显式授权门（仅 tenant 0 且超管角色）与审计留痕。
- **B. 只读跨租户视图（建议）**：保留列级隔离与全部写路径不变；为超级租户提供显式只读跨租户查询（如租户选择器＋用户/部门列表的跨租户只读端点），服务端显式校验 `tenant 0 + superadmin` 并审计。改动集中在 system 模块（＋前端页面），不触碰其它模块写路径。
- **C. 折中**：仅放开 system 模块只读列表（用户/部门/角色/租户）；写操作仍限本租户，或要求显式指定目标租户并单独授权。
- 三者共同前置：明确授权边界（角色范围/页面范围/是否含写）、契约与测试更新范围、是否需要新发布版本（版本由 Owner 确认）。

## §4 本轮动作与边界

- **未实施任何改动**：只读核实＋定性＋选项回传；未改隔离、未复制租户数据、未改代码/配置/迁移、未动既有发布。
- 保持有效：admin 口令更新与正反向验证（`reopen-041-01` §4）、9001/9002 组织数据完好（各 7 节点/14 用户）、可用访问路径（对应租户管理员身份）。
- 请求裁决：Planner/Owner 就 §3 选项与授权边界给出结论（建议 B 或 C）；若需实现，请按方向下发精确范围（含验收口径、回归范围与是否随版本发布）。
