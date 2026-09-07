# gap-round3 生效证据索引（R9 脱敏）

采集时点：2026-09-07（最终快照 Server ef0fb12+本轮修复、Web a427621+本轮修复，见 receipts 提交记录）。
唯一生效原始流：`api-r3-final.txt`（API，方法/路径/HTTP status/响应体，密码字段采集层正则脱敏）；
`api-r3b.txt` / `api-r3c.txt` 为同轮中间采集（R7/R2 部分对象被 final 重建替代，仅作过程追溯，不作完成证据）。
`api-r2*.txt` / `api-r3-final-partial.txt` 等历史附件保留原样、本轮不引用。密码脱敏实现：SysUser.password
JSON WRITE_ONLY（DTO 层排除）+ 采集层正则（双保险），扫描结果见 completion-03 §R9。

| 原子 | 原件 | 结论 |
|---|---|---|
| R1 | api-r3-final.txt `S0-role2-grant`/`R1-mgr-*`；ui-r3-mgr-enter-admin.png、ui-r3-mgr-admin-refresh.png、ui-r3-mgr-portal-refresh.png、ui-r3-mgr-revoked-no-entry.png | 进入后台→/dict 合法后台页，双侧深链刷新可用；撤权后按钮消失、管理请求 403、菜单树为空 |
| R2 | api-r3-final.txt `R2-*`（copies=2、detail、stranger 403、filter-pi 命中/未命中、时间窗内外、pageSize=1 翻页）、`R2-emp-approve-others`→`R2-cmd-poll-*` FAILED 无权处理 | 不同实例筛选、同时间稳定分页、发起人越权审批被异步核对拒绝；同事件去重由 NotifyFacadeIdempotencyIntegrationTest（DB 唯一键+回放）锁定 |
| R3 | api-r3-final.txt `R3-urge-after-move` → 已通知待办人 [APP id]；`R3-app-inbox-urge` | 活动任务变化后催办目标匹配新任务；运行中无活动审批任务拒绝分支由 BpmUrgeServiceTest 锁定 |
| R4 | api-r3-final.txt `S0-*-layout(-read)`；ui-r3-emp-relogin-layout.png；WorkspaceHome.spec.ts（4 用例） | 新会话恢复保存布局；撤权收敛见 R1；无权/隐藏组件不发请求、失效收藏不可执行（等强度前端测试） |
| R5 | api-r3-final.txt `R5-*`（initiator/approver/recipient 200；stranger 附件/图片/他记录 403；伪造键 404） | 对象级授权矩阵成立；真实附件+图片上传关联、审批人 task-detail 贯通 |
| R6 | backend-mvn-test.log（FormVisibilityRulesTest、BpmCatalogServiceTest、NotifyRecordServiceTest、NotifyFacadeIdempotencyIntegrationTest 段）；frontend-vitest.log | 规则组合与无环/隐藏必填原件随全量门禁归集 |
| R7 | api-r3-final.txt `R7-*`：detail-pre(1 attempt)→resend-legal 受理→detail-final(2 attempts FAILED)→concurrent-x5 全 400 零新增→batch-valid 成功→batch-invalid 无有效接收人→batch-channel-fail 2 子记录→sub-resend 后 attempt 累积 | 合法重发、并发零新增、有效批量、失败子记录可查可重发全部成立 |
| R8 | backend-mvn-test.log（BUILD SUCCESS）、frontend-*.log、SHA256SUMS.txt | 后端 180 报告/1154/0/0/0；前端 124f+1sk、1168+3sk、typecheck/lint/build 退出码 0；清单回读 13/13 OK |
| R9 | 本文件 + 扫描结果（completion-03 引用） | 生效包零混合历史段、零密码/Token/Cookie/hash |

对象登记（final 时间线）：MGR=2096817410661822466、EMP=2096817411181916161、APP=2096817411655872514、
STR=2096817730850795522；实例A=BK 5599df8b…、INST3=2096818034610679809；NID=2096818165842063361；
失败子记录 keyword=R3F渠道批量失败。
