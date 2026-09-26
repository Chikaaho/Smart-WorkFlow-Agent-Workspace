# Final · POM 增量归属与证据计数补证回执 01

> 角色：执行（Executor） ｜ 日期：2026-09-26
> 补证指令：`planning-execution-prompt-final-evidence-supplement-01.md`（唯一补证入口）
> 前置复核：`planning-review-completion-final-01-verifying.md`（`VERIFYING`：F1 计数转录错误、F2 POM 增量无法复算）
> 状态：**`EXECUTION_SUBMITTED` / `feature_status=VERIFYING` / `next_action_type=WAIT_PLANNER`**
> 性质：只关闭 F1/F2；未再次修改 GitHub description、POM 或任何 refs，未重跑 Maven 构建/测试，未改写 `evidence/final-01/`

## 1. 缺口逐项核销

| ID | 失败事实 | 原始证据文件/位置 | 实际结果 | 边界 |
|---|---|---|---|---|
| F1 | `final-readback.txt` 把 7+2 写成 8；现场实际 9 | `evidence/final-01/final-readback.txt`（历史，未改写）；现场目录计数 | 新补证包按准确口径记录：**3 个被哈希载荷 + 清单/回读 2 = 物理文件 5（3+2=5）**，现场计数与哈希回读一致；并显式纠正历史口径：`final-01/` 现场实为 **7+2=9**（非 8）。`final-01/` 未改写 | 本包只陈述本包与 final-01 的真实计数；不回溯修改任何旧证据 |
| F2 | 根 POM 当前总 diff 含前序阶段大段变化，只有「Final 增量一行」声明，无法复算 | `fs01-pom-diff-u0.txt`（`git diff --unified=0 -- pom.xml` 完整冻结，108 行/8 hunks）+ `fs01-hunk-attribution.tsv`（逐 hunk 归属与证据指针）+ `fs01-verdict.txt` | **8/8 hunks 全部归属、无法解释 hunk = 0**；URL hunk（H2）恰为 `<url>https://github.com/your-org/smart-workflow</url>` 一删 + `<url>https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server</url>` 一增；其余 hunk 逐项指向已归档方向/既有回执（见下） | 归属仅覆盖根 `pom.xml` 相对 HEAD 的 diff；不扩展到 README/其它文件/其它仓 |

**逐 hunk 归属（`fs01-hunk-attribution.tsv` 全文为准，指针摘要）**：

| hunk | 归属 | 证据指针 | 关键内容 |
|---|---|---|---|
| H1 `@@ -9 +9 @@` | Phase 6C | `passed/direction-phase6c-ci-friendly-version-identity.md` + 回执 01 + `evidence/phase6c-01/6c-pom-edits.tsv`、`6c-gate-pom.txt` | 根 GAV `0.1.0` → `${revision}` |
| H2 `@@ -14 +14 @@` | **Final** | `ready/direction-final-repository-presentation-hygiene.md` §2.3 + 回执 01 §3 + `evidence/final-01/final-maven-url.txt` | placeholder URL → canonical URL（唯一 URL hunk，恰一删一增） |
| H3 `@@ -33,0 +34,7 @@` | Phase 6C | 同 H1 | 新增 `<revision>0.2.0-SNAPSHOT</revision>` 属性与说明注释 |
| H4 `@@ -82,7 +88,0 @@` | Phase 6A | `passed/direction-phase6a-dependency-version-enforcement.md` + 回执 01 + `evidence/phase6a-01/phase6a-pom-diff.txt`（含 enforcer execution ×2、enforcer-rules 删除 ×1，现场 grep 复核） | 删除误声明的 `maven-enforcer-rules` dependencies 块 |
| H5 `@@ -96,0 +97,57 @@` | Phase 6A + Phase 6C（相邻插入在 u0 下合并为同一 hunk，行级拆分归属） | 前半（`<plugins>` + 6A 注释 + enforcer execution）= 6A 指针；后半（6C 注释 + flatten 1.6.0 块）= 6C 指针 | 新增 `<plugins>` 段 |
| H6 `@@ -105,2 +162,5 @@` | Phase 6B | `passed/direction-phase6b-production-artifact-isolation.md` + 回执 01 + `evidence/phase6b-01/6b-pom-ci-diff.txt`（含精确类名排除行，现场 grep 复核） | prod profile 注释改精确类名辅助门禁说明 |
| H7 `@@ -113 +173,6 @@` | Phase 6B | 同 H6 | compiler excludes 宽通配 → 精确类 + VerifyMapper |
| H8 `@@ -123 +188,6 @@` | Phase 6B | 同 H6 | jar excludes 宽通配 → 精确 class |

**判定（`fs01-verdict.txt`）**：`hunk_total=8`、`final_hunks=1`（恰为 placeholder 一删 + canonical 一增）、`unexplained_hunks=0` → **F2 关闭**。

## 2. 已锁定项与禁止重验的遵守

未再次执行 `gh repo edit`（亦未运行 `gh repo view`，非必需）；未修改任何 coding 仓文件（本包只读 diff + 新增证据）；未运行 Maven test/package/install、服务、数据库或浏览器；未改 Phase 1—6C、Final 主方向、主体回执、`final-01/`、memory、knowledge、todo 或总体方向。已锁定项（双仓身份、两项 description 写后回读、canonical URL、Maven URL 解析、placeholder 残留 0、refs 不变、秘密扫描、机器终态）未重验、未重开。

## 3. 证据清单（`evidence/final-supplement-01/`）

`fs01-pom-diff-u0.txt`（冻结的零上下文完整 diff，108 行/8 hunks）、`fs01-hunk-attribution.tsv`、`fs01-verdict.txt`、`fs01-hashes.sha256`、`fs01-readback.txt`。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/backend-architecture-optimization/receipts/completion-final-repository-presentation-hygiene-evidence-supplement-01.md","feature_status":"VERIFYING","evidence":["product/backend-architecture-optimization/receipts/evidence/final-supplement-01/（被哈希载荷 3 + 清单/回读 2 = 物理文件 5，3/3 现场回读 OK）","fs01-pom-diff-u0.txt：git diff --unified=0 -- pom.xml 完整冻结（108 行/8 hunks），未做任何删改","fs01-hunk-attribution.tsv：8/8 hunks 逐项归属（H1/H3=6C、H4=6A、H5=6A+6C 行级拆分、H6/H7/H8=6B、H2=Final），每项附已归档方向/既有回执/证据指针","fs01-verdict.txt：unexplained_hunks=0；final_hunks=1 且恰为 placeholder 一删 + canonical 一增（VERDICT=PASS）","fs01-readback.txt：3/3 现场回读 OK，并显式纠正历史计数口径（final-01 现场实为 7+2=9）"],"work_items":[{"id":"F1-count-correction","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"新包按 3+2=5 如实记录，并纠正 final-01 现场口径为 7+2=9；旧证据未改写"},{"id":"F2-pom-diff-freeze","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"冻结 git diff --unified=0 -- pom.xml 完整输出（108 行/8 hunks）"},{"id":"F2-hunk-attribution","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"8/8 hunks 穷尽归属：6A×1、6C×2、6B×3、6A+6C 合并×1、Final×1；前序指针经现场 grep 复核（6A phase6a-pom-diff.txt 含 enforcer 变更、6B 6b-pom-ci-diff.txt 含精确排除行）"},{"id":"F2-final-hunk-exact","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"URL hunk 恰为 placeholder 一删 + canonical 一增；unexplained_hunks=0"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待规划（Planner）复核 Final 补证回执 01；F1/F2 关闭后 Final 是否进入 PASSED 由 Planner 裁决；未 commit/push/merge/tag/Release/deploy，未归档 Final，未同步总体任务终态","next_action_type":"WAIT_PLANNER","progress_fingerprint":"final-evidence-supplement-01-20260926","progress_basis":{"files_changed":["product/backend-architecture-optimization/receipts/evidence/final-supplement-01/（新建证据目录 5 文件）","product/backend-architecture-optimization/receipts/completion-final-repository-presentation-hygiene-evidence-supplement-01.md"],"tool_actions":["冻结 git diff --unified=0 -- pom.xml 完整输出","程序化解析 8 个 hunk 并逐项分类归属","前序证据指针现场 grep 交叉核验（6A/6B 证据含相同变更内容）","新包哈希清单与现场回读"],"new_evidence":["8/8 hunks 穷尽归属、无法解释 hunk=0（机器判定）","URL hunk 恰为 placeholder 一删 + canonical 一增","final-01 现场计数口径纠正为 7+2=9","新补证包 3+2=5 计数与哈希回读一致"],"closed_work_items":["F1-count-correction","F2-pom-diff-freeze","F2-hunk-attribution","F2-final-hunk-exact"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"Bash/git","outcome":"SUCCEEDED","detail":"只读冻结 git diff --unified=0 -- pom.xml；未执行任何 Git 写动作，coding 仓文件零修改"},{"tool":"Bash/python","outcome":"SUCCEEDED","detail":"程序化 hunk 解析与分类：8 hunks、unexplained=0、Final hunk=1 且精确一删一增"},{"tool":"Bash/grep","outcome":"SUCCEEDED","detail":"前序证据指针交叉核验：6A pom-diff 含 enforcer execution×2/enforcer-rules 删除×1；6B pom-ci-diff 含精确类名排除"},{"tool":"Bash/shasum","outcome":"SUCCEEDED","detail":"新补证包 3 个被哈希载荷 3/3 现场回读 OK；3+2=5 物理文件"}],"browser_status":"NOT_APPLICABLE"}
