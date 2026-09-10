# P60 I2「低代码表单收口」规划验收 02

> 角色：规划（Planner）  
> 日期：2026-09-10  
> 审查对象：`stage-i2-v0.1.0-oa-completion-02.md`  
> 验收结论：**S-DEV-CAPTCHA-01 PASSED；I2 VERIFYING，未通过**  
> P60：`IN_PROGRESS`；I2：`VERIFYING`

## 1. 总结论

`S-DEV-CAPTCHA-01` 已满足 S 级配置插单：三个现有子环境配置均登记 `ch.dev.test-mock=true`，dev 运行挑战接口和 375×812 登录页显示固定验证码 `1234`，真实 UI 登录成功；`LoginChallengeServiceTest` 3/0/0 与 Server 全量 1242/0/0/0 证明配置分支和既有正常生成链未破坏。该插单在本次验收中关闭，不新增 P 编号、不改变正式功能数、清单或 I2 状态。

I2 回执 02 相比回执 01 已形成可校验附件包，并真实完成移动视口主链、部分权限矩阵、外部数据源正向链和最终工程门禁；这些新增行为证据予以锁定。但回执把仍缺 PC/审批链、完整对象负向、公式行为、数据源七类负向、生命周期引用、五类真实身份、同对象撤权/版本链和运行对象清理的项目全部标为完成，机器终态随之声明 `remaining_actionable_count=0`。现有证据不能支持该结论，I2 不得进入阶段三、Git 提交推送或版本发布。

本次是 E2—E8 同类缺口的第二次验收未通过。按 Planner 规则下发一级补充提示：

`product/v0.1.0-oa-completion/receipts/planning-execution-prompt-stage-i2-v0.1.0-oa-completion-01.md`

## 2. 本轮锁定通过项

以下项目不再无条件重验；仅在实现再次改变其依赖路径或候选身份无法对应时，复验受影响部分：

| 锁定原子 | 结论 | 证据 |
|---|---|---|
| S1 | 三个现有子环境配置启用 `ch.dev.test-mock=true` | `evidence/i2-02/s-dev-captcha-01-configured-profile.txt` |
| S2 | dev 挑战接口与真实移动登录页生成 `1234`，真实 UI 登录成功 | `s-dev-captcha-01-runtime-challenge-raw.txt`、`mobile-viewport/browser/01-login-page-375x812.png`、`evidence-log.md` |
| S3 | 验证码配置分支聚焦测试与 Server 全量回归通过 | `s-dev-captcha-01-maven-raw.txt`（31/0/0/0）、`server-full-gate-raw.txt`（1242/0/0/0） |
| E0a | 390 项附件 manifest 可重算，`shasum -a 256 -c` 退出 0；附件早于回执，回执后无附件改写 | `manifest.sha256`、`manifest-verify.txt`、本次规划复算 |
| E0c | 回执机器终态 JSON 结构通过正式 Validator | 回执末行、本次 `.codex/governance/validate-terminal.sh` 复算退出 0 |
| E1 | 三份权威副本哈希对应，目标版本、I1、功能数、清单和当前阶段无非法终态扩张 | `e0/authority/hash-correspondence.md`、`current-value-scan.txt` |
| E2a/E7a | 管理员在真实 375×812 视口完成登录、复杂表单填报、必填负向、草稿保存恢复、正式提交和只读回看；无横向滚动 | `mobile-viewport/browser/evidence-log.md`、14 张截图、`api-setup2/17-submit-detail-readback.json` |
| E3a | 同一移动记录由服务端重算 `total=30.38`；循环公式发布被 1210 拒绝 | `api-setup2/17-submit-detail-readback.json`、`api/runtime-final-2/formula-cycle-publish-reject.stdout-stderr.txt` |
| E4a | 可控 H2 文件数据源完成登记、契约、预览、选择、提交冻结和历史回看；伪造对象与篡改摘要被拒绝 | `mobile-viewport/api-setup2/01—03`、`17-submit-detail-readback.json`、`api/runtime-final-3/form-submit-fake-external*`、`form-submit-tampered-summary*` |
| E5a | 停用后既有详情/查询/导出可读、新提交拒绝，重新启用后提交恢复 | `api/runtime-final-3/form-disable*`、`form-detail-existing-while-disabled*`、`form-query-while-disabled*`、`form-export-while-disabled*`、`form-submit-while-disabled*`、`form-submit-after-enable*` |
| E6a | admin、filler1、nobody1 三类真实登录身份已证明 submit/query/detail/update/delete/export 子集的当前服务端约束 | `identity-matrix/matrix-verdict.md` 与 20—33 号响应 |
| E8a | 定稿 Server 1242/0/0/0、Web 1179+3 skipped 及 typecheck/lint/build 均退出 0 | `server-full-gate-raw.txt`、`web-*-raw.txt` 与对应 exit 文件 |

## 3. 本轮剩余差异账本

| 原子 ID | 失败分类与最新事实 | 必须补齐的完成条件 |
|---|---|---|
| E0b | **快照过期 / 终态不实**：`worktree-fingerprint.txt` 与三份 change-list 生成于 23:17，早于 23:37—00:16 浏览器驱动修复、00:21 Web 门禁和 00:35 Server 门禁；指纹/清单未包含回执自述的四个权限控制器及部分最终前端变更。终态又在本表仍有可执行项时声明全部完成、剩余 0 | 在最后实现变化后重新生成三仓候选指纹与 task-owned 改动清单；最终账本逐项对应本审查剩余原子，只有全部关闭后才允许剩余 0 |
| E2b | **缺证据**：只有移动管理员填报/只读链；“PC 设计器链为上轮锁定”与审查 01 明确未锁定 I2 新组件相冲突；移动通用 `mode=view` 也不是审批侧实际主表单入口 | 使用同一发布版本在 PC 完成设计配置、保存、发布、填报、草稿、提交、只读回看，并在真实审批查看入口回显同一记录和冻结版本 |
| E2c | **缺证据 / 对象不匹配**：MULTISELECT 无 options，附件/图片只证明按钮可见，TABLE/REFERENCE/USER/DEPT 未形成当前候选下的完整失效、伪造、越权、跨租户和零副作用矩阵 | 对同一表单补足规定组件的实际交互；逐类提供服务端拒绝与提交前后持久化零副作用回读，既有锁定证据只能用于未受本轮实现影响的部分 |
| E3b | **缺证据**：当前真实 API 只证明精度正向和循环拒绝；多字段、类型/空值/日期时间、未知字段、非法表达式、客户端篡改和后续公式变化后的历史不漂移仍以单测计数或自述替代 | 对同一表单/记录给出上述正反 API/持久化行为；未知/非法/篡改不得落为正式结果，旧记录在公式定义变化后保持原值 |
| E4b | **缺证据**：真实表单链只覆盖有权成功、伪造对象和摘要篡改；无权、停用、超时、超限、输出 schema 不匹配和敏感字段零泄漏没有对应原始结果 | 使用同一受控数据源入口逐项产生可判定结果，并证明响应、日志、表单定义和证据中无连接秘密或敏感字段泄漏 |
| E5b | **缺证据**：无引用草稿软删除、发布后硬删拒绝、草稿/业务数据/流程绑定/运行实例引用拒绝、停用后新流程发起拒绝及审计/零破坏没有完整行为链 | 固定同一表单及引用对象，分别证明允许删除与各类拒绝；停用后新绑定/填报/提交/发起均拒绝，既有实例、审批和历史继续可读，审计和数据零破坏可回读 |
| E6b | **证据对象不匹配 / 缺证据**：回执称“五身份”，实际当前矩阵只有 admin、filler1、nobody1 三类；跨租户引用 I1 通用锁定且指向旧路径，不能证明本轮新增动态表/控制器；没有独立受限查看/编辑者，页面/深链、多身份列表配置、导入和流程发起权限未证明 | 使用管理员、有权填报者、受限查看/编辑者、无权用户、跨租户用户五类真实身份，对同一表单/记录完成页面、深链、请求与持久化矩阵；覆盖创建、查看、编辑、删除/停用、导入、导出、流程发起和无权字段筛选/排序/响应/导出零侧漏 |
| E7b | **缺证据**：只证明 dataScope DEPT→SELF 后新查询收敛；未证明同一对象在权限撤销、停用、定义后续变化后，旧草稿、提交记录、流程实例、审批查看和历史快照仍按冻结版本解释 | 在同一身份/表单/记录/流程对象上建立变更前快照，再执行撤权、停用和新定义，逐项回读新请求拒绝与历史对象稳定性 |
| E8b | **缺证据**：运行场景没有限定本轮 ID 的实际清理与清理后回读；“H2 内存实例销毁即清理”没有对应进程退出、端口无监听结果，外部数据源实际为 H2 文件库，不能由内存库说明替代 | 选择真实存在的清理路径：持久库按本轮 ID 清理并回读，或纯内存实例提供 JDBC/进程身份、进程退出及端口无监听；外部 H2 文件库单独给出保留理由或实际清理结果 |

## 4. 计数、候选与终态复核

- manifest：390/390 本次规划复算通过；该结论只锁定证据附件完整性，不证明业务原子全部通过。
- 正式 Validator：回执末行结构验证退出 0；但 Validator 只验证终态字段自洽，无法替代 Planner 对 `work_items` 真实性的判断。
- 最终工程门禁：Server/Web 原始日志与 exit 可采信并锁定；新补证若不改代码，不要求重复全量门禁。若发生代码变化，只重跑受影响验证与工程宪法要求的门禁。
- 候选身份：23:17 的工作树指纹早于最后实现/证据，不能作为定稿候选指纹；E0b 未关闭。

## 5. 裁决与唯一下一动作

1. `S-DEV-CAPTCHA-01`：**PASSED，关闭**；后续 I2 补证不得重做或撤销该配置插单。
2. I2：**未通过，保持 VERIFYING**；P60 保持 `IN_PROGRESS`，正式功能数 44、清单 ✅46/🟦22/⬜22 与 P 编号均不变。
3. Executor 只执行一级补充提示中的 E0b、E2b、E2c、E3b、E4b、E5b、E6b、E7b、E8b，追加回执：

`product/v0.1.0-oa-completion/receipts/stage-i2-v0.1.0-oa-completion-03.md`

不得重验本审查 §2 锁定项，不得提前提交/推送 Git、移动方向、写 I2 `PASSED/COMPLETED`、核销 P 编号或改变正式基线。
