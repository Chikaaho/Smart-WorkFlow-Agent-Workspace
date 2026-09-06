# P4 当前实现验证证据

## 代码与构建

- 后端使用包含本轮代码的 `sw-bootstrap` 聚合包启动；启动健康检查：`GET /api/actuator/health` 返回 `status=UP`，H2 与 Redis 均为 `UP`。
- 后端迁移启动回读为 V54 表单可见范围与 V53 中台菜单/权限迁移已执行；数据库夹具验证使用 H2，未触达生产或真实设备。
- `FormDefEntity.visibilityScope` 使用 MyBatis-Plus `updateStrategy=ALWAYS`，保证管理员以空用户集恢复全租户可见时真正写入 `NULL`；上述 G1b API 回读已验证。

## 后端测试

定向 XL 目标测试（修复旧双参隔离构造器的 P0 测试兼容语义后）通过，命令：

```text
MAVEN_OPTS='-Xmx2g' mvn -q -pl sw-biz/sw-bpm/sw-bpm-process,sw-biz/sw-biz-form/sw-biz-form-biz -am -Dtest='FormDefinitionServiceTest,FormDefinitionControllerAuthorizationTest,CommandDispatcherTest,CommandDispatcherP0PriorityTest,BpmCommandQueueContractTest,PersistentBpmCommandQueueContractTest,CommandQueueIntegrationTest' -Dsurefire.failIfNoSpecifiedTests=false test
```

结果：process exit `0`；覆盖表单可见性、P0 消费前权限、NORMAL/P0 双车道、持久队列提交可见性、stale 回收、重复投递、竞争领取与 P0 优先。

Flyway 链校验也已通过：修正 V54 尾部断言后，H2 全链达到 54 条迁移，PostgreSQL 兼容夹具达到 53 条迁移。

全量命令：

```text
MAVEN_OPTS='-Xmx2g' mvn -q test
```

本回执仅在该命令最终 exit `0` 后提交；此前一次全量运行暴露的 `FormDataIsolationIntegrationTest` 测试替身缺少 `isCurrentUserVisible` 默认契约，已补齐后重新执行。

全量 Surefire 扫描共 169 个报告文件，未发现 failure/error 计数（`NO_FAILURE_OR_ERROR_COUNTS`）。

## 前端门禁

| 门禁 | 结果 |
| --- | --- |
| `NODE_OPTIONS='--max-old-space-size=2048' pnpm typecheck` | exit `0` |
| `NODE_OPTIONS='--max-old-space-size=2048' pnpm lint` | exit `0` |
| `NODE_OPTIONS='--max-old-space-size=2048' pnpm test -- --run` | `121 passed / 1 skipped`；`1153 passed / 3 skipped` |
| `NODE_OPTIONS='--max-old-space-size=2048' pnpm build` | exit `0`；`1840 modules transformed`，`built in 14.15s` |

构建过程仅有依赖包 `@vueuse/core` 的 Rolldown `INVALID_ANNOTATION` 警告，未阻断构建，不属于本轮源码错误。

## 代码范围检查

- 前端删除用户发起时的流程候选加载、流程选择参数与流程选择 UI；保留草稿/待办/我发起/我的已办与后端契约。
- 后端保留流程定义管理、关联流程、中台表单定义与现有接口；新增能力只在已发布表单绑定、发起可见范围、命令队列与 P0 权限链路上落地。
- 未新增流程中心分类页、双视角流程中心或流程中心完整编排；本轮仅保留中台能力与接口契约。
- 新增真实业务与重启证据见 `product/p4-oa-personal-center-dual-dispatch/evidence/03/live-business-20260905.md`，覆盖会签 `ANY` 首个有效动作、指定节点退回、持久队列重启恢复及身份/P0 权限边界。
