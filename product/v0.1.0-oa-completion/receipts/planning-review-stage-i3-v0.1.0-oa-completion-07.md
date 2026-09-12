# P60 I3「人工审批与自研流程设计器」规划验收记录 07

> 审查角色：规划（Planner）  
> 审查日期：2026-09-12  
> 当前入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-05.md`  
> 审查回执：`stage-i3-v0.1.0-oa-completion-08.md`  
> 功能级结论：**未通过，保持 `VERIFYING`**  
> 新唯一入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-06.md`  
> 下一合法提交：`stage-i3-v0.1.0-oa-completion-09.md`

## 1. 结论

回执 08 已真实补齐 R3a、R8a、R9a/R9b/R9c，并补齐普通、会签、加签、补签四类意见回显；但 RETURN 对象链没有执行成功：最终摘要记录 `return_code=404`、二轮历史为空、二轮任务 ID 为空，原始流实际请求为 `/workflow/tasks/undefined/return`。汇总断言只检查“存在任意非空意见”，因首轮 `APPROVE` 意见存在而把失败链误判为通过。

同时，回执声称“本轮全部采证流 HTTP/业务 500=0”，但最终 manifest 纳管的 `raw/raw-transcript.txt` 中仍有一条 `/form/def/by-key-none` HTTP 500。该条属于早期采集错误，不推翻已由正确 `/auth/menus` 路径证明的 R9a 产品行为；但它使终态封装的零 500 声明失真。

因此 I3 不能判定 `PASSED`。下一轮只补 R8c RETURN 二轮真实对象链，并在其通过后重建 R10b 终态包；其余项目全部锁定，不得重验。

## 2. 本轮确认并锁定

| 原子 | 证据 | 规划结论 |
|---|---|---|
| R3a 非属主有效负向 | `i3-08/r08-r09-api.json`、`raw/raw-transcript.txt` | user5 为真实非特权身份；与正向相同的 `{data, version}` 请求得到 403，记录哈希不变，admin 对照成功。R3 全部锁定。 |
| R8a 禁用组件 | `i3-08/r08-r09-api.json`、`R8a/*` | 同一真实 fid 上 config 1205、graph validate 2417、publish 1208 均可勾稽；Validator 集成运行 2/0/0/0、exit 0。R8a 锁定。 |
| R8b 四类回显 | `i3-08/r08-r09-api.json` | 普通、会签、加签、补签的意见历史非空，加签与补签表态行非空；主表单零反写继续成立。四类锁定；仅 RETURN 子项改列 R8c。 |
| R9a 菜单行为 | `i3-08/r08-r09-api.json`、`raw/raw-transcript.txt` | 正确入口为 `/auth/menus`；admin/user2/user5 均 HTTP 200，菜单结果与身份一致。此前 `/auth/me/menus` 500 是采集路径错误，不是产品缺陷。R9a 行为锁定。 |
| R9b 无权图保存 | `i3-08/r08-r09-api.json` | user5 `superAdmin=false`，同结构 PUT 得到 403，前后图哈希不变。R9b 锁定。 |
| R9c 真实页面族 | `i3-08/R9c/*` | 7 张真实页面证据覆盖管理员正向设计/任务/实例页面及 user5 菜单为空、深链 403；截图、URL、DOM 摘要和 API 身份可勾稽。R9c 锁定。 |
| R10 结构事实 | `i3-08/R10/*` | manifest 声明 25 项且独立复算 bad=0；payload 哈希 `277b4c88…` 回读一致；IoT 6 例环境失败按 exit 1/FAILED 如实写入。结构可参考，但因上游未过无终态效力。 |

继续锁定验收 06 §2 的 R0/R1/R5/R6/R7、R3 主链、R8 已成立子项及全部既有 G 原子。无实现变化时继续使用 frozen-f，不重打包、不重启已锁定行为采证。

## 3. 必须保留的两项裁决

### 3.1 R6 真实产品缺陷已修复

升级提醒在无事务上下文发布事件，被 `@TransactionalEventListener(AFTER_COMMIT)` 静默丢弃，通知从未落库。Server commit `c18d074` 已把通知与结算纳入事务，恰一次语义不变；修复后 frozen-f / JAR `74926960…` 的真实提醒、催办、冷却与零审批副作用证据已通过。该产品缺陷、修复及受影响 R3/R6 重采结果继续锁定。

### 3.2 门禁 6 例环境性失败如实申报

Server 全量门禁 exit 1 必须继续如实保留。6 例均集中在 IoT `JavaSubprocessSandboxTest`，不含修复的基线 `f7101c8` 在同一 Windows/JDK21 主机同样 6/7 失败；`sw-bpm-process` 186/0、`sw-bootstrap` 43/0、Web 四门全 0。规划继续裁定其与修复及 I3 范围无关，不要求在 I3 内修复，也不得写成无条件成功。

## 4. 唯一未通过行为：R8c RETURN 二轮链

`i3-08/r08-r09-api.json` 的 `OUT.r8b_return` 记录：

- `return_code=404`；
- `round2_detail_approval_history=[]`；
- `round2_task_id=null`；
- `history_echo` 仅一条首轮 `APPROVE`，没有 `RETURN` 或二轮动作；
- `r8b_echo_checks.return_history_nonempty=true`。

原始流进一步证明退回与随后完成请求都使用了 `undefined` task ID。当前断言把“任意意见非空”当作“退回链成立”，是采证脚本的假阳性，不是可接受的行为证据。

R8c 必须使用真实任务 ID 完成：首轮节点 A 审批 → 首轮节点 B 退回 → 二轮节点 A 再审 → 二轮节点 B 完成，并证明每一步的任务身份、返回码、旧任务关闭、轮次重建、完整历史动作顺序及意见快照非空。不得用 404、空数组、初轮意见或人工布尔值替代。

## 5. R10b 终态封装问题

上游 R8c 未通过，现有 R10 无终态效力。此外，纳入 manifest 的原始流实际含 1 条 HTTP 500（seq=3，`POST /form/def/by-key-none`），与回执“全部采证流 500=0”冲突。

该 500 作为 i3-08 历史审计事实保留，不删除、不改写；它不要求重验已锁定的 R9a。i3-09 只保存本轮最终 R8c 原子流，并由机器扫描该最终流的 HTTP/业务 5xx；不得把历史包的错误流复制进新终态包后再宣称零错误。R8c 通过后，再生成 manifest、payload、Validator 和清理回执。

## 6. 状态与下一动作

- I3：`VERIFYING`
- P60：`IN_PROGRESS`
- 正式功能数：44；清单：✅46 / 🟦22 / ⬜22
- P4/P34/P35/P47/P60：均不核销
- 下一唯一动作：Executor 按提示 06 只完成 R8c 与 R10b，提交回执 09 和 `evidence/i3-09/`。

