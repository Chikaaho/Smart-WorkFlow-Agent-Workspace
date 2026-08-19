# 功能追踪：user-group-membership（P28 / I36 / M01-F04-01 基础子集）

> 工作区统一知识库 — 单功能规划与追踪。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | M01-F04-01（P28 / I36 用户组绑定） |
| 功能名称 | 用户组维护与成员绑定基础闭环 |
| 功能目标 | 租户内扁平虚拟用户组的维护与成员多对多绑定闭环，为后续流程/权限消费提供引用基础（本轮不接消费端） |
| 创建日期 | 2026-08-19（D112 方向下发） |
| 当前状态 | **COMPLETED**（D117 PASSED + 阶段三同步，2026-08-19） |
| 涉及模块 | 后端 sw-biz-system / 前端 Smart-WorkFlow-Web system 模块 |

## 2. 功能生命周期

| 阶段 | 状态 | 说明 |
|------|:---:|------|
| 规划（D112） | ✅ | 方向 `product/user-group-membership/ready/direction-user-group-membership.md`：扁平虚拟组、稳定业务标识、用户多对多、状态/逻辑删除、独立权限；非角色/数据权限主体，不接 BPM/权限消费端 |
| 执行 | ✅ | V34 双端迁移 + 后端领域 + 前端页面/API/Mock/菜单/权限（见 §3） |
| 功能级验收 | ✅ | D113 FAILED（标准4/6/8/9/10/11）→ D114 FAILED（标准9/10/11）→ D115 FAILED（标准11）→ D116 FAILED（标准11 提交后当前态）→ **D117 PASSED**（十一项全通过） |
| 阶段三 | ✅ | 终态同步 COMPLETED（2026-08-19）：I36 关闭、P28 核销、M01-F04-01 🟦 确认、基线 647/71f·646t/V34、功能数 24→25 |

## 3. 实现要点（CONFIRMED）

- **迁移 V34**（H2/PG 双份逐字一致）：`sys_user_group`（group_code 租户内唯一 + 逻辑删除唯一语义）+ `sys_user_group_member`（tenant_id, group_id, user_id, deleted 唯一）。
- **后端**：SysUserGroup/SysUserGroupMember 实体、2 Mapper、SysUserGroupService(+Impl)、UserGroupController（`/system/user-group/**`）。
  - 组 CRUD/启停/逻辑删除（停用保留配置与成员）；成员保存/整量替换/追加/移除/清空/回填，主记录与成员事务一致。
  - 数据范围：组列表/候选按「组内成员用户部门命中当前数据范围」EXISTS 语义（`/{id}` 路由以 `\d+` 限定，避免吞 `/candidates`）。
  - 成员绑定校验与候选列表同源（同租户 + 未删除 + 启用 + 数据范围内可见），拒绝不产生部分写入。
  - 零隐式授权：构造器仅注入组成员/用户 mapper 与登录上下文；不触碰 sys_user_role/sys_role_menu/sys_role_dept。
  - 权限：查看 `system:userGroup:list`、管理 `system:userGroup:manage`。
- **前端**：UserGroupList 页面（列表/筛选/新建/编辑/启停/删除/成员多选/失效成员展示）、api/userGroup.ts、types/userGroup.ts、Mock（seeds + 9 端点 + 菜单/权限种子）。

## 4. 测试门禁（CONFIRMED）

- 后端专项 45：Controller 12 + Service 15 + 集成 12（边界/原子性）+ 授权 6（请求级 401/403/成功）。
- Flyway H2/PG 全链 34 条 migrate+validate + V32/V33→V34 升级链 + 逻辑删除唯一语义（23505）+ V13 checksum 守卫。
- 项目级 **647/0/0/0**（surefire XML 聚合 109 文件；1292 系重复累计弃用）；前端 **71 spec files / 646 tests / 0 failures** 四连全绿（2G 上限、前后端串行）。

## 5. 终态（2026-08-19，D117 PASSED + 阶段三 COMPLETED）

- 功能：**COMPLETED**；方向归档 `product/user-group-membership/passed/`。
- **I36 关闭**（用户组绑定缺口；不扩大为流程/权限消费端已完成）。
- **P28 核销**。
- M01-F04-01：**🟦**（消费端未接不得升 ✅）；清单终态 ✅21/🟦29/⬜40 共 90。
- 基线：后端 647/0/0/0、前端 71f/646t、Flyway V34 双方言 34 条全链；已完成功能 24→25。
- 回执：`product/user-group-membership/receipts/`（D113-D117 审查链 + stage3-closeout-receipt-d117.md）。
