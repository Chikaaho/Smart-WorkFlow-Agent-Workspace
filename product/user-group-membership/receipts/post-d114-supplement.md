# user-group-membership 二轮补充回执（D114 标准 9/10/11 补证）

> 依据 `receipts/planning-rereview-d114.md` 逐项补齐；标准 1-8 已通过结论沿用，主体功能/V34/授权链/前端 71f·646t 保留。

## 标准 9：后端项目级计数统一（补证通过）

**根因澄清**：此前 1292 是把 Maven 输出中「类级行（含 `-- in`）」与「模块汇总行（Results 后）」**两类行重复累计**所致——规划层判断正确。

**权威口径（可复算）**：

| 统计面 | 命令/来源 | 结果 |
|--------|----------|------|
| 类级行求和 | `grep "Tests run:" <mvn test 输出> \| grep -- "-- in " \| awk 求和` | **646** / 0 / 0 / 0（108 行） |
| 模块汇总行求和 | 同输出，`grep -v -- "-- in "` | **646** / 0 / 0 / 0（11 行） |
| surefire XML 聚合 | 全模块 `target/surefire-reports/*.txt`（109 个 XML，去重复制）| **647** / 0 / 0 / 0 |
| 模块小计 | sw-framework 22 + sw-basic 262 + sw-biz 340 + sw-bootstrap 23 | **647**（与 XML 一致） |

- 类级行 646 与 XML 聚合 647 差 1：嵌套类（如 `JobFacadeImplTest$GetByJobNameTests`）在 Maven 日志合并显示、XML 分开计。
- **项目级测试总数 = 647（surefire XML 聚合口径，与规划层引用的模块小计一致）**；1292 弃用。
- 用户组专项：Service 15 + Controller 12 + 集成 12 + 授权 6 = 45；前端增量另计。

## 标准 10：互斥检查覆盖全工具族（补证通过）

快照命令扩展至 `mvn|vite|vitest|eslint|vue-tsc|tsc|node`（含 pnpm/npm 触发的 node 编译进程），并用 `pgrep -fl` 排除匹配自身的 grep/pgrep 进程：

```
pgrep -fl "mvn|vite|vitest|eslint|vue-tsc|tsc"   → PGREP_COUNT=0
pgrep -fl "node" | grep -iE "vite|vitest|eslint|vue-tsc|pnpm|npm-cli" → NODE_FE_COUNT=0
```

- 执行时间线（严格串行）：后端 `mvn test` 前快照 0 → 后端运行中（仅 mvn 自身，无前端工具）→ 后端退出 0 后快照 0 → 前端 typecheck → lint → test → build（`NODE_OPTIONS=--max-old-space-size=2048`）。
- 说明：系统存在无关 node 进程（ChatGPT 等应用），快照按「编译/测试类 node（vite/vitest/eslint/vue-tsc/pnpm/npm-cli）」精确匹配，不将无关进程误判为编译活动。

## 标准 11：全文当前状态收敛（补证通过）

| 文件 | 修正 |
|------|------|
| `memory/state.md` | 后端基线更新为 **647/0/0/0**（XML 聚合 109 文件；1292 系重复累计已弃用并说明）；「补充回执待提交」→「二轮补证完成待复验」 |
| `memory/handoff.md` | 下一动作/当前待办更新为「二轮补证完成，补充回执 `receipts/post-d114-supplement.md` 已提交，待规划层复验」；基线 647/71f·646t |
| `memory/features.md` | user-group-membership 状态 →「D114 FAILED → 二轮补证完成，待规划层复验」；标准 9/10/11 补证内容 |
| `memory/issues.md` | I36 条目更新为「二轮补证完成待复验确认关闭，P28 未核销」 |
| `knowledge/known-issues.md` | I36 保持「⏳ 执行层候选关闭，D113/D114 复验通过前保持开放」（未改动，符合口径） |
| `todo/requirement-pool.md` | P28「已实现，待规划层复验核销」（未改动，符合口径） |

- I36 保持开放、P28 不核销、M01-F04-01 ⬜→🟦 仍为候选变更——均未提前关闭。
- 无关清单行零漂移。

## 待规划层复验项

1. 标准 9/10/11 是否通过；
2. 通过后：I36 关闭确认、P28 核销、M01-F04-01 🟦 终态确认、新基线（后端 **647** / 前端 **71f·646t**）确认；
3. 方向移入 `passed/` 归档。
