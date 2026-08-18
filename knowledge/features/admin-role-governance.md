# P24 / I49：不可变超管与可配置管理员角色

| 字段 | 值 |
|------|-----|
| 状态 | 规划层最终验收 PASSED（D96，阶段三知识同步中；P24/I49 关闭条件满足） |
| 方向 | `product/admin-role-governance/passed/direction-admin-role-governance.md` |
| 回执 | `product/admin-role-governance/receipts/admin-role-governance-completion.md`；阶段三 `product/admin-role-governance/receipts/post-acceptance-knowledge-sync.md` |

## 已交付

- 后端保护 `built_in=true` 且 `code=superadmin` 的角色，覆盖改名、改 code、停用、删除、数据范围及菜单授权写入；保留 code 旁路。
- 新增 H2/PostgreSQL V31：安全条件下 seed 启用、非内置、ALL 数据范围的 `admin` 角色；显式 seed 现有菜单/按钮及 job/storage 方法权限；不创建用户、不改绑用户。
- 新增角色菜单读取/写入和用户角色读取/写入接口；job/storage 控制器增加方法级 permission。
- 前端角色页对超管只读并提供菜单/按钮权限树，用户页提供角色绑定/回填；mock 纠正 `superadmin`/`admin` 语义。

## 验证

- 前端四连：typecheck、lint、66 spec/576 tests、build 全部退出码 0。
- 后端项目级全量：551 tests / 0 failures / 0 errors / 0 skipped；新增 job/storage 请求级 MockMvc 鉴权测试 4 tests 全绿。
- Job/storage 请求级 allow/deny：普通 admin 带权限返回 200，撤权返回 403，未认证返回 401；PermissionService 覆盖撤权拒绝与 superadmin 旁路。
- FlywayFullChainH2Test：31 条迁移 migrate + validate 通过，H2/PostgreSQL V31 逐字一致；V31 冲突显式失败有断言。
- 前后端编译互斥：提权进程快照在两个编译阶段均无竞争进程，后端 compile 与前端 typecheck 严格串行通过。

## 边界

本轮未新增默认账号、未迁移现有用户绑定，未处理 P1 其余组织关联/筛选缺口；未执行真实 PostgreSQL 部署联调，使用 H2 全链、双方言一致性和请求级自动化证据完成验收。

## 修正与最终验收轨迹

- D94：FAILED，发现 V31 冲突语义、请求级鉴权、全量回归/互斥证据、功能清单明细缺口。
- D95：FAILED，执行层补齐 V31 显式失败、551 全量回归、job/storage MockMvc allow/deny、互斥快照及清单零变化计数。
- D96：规划层最终验收 PASSED，十一项验收标准全部满足；主方向已归档至 `product/admin-role-governance/passed/`。
