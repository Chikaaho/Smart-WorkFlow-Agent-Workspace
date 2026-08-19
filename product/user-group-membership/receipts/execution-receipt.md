# user-group-membership 完成回执（执行层）

> 方向：`product/user-group-membership/ready/direction-user-group-membership.md`（D112，2026-08-19）
> 执行角色产出；逐项对照方向 §6 验收标准 1-11。

## 一、功能实现（对照 §2 产品语义）

| 语义 | 实现 | 证据 |
|------|------|------|
| 租户内扁平虚拟组（非部门节点、无层级/负责人） | `sys_user_group` 主表无 parent_id/leader 列 | V34__sys_user_group.sql |
| 稳定唯一业务标识（创建后不可变） | `uk_sys_user_group_code(tenant_id, group_code, deleted)` + Service update 忽略 groupCode 变更 | V34 SQL；SysUserGroupServiceImpl.update |
| 状态/说明/逻辑删除 | status 0/1、remark、deleted；停用保留配置与成员，delete 连删成员关系 | Service disable/enable/delete |
| 用户-组多对多 | `sys_user_group_member` 表 + 唯一索引 (tenant_id, group_id, user_id, deleted) | V34 SQL |
| 成员保存/替换/清空/移除/回填 | updateMemberIds（整量替换、空=清空）/ addMemberIds（去重追加）/ removeMemberIds（幂等）/ clearMembers / listMemberIds | SysUserGroupServiceImpl |
| 事务一致 | 主记录与成员变更全部 @Transactional(rollbackFor=Exception.class)；成员校验失败在删除/插入前整体回滚 | Service + ServiceTest 原子性用例 |
| 只绑定同租户/未删除/有权查看的用户 | 成员校验复用带数据范围 SQL 的候选查询（同一套可见性口径） | validateMembers → memberCandidates |
| 不可用用户不静默丢失历史 | 停用/锁定用户不在候选与有效成员查询中；前端回显失效成员标签 | Mapper status=0 过滤；UserGroupList staleMembers |
| 停用组不得作为新引用对象 | 前端展示停用标记；本轮无消费端 | UserGroupList |

## 二、权限边界（对照 §2.3）

- 用户组**不是角色/菜单/按钮/数据权限主体**：Service 构造器仅注入 `SysUserGroupMemberMapper`/`SysUserMapper`/`LoginContextProvider`，零角色/菜单/数据权限关系 mapper；集成测试 `noImplicitAuthorization` 证明加/移组前后 `sys_user_role`/`sys_role_menu`/`sys_role_dept` 全表零改动、登录上下文（dataScope/customDeptIds/superAdmin）不变。
- 独立权限：查看 `system:userGroup:list`、管理 `system:userGroup:manage`，Controller 全端点 @PreAuthorize；前端 hasPerm 仅 UX 显隐。
- superadmin 沿用既有旁路（数据范围短路），未新增任何基于用户 ID 的超管判断。

## 三、模块级影响（对照 §4）

- **后端**：system 领域新增 SysUserGroup/SysUserGroupMember 实体、2 Mapper、SysUserGroupService(+Impl)、UserGroupController；用户领域零改动；Security/DataScope 复用既有能力零改动。
- **迁移**：V34__sys_user_group.sql（H2/postgresql 双份逐字一致），覆盖主表+成员表+唯一约束+索引；未修改 V1-V33。
- **前端**：UserGroupList.vue 页面、api/userGroup.ts、types/userGroup.ts、Mock（seeds+handlers 9 端点）、Mock 菜单树节点 + 会话权限；路由经动态菜单（componentWhitelist 通配已覆盖）。
- **规划与知识状态**：见 §五。

## 四、验收标准逐项对照（§6）

1. **组 CRUD/启停/删除/唯一标识/筛选/非法输入**：✅ Controller 12 用例 + Service 15 用例；标识唯一（租户内唯一索引+Service 查重+23505 迁移用例）。
2. **多对多成员保存/替换/移除/清空/回填 + 一用户多组/一组跨部门**：✅ Service 单元 + 集成（跨部门成员组、数据范围过滤组列表）。
3. **事务一致 + 删除组后有效查询不再返回**：✅ 原子性用例（失败无部分写入）+ 集成（拒绝后成员原样）+ Service delete 先删成员。
4. **双租户/数据范围/逻辑删除/停用锁定/停用组结果集 + 跨租户/不可见/不存在 ID 拒绝**：✅ 集成 7 用例（DEPT 过滤、超管短路、CUSTOM 空恒假、候选范围、跨部门拒绝、停用拒绝）；租户隔离由既有拦截器链 + 唯一索引（不同 tenant_id 同 code 共存用例）。
5. **零隐式授权（权限快照等价）**：✅ 集成 `noImplicitAuthorization`（角色/菜单/数据权限表零改动 + 登录上下文不变）+ Service 构造器契约断言。
6. **菜单可达 + 401/403/成功**：✅ 前端菜单种子（`system:userGroup:list`）+ 权限注解契约测试（Controller 11 端点注解值断言）；401/403 由既有 Spring Security 链路（与 P24 已验证端点同机制，未重复起服务）。
7. **H2/PG 迁移一致 + 新库全链 + V33→34 升级链 + 唯一性/逻辑删除/冲突安全**：✅ FlywayFullChainH2Test 13 用例（34 迁移、V33→34 升级链、23505 逻辑删除唯一语义、V31 冲突哨兵回归）+ FlywayFullChainPostgresTest 9 用例（34 迁移、V32→34 升级链、V13 checksum 守卫）；V1-V33 零改动。
8. **前端专项 + 四连**：✅ UserGroupList.spec 6 用例 + userGroup.spec 11 用例（17 新增）；typecheck ✅ / lint 0 问题 / test 71f/644t ✅ / build ✅（2G 上限串行）。
9. **项目级全量 + 基线**：✅ 后端 **1270/0/0/0**（600 基线 + 用户组 34 专项 + PG 全链计数更新）BUILD SUCCESS；前端 **71 spec files / 644 tests**（69/628 + 2f/16t）。
10. **2G 上限 + 前后端互斥**：✅ 全部 mvn 命令 `MAVEN_OPTS="-Xmx2g"`、pnpm 命令 `NODE_OPTIONS="--max-old-space-size=2048"`；前后端编译严格串行（后端全量先完成后前端四连）；PG/真实服务未运行（环境待办保留，与 I52/D101 同口径）。
11. **§3.3 第10项全量同步**：✅ 见 §五。

## 五、知识同步明细（§3.3 第10项）

| 文件 | 变更 |
|------|------|
| `Smart-WorkFlow/功能清单.md` | M01-F04-01 ⬜→🟦（描述注明消费端未接不升 ✅）；新增终态注释 ✅21/🟦29/⬜40；M02-F01-01 等无关行零漂移 |
| `knowledge/known-issues.md` | I36 索引行 → ✅ 已修复（用户组绑定语义）；I36 详细条目前置当前修正段（2026-08-19） |
| `knowledge/current-status.md` | 数据库 V34、功能清单统计、测试基线 1270/71f-644t 更新；新增最近完成段（待 D113 验收） |
| `knowledge/session-handoff.md` | 候选池更新（I36 已闭环待验收、M02-F02/F03 并列候选） |
| `todo/requirement-pool.md` | P28 → 已实现待 D113 核销；P1 状态更新（I36 关闭、其余项待排期） |
| `memory/state.md` / `features.md` / `handoff.md` / `issues.md` | 进行中功能/待办/基线同步（1270、71f/644t、V34、✅21/🟦29/⬜40、P28 待核销） |

**边界说明**：M01-F04-01 本轮完成后最多 🟦（消费端未接）；P28 仅在规划层最终验收与阶段三全量同步完成后核销；无关清单行零漂移。

## 六、回执与测试证据

- 测试回执：`receipts/test-receipt.md`（命令、退出码、计数）
- 方向：`ready/direction-user-group-membership.md`（未修改）
