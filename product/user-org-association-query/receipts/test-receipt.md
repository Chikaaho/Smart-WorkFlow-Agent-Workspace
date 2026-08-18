# user-org-association-query 测试回执

## 命令与结果

| 阶段 | 命令 | 退出码/结果 |
|---|---|---|
| 后端关联专项 | `MAVEN_OPTS='-Xmx2g' mvn -pl sw-biz/sw-biz-system/sw-biz-system-biz -am -Dtest=UserAssociationQueryIntegrationTest,UserAssociationContractTest -Dsurefire.failIfNoSpecifiedTests=false test` | 0；6/0/0/0 |
| Flyway H2 全链 | `MAVEN_OPTS='-Xmx2g' mvn -pl sw-bootstrap -am -Dtest=FlywayFullChainH2Test -Dsurefire.failIfNoSpecifiedTests=false test` | 0；10/0/0/0；新库 V1→V32、V31→V32 migrate+validate；冲突哨兵通过 |
| 后端全量（普通沙箱） | `MAVEN_OPTS='-Xmx2g' mvn test` | 1；Agent 21 项本地 HTTP 测试 Socket Operation not permitted |
| 后端全量（授权环境） | `MAVEN_OPTS='-Xmx2g' mvn test` | 0；31/31 模块 BUILD SUCCESS；Surefire 563/0/0/0 |
| 前端门禁 | `NODE_OPTIONS='--max-old-space-size=2048' pnpm typecheck && NODE_OPTIONS='--max-old-space-size=2048' pnpm lint && NODE_OPTIONS='--max-old-space-size=2048' pnpm test -- --run && NODE_OPTIONS='--max-old-space-size=2048' pnpm build` | 0；66 files / 577 tests，全绿；构建第三方警告不影响产物 |

## 专项证据

- 双租户/数据权限：同一查询在 tenant、部门数据范围下只返回授权用户；其他租户、越权部门、逻辑删除用户/关系、停用岗位/角色均排除。
- 事务回滚：故意传入不存在角色导致关系写入失败，用户主记录与关系计数均为 0。
- 边界：非法岗位/角色 ID、空结果均稳定返回；组合查询总数准确且无重复。
- 前端 Mock：handlers 支持全部筛选和关联 GET/PUT；superadmin 绑定返回 403；岗位/角色空数组清空在 API 测试中通过。seeds 已补关联字段。
- 互斥：每次门禁前尝试 `pgrep -af 'mvn|surefire|java'` 或 `pgrep -af 'pnpm|node|vitest|vite'`；系统统一返回 `sysmond service not found / Cannot get process list`。前后端实际严格串行，无同时启动记录。

## 未完成与阻塞

PostgreSQL 运行期验证无法在当前环境执行：`psql`/`postgres` 不存在，Docker 报 `Cannot connect to the Docker daemon at unix:///var/run/docker.sock`。系统进程快照同样被 sysmond 拒绝。除这两项环境证据外，D98 范围实现和测试已完成；本回执不使用 PARTIAL。
