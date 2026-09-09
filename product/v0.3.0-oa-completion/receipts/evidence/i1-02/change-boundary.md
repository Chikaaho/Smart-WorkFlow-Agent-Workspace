# 存量改动与 I1 变更边界分类（验收 01 · G7）

> 收集时间：2026-09-09；候选：workspace 7712fa5 / server 3aec762 / web 8d26f61（见 identity.txt）。
> 完整 name-status 清单见 `diff-name-status.txt`；工作树指纹见 `worktree-fingerprint.txt`。

## A. I1 任务改动（本次与首轮 I1 执行产生）

- **workspace 仓**：`knowledge/current-status.md`、`knowledge/features/v0.3.0-oa-completion.md`（I1 状态同步）；`product/v0.3.0-oa-completion/receipts/` 下 `stage-i1-...-01.md`、`evidence/i1-01/`、`evidence/i1-02/`、`planning-review-stage-i1-...-01.md`（规划侧文件，Executor 只读不动其内容）。`memory/*` 为此前获得状态同步授权的轮次写入，本轮不再修改。
- **server 仓**：
  - I1 主实现（首轮）：`sw-biz-system-*`（controller/entity/mapper/service/api/user facade）、`sw-bpm-*`（策略/翻译器/监听器/快照/实例控制器）、`V67__i1_org_permission_foundation.sql`（h2+postgresql）、新增测试 `orgfoundation/`、`engine/participant/`、`ParticipantNameSnapshotTest`、`ProcessStartInitiatorValidationTest`（详见回执 01 修改清单）。
  - I1 补证修复（本轮，G6 fail-secure）：`SysUserServiceImpl`、`SysRoleServiceImpl`（驱逐失败改为抛出+回滚+审计日志，仅容忍 NoSuchBeanDefinition）；`RoleMenusContractAndSecurityTest`（补 `sys_user_role` 表结构与成员行，真实反查）；新增 `PermissionConvergenceFailSecureTest`（5 用例）。
- **web 仓**：
  - I1 主实现（首轮）：`modules/system/{types,api,views}`、`foundation/mock/handlers.ts`、`foundation/mock/seeds.ts`、新增 `i1-org.spec.ts`、`i1-org-handlers.spec.ts`、既有 `user.spec.ts`、`RoleList.spec.ts`、`permission.spec.ts`、`auth-session.spec.ts` 适配。
  - 归属说明（验收 01 点名）：`src/foundation/mock/notify-batch-send.evidence.spec.ts` 的 1 行改动为 `postIds: []` → `posts: []`，是 I1 用户岗位契约从 ID 数组升级为对象数组后对既有 mock 证据 spec 的必要适配（diff 见下），属 I1 改动而非无关存量。

## B. 存量改动（非 I1 产生，本轮回执不主张、不删除、不回滚）

- **server 仓** `D product/bpmn-adapter/...`、`D product/p4-oa-personal-center-dual-dispatch/...`（38 个删除）：上一功能（P4 双通道）会话在 server 仓内遗留 product 证据目录的删除，早于 I1 开始即存在；未提交、未恢复，维持原状。
- **server 仓** `?? sw-bootstrap/uploads/`：运行期本地存储提供者的上传目录（dev profile 副产物），非代码改动。
- **web 仓** `?? f-cfg.json`、`?? f-cfg-fix.json`、`?? graph.json`：P4 会话遗留的表单/流程图草稿 fixture（内容为 P4 报销表单与流程图），非 I1 改动，维持原状。

## C. 归属说明附件

```
$ git -C Smart-WorkFlow-Web diff src/foundation/mock/notify-batch-send.evidence.spec.ts
@@ -134,7 +134,7 @@
-      postIds: [],
+      posts: [],
```
