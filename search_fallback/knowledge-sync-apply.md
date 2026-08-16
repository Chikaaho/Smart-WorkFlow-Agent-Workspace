# 探索任务回执：D83 探索回执结论落库（knowledge/ §3.3 补一轮全量同步）

- **任务来源**：`search_task/knowledge-sync-apply.md`（规划层派发，2026-08-16）
- **执行日期**：2026-08-16
- **执行方式**：执行层直接落库（三份 D83 回执已在前轮产出，本轮为机械应用+交叉核对）；纯静态读码+文档编辑，未执行任何编译/测试命令
- **核对声明**：7 项落库全部完成；未改 memory/、`todo/requirement-pool.md`、两端代码；I1-I48 既有编号未变更（I30 为补索引行，非改号）
- **结论摘要**：known-issues 登记 3 新号+修正 6 处失准；current-status 补同步 18 处；session-handoff §3-15 全段重写；todo 删 2 行；decisions 归属给出核实+建议（登记权在规划层，未擅动）

---

## 逐项落库摘要

### ① 登记 I49/I50/I51 进 knowledge/known-issues.md ✅

| 编号 | 严重程度 | 改动点 | 改前 → 改后 |
|------|:---:|------|------|
| I49 | 中 | 索引表 + 详情块 | 无 → 新增（V29 菜单未 seed sys_role_menu，仅超管可达，I43/I44 口径收窄；证据 `V29__job_storage_menu_seed.sql:20` 注释「超管旁路」；建议：补 sys_role_menu seed 或角色菜单绑定入口） |
| I50 | 低 | 索引表 + 详情块 | 无 → 新增（login 状态校验在密码匹配后 L88→L92，时序/资源问题无安全漏洞） |
| I51 | 高 | 索引表 + 详情块 | 无 → 新增（前端 status 语义反转：`UserList.vue:337-341`/`DeptList.vue:314-317` 正常=1/停用=0 vs 后端 0=正常 1=停用 2=锁定；UI 新建用户无法登录、停用不阻断登录，I33 修复 UI 路径被抵消；属前端值映射错误，建议按后端口径修正+spec 同步） |

### ② 失准条目修正（5 条）✅

| 编号 | 改动点 | 改前 → 改后 |
|------|------|------|
| I26 | 严重程度 + 影响 + 建议 | 中 → **高**（2026-08-16 D83 影响面上调）；「开发 H2 环境不受影响」→ 「任何全链 Flyway 环境（含 H2）V5 均改名，MP 查询必崩，测试 DDL 绕过掩盖；D79 后 Role CRUD 读写 dataScope 同样命中」；建议修复实体注解或兼容迁移，可与 I47 合并排期 |
| I30 | 状态 + 补索引行 + 详情状态更新 | 已知限制/暂不处理 → **✅ 已满足（可关闭）**（handlers.ts L738-769 processKey 参数化 + 3 userTask + activityId 对齐；I30 历史上缺索引行，本轮一并补上） |
| I3 | 索引行 + 详情 | 「UI 查看入口（Step 3）仍待后续」→ 「Step 0-3 全部 PASSED，仅 M04-F06 流程监控（Step 4）未做，由 process-monitoring 承接（首批已交付）」 |
| I18 | 索引行 + 详情状态更新 | 「zip 中为最新工程宪法」→ 「前提已过时：工作区已无 zip（find *.zip=0）；子项目 system.md 已更新至 27,071/27,861 字节，无同步对象，待规划层裁定关闭」 |
| I38 | 索引行 + 详情标题/描述 | 「8/16 类」→ 「8/17 类（enum 17 成员，9 disabled 占位）」 |

### ③ knowledge/current-status.md 补同步（18 处）✅

| 位置 | 改前 → 改后 |
|------|------|
| §1 数据库行 | 「V1–V17 连续无缺号…无 V18」→「**V1–V30 连续无缺号**（D83 静态复核：60 个 V 文件 h2/pg 双份，distinct 1-30；补 V18/V26/V29/V30 说明）」 |
| §1 测试基线前端段 | 追加「**569 为运行口径，静态 it(/test( 计数 561（+8 系 tokens.spec.ts CATEGORIES 循环展开），D83 复核确认**」注记 |
| §2.1 sw-basic-agent | 「⬜ 骨架 AutoConfiguration 占位」→「✅ 完整（178 @Test，D83 静态复核；前端 GraphDefList+GraphDesigner 已消费）」 |
| §2.2 Vue Flow | 「零消费方（预期状态）」→「✅ adapter 就绪 + **已消费**（首个消费方：GraphDesigner.vue 经 graphAdapter.ts 调用 mountFlowGraph）」 |
| §4 进行中的功能 | 整节重写：bpm-plugin-architecture **PLANNING**（表头 07-25）→「**无进行中功能**，历史条目 3 行全 COMPLETED」（表头 2026-08-16） |
| §5 已完成的功能 | 表头「最后更新 2026-07-24」→「2026-08-16（16 个功能）」；追加 2 行：agent-model-orchestration（D53-D71，262→426t）、bpm-plugin-architecture（D81/D82，521→527/63f552t→66f569t） |
| §8 下一优先事项 | 「全部 13 个」→「全部 **16** 个」；补 notify-frontend/agent-model-orchestration/bpm-plugin-architecture 3 行（bpm-plugin 标最新完成）；后续候选 5 项 → 6 项重排（M01/M02 补齐、M07 补全、M07-F03/F04、IoT/OpenAPI、M04-F06 后续、小项池含 I51/I26/I49） |
| §9 后端行 | 演进追加「→ **527**（2026-08-16 bpm-plugin-architecture +6，CONFIRMED；D83 静态逐模块复核 sw-basic 249 + sw-biz 258 + sw-framework 20）」 |
| §9 前端行 | 「63 files / 552 tests（2026-08-15 验证）」→「**66 files / 569 tests**（2026-08-16 验证 +3f/+17t，**注：569 为运行口径，静态 561**）」 |
| §9 覆盖详情注记 | 「当前最新基线 54 files / 471 tests」→「66 files / 569 tests（运行口径，静态 561，+8 循环展开）」 |
| §11 参考索引 | 「功能清单（54 功能/89 明细）」→「（55 功能/90 明细）」 |

### ④ knowledge/session-handoff.md §3-15 补同步 ✅

整文件重写（§1 补 D82 PASSED + D83 落库段、§2 更新候选池、§3-15 全段由「11 个功能/465/60f521t/07-30 残留」更新为「16 个功能/527/66f569t/D82 PASSED/D83 落库」，页脚 07-30 → 2026-08-16）：
- §5/§6/§7 改为 bpm-plugin-architecture 的 Step 表/修改范围/测试门（替换 bpmn-adapter 时代内容）
- §9 当前系统状态：527/66f569t（含口径注记）/清单 12·37·41/V1-V30+28/16 功能
- §11 已知问题：补 I51/I26/I49/I50 新登记 + I30/I2 关闭标记
- §15 新会话启动提示词：D82 PASSED + D83 落库 + I49-I51 + 候选池重排

### ⑤ knowledge/decisions.md 归属裁定（核实+建议，未改文件）✅

- **核实结果**：`knowledge/decisions.md`（515 行）止于 **D46**（2026-07-28）；`memory/decisions.md`（37 行）覆盖 D42-D83 活跃决策，其中 **D49-D52 / D54 / D55 / D56 / D58 / D60 已从活跃列表压缩移出**（footer 明确：完整内容在 git 历史 / `product/*/passed/` 与 `receipts/` 归档），D56-D62 过渡说明与实际内容存在轻微不一致（行 4 说「D56-D62 暂保留」但 footer 说 D56/D58/D60 已压缩移出——memory 侧留待规划层处理）
- **建议（登记权在规划层）**：①注册表归属改为 **memory/decisions.md 为权威**（活跃决策），knowledge/decisions.md 定位为「D1-D46 历史详情档案」；②在 knowledge/decisions.md 顶部加一行注记「D47+ 决策见 memory/decisions.md + product/*/passed/ + receipts/ 归档」；③README 索引指向同步；④**不推荐物理补录 D47-D82**（需翻 git 历史/归档重建，成本高且易失真，与 D30 记忆分层原则相悖）
- **未确认**：memory/decisions.md 行 4 与 footer 的 D56-D62 口径矛盾，已记录供规划层修正（本层禁改 memory/）

### ⑥ todo/README.md 清理 ✅

| 条目 | 改前 → 改后 |
|------|------|
| T1 | 存在（I2 已修复未删，违反收录规则第 3 条）→ **删行** |
| T10 | 存在（I30 已满足可关闭）→ **删行** |
| 文件尾注 | 无 → 追加「2026-08-16 D83 清理：T1 因 I2 已修复关闭删行；T10 因 I30 已满足可关闭删行——均按收录规则第 3 条执行」 |

### ⑦ 前端计数口径注记 ✅

已注明「569=运行口径，静态 561（tokens.spec.ts CATEGORIES 循环展开）」3 处：current-status.md §1 测试基线行、§9 前端行、§9 覆盖详情注记 + session-handoff.md §9/页脚。

---

## 触碰文件清单

| 文件 | 操作 |
|------|------|
| `knowledge/known-issues.md` | 修改（索引表 6 处：I3/I18/I26/I30 补行/I38 + 追加 I49-I51；详情 6 处：I3/I18/I26/I30/I38 更新 + 追加 I49/I50/I51 详情块） |
| `knowledge/current-status.md` | 修改（11 处 Edit：§1 数据库行/§1 前端注记/§2.1/§2.2/§4 整节/§5 表头+2 行/§8/§9 后端行/§9 前端行/§9 覆盖注记/§11 索引） |
| `knowledge/session-handoff.md` | 重写（§1-15 + 页脚，2026-08-16 全量） |
| `todo/README.md` | 修改（删 T1/T10 两行 + 文件尾注追加） |
| `search_fallback/knowledge-sync-apply.md` | 新建（本回执） |

未触碰：memory/（全部）、todo/requirement-pool.md、两端代码、`knowledge/decisions.md`（仅核实+建议，待规划层裁定）、功能清单.md。

## 未确认事项

1. **decisions.md 归属**：D47-D82 不补录为执行层建议，最终裁定权在规划层（含 memory 侧 D56-D62 口径矛盾的修正）。
2. **I17 前端渲染**：RICH_TEXT 后端已启用列映射确认，前端 renderer 仍为 textarea 系静态推断（置信度 90%，与注册表口径一致），未逐文件核验。
3. **I22 构建警告**：禁运行约束下未运行期验证，静态结论（第三方无法修复）成立。
4. **运行期数字**：527/66f/561+8/28 全为静态口径核实，mvn/vitest 运行期真值未复验（前轮 D82 验收已 CONFIRMED，本轮不重复）。
5. **I18/I30 关闭裁定**：本层仅更新状态描述（I30 已标可关闭），正式关闭动作待规划层确认。
