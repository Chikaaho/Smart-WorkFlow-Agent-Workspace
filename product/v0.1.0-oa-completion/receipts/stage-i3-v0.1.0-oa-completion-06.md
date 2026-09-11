# Stage I3 执行回执 06 — v0.1.0-oa-completion（人工审批与自研流程设计器）

- 执行角色：executor（Owner 授权，system.md 会话角色门禁）
- 执行入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-03.md`（三级零裁量提示 03，唯一当前入口；依据审查 04）
- 本回执为第 6 轮：崩溃恢复会话按三级提示 §3 固定顺序执行（Z0 → 修复 → Z1 → 冻结 → 行为采集 → 清理 → manifest → Validator → 回执）
- 证据根：`product/v0.1.0-oa-completion/receipts/evidence/i3-06/`（Z0—Z10 独立目录；manifest 266 文件全量 sha256，bad=0）
- 冻结：**snapshotId=i3-06-frozen-e**，jar sha256=90d8bb895a129d523c67e327807840192c606d2fbee44ed7e049d0cc298a16ba，web dist merkle=f16e31ae1869e5f176405b7d5bc21abcf6d3afc17848dee8c71858a52156e479，server diff=c7ea4de0…，web diff=89aad6be…（`evidence/i3-06/Z1/candidate-e.json`；冻结后零改动复核 `Z10/post-freeze-change-scan.txt`）
- 冻结链说明：frozen-a → e 共四次重冻结，每次均由行为采证暴露的真实产品缺陷触发，每次重跑全部 Z1 门禁并作废旧采证（`Z1/candidate-b/c/d/e.json` 留痕，旧采集目录以 `-superseded` 后缀保留）

## 0. 本轮修复清单（服务端，均已入 frozen-e jar）

| # | 缺陷（采证发现） | 修复 |
|---|---|---|
| 1 | 会签 RATIO/ANY 负向结算后实例终态被最后投票人 APPROVE 覆盖（Z4-06 实测 D,D,A → APPROVED） | `TaskActionService.processGone`：重读实例状态，非 RUNNING（节点结算已写终态）则跳过动作侧终态改写与通知 |
| 2 | 加签取消在 V74 唯一键 (tenant,task,actor,action) 上重复插入动作行 → duplicate key 500，取消不可用（Z5-03 实测） | `ApprovalActionService.upsertDuplicate`：动作行按唯一键幂等写入（同键更新结算状态/明细） |
| 3 | 双实例竞争下败者分支无条件覆盖胜者的 deadline 结果标注（TASK_GONE 覆盖 AUTO_APPROVE），提醒通知未先认领存在双通知窗口（Z6 dual 实测 6 例覆盖） | `TaskDeadlineScheduler`：TASK_GONE 分支改 PENDING 条件推进；提醒/升级先 `markClaimed` 原子认领再通知 |
| 4 | V75 内建结果函数输出变量名 `auditNote` 含大写，被 G13b 白名单正则 `[a-z_][a-z0-9_]{0,63}` 拒绝——白名单正向写回从未可能成功（运行日志「结果函数输出不合法」实证） | `ResultEchoFunction`/`AuditTrailResultFunction` 输出变量改名 `audit_note` |

采证口径修正（非产品缺陷）：历史「trace 为空」系采证 SQL 使用不存在列名 `activity_type_`（真实列 `act_type_`/`act_name_`）所致；本轮已按真实列名重采。

## 1. Z0 — 凭证清零包（PASS）

- 范围：i3-03/i3-04/i3-05/i3-06 四目录，口径 `Authorization: Bearer` 前缀 + eyJ 三段式 JWT
- ROUND1（上会话）清零后，本轮 Z2 采证的 `login.mjs` 在 rawOut 落盘过一次 accessToken 正文（违反反向断言）→ ROUND2：`login.mjs` 改为落盘 `[REDACTED len/sha256]`（自测通过），`Z0/scrub-round2.py` 原地清零
- 终态：四目录 `auth_bearer_files=0 jwt_files=0`（`Z0/hit-count-after.txt`、`Z0/scrub-round2-output.txt`）；i3-03/04/05 manifest 重算校验 158/125/80 文件 bad=0；i3-06 manifest 按 Z10 规则终态一次性生成
- 反向断言：无备份/无压缩包/无 /tmp 复制（原地正则替换，脚本与输出在 Z0/）

## 2. Z1 — 最终门禁与唯一冻结（PASS）

| 门禁 | 文件 | 结果 |
|---|---|---|
| Server 全量 mvn test | `Z1/server-full-test-r6.*` + `surefire-totals-r6.txt` | **1261/0/0/0，exit 0**（含 FlywayFullChain H2/PG 迁移链，终点 V75） |
| Web typecheck/lint/test/build | `Z1/web-*-r5.*` | 四门全部 exit 0（test：126 文件 passed+1 skipped；1178 passed+3 skipped） |
| package | `Z1/server-package-r5.*` | exit 0 → jar 90d8bb89 |
| 冻结 | `Z1/candidate-e.json` | 唯一 snapshotId=i3-06-frozen-e；冻结后零改动（`Z10/post-freeze-change-scan.txt` 四项哈希逐项一致） |
| 实例 | A=PID 23722@8081、B=PID 23764@8082（采证期间因日志止血同 JAR 重启过，见 `Z1/instance-restart-log.md`；重启不改变候选工件） | 双进程同 jar 90d8bb89 |

## 3. Z2 — 设计器真实浏览器全链（PASS）

真实浏览器（IAB）会话：坐标化真实输入（点击/拖拽/滚轮）+ XHR 拦截捕获真实请求 + DOM/服务端双读回 + 截图落盘（`Z2/screens-e/`，未进入会话上下文）。

- 全动作链（`Z2/actions.json` 18 步）：拖入（HTML5 拖放，降落进场路径）→ sticky 点选连线 → 拖拽连线 → 移动（连线随动）→ 点选边 → 删除 → 保存（PUT /graph 200）→ 撤销（恢复被删边）→ 再删再存 → 滚轮缩放（viewBox 1.1×/次）→ 空白平移 → 适配 → 属性编辑（参与人 JSON 文本回显，**无 [object Object]**）→ 保存 → 刷新恢复（同 id/同坐标/同连线）→ 校验（0 错误，toast）→ 发布（确认框 → 成功 toast「图、节点配置、表单与函数版本已冻结」）
- 非法图（z2err-e）：不连线 + 空 approver → 校验一次返回 3 条错误（2202/2004/2005，均带 nodeKey）→ 点「定位 node_1」→ 画布聚焦+节点选中+面板校验提示（截图 12）
- 发布失败零部署：z2err-e 发布被拒（error toast）→ `deployment_id` 为空计数 0，定义保持 DRAFT
- 同图贯穿：设计器保存图 = 发布 graphJson = 服务端定义 = 定义查看渲染 = 实例轨迹渲染，节点/边身份与坐标逐项一致（`Z2/graph-hash.json` identity_same=true；定义查看 13 屏、实例轨迹 14 屏：START=completed、审批A=current、END=passed-over，与真实待办一致）
- 报文：PUT/validate/publish 真实请求体与响应在 `Z2/actions.json` 各步 `http` 字段；实例发起原始报文 `Z2/raw-instance-e/`

## 4. Z3 — 审批语义与退回（PASS，`Z3/assertions.json`）

- APPROVE/DISAPPROVE/REJECT 普通节点 + 会签场景逐动作对象链（action 行 ↔ act_hi_actinst 轨迹 ↔ sw_notify_message ↔ 实例终态），requestMarker 以意见 comment 落库贯穿
- 语义分离：DISAPPROVE 行=DISAPPROVE/DISAPPROVED（非 REJECT 枚举），通知文案「被不通过意见拦截」与 REJECT「已审批驳回」分离；会签 DISAPPROVE 结算行 CONSENSUS_SETTLED（系统行 actor=0 设计语义单列登记）
- RETURN：合法历史节点 → round_no=1 行 + 旧任务关闭（act_ru_task=0）+ 轨迹取消原因「Change activity to node_1」+ 二轮重走办结；form before/after 与历史回看在 `Z3/z3-actions.json` Z3-04
- 负向：重复办理 2305、非法目标/缺失目标 2306、越权 403，全部零第二副作用
- 空值计数：action 必需字段 0、userTask 轨迹 actor 0、notify 必需字段 0

## 5. Z4 — 会签与双进程（PASS，`Z4/assertions.json`）

- ALL/ANY/RATIO(50,3 人)/VETO 最小正反 8 例：含未达阈值不终结（ALL 1/2、ANY 否决单票、RATIO 1/3 均 RUNNING）
- **RATIO 负向 [D,D,A] → REJECTED**（修复-1 后正确；frozen-a 上实测为 APPROVED 的缺陷不再复现）
- VETO 一票否决即时负向；重复票不新增投票行；双进程同结算边界竞争（A@8081/B@8082 并发）恰一结算、无重复通知；同任务并发双请求 200+2305 恰一副作用
- HTTP 500=0

## 6. Z5 — 生命周期动作（PASS 13/13，`Z5/z5-actions.json`）

- 加签串行（seq 门控违规拒绝→顺序表态→办结）、并行、取消（取消后表态拒绝）、失效人员/自我加签/权限越权全拒绝、重复表态幂等
- 补签：创建/表态/SUPPLEMENT_SIGN 意见快照、PENDING 同参与人重复 2405、越权 403、原终态 APPROVED 不变
- 转办（原人失权 403、转入人办结）、委托（受托办结）
- 代理：生效期新任务自动代理（assignee=2002+PROXY_JOINED 审计+代理办结）、未来窗口不代理、撤销后回归本人、自我/非法/坏范围/无权全拒绝
- 撤回（WITHDRAWN+重复幂等+非发起人 403+已办结越界拒绝）、沟通（沟通行+接收人无审批权 403+回复+办理不受影响）、废弃（DISCARDED+轨迹+重复幂等+无权 403+任务关闭）

## 7. Z6 — 办理时限调度（PASS，`Z6/z6-actions.json` + `Z6/dual-scan-result.json`）

- 自动策略：d6（dueMinutes=1, autoAction=APPROVE）真实到期待扫描 → deadline DONE/AUTO_APPROVE + 动作行恰 1 + 实例 APPROVED
- 提醒/升级：无自动策略 deadline 到期 → DONE/ESCALATED + TASK_DEADLINE_ALERT 通知、实例保持 RUNNING 零审批动作
- 人工催办：发起人催办 + 10 分钟冷却重复请求
- 通知失败解耦：注入不可解析收件人 → 通知投递失败，deadline 仍推进 DONE、任务与实例不回滚（调度器 catch 不回滚）
- **双扫描器竞争（相位同步法）**：实测 A/B 扫描相位（60s 周期），重启 B 对齐至 A+2~10s；40 个 deadline 统一注入到期时刻 → **40/40 DONE/AUTO_APPROVE 恰一完成、14 个 deadline 同时出现在完成方与 claim=0 跳过方日志（双 PID 扫描同一 deadline 事实）、零双完成**；双 PID 调度日志段已入包（`Z6/instance-a-scheduler.log`、`Z6/instance-b-scheduler.log`）

## 8. Z7 — handleResult 运行边界（PASS，`Z7/z7-actions.json`）

- 正向：两节点流上 func_result_echo 白名单变量 `audit_note` 真实写回（0 → `echo:<pid>:node_1:outcome=APPROVED`），下游节点存活流程可读，审计行 SUCCEEDED（func/version/type/actor/summary/duration 全非空）
- 重复调用：同任务 2305，函数调用计数不变
- G13a 八类负向契约（已锁定项）在冻结源码复跑（`Z7/g13a-contract-test-rerun.txt`），同口径计入 r6 全量 1261
- 生产反向扫描：注册表仅 V75 内建三行（bean 白名单）；bpm 主源码无 Groovy/ScriptEngine/Nashorn 引用；无函数源码上传端点

## 9. Z8 — 意见表单（PASS 7 例，`Z8/z8-actions.json`）

- 能力目录：`GET /form/def/field-types` 服务端权威 HTTP 响应（22 类 = 17 enabled + 5 disabled EMAIL/PHONE/URL/RATE/SLIDER）
- 禁止组件四层拒绝：config 1205、图 validate 2417「意见表单组件不可用」、publish 拒绝、提交层 ApprovalOpinionValidator 同口径（Z8-02）
- 五类轮次：普通（缺 required 拒绝→合法提交→主表单逐字段零变化→不可变快照）、会签（双票各落快照）、加签（表态快照）、补签（SUPPLEMENT_SIGN 快照）、退回（code 0 + round_no=1 + 二轮办结 + 快照保留）——`snapshot_rows` 逐实例非空

## 10. Z9 — 权限与总账（PASS，`Z9/assertions.json`）

- 身份矩阵：admin/initiator/user2/user3/user4/user5/tenant1user 七身份 userId/tenantId/roles/菜单数全非空（角色差异化种子：role2 业务权限、user5 无角色、tenant1user 租户 1）
- 职责正负矩阵：设计能力（admin 正向）、转办（admin 正向/user5 403）、转入人办结正向、跨租户（tenant1user 待办零泄漏）；菜单通道计数入表
- machine ledger：冻结时刻后 191 个证据实例全对象勾稽——action 必需字段空值 0、重复动作组 0、userTask 轨迹 actor 空 0、通知必需字段空 0、重复结果通知 0（取消后重发的加签再通知按签名记录数核销并在 `dup_groups_detail` 逐组登记）、意见快照缺失 0、签名行缺失 0、deadline 结果缺失 0、函数审计缺失 0、跨租户泄漏 0、HTTP 500=0（仅统计本轮现役包报文）

## 11. Z10 — 终态封装（PASS）

- `Z10/manifest.json`：i3-06 全量 266 文件 sha256（排除 manifest 自身/`__pycache__`/`*.pyc`/空 uploads），`Z10/manifest-verify.txt` 复算 bad=0，单一 file_count
- `Z10/terminal-payload.json` 原文件入包；`sh .codex/governance/validate-terminal.sh < payload` 实跑：`Z10/validator-command.txt`、stdout/stderr/exit（**exit=0**）；`Z10/payload-hash.txt` 与本回执机器终态字段同源
- 环境清理回执：`env/cleanup-attest.txt`（frozen-e 实例/PG/redis/vite 全停，五端口 listeners=0；数据随集群保留，未清理历史对象、未重建数据库）

## 12. 与三级提示的偏差说明

- 无方向级偏差。执行过程说明：采证共暴露 4 个真实产品缺陷，按提示 §4「允许修改剩余原子直接涉及代码」修复并每次重跑全部 Z1 门禁后重冻结（frozen-a→e），旧采证全部作废重采，最终所有行为证据唯一绑定 frozen-e；崩溃恢复会话期间 Z0 曾被新采证短暂破坏（1 个 JWT），已按 Z0 提交门停止提交、完成第二轮脱敏后重采。

## 13. 自验结论

三级提示 Z0—Z10 共 11 个独立证据包全部 PASS；正向/反向断言与对象身份逐项为「是」；合法功能状态 `VERIFYING`，本回执提交状态 `EXECUTION_SUBMITTED`。等待规划按十八项标准与三级提示逐包独立验收；未写 PASSED/COMPLETED、未核销 P 编号、未晋级基线、未移动方向。
