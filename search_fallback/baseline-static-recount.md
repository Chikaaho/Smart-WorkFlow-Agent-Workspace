# 探索任务回执：基线静态复核 + 记忆/知识库跨文件一致性检查

- **任务来源**：`search_task/baseline-static-recount.md`（规划层派发，2026-08-16）
- **执行日期**：2026-08-16
- **执行方式**：1 个 Sub Agent 静态计数（find/grep/wc，排除 target/ 与 .claude/worktrees/ 陈旧副本）+ 汇总层整理；未执行任何编译/测试命令，未修改任何文件
- **结论摘要**：**基线五个数字全部核实成立**（后端 527 ✓ / 前端 66f 且 569 为运行口径 ✓ / 清单 12·37·41=90 ✓ / Flyway V30+28 ✓ / 已完成 16 个 ✓）；**memory 全部最新自洽**；knowledge 两文件（current-status/session-handoff）**顶部新、中下部残留**，不一致 17 处（§5）

---

## §1 后端测试总数：**527 ✓**

源码口径逐模块数 `@Test`（仅 src/test，排除 target/、.claude/worktrees/）：

| 模块 | @Test 计数 |
|---|---|
| sw-basic（249） | agent 178 · iot 0 · job 48 · knowledge 0 · notify 7 · storage 16 |
| sw-biz（258） | form 76 · openapi 0 · system 111 · bpm 71（engine 21 + process 50） |
| sw-framework（20） | common 16 · security 4 |
| sw-bootstrap | 0 |
| **总计** | **527** ✓ |

与 521→527 演进自洽（engine 18→21 = B1 +3；process 47→50 = B2/B3 +3）；本数为源码口径，与运行口径 527/0/0 一致（435 源码/436 运行双口径先例不再适用，当前两口径相等）。

## §2 前端：spec 66 ✓ / 测试 **569 为运行口径**（静态 561，差值已解释）

- spec 文件数 = **66** ✓（全在 src/，vitest include 范围无额外文件）
- 静态 `it(` 块 = **561**（test( = 0；行首锚定/词边界/occurrence 多口径交叉验证一致）；≠569
- **差值 +8 已完全解释**：`src/styles/tokens.spec.ts` CATEGORIES 循环（1 个静态 `it(` 运行时展开为 9 个）——与 kb-verification 历史先例（463 静态/471 运行，+8 定位同文件）吻合
- 演进 delta 自洽：git archive 验证 D82 前 63 文件静态=544 → 当前 561（+17 = 3 新 spec 6+4+6 + GraphDesigner +1，与声称 +17 一致）；552/569 同为运行口径（552=544+8，569=561+8）
- **建议**：基线文档今后注明前端计数为**运行口径**（后端早有"435 源码/436 运行"先例，前端从未标注，是本次口径差异的根源）

## §3 Flyway：V1-V30 全占无缺号 ✓；V30 ✓；I47 描述准确 ✓；28 冒烟口径 ✓

- 无 root 级 db/migration 目录——迁移全部在模块 resources，sw-bootstrap 为聚合链（"root 路径"实指 bootstrap 链）
- 60 个 V 文件（h2 30 + pg 30 双份），distinct V 号 1-30 连续无缺号；**V30 已占**（`sw-bootstrap/.../{h2,postgresql}/V30__sys_role_dept.sql` 双份逐字一致）✓
- **bpm V8 partial index（I47）**：bpm/h2/V8 L34 与 bpm/postgresql/V8 L39 均有 `create unique index uk_sw_bpm_binding_active ... where active = true`——「H2 不支持、全链 H2 迁移从未可跑」描述准确
- **28 冒烟口径 ✓**：30 − bpm 2（V8/V14 被 I47 排除）= 28；6 链（bootstrap 14 + notify 1 + form 2 + agent 9 + job 1 + storage 1）= 28；**form V12 双份确认在计**（此前漏计项已纳入）；mysql/oracle 目录仅 README；iot/knowledge 迁移目录为空

## §4 功能清单计数：✅12 / 🟦37 / ⬜41 = 90 行 ✓

文件总 209 行（含表头/约定/空行），状态列快速计数与声称口径完全吻合。

## §5 memory↔knowledge 不一致清单（17 处，规划层修正依据）

| # | 文件 | 字段 | 旧值 | 应为 | 证据 |
|---|---|---|---|---|---|
| 1 | `memory/features.md` 页脚 | "14 个功能追踪文件" | 14 | **15（或16）** | 表内 16 行；`knowledge/features/` 实为 15 个功能文件 + _template |
| 2 | `knowledge/features/` | agent-model-orchestration.md | 缺失 | **应有** | features.md 有该行且 README 声明详情在 `knowledge/features/*.md`；M07 详情仅存 `product/agent-model-orchestration/passed/` |
| 3 | `knowledge/decisions.md` | 决策注册表 | 止于 D46（07-28） | **D47-D82** | 全文 0 处 D47+；memory/decisions.md 已有 D76/D82 等——补录或裁定注册表归属 |
| 4 | `memory/state.md` L31 | "root 路径 V26 已占；V27+ 空闲" | V27+ 空闲 | **V27-V30 均已占** | V27/V28（Step12）/V29（菜单 seed）/V30（sys_role_dept）文件均存在（M07 时期段落残留） |
| 5 | `knowledge/current-status.md` §4 | 进行中表 | bpm-plugin-architecture 仍 PLANNING（表头 07-25） | **已 COMPLETED/无进行中** | 同文件 §1 已记 08-16 闭环 |
| 6 | `knowledge/current-status.md` §5 | 已完成功能表 | 14 行，缺 agent-model-orchestration + bpm-plugin-architecture（表头 07-24） | **16 行** | 与 §1/memory/handoff 对照 |
| 7 | `knowledge/current-status.md` §8 | "全部 13 个功能已完成闭环"；候选 5 M04-F08-01 | 13；列为待办候选 | **16；M04-F08-01 已闭环** | memory 两侧均 16 |
| 8 | `knowledge/current-status.md` §9 | 测试基线两行 | 后端 521、前端 63f/552t | **527、66f/569t** | §1 顶行已更新，§9 未同步 |
| 9 | `knowledge/current-status.md` §1 L18 | "V1-V17 连续无缺号…无 V18" | V1-V17 | **V1-V30** | V18 refresh_token 等均存在 |
| 10 | `knowledge/current-status.md` §2.1 | sw-basic-agent | "⬜ 骨架 AutoConfiguration 占位" | **完整模块** | 178 个 @Test |
| 11 | `knowledge/current-status.md` §2.2 | Vue Flow adapter | "零消费方" | **GraphDesigner 已消费** | state.md L54"首个消费方"；adapters/flow-graph spec |
| 12 | `knowledge/current-status.md` L249 | 参考索引 | "功能清单（54 功能/89 明细）" | **55/90** | §1 同文件已记 55/90 |
| 13 | `knowledge/session-handoff.md` §3-15 | 全段 | 11 个功能/465 tests/60f521t；页脚 07-30；"待规划层最终验收" | **16 个/527/66f569t；D82 已 PASSED** | 仅 §1-2 被 D81 更新，§3-15 为 07-30 残留 |
| 14 | current-status L22 + session-handoff L27/35 | "待规划层最终验收" | 待验收 | **已 PASSED（D82，08-16）** | memory/decisions.md D82=PASSED |
| 15 | `knowledge/architecture.md` §7.3 | "已完成 7 个功能" | 7 | **16** | 07-28 旧档，属一致老化低优先 |
| 16 | `memory/features.md` | 行名 | "sys-mgmt-crud" | **system-mgmt-crud.md** | 与文件实际名不一致（命名统一） |
| 17 | `memory/state.md` L54 | 前端计数注记 | "63f/539t" | — | D65 时点注记残留（次要） |

## §6 三文件对比结论

| 项 | memory/handoff.md | knowledge/current-status.md | knowledge/session-handoff.md |
|---|---|---|---|
| 后端测试数 | 527 ✓ | 顶行 ✓ / **§9 521 ✗** | 顶节 ✓ / **§9 465 ✗** |
| 前端 spec/测试 | 66f/569t ✓ | 顶行 ✓ / **§9 63f/552t ✗** | 顶节 ✓ / **§9 60f/521t ✗** |
| 清单计数 | ✅12/🟦37/⬜41 ✓ | ✓（§1） | ✓（顶节） |
| Flyway | V30/28 ✓ | ✓（§1） | 未提（"零迁移"）✓ |
| 已完成功能数 | 16 ✓ | **§8 13 ✗** | **§9 11 ✗** |
| 进行中功能 | 无，待选方向 ✓ | **§4 仍列 bpm-plugin PLANNING ✗** | 无，但"待验收"过时 ✗ |

**结论**：`memory/handoff.md` 与 `memory/state.md` 完全最新且互相一致；`knowledge/current-status.md` 与 `knowledge/session-handoff.md` 均为"顶部更新、中下部残留"——D81 的"知识库全量同步"只覆盖了两文件首部段落，**本轮清单复核/known-issues 复核的基线引用不受影响**（均以 memory 与两文件首部为准）。

## §7 日期与内容新旧匹配

| 类别 | 文件 | 判定 |
|---|---|---|
| 内容新+日期新（匹配） | memory/ 全部状态文件（08-16）、known-issues.md（08-16）、features/bpm-plugin-architecture.md（08-16）、data-scope-enforcement.md（08-15） | ✓ |
| **日期新但内容旧（不匹配）** | knowledge/current-status.md（08-16 20:13，中部 §4/§5/§8/§9 过时）、knowledge/session-handoff.md（08-16 20:14，仅顶部两节新，页脚仍 07-30）、knowledge/decisions.md（08-14，内容止于 07-28 D46） | ⚠ 见 §5 对应行 |
| 日期旧内容旧（一致老化，可接受） | knowledge/architecture.md（07-28）、memory/architecture.md（07-30）、memory/README.md/constraints.md（08-14 静态索引） | 可接受 |

## §8 未确认事项

1. **前端 569 运行/静态口径差（+8）**：已用 tokens.spec.ts 循环展开完全解释（与 kb-verification 先例吻合），但禁运行约束下未 vitest 实证；若规划层今后采用静态口径应为 **561**。所有基线文件均未注明前端计数口径（§2 建议）。
2. **knowledge/decisions.md 缺 D47-D82**：补录还是该注册表已被 memory/decisions.md 取代，需规划层裁定（README 仍指向前者为完整注册表）。
3. "mvn BUILD SUCCESS 12:07min"、"四连全绿"等运行事实无法静态验证；数字口径（527/66f/561+8/28/V30）已全部静态核实。
