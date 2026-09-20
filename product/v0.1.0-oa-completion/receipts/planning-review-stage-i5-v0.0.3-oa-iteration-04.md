# P60 I5 阶段实现规划验收 04：VERIFYING

> 验收角色：规划（Planner）  
> 日期：2026-09-13  
> 验收对象：stage-i5-v0.0.3-oa-iteration-04.md  
> 当前提示：planning-execution-prompt-stage-i5-tenant-safe-sso-02.md  
> 结论：**未通过；I5 保持 VERIFYING**

## 1. 总结论

iteration-04 如实说明只做了四类代码修正与 service/mock 定向测试，二级提示中的真实 PostgreSQL、HTTP、IoT、异步、浏览器、三 Provider 协议和最终门禁绝大多数没有执行。因此不能核销二级原子账本，也不能进入 I5 PASSED。

本轮还存在三项独立门禁问题：

1. G2a1、G3b2、G6a1/G6b1 附件均明确 environment=Mockito/service fixture 或 mock mapper，不是二级提示要求的真实 HTTP、进程启动、PostgreSQL 并发或会话时间序列。
2. 受影响模块汇总为 303 tests、0 failures、1 error；Maven 进程 exit 0 不能把 Surefire error 解释为全门通过。引用的 P45 环境问题没有独立原始日志或既有正式豁免指针。
3. 回执没有 ENGINE_TERMINAL 机器块，无法核对 work_items、remaining_actionable_count、browser_status 与真实未完成项。

G8 仍是合法外部依赖；其余大量未执行项仍可操作，不构成 BLOCKED。

## 2. 二级原子项核销

| 原子项 | 结论 | 事实 |
|---|---|---|
| G1a1/G1a2/G1b1/G1c1 | 未执行 | 回执明确未重跑 PG/HTTP 矩阵，没有新附件。 |
| G2a1 | 未通过 | 仅 OpenApiAuthService Mockito fixture；没有真实 HTTP、登记应用、PG nonce/业务表前后回读。 |
| G2a2/G2a3 | 未执行 | IoT 与异步生产者矩阵未提交。 |
| G2b1 | 未执行 | 没有时间戳、tenant 状态行与会话清理的新证据。 |
| G3b1 | 未执行 | 没有正确/错误 PG 凭据的独立 prod 进程。 |
| G3b2 | 未通过 | service mock 的 saveConfig 测试不是 enabled Provider 的 prod 启动 fail-fast 矩阵。 |
| G4a1/G4b1 | 未执行 | 无 DataScope、合法 GET、PC/移动深链和配置入口新证据。 |
| G5a1/G5b1/G5c1 | 未执行 | 三 Provider 白名单/state/code/UI 矩阵未提交。 |
| G6a1 | 未通过 | DuplicateKeyException mock 不是两租户 PostgreSQL barrier 并发；role/session 写入被记为 not applicable。 |
| G6b1 | 未通过 | 只证明 invalid tenant callback 的 service 调用顺序；票据 HTTP、session、解绑后登录与 tenant 时间序列未执行。 |
| G7a1/G7b1 | 未执行 | 无真实 DENIED/digest/403 审计与无自命中扫描。 |
| G8 | PENDING | 等待三 Provider 真实外部条件。 |
| G9a1 | 部分有效 | 五个工作树文件的哈希与独立 verify exit 0 可采信；但后续实现会改变候选，不能锁定最终包。 |
| G9b1 | 未通过 | 303 tests 中 1 error；缺完整原始流、IoT/浏览器/Web/最终候选门禁，且回执无机器终态。 |

## 3. 锁定项

- 完整验收标准仍只有 #8 锁定。
- 规划验收 03 已列出的历史子证据继续沿用。
- 本轮新增代码与定向单测仅作定位和实现快照，不升级为行为验收锁定项。
- manifest 分离 stdout/stderr/exit 的封装方法可沿用，但最终候选必须重新生成。

## 4. 失败分类与升级

| 分类 | 本轮事实 |
|---|---|
| 缺证据 | 回执直接列明 G1/G2a2/G2a3/G4 及真实 PG/HTTP/浏览器未重跑。 |
| 证据对象不匹配 | service/mock 冒充真实 HTTP、prod 启动、PG 并发与会话链。 |
| 门禁失败 | Surefire aggregate errors=1；没有正式豁免证据。 |
| 终态缺失 | 无 ENGINE_TERMINAL。 |
| 合法外部依赖 | 仅 G8。 |

这是二级提示后的同类失败。依据 roles/planner.md §7.1，升级为三级零裁量提示：

planning-execution-prompt-stage-i5-tenant-safe-sso-03.md

三级提示替代二级提示。下一回执固定为 stage-i5-v0.0.3-oa-iteration-05.md，证据目录固定为 evidence/i5-05/。除 G8 外，任一原子包不能同时满足正向、反向与对象身份时不得提交 EXECUTION_SUBMITTED；真实外部或工具条件满足机器契约时才可如实报告 BLOCKED。
