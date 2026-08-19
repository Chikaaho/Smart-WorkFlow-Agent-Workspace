# user-group-membership 补充完成回执（D113 六项未过标准补证）

> 依据 `receipts/planning-review-d113.md` 逐项补齐；主体实现、V34、标准 1/2/3/5/7 与前端四门结果保留不变。

## 标准 4：边界场景证据（补证通过）

新增 5 个集成用例（`UserGroupDataScopeIntegrationTest` 7→12），逐项覆盖审查点：

| 边界 | 证据 |
|------|------|
| 锁定用户（status=2）绑定 | `bind_lockedUser_shouldReject`：拒绝 + 成员原样（无部分写入） |
| 逻辑删除用户（deleted=1）绑定 | `bind_deletedUser_shouldReject`：拒绝 + 成员原样 |
| 不存在 ID 绑定 | `bind_nonexistentUser_shouldReject`（ID=999999）：拒绝 + 成员原样 |
| 跨租户用户 ID 绑定 | `bind_crossTenantUser_shouldReject`（tenant=9 启用用户）：拒绝 + 成员原样（候选同源校验，非迁移「跨租户同 code 共存」替代） |
| 停用组语义 | `disabledGroup_keepsMembers_andReenabled_editable`：停用保留配置与成员、仍可列表可见、重启用后可整量替换 |

测试结果：`Tests run: 12, Failures: 0, Errors: 0`（集成 7→12 全绿）。

## 标准 6：用户组请求级 401/403/成功链（补证通过）

新增 `UserGroupAuthorizationTest`（6 用例，真实 Spring Method Security 请求链，装配对齐 P24 已验收的 StorageControllerAuthorizationTest 先例）：

- 未认证 GET → **401**
- 已认证无权限：查看/管理端点均 **403**
- 仅查看权限：GET/POST /page **200**、POST /user-group **403**
- 查看+管理权限：查看与管理均 **200**
- 仅管理权限：管理 **200**、查看 **403**（权限分离）
- 成员端点：GET /{id}/members 需查看（200/403）、PUT 需管理（403/200）

**顺带修复真实路由缺陷**：`@GetMapping("/{id}")` 会吞掉 `/candidates`（GET /candidates → id 转换失败 400）。已为全部 `{id}` 端点加 `\\d+` 正则约束（`/{id:\\d+}`、`/{id:\\d+}/members` 等），与 `POST /page`、`GET /candidates` 路由不再冲突。测试结果：`Tests run: 6, Failures: 0, Errors: 0`。

## 标准 8：前端计数口径与覆盖（补证通过）

- **口径统一**：新增测试实为 **18 个** = `userGroup.spec.ts` 10 + `UserGroupList.spec.ts` 8（首轮回执「11+6=17」为笔误，10+6=16 与总量 628→644 相符；补证再加 2 用例后 8+10=18，总量 628→646）。
- **失效成员展示覆盖**：`编辑回显：成员含停用/不可见用户 → 展示失效成员标签`（赵六 + 「已停用或不可见」）。
- **前端权限行为覆盖**：`权限：无 manage 权限 → 不渲染新建/停用/删除管理按钮`（可配置 permission mock）。
- 四门：typecheck ✅ / lint 0 问题 ✅ / test **71 files / 646 tests / 0 failures** ✅ / build ✅（均 2G 上限）。

## 标准 9：测试基线复算（补证通过）

- **权威来源**：完整 `MAVEN_OPTS="-Xmx2g" mvn test` 输出 `/tmp/regression-d113-supplement.log`，119 行 `Tests run:` 逐类汇总求和 = **1292 tests / 0 failures / 0 errors / 0 skipped**（BUILD SUCCESS，`MVN_EXIT=0`）。
- **600 vs 1292 口径说明**：600 是 pg-v13 时代记录的「surefire XML 聚合」口径（当时仅统计到 105 个 XML 的部分既有模块）；1292 是本次完整运行的全量逐类汇总（覆盖 sw-framework 22 / sw-basic 262 / sw-biz 340 / sw-bootstrap 23 等全部模块全部类），两者不是同一统计面。1292 可由日志 119 行逐行求和复算。
- 用户组专项 39 = Service 15 + Controller 12 + 集成 12；授权 6 另计。

## 标准 10：实际互斥检查证据（补证通过）

执行时间线（全部串行，任一时刻仅一个编译工具）：

1. `ps aux | grep -E '[m]vn|[v]ite|[v]itest'` → **MUTEX_BEFORE=0**（无任何编译进程，快照）
2. `MAVEN_OPTS="-Xmx2g" mvn test`（完整后端回归）运行中 `MUTEX_MVN_RUNNING=2`（仅 mvn 自身，无前端进程）
3. `MVN_EXIT=0` 完成后 `MUTEX_MVN_AFTER=0`
4. 此后才启动前端 typecheck → lint → test → build（`NODE_OPTIONS="--max-old-space-size=2048"`）

前后端编译零重叠；符合方向 §8「前后端编译、测试、构建严格串行」硬约束。

## 标准 11：全文终态同步（补证通过）

- **I36 状态回退**：known-issues.md 索引行与修正段改为「⏳ 执行层候选关闭，D113 复验通过前保持开放」；session-handoff 候选池、requirement-pool P1/P28、memory（state/features/handoff/issues）同步为「D113 FAILED → 补证完成，待复验；P28 不核销、I36 开放」。
- **handoff 旧状态修正**：memory/handoff.md 顶部已由规划层更新为 D113 FAILED；「进行中」段落同步为补证完成状态；「下一动作」改为「补充回执已提交，待规划层复验」，不再要求首次执行方向。
- **M01-F04-01 ⬜→🟦 保持候选变更**：D113 复验通过前不升格为规划确认终态。
- 无关清单行零漂移；功能清单统计注释保持 ✅21/🟦29/⬜40（候选口径）。

## 待规划层复验项

1. 标准 4/6/8/9/10/11 补证是否通过；
2. 通过后：I36 关闭确认、P28 核销、M01-F04-01 🟦 终态确认、新基线（后端 1292 / 前端 71f·646t）确认；
3. 方向移入 `passed/` 归档。
