# P62 探索附件 A：当前状态核验与信息治理矩阵（2026-09-30，执行实测）

> 主回执：`search_fallback/p62-current-seams-and-information-audit-20260930.md`。本附件承载 Q1/Q2 的逐文件核验值、行级重算、Git/CI/Release 回读与 0.1.3 身份分解。核验时点：2026-09-30（本会话），除注明外均为本次实测回读。

## A1. 权威值行级重算（Q1）

| 值 | 摘要沿用值 | 本次实测 | 结论 |
|---|---|---|---|
| 90 项清单 | ✅46/🟦22/⬜22 | `Smart-WorkFlow-aPaaS-server/功能清单.md` M01—M10 段（53—224 行）awk 逐行过滤 `\| Mxx-Fyy-zz \|` 行=90；按行尾状态列分计 ✅46/🟦22/⬜22；无缺状态行 | **一致（实测）** |
| ADV | 64 条 | 同文件 ADV 章节（225 行起）`ADV-M11..M18-Fxx-zz` 行=64 | **一致（实测）** |
| 功能数 | 45 | 未逐名复验 45 个登记路径；`knowledge/features/` 非模板文件 53 个（含 v0.1.1/v0.1.2 bugfix 等非业务计数登记），与 45 业务功能＋非计数任务并集相容；`knowledge/feature-reconciliation-index.md` §0 断言 45/45 存在 | **相容（部分实测）** |
| 映射索引 | 90 明细/56 唯一 P/54 I/55 product 目录 | 索引文件头声明同值；索引内 Mxx 行数 grep=90 | **一致（抽查）** |
| 已知问题 | 54 条开放（I1—I55 缺 I27） | `knowledge/known-issues.md` 头部与各同步注记维持 54 条口径（未逐行重审 676 行全文） | **口径一致（抽查）** |
| P62/关联 P | P62 PLANNING；P31 开放（企微延期）；P2/P4/P34/P35/P37/P38/P39 部分实现未核销；P57/P58/P21/P53/P60/P61/P59 已核销 | `todo/requirement-pool.md` 12 行（2026-09-30 当前排期）+158 行 P62 行+547/550-568 行逐项一致；本轮零核销 | **一致（实测）** |

裁决依据：功能状态与 P 核销仅取既有 Planner 裁决（本探索未改任何状态）；本轮重算结果与沿用值无冲突，**无需 Planner 裁决计数差异**。

## A2. Git / CI / Release 回读（Q1/G04，2026-09-30 本会话只读实测）

| 对象 | 实测值 |
|---|---|
| Workspace | 分支 `develop-sw` @ `cd6034f`；工作树有未提交的 memory 8 文件、todo 2 文件修改与 `product/p62-lowcode-transaction-bpm-tiering/`、`search_task/p62-…md` 未跟踪（均为 Planner 本轮规划产物） |
| Server | `develop` @ `8e23a2d`；`origin/develop`=`origin/main`=本地=8e23a2d（ls-remote 回读）；annotated tag `0.1.3`（对象 8e4f3625）→ 8e23a2d；CI run 36603608187 success（gh API 实测，headSha 8e23a2d）；Release `0.1.3` 非 draft/prerelease、资产 `bootstrap-0.1.3.jar`（gh API 实测，发布于 2026-09-29T17:31:51Z） |
| Web | `develop` @ `e3ae316`；origin/develop=origin/main=e3ae316；tag `0.1.3`（对象 fd48809）→ e3ae316；CI run 36602576798 success（gh API 实测）；Release `0.1.3` 资产 `sw-web-dist-0.1.3.zip`（发布 2026-09-29T17:32:23Z） |
| 无 0.1.1 tag/Release | 两仓 tag 列表仅 0.1.0/0.1.2/0.1.3（+build-* 与 v0.0.1*），与"0.1.1 无独立发布"记载一致 |

## A3. 0.1.3 五类身份分别表达（Q1/G04）

| 身份 | 值与依据 |
|---|---|
| 发布 | 0.1.3 tag/Release 双仓 Latest（上表+A2 实测）；制品 sha256 见 `product/v0.1.3-release/receipts/release-20260930.md` §5（本次未重新下载资产复算哈希，只核验存在性与元数据） |
| 部署 | UAT（`docs/ops/production-ops.md` 所述 chikaho.cn 单机）删库重建：Flyway 2 条至 v0.1.0、101 表、health 200、公网双 200（`deployment-20260930.md` 执行回执；远端现状本次未登录复核，属"部署回执记载"层级） |
| 开发版本 | Server 根 POM 默认 `0.1.3-SNAPSHOT`（develop）；Web package.json `0.1.3`；`version.json`=0.1.3（实测） |
| 迁移形态 | `V0.1.0__baseline_seed.sql` 单基线（PG 102/H2 104 唯一版本合并，等价性 sha256 双一致见 release 回执 §2）；**0.1.3 起仅支持全新建库**，≤0.1.2 原地升级被 validate 显式拒绝；锚测试重写为 H2 17/PG 11 |
| 待验收 | `v0.1.3-release` = EXECUTION_SUBMITTED 待规划验收；1629/0/0/0 为执行报告、尚未成为 Planner 锁定基线（与 memory/state.md、主方向 §6 口径一致） |

环境身份注意：0.1.2 部署段称"生产"、0.1.3 部署段按 Owner 指令称"UAT"，两者为同一 chikaho.cn 单机——该机当前运行 0.1.3（UAT 身份），0.1.2 生产身份随删库重建终止。此表述差异是易混点，建议治理时按"环境=chikaho.cn 单机；身份=UAT（0.1.3 起）"统一。

## A4. 逐文件信息治理矩阵（Q2；类型 a=过期当前表述 b=失效链接 c=矛盾/重复遗漏 d=当前历史混写）

| 文件 | 判定 | 发现（行号+原文要点） | 更正建议（可确定部分） |
|---|---|---|---|
| knowledge/current-status.md | **有问题** | ①3 行顶部条目："sso-admin-config 仍为 COMPLETED（待规划确认）"——与 2026-09-29 终局裁决冲突；6 行 SSO 条目同。②14 行历史区边界注记："当前值唯一见顶部「2026-09-29 三方 SSO」条目"——顶部实为 0.1.3。③21 行"项目当前版本为 0.1.2"（历史区内"当前"措辞）。④27 行失效声明⑦…"当前基线为 1570"等多处硬编码"当前"值已过期（应为 0.1.3 执行报告 1629 层级）。⑤100 行"当前唯一下一动作：待 Owner 授权推送两仓 develop"（已标历史但指针链陈旧） | ①更正为 `COMPLETED（规划已确认，2026-09-29）`，依据 `product/sso-admin-config/receipts/planning-final-review-terminal-sync-01-completed.md`（存在性已实测）+治理方向 §3 固定口径；②③④⑤把"当前值唯一见顶部"指针改指 0.1.3 条目、历史区内"当前"改"当时"。 |
| knowledge/session-handoff.md | **有问题（高优）** | 顶部覆盖值仍为 2026-09-29 三方 SSO；载"生产事实…应用 0.1.2、迁移终点 V102"、"当前唯一下一动作=…执行 sso-admin-config 方向（READY）"；无 0.1.3/P62 条目 | 新增 2026-09-30 覆盖值：P62 PLANNING 当前主规划、唯一下一动作=探索回传+0.1.3 待验收；旧值标历史。 |
| knowledge/feature-reconciliation-index.md | 基本健康 | §0 权威值与本次实测一致；无过期"当前"硬编码 | 无需更正（历史断言均已带日期） |
| knowledge/known-issues.md | 健康（抽查） | 头部各轮注记均带日期；最后同步注记 2026-09-26（本轮无新增问题，合理） | 无 |
| knowledge/decisions.md | 健康 | D1—D48 历史档案+D47+ 活跃权威指向 memory/decisions.md 注记明确 | 无 |
| knowledge/model-registry.md | 健康 | 引用路径全部实测存在（terminal-contract.json、validate-terminal.sh、stop-gate.sh/.ps1、两工程宪法、development-workflow.md） | 无 |
| knowledge/shared-constraints.md | 轻微 | §7 表"product 生命周期 → system.md §5.5"——现行 system.md §5 无 5.5 子节（锚漂移）；其余与 DynamicTableSql/租户约束一致 | 锚改为 `system.md §5` |
| knowledge/governance-authority-matrix.md | 健康 | 同步点 2026-08-29；引用文件全部存在（.claude/.codex hooks 实测在） | 无 |
| knowledge/README.md | 不存在 | 候选入口不存在（按治理方向"不凭空建副本"） | 标不适用 |
| knowledge/architecture.md | 健康 | §5 注明"粗粒度总览，权威以 current-status/映射索引为准"，0.1.0 校正行已注明时点 | 无 |
| memory/ 8 文件 | 基本健康（工作树未提交，Planner 本轮已纠偏） | state/README/handoff/features/issues/decisions 均含 2026-09-30 同步点；残留轻微项：features.md 6 行 BAO"基线 1570/0/0/0"无显式时点词（有 4 行总免责）；architecture.md 同步点 2026-09-13、constraints.md 2026-09-24（内容无冲突） | 可选：features.md BAO 行补"（Phase 6C 时点）" |
| memory 字节数（G05） | 达标 | 8 文件均 <5KB（最大 features 4,244B），总量 17,176B <20KB（实测 wc -c） | — |
| todo/requirement-pool.md | 健康 | 12 行已含"2026-09-30 当前排期"+"以下日期段均为历史快照"免责；P62 行 158 行登记；历史段旧"当前"措辞已被免责覆盖 | 无（历史段保持原文） |
| todo/ 其他 | 健康 | p62-lowcode-transaction-bpm-tiering.md=正式需求（已读，R01—R10/A01—A12 完整）；其余为暂不修复/待办索引 | 无 |
| 根 README.md | 健康 | 能力描述无版本数字/状态计数（治理矩阵约定其不得保存当前状态数字） | 无 |
| CHANGELOG.md | 注意 | 最新条目 0.1.0；0.1.2/0.1.3 未新增——0.1.3 发布回执 §6 已声明"沿 0.1.2 先例未新增条目（以 version.json+release/ 为准）"，属已记录实践 | 按 Planner 裁决决定是否补条目；不属执行可确定项 |
| version.json | 健康 | 0.1.3、Flyway V0.1.0 双库、种子说明、tag/Release 授权注记齐全（实测） | 无 |
| Server/功能清单.md | **有问题（高优）** | 49 行"当前焦点"引注块仍为 0.1.0 时点：正式基线 1423/V93、0.1.0 发布身份、"当前唯一下一动作=等待 Owner 自行体验"；229 行"不并入已完成功能数 44"（现 45）。明细行本身 90 行计数与状态正确（A1 实测） | 当前焦点段重写为 0.1.3/P62 口径（基线层级：0.1.3 执行报告 1629，待规划验收）；44→45；历史基线保留下移 |
| Server/README.md | 轻微 | "当前可体验的业务闭环"标"0.1.0 已交付"，未反映 0.1.2/0.1.3 增量（0.1.3 新增 SSO 配置管理页） | 可确定：补一句"0.1.2/0.1.3 发布说明见 release/0.1.2|0.1.3/，0.1.3 新增后台 SSO 配置管理与种子基线重建" |
| Web/README.md | 轻微 | 同上（0.1.0 锚定） | 同上 |
| product/ 目录 | 健康 | 无顶层索引文件（不适用）；p62 目录 ready/ 两方向在位；sso-admin-config 终局裁决回执、v0.1.3-release 两回执实测存在；release/0.1.0|0.1.2|0.1.3 目录齐 | 无 |
| AGENTS.md / CLAUDE.md | 健康 | 纯路由，无状态事实 | 无 |

## A5. 待 Planner 裁决/知晓项汇总（Q2 按方向 §6 边界提交）

1. current-status.md 顶部 sso-admin-config 状态值（"待规划确认"→"规划已确认"）：裁决依据唯一（sso 终局复核回执+治理方向 §3 已固定值），**更正内容可确定**，但涉及功能状态字段，按方向留治理执行落实。
2. Server/功能清单.md 当前焦点段重写：涉及"当前正式基线"表述层级（1629 是执行报告非锁定基线），方向已给出口径，重写文本可确定。
3. CHANGELOG 0.1.2/0.1.3 条目补否：属发布材料实践裁决，列 Planner。
4. "生产/UAT"环境身份统一表述（A3 注意项）：建议口径已给，采纳与否归 Planner。
5. 其余 A4 表"更正建议"列均为无争议文档事实更正，可在治理执行中直接落实（方向 §6 授权范围）。
