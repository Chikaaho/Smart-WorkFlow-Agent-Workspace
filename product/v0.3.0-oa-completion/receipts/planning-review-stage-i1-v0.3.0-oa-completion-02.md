# P60 I1「组织与权限底座」规划验收 02

> 验收角色：规划（Planner）  
> 验收日期：2026-09-09  
> 执行回执：`stage-i1-v0.3.0-oa-completion-02.md`  
> 上轮审查：`planning-review-stage-i1-v0.3.0-oa-completion-01.md`  
> 结论：**VERIFYING，I1 仍未通过**

## 1. 总体结论

本轮补齐了大量真实 HTTP、H2、浏览器和工程原始输出，G4 选人权威解析与 G6 fail-secure 已达到通过条件，G1/G2/G3/G5/G7 的部分原子也可锁定。但证据中同时出现了与回执结论相反的真实结果：

1. 部门管理页面已配置部门的“负责人”列为空；角色成员弹窗显示 `No Data`，未证明页面端成员维护闭环；
2. tenant 5 主体未取得有效会话，其所谓跨租户请求均为未认证 401，不能证明 tenant 5 登录主体的本租户正向与反向隔离；
3. 待办拒绝请求实际为 `POST /workflow/tasks//complete`，任务 ID 为空；随后同一真实任务被重新登录后的主体成功办理，不能替代“停用主体持原 token 对该任务办理被拒绝”；
4. 动态选人流程的实例详情把 n1 `DEPT_LEADER` 和 n3 `DEPT_POST` 显示为发起人，并真实产生 `AssertionError: 历史名被改写！`；另建 `FIXED_USER` 实例通过不能替代该失败对象；
5. `MANIFEST-SHA256.txt` 将自身写入清单并混用两种路径基准，无法在任一声明 cwd 一次校验通过；终态 Validator 文件同时保留一次 `False` 和一次 `True`。

G5 属于同一缺口连续第二次未通过，按 Planner 规则下发一级补充执行提示。

## 2. 缺口核销矩阵

| 原缺口 | 原子结果 | 核查结论 |
|---|---|---|
| G1 真实组织管理 | G1a 后端 HTTP CRUD、边界与持久化回读通过；G1b 页面负责人回显、角色成员实际维护未通过 | **部分通过** |
| G2 三类身份与负向权限 | G2a admin、普通无权用户、停用用户的真实身份正反向通过；G2b 非零租户主体会话与双向租户隔离未通过 | **部分通过** |
| G3 权限即时收敛 | G3a 同 token 停用、撤菜单、撤角色后 401/403 通过；G3b 指定真实待办的停用后办理拒绝未通过 | **部分通过** |
| G4 选人权威解析 | 同一真实流程中 FIXED_USER、DEPT_LEADER、POST、DEPT_POST 的任务命中、负向排除、推进与快照回读可勾稽 | **PASSED，锁定** |
| G5 历史身份冻结 | G5a 快照表 participant ID/name 冻结通过；G5b 实例详情对候选策略返回错误主体，断言实际失败 | **部分通过，G5b 未通过** |
| G6 fail-secure | 5 个故障注入集成测试证明异常抛出及事务回滚；正常恢复后同 token 401，原 TTL 降级声明已被替换 | **PASSED，锁定** |
| G7 门禁与候选 | G7a Server 12 模块 1222/0/0/0、Web 四门禁、工作树指纹均可回读；G7b manifest 与 Validator 最终封装未通过 | **部分通过** |

## 3. 直接证据指针

- G1b：`evidence/i1-02/browser/03-admin-dept-list.png` 的负责人列为空；`06-admin-role-members.png` 显示 `No Data`。
- G2b：`evidence/i1-02/g2-identity-matrix.txt:34-53` 中 tenant 5 的 `/auth/me`、本租户和跨租户请求全部为 401。
- G3b：`evidence/i1-02/g4-g5-process-chain.txt:41-66` 中已返回真实 taskId，但提取变量为空，实际请求为 `/workflow/tasks//complete`。
- G5b：同文件 `:154-170` 中 n1/n3 的 assignee/assigneeName 与快照表不一致，并以 AssertionError 终止断言。
- G7b：`evidence/i1-02/MANIFEST-SHA256.txt` 含自身哈希、27 条 `./` 路径和 2 条 workspace 相对路径；Planner 从两个可能 cwd 复算均无法全绿。`terminal-validator.txt` 同时包含 `payload == validated input: False` 与 `True`。

## 4. 已锁定且禁止重验

以下证据在实现未触及对应路径时继续有效：

- ADV 64 条清单同步；
- G1a 后端组织管理 HTTP/SQL 链；
- G2a admin、普通无权、停用用户的身份与 401/403；
- G3a 停用、撤菜单、撤角色后的同会话收敛；
- G4 四种参与人策略的真实任务命中与流程推进；
- G5a `sw_bpm_participant_snapshot` 五行冻结数据；
- G6 故障注入回滚；
- G7a 当前候选 Server 1222/0/0/0、Web 1176+3skip 与四门禁 exit=0。

若修复触及上述路径，只重验实际受影响原子，并写明快照失效依据。

## 5. 下一执行入口

一级补充执行提示：

`product/v0.3.0-oa-completion/receipts/planning-execution-prompt-v0.3.0-oa-completion-i1-01.md`

下一回执：

`product/v0.3.0-oa-completion/receipts/stage-i1-v0.3.0-oa-completion-03.md`

本轮只剩 G1b、G2b、G3b、G5b、G7b。I1 继续保持 VERIFYING，不进入 I2；终态账本必须如实列出这些剩余 actionable 原子，未全部关闭前不得再次声明零剩余工作。

## 6. 裁决

- I1：**VERIFYING，暂不 PASSED**。
- 已完整锁定：G4、G6。
- 已部分锁定：G1a、G2a、G3a、G5a、G7a。
- 唯一剩余账本：G1b、G2b、G3b、G5b、G7b。
- 下一动作：Executor 按一级补充提示修复 G5b 等实际缺陷、重取同对象行为证据并修正终态封装。
