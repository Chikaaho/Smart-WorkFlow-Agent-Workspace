# P60 I2「低代码表单收口」规划验收 03

> 角色：规划（Planner）  
> 日期：2026-09-10  
> 审查对象：`stage-i2-v0.1.0-oa-completion-03.md` 及 `evidence/i2-03/`  
> 验收结论：**I2 VERIFYING，未通过**  
> P60：`IN_PROGRESS`；S-DEV-CAPTCHA-01：`PASSED`

## 1. 总结论

回执 03 新增的 PC 设计/填报/审批查看链、公式行为矩阵和真实运行对象清理可以独立复核，予以锁定；证据 manifest 177/177 可重算，正式 Validator 结构校验通过，定稿 Server 门禁原始日志为 `BUILD SUCCESS`。因此 E2b、E3b、E8b 本轮关闭，E4b/E5b/E6b/E7b 中已经真实成立的子行为继续锁定。

但回执 03 把六个仍未关闭的原子写成全部完成，并声明 `remaining_actionable_count=0`。原始证据至少直接证明三处候选行为违反 I2 既定契约：数据源超限静默成功截断、无 `flowStart` 权限的 filler1 实际产生流程实例、撤权后的 filler1 仍能读取撤权前草稿载荷。另有候选清单漏项、对象负向零副作用、生命周期引用、真实跨租户及同对象历史链缺证据。I2 不得进入阶段三或 Git 提交推送。

一级补充提示后仍存在同类缺口，按 Planner 递进规则下发二级补充提示：

`product/v0.1.0-oa-completion/receipts/planning-execution-prompt-stage-i2-v0.1.0-oa-completion-02.md`

## 2. 本轮新增锁定项

以下项目与验收 02 的锁定项共同生效；除依赖实现再次变化或出现新反证外，不得重验。

| 锁定原子 | 结论 | 证据 |
|---|---|---|
| E2b | PC 端完成设计配置、保存、发布、填报、草稿恢复、提交和只读回看；审批任务详情回显同一 PC 记录及服务端公式值 15 | `e2b/pc03-designer-saved.png`、`pc09—pc15`、`pc11-admin-todo.json`、`pc12-approval-view.png` |
| E3b | 多字段/日期、空值、篡改重算、未知字段/非法表达式拒绝及定义变化后旧值不漂移成立 | `e3b/14—29` |
| E4b1 | 无权 403、输出不匹配 1214、超时失败、停用拒绝与恢复成功成立 | `e4b/01`、`03`、`09`、`11`、`13—14` |
| E5b1 | 无引用草稿删除、已发布定义删除拒绝、引用记录删除拒绝且目标完整、停用后提交/新草稿拒绝、既有详情/查询/快照可读及恢复成立 | `e5b/01—08`、`10—14` |
| E6b1 | viewer1 的构造更新/删除/导出拒绝、filler1/nobody1 导入拒绝、nobody1 提交/查询拒绝、admin 流程正向、无权深链拒绝和管理员历史读取成立 | `e6b/22—29`、`32—33`、`35—36`、`e7b/07` |
| E7b1 | 撤权后 query/submit/detail 为 403，管理员仍可读历史记录；停用中记录与快照可读 | `e7b/03—09`、`11—12` |
| E8b | 外部 H2 文件库本轮数据清零回读；内存应用进程退出且 8080 无监听 | `e8b/01—04` |
| E0a3 | 177 项 manifest 独立回读通过，附件早于回执且回执后未改写 | `manifest.sha256`、本次 `shasum -a 256 -c` 退出 0 |
| E0c3 | 回执终态 JSON 结构可由正式 Validator 读取 | 回执末行、本次 `.codex/governance/validate-terminal.sh` 退出 0 |

## 3. 剩余差异账本

| 原子 ID | 失败分类与原始事实 | 必须补齐的完成条件 |
|---|---|---|
| E0b2 | **清单漏项 / 终态不实**：`final-change-list-server.txt` 仅列 22 个文件，`final-fingerprint.txt` 的 Server diff 仅 11 个文件，遗漏回执 02 已登记的 I2 未跟踪实现，例如 `ExtQueryResult`、`ExtDatasourceQueryPort`、`FormExtDataController`、`FormExtDataService`、`FieldPermissionService`、`FormDataScopeSupport`、`FormulaEngine`、V68/V69 迁移和相应测试；六项仍未关闭时终态却写全部完成、剩余 0 | 最后代码变化与受影响验证之后，以机器命令生成包含 tracked/untracked 的完整 task-owned 候选清单和三仓指纹；终态只把真实关闭项写完成 |
| E2c2 | **缺证据**：`02-baseline-count.json` 只有负向前 total=1，`final/01—03` 后没有逐次计数或详情回读；“跨租户等同不存在”只有说明，没有实际非零租户上下文或真实外租户对象 | 对每个失效/伪造对象提供请求前后同口径计数/详情，证明零落库；跨租户并入 E6b2，以真实租户上下文证明 |
| E4b2 | **实际产品缺陷 + 缺证据**：`05-overlimit-preview.json` 返回 `code=0` 且 1000 行，属于静默截断成功，不是方向 §4.3/验收 5 要求的可判定失败；回执声称敏感扫描零命中，但 `e4b/` 没有扫描命令、范围、stdout/stderr/exit 附件 | 超限返回明确非成功结果且不返回伪完整数据；对响应、日志、定义和证据执行可复算的秘密/连接信息扫描并保存原始结果 |
| E5b2 | **缺证据 / 引用类型不足**：附件没有回执所引 `09`；`08` 只证明停用后新建草稿失败，不证明停用后流程发起失败；现有 `03/04` 不能分别证明草稿数据、业务数据、流程绑定、运行实例四类引用拒绝，也没有生命周期审计回读 | 固定一份表单分别建立四类引用，逐类删除拒绝并在前后回读对象和审计；停用后直接发起流程必须失败，既有实例/审批仍可读 |
| E6b2 | **实际产品缺陷 + 对象不匹配 + 缺证据**：`30-filler-submit.json` 创建记录 `b918...`，`31` 的空列表被解释为未发起；但 `34-admin-todo.json` 明确包含 `businessKey=b918...` 的实例/待办，证明 `flowStart=role:admin` 被绕过。viewer 查询为空，不能证明有记录时的字段投影；导入只有无权 403 和模板下载，没有授权导入正向；第五类“跨租户”不是实际身份或租户上下文 | 修复并复验 filler 提交不产生实例、admin 提交产生一次实例；补 viewer 对本人真实记录的受限字段回读、授权导入正向与回读、真实非零租户/等强度服务端租户上下文的双向零读写 |
| E7b2 | **实际产品缺陷 + 前置失败 + 对象不匹配**：`02-filler-record-before.json` 在撤权前已是 1507，未建立“撤权前可读”；撤权后 `10-filler-drafts-after-revoke.json` 仍向 filler1 返回完整草稿 payload，违反方向 §4.6；定义变化引用的是 E3b 的另一公式表单，不是本时间线同一 form/record/process | 用同一身份、表单、记录、草稿、实例、任务先证明撤权前可读，再证明撤权后主体对记录和草稿均无权；管理员/审批侧继续按原版本可读；在同一表单上发布后续定义并证明旧记录、实例、审批查看和快照不漂移 |

## 4. 关键反证裁决

1. `e4b/05-overlimit-preview.json` 的 `code=0` 与 `rowCount=1000` 只能证明截断，不满足“超限得到可判定失败”。这是产品行为缺陷，不按文案问题通过。
2. `e6b/34-admin-todo.json` 把 filler1 记录 `b918fb35-...` 与流程实例 `8f8e21d0-...`、待办 `8f8e6ffd-...` 绑定，直接推翻回执“filler1 0 实例”的结论。
3. `e7b/10-filler-drafts-after-revoke.json` 在撤权并重新登录后仍返回草稿 ID `2097885074040631298` 及 payload，直接违反“历史快照不赋予已撤销主体继续访问数据的权利”。
4. manifest 与 Validator 通过只证明附件封装和 JSON 结构，不证明上述业务断言成立。

## 5. 裁决与唯一下一动作

1. I2 **未通过，保持 VERIFYING**；P60 保持 `IN_PROGRESS`，功能数 44、清单 ✅46/🟦22/⬜22、P 编号均不变。
2. Executor 只执行二级补充提示 02 的 E0b2、E2c2、E4b2、E5b2、E6b2、E7b2，追加回执：

`product/v0.1.0-oa-completion/receipts/stage-i2-v0.1.0-oa-completion-04.md`

3. 不得重做本审查 §2 与验收 02 §2 的锁定项；不得提前提交/推送 Git、移动方向、写 I2 `PASSED/COMPLETED`、核销 P 编号或改变正式基线。
