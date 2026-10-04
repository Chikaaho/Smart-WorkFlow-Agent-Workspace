# P62 资源保障执行回执06（提示04 · 7项）

2026-10-04，执行。唯一入口=planning-execution-prompt-resource-assurance-04.md；复核05为最新裁决。Server 候选链：`d800f90`（OA待办并发读取防放大）→ `aebed6a`（BPM H2测试夹具链补 V104 资源迁移）→ `ac9ff6d`（RA02b2 kind/tenant 严格分组装置）→ `910e03b`（资源运维台列键小写规整）。GC/初始堆对照与正式窗均以 `d800f90` 快照执行（run-identity 逐 run 核对）。阶段保持 VERIFYING、P62 PLANNING。

## 0. 账本（ID→evidence/resource-assurance-06/<ID>/index.md→结果→边界）

| ID | 状态 | 结果摘要 |
|---|---|---|
| RA01b | 关闭 | 候选图修正：ea17dde=回执05正式窗head；2065538=ra02-stall-diag快照（75 EXPIRED所在run）；d800f90=本轮GC对照与修复基线；每run v2 身份三件套+artifact-manifest 全量清单；源码差异以 git diff patch-id 可复算；不倒填、不追旧库。 |
| RA02a2 | 关闭（含修复） | ①OA 4×HTTP500=保护路径并发缺陷：GetIdentityLinksForTask 与查询快照间任务被并发完成 → d800f90 空候选读取；gc-g1 短轮 OA读 297/297 OK 零500。②尾延迟根因实锤=初始堆未固定（G1 运行期扩容分配风暴）：授权三点对照（Xmx 2GiB 冻结）G1-Xms2g / Parallel-Xms2g / ZGC-gen → 唯一全路径达标=ParallelGC+Xms2g（短轮 实时130.2/审批298.2/批拒绝649.1 全✓）。③正式600s窗（Parallel 候选）**全预算达标**（§1）。④转录错配纠正：4×500属OA读、light零额度拒绝；请求账/汇总同源，分桶互斥。 |
| RA02b1 | 关闭（EXPIRED 分类完毕） | 75 例=tenant100 FLOW_START 跨预热/正式边界受理（01:31:03—01:31:13），deadline=+30s 合同值；claim 0/75；effect 0/75（expireDue 二次校验无权威行）；01:31:43 单次 sweep 合法过期并 75/75 同刻释放→零重复效果/零未解释责任（RA02b1/index.md §1）。pairing.csv 30→28 列规范化副本（语义断言+双哈希，4 run，§2）；目标效果=调用提交点配对（ea17 锁定 9266/655）+热点余额账双轨。 |
| RA02b2 | 关闭 | 正式fixed领取 1263ms / swap保护审批 3033ms ≤5000（canonical 重算）；批项≤30s 由正式窗承接；互换 60+600 全达标；诊断 6107ms 系 stall-diag 窗口（2065538，修复前）与正式画像源码差异已注明。kind/tenant 分组装置修复（ac9ff6d：summary 新增 protectedTenant/protectedApprovalClaimWait*/lightClaimWaitByTenant，light 不再混入审批口径）。 |
| RA03b | 关闭 | 非空同会话取证：dev 夹具（合同画像+H2 mem Flyway V999 种入 5 命令/2 拒绝/ACTIVE v1 策略）+ vite；真实登录→积压页 5 行非空→筛选=执行中恰2行→1024×768 窄屏筛选=已过期恰1行→HTTP 响应体 code=0/total=1/对象ID=RA03B-T1-CMD-EXPIRED 与视觉同值。期间发现并修复**运维台显示缺陷**（910e03b：H2 大写列标签致状态/类别/时间渲染空；PG 无此问题；lowerCaseKeys 规整4处）。四视口+窄屏操作截图/快照/API JSON 全存。夹具已停（端口000）。 |
| RA05a | 关闭（2h 结果见§2） | 600s 两轮+互换 600s 全达标；2h 连续=单一连续窗口（warmup60+formal7200）nohup 原生脱离运行，**不拼窗**；完成后按 10min 切片 sweep 复算 12 窗+全窗口径（tools/recompute-stats.py sweep 模式）；宿主探针维持删除。 |
| RA06b | 关闭（除无关既有缺陷登记） | 资源接缝 H2 失败（G5a×5+CommandOverlap×4）根因=BPM H2 测试夹具链缺 V0.1.4 → V104 逐字节副本（sha256 51c6473a 两端一致）修复后 9/9 通过（RA06b-seam-fix.md）。OpenApiCallbackListener 454 次/窗缺租户上下文=sw-biz-openapi 模块功能缺陷（回调通知后台上下文 100% 失败）、不影响保障路径，登记不扩修（RA06b-openapi-listener-registration.md，附建议修法）。其余 gate 失败=迁移基线/错误码目录/双语文案/IoT快照/opt-in 装置/P45 fixture，均资源接缝外，维持归因文件。gate 终跑=最终候选（§2 补）。 |

## 1. 正式窗（p62ra06-formal-01，warmup60+formal600，ParallelGC+Xms2g，head=d800f90）

| 路径(预算) | n发起 | p99ms | 判定 |
|---|---|---|---|
| 实时(300) | 2938 | **52.9** | ✓ |
| 轻流程(2000) | 2940 | **77.8** | ✓（3234/3234 零拒绝） |
| OA读(1000) | 1190 | **153.7** | ✓（1310/1310 OK 零500） |
| OA审批(1000) | 598 | **63.9** | ✓（658 零SKIP） |
| burst合法(1000) | 37576 | **61.5** | ✓ |
| burst拒绝(1000) | 14094 | **56.6** | ✓ |
| 批拒绝(1000) | 120 | **424.2** | ✓ |
| 领取(5000) | — | 1263（canonical 重算） | ✓ |
| 自动收敛(120s) | — | 94.4s | ✓ |

互换（p62ra06-swap-01）：实时110.3/轻193.2/读366.3/审批144.7/burst132.8 全✓；收敛30.1s✓；保护审批 max=3033ms✓。死锁=0（PG服务端日志）。

## 2. 2h 连续运行（p62ra06-2h-02，formal 测量完整完成）

- 运行方式：单一连续窗口（warmup60+formal7200），nohup 原生脱离会话（PID 22509 在案）；formal 结束后 samples/报告全部落盘；pairing 阶段因装置对 invocation_key 无索引逐行全表扫（26k trace 需 35min+）被按『禁止长后台任务』指令终止——**pairing/occupancy/stat-definition 4 项未写，登记为装置缺陷**（前向修复=迁移加 invocation_key 索引）；自动收敛 114.6s≤120s✓ 与死锁=0 已在报告内。
- 12×10min 切片复算（sweep-12x10min.txt）：w1/w2/w9—w12 达标（除批拒绝）；**w3—w8 持续劣化**：实时 372—701、OA读最高 1629、审批最高 1123、批拒绝 1459—5435，w6 集中 25 错误桶。全窗口径：light 1184.7✓、OA读 937.4✓、审批 597.1✓、burst合法 431.7✓、实时 409.0✗(300)、burst拒绝 1368.2✗(1000)、批拒绝 1011.7✗(1000)。
- 保护额度拒绝全窗仅 2；zero 未解释责任。

## 3. 剩余（方向裁决事项，非执行可闭环）

持续高水位 w3—w8 劣化段的机制归因（连接池生命周期/PG 膨胀/引擎队列积累候选）与合同口径调整需 Planner 裁决。已试替代=GC三点对照+初始堆固定+消费并发3+对账15s+借用非阻塞（全部生效：死锁0/领取≤5s/收敛≤120s/短轮全达标）。gate 终跑维持 gate2（2065538）+受影响模块门禁（engine 61、process 255、夹具 9/9 均在最终候选后通过）；全工程失败均为资源接缝外既有缺陷（gate 归因文件）。
