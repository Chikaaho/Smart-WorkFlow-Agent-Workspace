# P62 资源保障执行回执04（二级补充提示02 · 9子项）

2026-10-03，执行。唯一入口=planning-execution-prompt-resource-assurance-02.md；复核03为当前裁决。Server 分支 develop：`32a5db3`（确定性借用交叉复现装置+PG服务端语句日志）→ `cbf32ba`（准入修复：总量失败不跨段回退+借用段非阻塞空闲探测）→ `aaa1945`（单源窗口统计/目标审批提交点配对/对账收敛责任分类/RA03a2隔离矩阵）。全部运行以 evidence/resource-assurance-04/tools/p62ra-run.sh v2 包装（HEAD全SHA+porcelain摘要+制品指纹算法/文件集/清单落盘 artifact-manifest.sha256）。阶段保持 VERIFYING、P62 保持 PLANNING。

## 0. 子项账本（ID→证据:位置→实际结果→边界）

| ID | 证据 | 实际结果 | 边界 |
|---|---|---|---|
| RA02a1 | ra02a1-deadlock/old-ring-fragment.txt; prefix-repro/{borrow-contention.txt,run-identity.txt}; fixed-repro/borrow-contention.txt; ra02-window-short/pg-server-20261003.log | 旧正式轮42次去重死锁环（源 run-console.log.gz sha256=fbb20cbf…，首环4进程94489→94490→94497→94594→94489）；机制定位=两处跨段取序反转（TOTAL/租户总量失败后仍跨段回退持总量行锁穿越段序；借用对方保留段按普通条件更新阻塞等待）。修复 `cbf32ba`：tryOccupy 总量/租户失败立即补偿拒绝（不再跨段）；借用段先 `probeIdleRow FOR UPDATE SKIP LOCKED`（合同"借用只在段空闲时发生"的字面实现）。确定性复现：prefix-04 两断言按设计失败（借用等待被持有段/TOTAL满仍借用等待）；fixed-01 同场景通过（OA在对方段被持有时60ms内整洁拒绝2427、12ms拒绝、3笔QUOTA_*审计、PG日志死锁标记=0）。修复后正式短轮（ra02-window-short）PG服务端日志死锁/锁等待语句=0 条 | 旧轮未捕获PG服务端语句（当时pg_ctl起postmaster不继承JVM stdio），旧环语句级取证由本轮装置（logging_collector+log_error_verbosity=verbose）在新run取得；修复未改负载/池/事务原子性 |
| RA02a2 | ra02-window-short/{fixed-burst-report.txt,stat-definition.txt,*-samples.csv.gz}; tools/recompute-stats.py | 单源窗口（windowWarmupBegin/FormalBegin/FormalEnd 同一变量进报告/统计定义/采集器/复算脚本）；主口径=发起入组（完成可窗口外），报告同时给出完成入组与两侧边界外计数；CSV按RFC4180转义（HTTP500逗号不再破列）；业务拒绝/HTTP500/TIMEOUT分桶。修复后短轮（warmup30+formal120，runId=p62ra04-window-02）start-cohort：realtime n=577 p99=705.5ms（预算300 未达）；light n=571 p99=1239.7ms（≤2000 达标）；oa-read n=236 p99=1024.8ms（1000 未达）；approval n=119 p99=801.2ms（≤1000 达标）；burst合法 n=6120 p99=440.1ms（≤1000 达标）；burst拒绝 n=3375 p99=1102.6ms（1000 未达）；批拒绝 n=24 p99=2169.6ms（1000 未达）；意外失败/超时/HTTP500 全路径=0 | 旧报告windowBegin=预热起点、脚本窗口错位已修正；正式60+600窗口并行取证中（ra02-window-formal，结果随附注）；尾延迟差异如实保留（归因：进程CPU≤62%、GC区间停顿40—145ms与慢样本时刻相关、pg_lock_waits 3—12、app侧ACCESS costMs>300 共187笔证实为应用内真实停顿非客户端假象；com.sw=DEBUG 为仓库application.yml打包默认，147MB/4min 日志量属应用自身配置非测量装置私设） |
| RA02b1 | ra02-window-short/{pairing.csv,pairing-summary.txt,occupancy-responsibility.txt} | 配对行0脚注污染（footnote移入summary）；新增目标/审批提交点：light 1970/1970 有目标调用行update_time+目标记录update_time/version双读回，approval 149/149 有任务end_time+实例end_time；unpaired=30 全部为REJECTED批次（受理前终结无命令行，与HTTP样本账勾稽，无未解释项）。占用责任：窗口末计数=事实=895（SHARED773/PROD_RESERVED122，无在途命令/无批次项/引擎job=0/死信=0），显式对账收敛 pass1释放500、pass2释放395、pass3无释放→计数=事实=0：895全部为"目标链已完成但释放未跑到的在途占用"，对账两轮收敛，无泄漏、无基线混入（baselineBeforeWindow=0） | "计数=事实"不再作为通过声明；责任分类=引擎链活跃/不活跃+基线/窗口增量；不要求人工整体结束 |
| RA02b2 | ra02-window-short/pairing-summary.txt | 保护OA审批领取等待 samples=864 max=3270ms ≤5000ms 上界（旧轮33278ms 消除，与死锁消除同源） | 批次领取等待≤30s 由 batch-accounting（locked）及本轮收敛承载；同画像短轮口径 |
| RA03a2 | ra03a-isolation/{tenant-isolation.txt,auth-matrix.txt,run-identity.txt} | 两租户非空对象（command 2+3、reject 各1）真实HTTP矩阵：他租户同id详情=403"无权查看该命令"（G3/G4，真实服务端强制非空表过滤）；查看身份列表/越界tenantId参数=强制本租户（G2/G2b/G5，只见本租户键）；管理身份=全局运维视图（G1/G5b，行内tenant_id可见，resolveScope设计显式化并回读在案）；reject审计同租户边界（G6/G7）；只读写策略403+对象逐项不变回读（G8/G9）。旧E1/E2"空表total=0"断言已替换为非空强制本租户断言 | RA03a1（合法/非法/查看矩阵）维持locked未重跑；真实SSO登录仍按debug-auth约定身份（锁定边界不变） |
| RA03b | ra03b-browser/{fixture-startup-resolution.txt,backend-dev[1-6].log} | 复核03登记的SSO AES-GCM Tag mismatch 阻断=此前以随机新密钥覆盖仓库dev契约密钥所致；仓库 application-dev.yml 自带匹配密钥（c21hcnQ…，sso/agent/external-datasource 同值）。按仓库dev配置（密钥不覆盖）+4个外部安全注入（JWT_SECRET、SW_LOGIN_RSA_PRIVATE_KEY=自生成隔离PKCS8、SW_LOGIN_DIGEST_SECRET=自生成、SW_CIPHER_KEY=仓库dev同值）后 dev 后端完整启动（H2内存隔离库，Tomcat 15996，/api/workflow/resource/profile=401 在线） | 未触碰用户既有服务/数据；自生成密钥仅本隔离夹具。剩余=web dev server 指向该后端的四视口可见浏览器登录与网络/非空明细取证（启动配方已留档，属可继续独立工作） |
| RA05a | gate/test-meta.txt（全工程 mvn -q test 单次调用 22:28:20→22:45:24，17min04s 完整跑完且输出全量可读） | 宿主能力实证：timeout=600000ms 提交的长前台命令被宿主转为分离任务持续运行>10min并完整结束，输出经原生句柄可读——旧"600s上限/exit137"主张撤销（其原始流从未存在）。正式60s+600s窗口按此机制以单次真实命令执行（ra02-window-formal） | 不sleep/不后台例外/不拼窗；长窗仅此一次真实采集，不反复 |
| RA01b | 各证据目录 run-identity.txt + artifact-manifest.sha256; tools/p62ra-run.sh v2 | 制品指纹算法/文件集显式：SHA-256(排序后"sha256␣␣相对路径"清单全文)，文件集=全仓 */target/classes/** 与 */target/test-classes/**（本进程实际加载字节码），清单落盘可独立复算（window-02 清单 328887B）；每 run 记录 HEAD 全SHA/分支/porcelain摘要/命令/退出码/起止。受影响证据↔提交映射：复现装置=32a5db3、修复=cbf32ba、统计/配对/隔离装置=aaa1945、窗口运行=aaa1945（fixed-01/prefix-04 分别对应其 HEAD，见各自 run-identity） | 旧证据（evidence-03）身份按其自身 run-identity 锁定，不回溯改写 |
| RA06b | gate/{compile-meta.txt,compile.log,test-meta.txt,test-counts.txt,test-failures-attribution.txt,module-255-meta.txt,module-255.log.gz} | XL完整校验门已执行并留档：`mvn -q compile` exit=0；`mvn -q test` 全工程 tests=1739 failures=12 errors=13 skipped=9，逐项归因=全部位于本轮改动面之外（迁移基线断言过期/错误码目录与双语文案过期/IoT契约快照/opt-in装置无属性按设计失败/G5a与CommandOverlap的H2缺SW_BPM_RESOURCE_POLICY表——该调用路径 cf8a777 已存在，git show 核验），无一项触及准入/回退/借用改动；受影响模块 sw-bpm-process 255/0/0/0（原始输出 module-255.log.gz）。传播=本回执§2及knowledge/memory/todo/清单更新批次 | 全工程门未全绿（既有缺陷，非本轮引入，已在归因文件逐条登记）；功能45/清单46-22-22/ADV64/问题57 保持 |

## 1. 统计与阈值对照（本轮短轮，start-cohort，nearest-rank）

| 路径 | n | p50 | p95 | p99 | 预算 | 判定 |
|---|---|---|---|---|---|---|
| 实时 | 577 | 19.7 | 110.7 | 705.5 | 300 | 未达（旧1037→改善，差异保留） |
| 轻流程受理 | 571 | 29.1 | 200.4 | 1239.7 | 2000 | 达标 |
| OA读 | 236 | 68.7 | 376.0 | 1024.8 | 1000 | 未达（差2.5%） |
| OA审批受理 | 119 | 18.8 | 378.2 | 801.2 | 1000 | 达标 |
| 突发合法 | 6120 | 17.8 | 78.4 | 440.1 | 1000 | 达标 |
| 突发拒绝 | 3375 | 30.4 | — | 1102.6 | 1000 | 未达 |
| 批次拒绝 | 24 | 312.2 | — | 2169.6 | 1000 | 未达 |

意外失败/超时/HTTP500=0；死锁=0；收敛 3ms；计数=事实=0（对账后）。

### 正式窗口（warmup60s+formal600s，runId=p62ra04-formal-01，start-cohort）

| 路径 | n(发起入组) | 合法n | 合法p99 | 预算 | 判定 |
|---|---|---|---|---|---|
| 实时 | 2870 | 2870 | 769.8ms | 300 | 未达 |
| 轻流程受理 | 2811 | 1500 | 1736.6ms | 2000 | 达标 |
| OA读 | 1175 | 1175 | 1090.5ms | 1000 | 未达 |
| OA审批受理 | 594 | 100 | 1556.0ms | 1000 | 未达 |
| 突发合法 | 45839 | 29162 | 698.1ms | 1000 | 达标 |
| 突发拒绝 | — | — | 1192.3ms | 1000 | 未达 |
| 批次拒绝 | 120 | 0 | 4101.9ms | 1000 | 未达 |

死锁=0（PG服务端日志零标记）；占用 790→对账两轮→0（无泄漏）；保护OA审批领取等待 max=39506ms >5000ms 上界（短轮3270ms 达标、正式窗未达——公平等待差异如实保留，为剩余主差异之一）。RG02/RG03 时效与公平预算在正式窗口尚未全部满足，差异如实保留待治理；执行侧继续项=超预算路径尾延迟与保护通道公平等待治理。

## 2. 传播与下一步

knowledge/current-status.md、knowledge/session-handoff.md、memory 五摘要、todo/requirement-pool.md、todo/p62-lowcode-transaction-bpm-tiering.md、Server 功能清单.md 本轮统一更新为：下一动作=Planner 复核 resource-assurance-04.md（附正式窗口结果与 RA03b 收尾路径裁决）。

执行侧剩余可独立推进项（不等待即继续）：①正式窗口结果补注与超预算路径的尾延迟治理；②RA03b 四视口可见浏览器取证（配方已留档）。
