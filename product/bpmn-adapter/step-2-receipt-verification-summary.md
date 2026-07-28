# Step 2 回执核实 — 探索摘要

> 探索日期：2026-07-25
> 当前模型：`deepseek-v4-pro`，可承担角色：探索模型（按 system.md §0.4 模型族对照表）
> 依据：`product/bpmn-adapter/step-2-receipt-verification-task.md`

---

## 问题 1：测试计数

### 1.1 逐文件 @Test 实际数量

| 文件 | 子模块 | @Test 数 | 回执声称 | 一致？ |
|------|--------|-----------|----------|--------|
| `BpmDeployFacadeImplTest.java` | sw-bpm-engine | **2** | 2 | ✅ |
| `BpmProcessDefServiceImplTest.java` | sw-bpm-process | **4** | 4 | ✅ |
| `BpmProcessDefControllerTest.java` | sw-bpm-process | **3** | 3 | ✅ |
| `ApprovalProcessIntegrationTest.java` | sw-bpm-engine | **2** | 1 | ❌ 差 1 |
| **四文件合计** | — | **11** | 10 | ❌ |

**ApprovalProcessIntegrationTest.java 明细**：该文件当前共有 2 个 `@Test` 方法（第 103 行和第 170 行），而非回执声称的"新增 1 个测试方法"后总计为 1。回执可能低估了该文件在改动前的既有测试数量（改动前至少已有 1 个，改动后总计 2 个），但无论如何「该文件总计 1 个 @Test」与当前文件实际内容不符。

### 1.2 sw-bpm 全模块 @Test 总览

| 子模块 | @Test 数 | 明细 |
|--------|-----------|------|
| `sw-bpm-api` | **0** | 无测试文件 |
| `sw-bpm-engine` | **10** | BpmDeployFacadeImplTest:2 + ApprovalProcessIntegrationTest:2 + GraphToBpmnTranslatorTest:6 |
| `sw-bpm-process` | **26** | BpmProcessDefControllerTest:3 + BpmProcessDefServiceImplTest:4 + BpmTodoControllerTest:18 + GraphValidatorTest:1 |
| **sw-bpm 总计** | **36** | |

### 1.3 与回执声称的差异

| 指标 | 回执声称 | 实际值 | 差异 |
|------|----------|--------|------|
| 改动前基线 | 19 | 26（kb-verification 2026-07-22 已确认） | 回执低估 7 |
| 改动后总数 | 26 | **36** | 回执低估 10 |
| 净增 | +7 | **+10**（从基线 26 到当前 36） | 回执低估 3 |

**推演**：若基线确为 kb-verification 确认的 26：
- Step 2 前既存测试：BpmTodoControllerTest(18) + GraphValidatorTest(1) + GraphToBpmnTranslatorTest(6) + ApprovalProcessIntegrationTest 改动前(1) = 26 ✅ 与 kb-verification 吻合
- Step 2 新增：BpmDeployFacadeImplTest(2) + BpmProcessDefServiceImplTest(4) + BpmProcessDefControllerTest(3) + ApprovalProcessIntegrationTest 增量(1) = **+10**
- 改动后总计：26 + 10 = 36 ✅ 与实际吻合

回执声称的「基线 19 → 26（+7）」三个数字无一与实际吻合。

---

## 问题 2：git diff 范围

### 2.1 `git status`（完整输出）

```
On branch main
Your branch is up to date with 'origin/main'.

Changes not staged for commit:
  modified:   system.md
  modified:   knowledge/current-status.md
  modified:   knowledge/decisions.md
  modified:   knowledge/known-issues.md

Untracked files:
  knowledge/features/bpmn-adapter.md
  product/bpmn-adapter/

no changes added to commit
```

### 2.2 `git diff --stat`（完整输出）

```
 system.md                   |  1 +
 knowledge/current-status.md | 12 +++++++-----
 knowledge/decisions.md      | 20 ++++++++++++++++++++
 knowledge/known-issues.md   |  2 +-
 4 files changed, 29 insertions(+), 6 deletions(-)
```

### 2.3 关键发现

1. **Smart-WorkFlow/ 目录下零改动** — 无 modified、无 untracked 业务代码文件。Step 2 的所有生产代码和测试代码改动均已提交（不在 working tree 中），无法通过 `git status`/`git diff` 在当前工作树中验证其改动范围。

2. **Smart-WorkFlow-Web/ 目录下零改动** — 回执中「删除行数：~29（来自非本项目改动）」在当前 working tree 中无对应证据。唯一的 6 行删除来自根目录规划层文件（`knowledge/current-status.md`、`knowledge/known-issues.md`），与回执暗示的「非本项目」含义不同。

3. **git diff --stat 显示的是 29 insertions（非 deletions）**— 回执说「~29 删除行数」，但 `git diff --stat` 输出是 `29 insertions(+), 6 deletions(-)`。数字 29 出现在 insertions 侧，不在 deletions 侧。

4. **无 Flyway 迁移脚本被修改** — working tree 中无任何 `*.sql` 文件变更。

5. **结论**：基于当前 working tree 状态，无法核实 Step 2 在业务代码侧的具体改动范围（改动已被 commit 收录）。可确认的是：当前 working tree 中不存在任何 Smart-WorkFlow/ 或 Smart-WorkFlow-Web/ 下的未提交改动。

---

## 问题 3：错误码冲突

### 3.1 BpmErrorCode.java 完整枚举值（按编号排序）

| 编号 | 常量名 | 行号 |
|------|--------|------|
| 2000 | `GRAPH_MISSING_START` | 15 |
| 2001 | `GRAPH_MULTIPLE_START` | 16 |
| 2002 | `GRAPH_MISSING_END` | 17 |
| 2003 | `GRAPH_MULTIPLE_END` | 18 |
| 2004 | `GRAPH_NODE_EDGE_CARDINALITY` | 19 |
| 2005 | `GRAPH_ORPHAN_NODE` | 20 |
| 2006 | `GRAPH_EDGE_TARGET_NOT_FOUND` | 21 |
| 2007 | `GRAPH_ILLEGAL_EDGE` | 22 |
| 2008 | `GRAPH_UNKNOWN_NODE_TYPE` | 23 |
| 2009 | `GRAPH_FORM_NOT_FOUND` | 24 |
| 2010 | `PROCESS_DEF_NOT_FOUND` | 27 |
| 2100 | `FORM_NOT_PUBLISHED` | 30 |
| 2101 | `PROCESS_KEY_FROZEN` | 31 |
| 2102 | `TRANSLATION_FAILED` | 32 |
| 2103 | `DEPLOYMENT_FAILED` | 33 |
| **2104** | **`PROCESS_NOT_PUBLISHED`** | **34** |
| 2200 | `APPROVER_RESOLVE_EMPTY` | 37 |
| 2201 | `APPROVER_TYPE_NOT_IMPLEMENTED` | 38 |
| 2202 | `APPROVER_CONFIG_MISSING` | 39 |
| 2203 | `APPROVER_TENANT_ID_MISSING` | 40 |

### 3.2 核查结论

- ✅ `PROCESS_NOT_PUBLISHED(2104, "流程未发布，无法获取 BPMN XML")` 存在，位于第 34 行
- ✅ **无编号冲突** — 所有 20 个常量使用唯一编号，2104 在 2103 和 2200 之间顺延，不重复

---

## 问题 4：模块边界

### 4.1 检查命令与结果

```bash
grep -rn "org.flowable" Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/ --include="*.java"
```

**结果：空（exit code 1，零匹配行）**

### 4.2 结论

✅ `sw-bpm-process` 模块的生产代码（`src/main/`）中**无任何 `org.flowable` 引用**。Flowable API 的调用全部封装在 `sw-bpm-engine` 模块内，模块边界干净，符合架构约束。

---

## 汇总

| 核查项 | 回执声称 | 实际发现 | 判定 |
|--------|----------|----------|------|
| 四文件 @Test 合计 | 10 | **11**（ApprovalProcessIntegrationTest 有 2 而非 1） | 回执少计 1 |
| sw-bpm 改动前基线 | 19 | **26**（kb-verification 已确认） | 回执低估 7 |
| sw-bpm 改动后总数 | 26 | **36** | 回执低估 10 |
| 净增测试数 | +7 | **+10**（与四文件实际 @Test 增量吻合） | 回执低估 3 |
| git 改动范围 | 含「非本项目改动」~29 删除 | working tree 仅根目录规划层文件变更，Smart-WorkFlow/ 和 Smart-WorkFlow-Web/ 均为零改动 | 回执描述与当前 working tree 不符（但 Step 2 代码可能已提交，无法在当前 working tree 验证） |
| 错误码 2104 | 存在，无冲突 | ✅ 存在，无冲突 | 一致 |
| 模块边界 | sw-bpm-process 无 Flowable 引用 | ✅ 零匹配 | 一致 |
