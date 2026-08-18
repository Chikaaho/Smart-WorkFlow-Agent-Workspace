# user-org-association-query：人员组织与授权关联查询

## 当前状态

2026-08-18 已完成 D98 方向内实现并通过 D101 规划层最终验收；阶段三终态同步完成。I32、I34、I35 已关闭；I36 仅关闭用户-普通角色绑定管理子集，用户组绑定语义保留。

## 实现闭环

- 后端新增 `sys_user_post` V32 H2/PostgreSQL 迁移、实体和 Mapper。
- 用户创建/更新通过 `createWithAssociations` / `updateWithAssociations` 在同一事务内写入主记录、岗位关系和角色关系；非法关系故障注入证明整体回滚。
- 查询支持关键字、状态、部门含下级、岗位、角色组合条件，使用 `EXISTS`、`DISTINCT`，并保留租户、逻辑删除、数据权限过滤；H2 集成测试覆盖双租户、停用/删除关联和无效 ID。
- 服务端拒绝普通入口绑定或解绑 `superadmin`；岗位/角色只允许启用项。
- 前端部门选择、岗位/普通角色多选、清空/替换/回填及用户关系 API 已接通；Mock handler、种子和专项 API 测试已补齐。

## 验证证据

- 后端模块编译退出码 0。
- 关联/事务/权限/查询集成与契约测试：6 tests，0 failures，0 errors。
- Flyway H2：全新库 V1→V32 migrate + validate 通过；V30→V31 冲突哨兵通过；10 tests 通过。
- 前端：typecheck、lint、66 files / 577 tests、build 全部退出码 0。

## 未闭合验证与真实外部阻塞

- PostgreSQL 本地客户端/服务不可用，Docker daemon 未运行，无法完成 PostgreSQL 全新库和 V31→V32 运行期 migrate + validate。
- 后端项目级 `mvn test` 已在授权环境 31/31 模块通过，Surefire 563/0/0/0；普通沙箱 Agent HTTP socket 限制已通过授权运行排除。
- PostgreSQL 运行期与 `ps/pgrep` 进程快照分别登记为非阻塞环境待办：当前无 PG/Docker daemon，sysmond 拒绝进程列表。

## D101 阶段三终态同步

- 功能状态：`COMPLETED`；主方向已归档至 `product/user-org-association-query/passed/`。
- 验收：D101 `PASSED`，依据 `receipts/planning-final-review-d101.md`；执行/测试回执已更新。
- 环境待办：具备 PostgreSQL 后补 V32 新库及 V31→V32 运行期 migrate+validate；系统恢复进程可观测能力后补互斥快照。
