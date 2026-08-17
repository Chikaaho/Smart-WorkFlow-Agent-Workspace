# 功能级完成回执：I51 系统管理状态语义对齐（status-semantics-alignment）

- **方向文档**：`product/status-semantics-alignment/ready/direction-status-semantics-alignment.md`
- **执行日期**：2026-08-17
- **执行方式**：执行层自主闭环——2 个并行探索 Sub Agent（前端语义定位 + 后端契约核实）→ 1 个实现 Sub Agent → 主会话四连质量门 → 知识库全量同步
- **范围**：前端单项目（`Smart-WorkFlow-Web`），后端零修改

---

## 1. 状态契约对照（CONFIRMED，后端只读核实）

| 实体 | 值域 | 0= | 1= | 2= | 证据（后端文件） |
|------|------|----|----|----|------|
| 用户 sys_user | 0/1/2 | 正常 | 停用 | 锁定 | `SysUser.java:41-43` 注释；`AuthController.java:92-97/129-138/189-194` 登录与 refresh 校验（status==0 放行、2 锁定、其余停用）；`AuthFlowIntegrationTest.java:524-576`；`V2__init_data.sql:41-43` sys_user_status 字典 |
| 部门 sys_dept | 0/1 | 正常 | 停用 | — | `SysDept.java:33-35` 注释；`V2__init_data.sql:20,28-29` sys_common_status 字典 |
| 角色 sys_role | 0/1 | 停用 | 启用 | — | `SysRole.java:31-33` 注释；`UserDetailsProviderImpl.java:116-120` 登录仅加载 status=1 |
| 岗位 sys_post | 0/1 | 停用 | 启用 | — | `SysPost.java:29-31` 注释 |

前端现状：用户/部门页「正常=1/停用=0」→ **与后端反转**；角色/岗位页「正常=1/停用=0」→ **与各自后端契约（1=启用/0=停用）一致**，未修改。
注意：`CommonStatusEnum`（ENABLE=1/DISABLE=0）全仓零引用且与用户/部门契约相反，未引入前端（避免二次反转）。

## 2. 实际读取的文件

- 探索：`UserList.vue` / `DeptList.vue` / `RoleList.vue` / `PostList.vue` / `DictTypeList.vue` / `DictDataList.vue` / `api/{user,dept,role,post,dict}.ts` / `modules/system/types/*` / `foundation/mock/{seeds,handlers}.ts` / 5 个 api spec + 6 个 view spec / `foundation/dict` 相关（前端）；`SysUser.java` / `SysDept.java` / `SysRole.java` / `SysPost.java` / `AuthController.java` / `UserDetailsProviderImpl.java` / `SysDeptServiceImpl.java` / `CommonStatusEnum.java` / `V1/V2/V4/V5` 迁移脚本（后端只读）
- 收尾：`knowledge/known-issues.md` / `knowledge/current-status.md` / `knowledge/session-handoff.md` / `Smart-WorkFlow/功能清单.md`

## 3. 实际修改的文件（前端仓库）

| 文件 | 类型 | 改动摘要 |
|------|------|----------|
| `src/modules/system/constants.ts` | 新建 | 集中常量：SYS_USER_STATUS（NORMAL=0/DISABLED=1/LOCKED=2）、SYS_DEPT_STATUS（NORMAL=0/DISABLED=1）、userStatusOptions/deptStatusOptions、userStatusTagType/userStatusLabel/deptStatusTagType/deptStatusLabel 纯函数（仅服务用户/部门页，防链路再反转） |
| `src/modules/system/views/UserList.vue` | 修改 | 新建默认/resetForm `status: 1→0`（正常）；表单选择项与筛选选择项改三态（正常=0/停用=1/锁定=2）；列表 tag 三分支（0=success 正常/1=info 停用/2=warning 锁定，原二元式会把锁定误显为停用）；回填与提交保持透传（透传本身正确） |
| `src/modules/system/views/DeptList.vue` | 修改 | 新建默认/resetForm `status: 1→0`；表单选择项两态（正常=0/停用=1，契约无锁定）；列表 tag 经 deptStatusTagType；回填与提交保持透传 |
| `src/foundation/mock/seeds.ts` | 修改 | MOCK_USERS_LIST：admin/zhangsan/lisi/wangwu `1→0`（正常）、zhaoliu `0→1`（停用）；MOCK_DEPTS_LIST 全部 `1→0`；角色/岗位种子未动 |
| `src/foundation/mock/handlers.ts` | 修改 | user/dept create 默认 `data.status ?? 1 → ?? 0`（对齐后端 DB DEFAULT 0）；role/post 部分未动 |
| `src/modules/system/api/user.spec.ts` | 修改 | 「正常」语义夹具 `status: 1→0`（6 处） |
| `src/modules/system/api/dept.spec.ts` | 修改 | 「正常」语义夹具 `status: 1→0`（6 处） |
| `src/modules/system/views/UserList.spec.ts` | 修改 | **+5 用例**：新建默认 status=0（挂载后与 openCreate 后）、回填 status=1（停用）、回填 status=2（锁定）、提交「停用」payload status=1、提交「正常」payload status=0；按宪法 §11 模式（vi.mock API 层 + minimalStubs + wrapper.vm 类型断言 + element-plus mock，先例 JobList/TodoList spec） |
| `src/modules/system/views/DeptList.spec.ts` | 修改 | 树构建夹具 `status: 1→0`（3 处）；**+2 用例**：新建默认 status=0、提交「停用」payload status=1 |

Git diff 摘要：8 修改 + 1 新建；**+192 / −45 行**（纯值翻转仅 27 行：seeds 11 + handlers 2 + user/dept spec 夹具 12 + DeptList 树夹具 3 中的值翻转）。

## 4. 未修改核对（方向 §4 一致性对照）

- `RoleList.vue` / `PostList.vue` / `DictTypeList.vue` / `DictDataList.vue` 及 `api/role|post|dict.ts`、其 spec：**零改动**（git status 佐证；grep 确认 seeds/handlers 的 role/post 部分保持原值）
- `src/contracts/api-types/`：生成产物目录，未触碰
- 后端 `Smart-WorkFlow/`：零修改、未构建、未测试（仅只读核实契约）

## 5. 实际执行的命令及退出码

| 命令（均带 NODE_OPTIONS="--max-old-space-size=2048"） | 结果 |
|------|------|
| 编译互斥预检（ps 检测后端 mvn/java 编译进程） | 无并发进程，放行 |
| `pnpm typecheck`（实现 Sub Agent） | 退出码 0 |
| `pnpm test src/modules/system/api/user.spec.ts api/dept.spec.ts views/UserList.spec.ts views/DeptList.spec.ts` | 4 files / 27 tests 全过，退出码 0 |
| `pnpm typecheck`（四连 1/4） | 退出码 0 |
| `pnpm lint`（四连 2/4） | 退出码 0 |
| `pnpm test`（四连 3/4） | **66 files / 576 tests 全过**，退出码 0 |
| `pnpm build`（四连 4/4） | 构建成功，退出码 0（仅 @vueuse/core INVALID_ANNOTATION 既有第三方警告，不影响退出码/产物） |

测试计数账：基线 66f/569t（2026-08-16，运行口径）→ **66f/576t（+7：UserList.spec +5 / DeptList.spec +2，均为 status 提交与回填语义用例）**，无任何无说明减少。

## 6. 与验收标准逐项对照（方向 §6）

| # | 验收标准 | 结果 | 证据 |
|---|----------|:---:|------|
| 1 | 用户页「正常/停用」提交值与后端一致；新建默认用户不再被判停用 | ✅ | 默认值与选择项改 0=正常/1=停用；提交透传正确值；handlers create 默认 ?? 0；UserList.spec 提交 payload 0/1 断言 |
| 2 | 回填/展示/筛选同一状态值解释一致；停用用户经 UI 保存后被安全门阻断 | ✅ | 回填透传 + 三态选项（含锁定 2）保证 el-select 正确展示；展示三分支 tag；筛选三态；前端只提交正确值，登录阻断仍由 I33 后端权威执行（未复制阻断逻辑到前端） |
| 3 | 部门页默认值/提交/回填/展示/筛选与后端契约一致 | ✅ | 0=正常/1=停用两态全链路；DeptList.spec 提交 payload 断言 |
| 4 | 角色/岗位无行为回归；回执报告核对结论 | ✅ | 前端角色/岗位映射与其后端契约（1=启用/0=停用）一致，**零改动**（git diff 佐证） |
| 5 | 自动化测试覆盖正常/停用提交与回填语义；质量门全过；测试数量不得无说明减少 | ✅ | +7 用例覆盖提交与回填；四连全绿；计数 569→576 有明确来源 |
| 6 | 后端代码/迁移/契约零修改 | ✅ | 未触碰；如必须改后端才可完成的情形未发生（契约核实充分，无需 BLOCKED） |
| 7 | 知识库全量同步 | ✅ | 见 §8 明细 |

## 7. 范围偏差与决策说明

1. **用户页新增「锁定=2」选项与筛选项**：方向 §3 非目标「不新增状态值」——锁定 2 是后端既有契约值（sys_user_status 字典 + AuthController 已有锁定拦截），前端此前仅因映射错误未表达；若选择项不含 2，编辑回填 status=2 用户时 el-select 无法正确展示，违反验收 2「解释一致」。故展示/筛选/选择项均含锁定（tag warning 色），不改变锁定业务流程。
2. **集中常量文件 `constants.ts`**：方向 §5 风险 1/5——用户/部门页原持有 60+ 处散落数字，收敛为单文件常量与纯函数（仅服务用户/部门页），消除「局部改值导致链路仍反转」的直接重复；未扩大为全局状态字典重构，角色/岗位/字典页未引用。
3. **字典两页（DictTypeList/DictDataList）持有相同 1/0 映射但未修改**：方向 §4 影响范围仅点名用户/部门页及其直接相关文件；字典实体（SysDictType/SysDictData）后端契约未经本轮核实，超出 I51 范围。作为范围外发现报告，供规划层决策是否另排。
4. **`RoleList.vue` dataScope 0-4 数值映射注释「待联调确认」**：与本任务同类的潜在契约偏差，不在 I51 范围，报告供规划层参考。

## 8. 知识库全量同步明细

| 文件 | 变更 |
|------|------|
| `knowledge/known-issues.md` | I51 索引行「待修复」→「✅ 已修复（2026-08-17 status-semantics-alignment…）」；I51 详情块追加修复记录 |
| `knowledge/current-status.md` | §1 前端测试基线 569→576（+7 及来源）；§2 前次验证追加本轮四连结果；§4 功能追踪表新增 status-semantics-alignment 行；§6 已完成清单追加第 17 条（← 最新完成）；§8 小项池移除 I51 |
| `knowledge/features/status-semantics-alignment.md` | 新建功能追踪文件（契约事实/修改清单/验证结果/验收对照/状态） |
| `knowledge/session-handoff.md` | §1 新增最新完成功能块；§10 新会话必读列表（known-issues 注释 + features 指向）；候选池/小项池/基线 3 处移除 I51 或更新基线（历史 D83 记录保留） |
| `Smart-WorkFlow/功能清单.md` | **无变更**：I51 为修复轮，无独立功能明细行对应（清单 M01/M02 明细状态不受值语义修正影响），属验收 7「如适用」不适用项；🟦/⬜ 缺口无新增，无需 P 编号登记 |
| `todo/` | 无变更（无已决策暂不修复项被本轮触及） |

## 9. 未完成内容

无。方向 §7 待确认问题为空；全部 7 项验收标准逐项对照通过；无需 BLOCKED 标记。

## 10. 记忆更新草稿（仅供规划角色核对后落盘，不构成最终判定）

### state.md 追加行
`I51 status 语义对齐（status-semantics-alignment）| 用户/部门页 status 按后端契约修正（0=正常/1=停用/2=锁定），新建默认 0，集中常量 constants.ts，+7 测试 | 回执 product/status-semantics-alignment/receipts/ | PASSED（待规划层编号）`；测试基线：66f/569t→**66f/576t**

### decisions.md 新增条目
无新增（未产生新的架构/设计决策；契约对齐与常量收敛为方向既定范围内的实现方式，非新决策）

### issues.md 新增条目
无新增（I51 已关闭；范围外发现「字典两页同型映射」与「RoleList dataScope 数值待联调」已在回执 §7 报告，是否登记由规划层裁定）

### features.md 状态变更
status-semantics-alignment：COMPLETED（执行层自验收通过，待规划层最终验收后移 ready→passed）

---

**执行结论**：PASSED（执行层自验收）——全部 7 项验收标准满足，四连全绿（66f/576t），后端零修改，范围无越界，待规划层最终验收。
