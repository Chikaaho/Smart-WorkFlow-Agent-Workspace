# 功能追踪：I51 前端状态语义对齐（status-semantics-alignment）

> 工作区统一知识库 — 修复轮追踪。
> 本文件记录 I51 修复轮的完整闭环：契约核实 → 前端修正 → 测试 → 验收。
>
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | I51（known-issues 注册表，非 Mxx 功能明细） |
| 功能名称 | 系统管理状态语义对齐 |
| 功能目标 | 统一系统管理前端与后端的状态值语义：用户/部门页面提交、回填、筛选及展示的「正常/停用」含义与后端契约一致 |
| 创建日期 | 2026-08-17 |
| 当前状态 | **PASSED 并已归档**（2026-08-17 规划层最终验收 PASSED，无独立 D 编号；前端 66f/576t 四连全绿；归档 `product/status-semantics-alignment/passed/`） |
| 涉及模块 | 前端 `Smart-WorkFlow-Web`：src/modules/system（用户页/部门页）、src/foundation/mock（seeds/handlers）、测试 |

---

## 2. 需求分析

### 2.1 功能目标

方向文档（`product/status-semantics-alignment/ready/direction-status-semantics-alignment.md`）一句话目标：使用户和部门页面提交、回填、筛选及展示的「正常/停用」含义与后端契约一致，并确保 UI 创建的正常用户可以登录、被停用的用户会被既有后端安全门正确阻断。

### 2.2 非目标

- 不修改后端任何代码、迁移或状态契约
- 不修改 I33 已实现的登录与 refresh 双入口拦截
- 不处理 I49（菜单授权）、I50（登录校验时序）
- 不重构整个系统管理模块，不扩散为全局状态字典重构
- 不新增状态值、不重新定义「锁定」业务流程

### 2.3 影响范围

| 维度 | 详情 |
|------|------|
| 后端模块 | 无（仅只读核实契约，零修改） |
| 前端模块 | UserList.vue / DeptList.vue / 新建 constants.ts / seeds.ts / handlers.ts / 4 个 spec |
| 数据库表 | 无 |
| API 端点 | 无（透传层零改动） |

---

## 3. 契约事实（CONFIRMED，2026-08-17 后端只读核实）

| 实体 | 值域 | 0= | 1= | 2= | 证据 |
|------|------|----|----|----|------|
| 用户 sys_user | 0/1/2 | 正常 | 停用 | 锁定 | SysUser.java 注释 + AuthController 登录/refresh 校验 + AuthFlowIntegrationTest + sys_user_status 字典（四重证据） |
| 部门 sys_dept | 0/1 | 正常 | 停用 | — | SysDept.java 注释 + sys_common_status 字典 |
| 角色 sys_role | 0/1 | 停用 | 启用 | — | SysRole.java 注释 + UserDetailsProviderImpl 登录只取 status=1（与前端现状一致） |
| 岗位 sys_post | 0/1 | 停用 | 启用 | — | SysPost.java 注释（与前端现状一致） |

> 注意：`CommonStatusEnum`（ENABLE=1/DISABLE=0）存在但全仓零引用、语义与用户/部门契约相反，前端未引入（避免二次反转）。

---

## 4. 执行闭环（2026-08-17）

执行层自主闭环：2 个并行探索 Sub Agent（前端语义定位 + 后端契约核实）→ 1 个实现 Sub Agent → 主会话四连质量门 → 知识库全量同步。

### 4.1 修改文件清单

| 文件 | 改动 |
|------|------|
| `src/modules/system/constants.ts`（新建） | SYS_USER_STATUS（NORMAL=0/DISABLED=1/LOCKED=2）、SYS_DEPT_STATUS（NORMAL=0/DISABLED=1）、userStatusOptions/deptStatusOptions、userStatusTagType/userStatusLabel/deptStatusTagType/deptStatusLabel 纯函数 |
| `src/modules/system/views/UserList.vue` | 新建默认/resetForm `status: 1→0`；表单选择项与筛选选择项改三态（0/1/2）；列表 tag 三分支（0=success 正常/1=info 停用/2=warning 锁定）；回填与提交保持透传 |
| `src/modules/system/views/DeptList.vue` | 新建默认/resetForm `status: 1→0`；表单选择项两态（0/1）；列表 tag 经 deptStatusTagType；回填与提交保持透传 |
| `src/foundation/mock/seeds.ts` | MOCK_USERS_LIST：admin/zhangsan/lisi/wangwu 1→0（正常）、zhaoliu 0→1（停用）；MOCK_DEPTS_LIST 全部 1→0；角色/岗位种子未动 |
| `src/foundation/mock/handlers.ts` | user/dept create 默认 `data.status ?? 1 → ?? 0`；role/post 部分未动 |
| `src/modules/system/api/user.spec.ts` / `dept.spec.ts` | 「正常」夹具 status 1→0（各 6 处） |
| `src/modules/system/views/UserList.spec.ts` | +5 用例：新建默认 status=0、回填 1/2、提交 payload 0/1 |
| `src/modules/system/views/DeptList.spec.ts` | 树夹具 1→0；+2 用例：新建默认 status=0、提交 payload 1 |

### 4.2 验证结果

- 前端四连：typecheck ✅ / lint ✅ / test **66 files / 576 tests** ✅（569 + 7）/ build ✅，全部退出码 0（NODE_OPTIONS=--max-old-space-size=2048）
- 测试增量有明确来源：UserList.spec +5、DeptList.spec +2（提交与回填语义）
- 后端：零修改、未构建（方向 §6 第 6 项）
- 角色/岗位/字典页：未触碰（git diff 佐证；字典页不在方向 §4 范围）

### 4.3 与验收标准对照（方向 §6，7 项）

| # | 验收标准 | 结果 |
|---|----------|:---:|
| 1 | 用户页正常/停用提交值与后端一致；新建默认用户不再被判停用 | ✅ |
| 2 | 回填/展示/筛选同一状态值解释一致；停用用户经 UI 保存后被安全门阻断 | ✅（三分支 tag + 三态筛选/选项；前端只提交正确值，登录阻断仍由 I33 后端权威执行） |
| 3 | 部门页默认值/提交/回填/展示/筛选与后端契约一致 | ✅ |
| 4 | 角色/岗位无行为回归 | ✅（零改动，核实报告：前端映射与其后端契约一致） |
| 5 | 自动化测试覆盖正常/停用提交与回填语义；质量门全过；测试数量不减少 | ✅（+7 用例） |
| 6 | 后端代码/迁移/契约零修改 | ✅ |
| 7 | 知识库全量同步 | ✅（known-issues/current-status/features/session-handoff；功能清单状态列无变化——I51 无独立明细行，属「如适用」不适用项） |

---

## 5. 状态

- 执行层自验收：**PASSED**（2026-08-17，全部 7 项验收标准对照通过）
- 规划层最终验收：**PASSED**（2026-08-17；无独立 D 编号，如实记录不虚构——验收裁定见 `memory/decisions.md` D85 前后轮次与 `session-handoff.md` §1）
- 归档：`product/status-semantics-alignment/passed/direction-status-semantics-alignment.md`（已归档）+ `receipts/status-semantics-alignment-completion.md`
