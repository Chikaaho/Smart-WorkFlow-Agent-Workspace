# 探索任务：基线静态复核 + 记忆/知识库跨文件一致性检查

> 派发：规划层，2026-08-16。执行角色自主探索，产出唯一回执。

**任务目标**：静态复核当前基线数字（后端 527 tests / 前端 66f569t / 清单 ✅12🟦37⬜41 / Flyway V30+28 冒烟口径 / 已完成功能 16 个），并做 `memory/` 与 `knowledge/` 之间的跨文件一致性检查，列出所有过时/冲突条目供规划层修正。

**需要回答的问题**：

1. **后端测试总数**：静态源码口径逐模块数 `@Test`（注明 435 源码/436 运行双口径先例），总数是否 = 527？模块分布列出。
2. **前端**：spec 文件数是否 = 66？测试用例静态计数是否 = 569（数 `it(`/`test(` 块）？
3. **Flyway**：所有迁移目录（root + 各模块）文件清单，确认 V30 已占、bpm 迁移链现状（I47 partial index 问题）、"28 冒烟口径"（含 form V12）是否成立。
4. **功能清单计数**：`Smart-WorkFlow/功能清单.md` 状态列快速计数是否 ✅12/🟦37/⬜41 共 90 行（逐行判定属另一任务，此处仅计数）。
5. **memory/ 与 knowledge/ 的冲突/过时清单**：已知疑点——`memory/state.md` 基线仍为 426/63f552t 且"已完成功能 11 个"（2026-08-11 未随 D76-D82 更新）；`memory/features.md` 页脚"14 个功能追踪文件"vs `knowledge/features/` 实际文件数；其余自行发现（比对 `memory/handoff.md` 基线段）。
6. `knowledge/current-status.md`、`knowledge/session-handoff.md` 与 `memory/handoff.md` 的基线/计数/进行中状态是否互相一致。
7. 各文件的"最后更新"日期与内容新旧是否匹配（内容过时但日期新的，或反之）。

**搜索范围**：两端代码（只读）、`memory/`、`knowledge/`（current-status/session-handoff/architecture/features 等）、`Smart-WorkFlow/功能清单.md`、`todo/`。

**禁止范围**：不修改任何文件（仅允许写回执文件）；**不执行 mvn/pnpm/npm/java/node 编译或测试命令**（纯静态读码计数）；不写 knowledge/、memory/、todo/。

**预期证据**：每个数字附计数命令口径或文件清单；不一致清单逐条列出（文件 | 字段 | 旧值 | 应为 | 证据）。

**完成标准**：全部问题有答案 + 不一致清单逐条列出 + 回执按 §0.5.5 格式写入指定位置。

**失败处理**：静态计数有歧义的注明口径假设；不确定项列入"未确认事项"。

**回执位置**：`search_fallback/baseline-static-recount.md`

**附注**：回执结论优先、正文压缩，禁止大段粘贴源码。
