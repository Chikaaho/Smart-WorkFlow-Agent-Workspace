# P62 资源保障阶段 · 执行回执 03（resource-assurance-03）

日期 2026-10-03；执行（Executor）；入口=唯一当前执行入口 `planning-execution-prompt-resource-assurance-01.md`（8 原子项账本）+ 复核02 + 资源方向/ADR003 授权。证据根 `receipts/evidence/resource-assurance-03/`，全部原始流独立归档并按目录生成清单。

**自验结论：8 项原子项已推进但均未全部关闭**——RA01b/RA03a/RA04b/RA06b 的缺口已按项补证（原始读回+实际值），RA02b 完成配对/批次会计/收敛的充分证据但保护时效仍不达，RA02a 实现修正已交付、统计与采集口径已可复算，**实测时效全面超限且存在并发死锁中止（本轮 150s 窗口内 32 次）**，RA05a 为真实工具限制的有限报告，RA03b 因隔离环境后端启动被 SSO 配置解密阻断而只能引用锁定渲染证据。功能/阶段保持 `VERIFYING`，P62 整体 `PLANNING`。

## 0. 账本与状态

| ID | 本轮状态 | 唯一行为证据（原始文件:位置） | 实际结果 | 边界 |
|---|---|---|---|---|
| RA01b | 已补证（映射完成、历史 run 部分失效登记） | `evidence/resource-assurance-03/ra01b-identity/identity-map.txt` | 历史 run 的 env-frozen buildCommit 原始值（ra01 五轮=7a28b70；diag1/diag2=aff3071；ra04/ra04-downgrade/short-verify=e5e515a）＋提交时间线＋远端回读＋本轮每 run 身份（head/porcelain 指纹/制品指纹/exitCode/起止） | diag1/diag2 运行期工作树含未提交的 RA01—RA03 修正（HEAD 记 aff3071 不能代表实际代码）→ 该两轮按时效/计量受影响的结论标记为**限定失效**，其时序结论由本轮 pinned-身份 运行替代；ra01 五轮（7a28b70）用于配置画像锁定，不受后续实现修正影响 |
| RA02a | **未通过（实测超限）** | `ra02-window-short/recomputed-stats.txt`（原始样本独立复算；脚本 `recompute-stats.py`）、`fixed-burst-report.txt`、`stat-definition.txt`、`resource-samples.csv`、`run-console.log.gz`（DEBUG 级控制台流压缩归档） | 完成入组（ts_end∈窗口）：受保护实时 p99=1103.1ms/预算300ms（n=570，零非合法）；轻流程受理 p99=2572.0ms/2000ms（合法 n=525，另有 2 次 HTTP 500）；OA读 p99=2024.6ms/1000ms（n=235）；审批受理 p99=2215.6ms/1000ms（合法 n=116，另有 1 次 HTTP 500）；突发全结果 p99=1459.1ms、拒绝 p99=2744.8ms/1000ms（合法 6701/拒绝 2009/超时 3）；批次拒绝 p99=3935.5ms；进程真实 CPU 均值=机器 41.9%（max 64.6%，非饱和）；GC 277 次/1999ms、最大单次停顿 1066ms；pg 锁等待均值 8.0/max 22；慢样本(>300ms)与锁等待正相关（锁等待≥3 的采样区均值 0.32 vs <3 的 0.05） | 原样本全量落盘、nearest-rank、全结果/合法/拒绝三口径可复算；报告数字（941/批次0）已修正为同文件复算值；提交 `84e7b9c`（计数行加速+自愈、准入热点日志降级）与 `c5ffd17`（撤回未证实有效的两项并发控制实验）；**时效门槛仍未满足，不作通过声明** |
| RA02b | 行为证据充分、等待上界未达 | `ra02-window-short/pairing.csv`＋`pairing-summary.txt`＋`convergence-detail.txt`；`ra02-batch/batch-accounting.txt` | 配对 1940 笔受理逐项关联（命令状态/领取/完成/资源冻结字段/引擎实例/目标调用），未配对 49（拒绝整笔回滚或行未生成，已计数）；负载停止后收敛 openAfter=0、收敛耗时 4020ms≤120s、counterTotal=751=factTotal=751；批次 500 项整笔准入按项占额（resource_units=500/BULK/SHARED/BATCH_SETTLED）、同键同载荷重放不重复占用、同键异载荷 2426 拒绝、额度不足 2 项整笔拒绝且零残留行/项、跨租户额度独立、并发恰一笔放行不超卖、逐项终态 500 成功/0 失败/500 唯一调用键回收至 0 | 受保护 OA 领取等待实测最大 33278ms > 合同上界 5000ms（同画像突发竞争下未达标）；批次数值取自独立窄额度轮（租户上限 1）而非合同画像轮，属行为证据不属时效判定 |
| RA03a | 已补证 | `ra03-auth/auth-matrix.txt`（15 段请求-响应-回查） | 身份经 sys_user/sys_role/sys_role_menu 真实链回读；合法创建/启用 200 且逐字段回查（DRAFT→ACTIVE、版本、额度）；非法额度启用 2408/`bpm.resource_policy_invalid` 原文＋独立审计行原文＋被拒策略保持 DRAFT＋生效策略未被改动；只读身份 view 可读、创建/启用 403（响应原文）；无权限身份四端点全 403；跨租户 tenantId 强制本租户 total="0"、租户2 授予 view 后查租户1 total="0"、跨租户写 403 且策略未变；拒绝审计同租户可读 | 覆盖管理员/只读/无权/跨租户四类身份与读写两侧；不含 MFA/真实人机验证路径（本画像无此条件） |
| RA03b | **未关闭（环境阻断）** | `ra03b-browser/startup-blocker-summary.txt`＋`backend-startup-attempt.log`＋`render-locked-index-从复核02锁定.txt` | dev 隔离环境后端启动失败：`ssoAuthService` 启动校验解密 `sys_sso_provider_config` 失败（`AEADBadTagException: Tag mismatch`，新生成的 `SW_SSO_CIPHER_KEY` 不匹配既有密文）→ 无 UI 验收所需服务端；已确认 Web dev server 可启动（15173）但无后端可直连 | 沿用复核02已锁定渲染证据（四视口页面渲染＋池5/消费者OFF 可见拒绝提示）；未取得实际 URL/身份/对象/操作网络关联与非空明细；不把组件/无头层级升为正式 UI 验收；解除条件=提供匹配的 dev SSO 密钥或允许清空 SSO provider 行的隔离库 |
| RA04b | 已补证 | `ra04-downgrade/stop-acceptance-downgrade.txt` | v1 实际值 2000/800/400/400/1200/50/500 与 v2 减配 60/50/10/10/40；在途 20 项批次冻结字段（BULK/SHARED/20/policyVersion=1）减配前后逐字段一致且按原版本结算完成；usage 表无版本列（跨版本共用总账，`usage_policy_version_columns=0`）＋实际占用 20→50（OA保留10+共享40）→释放后 1；停受理 2429 原文、释放后受理成功；旧 NULL 字段行经真实领取+完成 → status=COMPLETED、资源字段与释放标记保持 NULL、占用与事实 1→1 不变、历史查询行一致可读；策略行/拒绝审计行保留 | 在途冻结以 20 项批次对象为证（非 100 项恢复对象，后者已由 RA04a 锁定，不重演） |
| RA05a | **有限报告（真实限制）** | `ra05a-tool-limit/tool-limit-report.txt` | Owner 原指令逐字（本会话用户提示词）；本会话实测 timeout=700000ms 被工具接受（上限非 schema 常量，约束来自宿主墙钟终止）；本轮最长单命令实跑 30s+120s（总墙钟 231.7s）；合同 60s+600s=660s 与单条前台命令不兼容 | 不 sleep、不后台、不重启负载拼窗；分段只切采集的路径在本 Harness（负载与应用同进程）不成立；解除条件=放行单条 >700s 命令／允许隔离环境后台负载驱动／Planner 按真实外部条件调整 RG08 口径 |
| RA06b | 已补证（传播待复核） | `ra01b-identity/identity-map.txt` §2—§4；各 run 目录 `run-identity.txt`／`run-console.log`／`run-command.txt`；本回执 §6 | 每个 run 记录命令、exitCode、起止时点、HEAD/工作树指纹（porcelain sha256）/制品指纹；Server develop 远端回读 `c5ffd17`=本地 HEAD；19f01f8 相对 e5e515a 仅测试文件（production 代码同一）、913b78e 仅文档；覆盖矩阵见 §6（含 knowledge/current-status 与 session-handoff 实际值/时点） | Web 批次 B（1321+3）沿用已回读值（本轮无 Web 改动）；不重跑无变更的全量门禁 |

## 1. 本轮实现修正（代码，已提交推送）

| 提交 | 内容 | 依据 |
|---|---|---|
| `84e7b9c` | 受理稳态不再逐笔「插入-捕获唯一键冲突」（原实现每次受理一次异常+独立事务）；计数行进程内加速 + 拒绝路径自愈重建；准入成功日志降为 debug；批次重放新增同键异载荷拒绝（2426）；测量资产改为全结果/合法/拒绝三口径 nearest-rank + 起止双入组与边界外计数 + 进程真实 CPU/堆/GC/慢请求配对 + pairing/convergence/stat-definition 取证；RA03 矩阵改请求-响应-查证三段；RA04 降配补实际值 | 复核02 §RA02/RA03/RA04；方向 §2「服务端确定额度/拒绝不留效果」 |
| `2a81ed9`→`c5ffd17` | 两项并发控制实验（段回退规范序预锁、非锁定预读）实测未改善（150s 窗口死锁中止 12/34 次 vs 基线 11 次）→ **按实测证据撤回**，保留主体修正；回执登记未解决根因 | 同上（真实证据优先，不保留未证实有效的控制逻辑） |
| `802a604` | 配对证据行缺失安全取列；PG 错误级语句日志（并发缺陷定位留档） | 取证完整性 |

工程门禁：`sw-bpm-process` 模块 `mvn test` **255/0/0/0 BUILD SUCCESS**（提交前实跑，改动模块）；`sw-bootstrap` 全链未改（无迁移变化），Flyway 锚 29 沿用复核02锁定值。

## 2. RA02a 统计与采集口径（可复算，替换旧报告）

口径文件 `ra02-window-short/stat-definition.txt`（**报告修正说明**：harness 内报告原 `inFormal` 仅有窗口下界，把窗口结束后完成的样本计入完成入组，且混合形态采集器只取首个非空合法类；已由 `recompute-stats.py` 对原始样本按声明口径独立复算，§0/§3 数字均取复算值，harness 同步修正见提交 `f466267`）：`ts_end`=完成时刻、`ts_start`=发起时刻；发起入组=ts_start∈窗口、完成入组=ts_end∈窗口、另计「发起在窗口内完成在窗口外」；nearest-rank 分位数（不插值、不剔慢样本、不以 p50 替 p99）；成功/拒绝/超时口径分明；`proc_cpu_pct_of_machine`=`ΔgetProcessCpuTime/Δwall/核数`（真实进程 CPU，非 load average）；`gc_count/gc_time_ms`=区间增量；`slow_*`=与采样点配对的慢请求数；`pg_lock_waits`=wait_event_type='Lock' 连接数；采样间隔 1s。旧报告 `burst p99=941`、`批次 p99=0` 与同文件复算（1565.3/3523.4）不一致的问题已由三口径与全样本落盘修正。

## 3. 阈值对照（合同 vs 本轮实测；`ra02-window-short`，warmup30+formal120，短验证轮）

| 门槛 | 合同 | 实测（全结果/合法） | 判定 |
|---|---|---|---|
| 实时入口→提交 P99 | ≤300ms | 1103.1（n=570，零失败零拒绝） | 未达 |
| 轻流程入口→持久受理 P99 | ≤2000ms | 2572.0（合法 n=525；另有 2 次 HTTP 500） | 未达 |
| OA 读 P99 | ≤1000ms | 2024.6（n=235，零失败） | 未达 |
| OA 审批受理 P99 | ≤1000ms | 2215.6（合法 n=116；另有 1 次 HTTP 500） | 未达 |
| 超额拒绝响应 P99 | ≤1000ms | 2744.8（拒绝 2009 样本，含 HTTP 500 与 3 次 10s 超时） | 未达 |
| 受保护合法请求意外失败/拒绝 | =0 | 窗口内：实时 0/570、轻流程 2/527、审批 1/117、OA读 0/235（全轮另有窗口外 500，见 §4 死锁） | 未达（失败>0） |
| 负载停止 120s 内收敛 | 全部收敛 | openAfter=0，4.02s；counterTotal=factTotal=751 | 达 |
| 逐项调用唯一（无重复效果） | 0 重复 | 500 项批次：500 成功 / 500 唯一调用键 | 达 |

## 4. 归因证据（复核要求「采集定义支持归因强度」）

- **撤销上一轮「CPU 饱和」结论**：真实进程 CPU 均值=机器 41.9%（8 核，max 64.6%），**不构成 CPU 饱和**；上一轮依据的 load average（8.90/14.45）含等待进程与同 JVM 负载生成器线程，不能作 CPU 利用率证据。
- **GC 停顿**：277 次回收/1999ms 合计，最大单次停顿 **1066ms**（另有 411/386ms），与秒级尾尖同量级。
- **锁竞争**：`pg_lock_waits` 均值 8.0、峰值 22（并发窗口内 107/146 采样点>0）；慢实时样本在锁等待≥3 的采样区均值高 6 倍。
- **并发死锁（未解决缺陷）**：150s 窗口内 PG 40P01 中止 **32 次**（`DeadlockLoserDataAccessException`），全部落在 `sw_bpm_resource_usage` 行更新；受影响方被放大为受理 HTTP 500（本轮 32 次，其中受保护轻流程 2、审批 19）。已识别机制=各形态类别段回退顺序交叉（PROD 先生产保留 / OA 先 OA 保留）叠加"满段条件更新仍取行锁等待"；两项针对性实验未获实测改善已撤回，根因定位需冲突双方语句（本轮已开 `log_min_error_statement=log`，仍只在特定时段复现）。

## 5. 与方向偏差、未完成与风险

- 偏差：RA05a 正式窗口/2h 未执行（真实工具与 Owner 限制，有限报告）；RA03b 未取得新 UI 证据（环境阻断）；RA02a/RA02b 时效与等待上界未达（如实保留，不冒称通过）。
- 未完成：并发死锁根因定位与修复；保护路径尾延迟（GC 停顿/锁竞争的传递路径）；正式 600s/2h 窗口。
- 风险：拒绝响应 P99 与保护受理 P99 均含 500/超时样本，按合同属"意外失败"，须在阶段通过前归零。

## 6. 覆盖矩阵（RA06b：受影响当前入口逐字段）

| 入口 | 字段/章节 | 目标值 | 实际值/位置 | 时点 | 核验方式 |
|---|---|---|---|---|---|
| `knowledge/current-status.md` | P62 资源保障段（阶段/账本/唯一下一动作） | VERIFYING；入口=一级提示01；下一动作=Planner 复核回执03 | 本轮编辑（见同批次提交） | 2026-10-03 | 全文回读 |
| `knowledge/session-handoff.md` | P62 交接段 | 同上 | 本轮编辑 | 2026-10-03 | 全文回读 |
| `Smart-WorkFlow-aPaaS-server/功能清单.md` | 当前焦点 P62 段 | 回执03 已提交、复核02 未通过保持 VERIFYING | 本轮编辑 | 2026-10-03 | 尾部段落回读 |
| `memory/state.md`、`memory/handoff.md`、`memory/README.md` | P62 状态/下一动作 | 复核03 待 Planner | 本轮编辑（授权摘要同步） | 2026-10-03 | 字段比对 |
| `todo/p62-lowcode-transaction-bpm-tiering.md`、`todo/requirement-pool.md` | 当前排期/下一动作 | 同上 | 本轮编辑 | 2026-10-03 | 字段比对 |
| 方向/ADR003 | ready/ 保持 | 未通过不归档 | 未改动 | — | 文件清单 |
| Server/Web Git | develop 远端 SHA | Server `cf8a777`（含实现 `84e7b9c`/`c5ffd17` 与测试取证 `802a604`/`f466267`；回读一致）；Web `28a2805`（本轮无改动） | `git ls-remote` | 2026-10-03 | 远端回读 |

## 7. 自检（提示 §7 清单）

- [x] 每项正向/必要反向断言由对应身份与原始行为证明，无近似对象或手写布尔替代（RA03a/RA04b/RA02b 均为原始请求/响应/持久行读回）。
- [x] 原始流独立归档、清单由工具生成（`SHA256SUMS.txt` 排除自身、在证据根回读）。
- [x] 请求跨窗口追踪：发起入组/完成入组/窗口外计数三口径同时落盘。
- [ ] 当前 8 项均关闭：**否**（RA02a/RA02b/RA03b/RA05a 未关闭，均有真实外部限制或实测差异，非"依赖 Planner 选择挂起"）。
- [ ] 正式采集连续、原预算/画像保持、工具限制与实际返回一致：正式窗口未执行（见 RA05a），短验证轮为合同画像内的短窗，未改预算。
- [x] 未受影响锁定项只引用（RA01a/RA03-render/RA04a/RA06a 指针见复核02）。
- [x] 功能 45、清单 90（46/22/22）、ADV64、问题 57、其他 P 状态与正式基线未改；未核销 P62、未归档方向、未进入阶段三。

## 8. 合法终态

`EXECUTION_SUBMITTED`（自验未通过部分如实保留；功能/阶段 VERIFYING，P62 整体 PLANNING）。Planner 复核 03 后：若接受 RA05a 限制报告与 RA03b 阻断，建议按真实外部条件裁决并调整 RG08 口径；否则需先解除 UI 环境阻断并放行长窗口。

## 9. 提交与远程回读（提交后关联）

- Workspace 分支 `develop-sw`：回执与传播批次 `a047354`，远端回读 `a04735491edc…`。
- Server 分支 `develop`：实现批次 `84e7b9c`（受理加速/日志降级/批次同键异载荷拒绝）、`802a604`（取证资产）、`f466267`（报告口径修正）、回撤实验 `c5ffd17`、焦点同步 `cf8a777`；远端回读 `cf8a777236db…`。
- 证据清单 `receipts/evidence/resource-assurance-03/SHA256SUMS.txt`（38 条，排除自身，`shasum -c` 38/38 OK）。
