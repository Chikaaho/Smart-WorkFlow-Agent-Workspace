# 收尾事实回传：P62 分支差异与已合并分支清单（2026-10-18）

核实时点：2026-10-18（Server main=f58e3ae，含返修与文档提交；Web main=264cca32）。

## 1. P62 分支 `feature/p62-perf-bounded-20261011`（16 提交，merge-base c0cbe60d，tip 7c30597）

产品行为类（3，**均非 main 等价**）：
- `08ed4c4` openapi 回调监听器租户行挂起（`TenantLineSuspension.suspended()` 包裹）＋投递日志显式租户列（DeliveryService `row.setTenantId(event.getTenantId())`）。main 现状：监听器/投递服务**无**租户挂起，openapi 回调表**不在** ignore-tables；提交自述"性能装置处置"。风险：若采纳＝改变 main 后台投递的租户上下文行为，需按现行流程重新落地与测试（装置耦合需剥离）；不采纳则 main 是否存在后台投递无租户上下文的真实缺口待规划定性（现网回调功能经 CI/e2e 与线上验收未见异常）。
- `6335f7f` claimDue 允许在途批次越过准入截止续跑领取。main `PersistentBpmCommandQueue` 领取路径**强校验**准入截止（"截止已过不得再获得执行权"，含 CAS 条件）——与 main 已复核的 P62 合同**语义相反**，属性能实验动机。
- `f2af26b` 过期判定识别分片续跑批次（G4 接缝）＋同提交混入二轮装置计量（G1/G2）。产品接缝与装置耦合在同一提交。

迁移类（2，**与 main 单基线形态冲突**）：`1105361`（V0.1.10 invocation_key 查询索引，h2+pg）、`fe549dc`（V0.1.11 batch_item.settled_at，h2+pg＋bpm H2 V103 同步）。main 已收敛为每方言单条 `V0.1.7__baseline_seed.sql`＋R__，versioned V0.1.10/V0.1.11 不能按原样落入现链（乱序）；两者均服务性能实验观测。

装置/测试类（5）：`b13b952`（死锁取证日志 Windows cmd 前缀）、`351c93e`（burstLoad 判空）、`9e2b07f`（G2 断言排序）、`120bdbc`（装置前向修复＋三画像窗口）、`318b8a0`（三轮续办装置）。

文档/焦点行类（6）：`4338c3f`、`83d582b`、`7caafb1`、`bc0bd03`、`a32cc76`、`7c30597`——历史焦点行状态，main 功能清单已演进越过，合入即倒退。

改动规模：23 文件 +862/−186（大头顶部 `P62ResourceAssurancePgTest` +731 行，装置为主）。

## 2. 已合并分支清单（Owner 所述 §3 位置未单独成文，以 git 实测为准）

实测与 Owner 口径一致：Server 9 支、Web 10 支全部 `--merged main`（无独有提交）。处置见回执 `product/0.1.7-bugfix/receipts/close-maintenance-017-01.md` §4：Server 删 8 留 2（`fix/super-tenant-visibility` 按方向持有至第41项复核通过；`feature/p62-perf-bounded-20261011` 未合并且处置未定，保留），Web 删 10。分支 tip 恢复记录在该回执。
