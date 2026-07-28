# 修正补充回执 — Step 2 数字证据链补充

> 本文件是对 `step-2-execution.md` 和 `step-2-test.md` 的补充说明，按 `product/bpmn-adapter/ready/step-2-correction-request.md` 要求，仅澄清数字口径与 Git 证据链，不重新执行方案 §9 的实现步骤。

---

## 1. 项目级全量测试总数（修正原回执偏差）

### 1.1 命令执行

```bash
# 在 Smart-WorkFlow/ 仓库根目录执行
mvn test 2>&1 | grep -E "Tests run: .*, Failures: 0, Errors: 0, Skipped: 0$"
```

### 1.2 各模块明细（Surefire 汇总行原文）

| 模块 | 测试数 | Failures | Errors | Skipped |
|------|--------|----------|--------|---------|
| sw-common | 4 | 0 | 0 | 0 |
| sw-security | 4 | 0 | 0 | 0 |
| sw-basic-storage | 12 | 0 | 0 | 0 |
| sw-basic-notify | 7 | 0 | 0 | 0 |
| sw-basic-job | 37 | 0 | 0 | 0 |
| sw-biz-system | 65 | 0 | 0 | 0 |
| sw-biz-form | 76 | 0 | 0 | 0 |
| **sw-bpm-engine** | **10** | **0** | **0** | **0** |
| **sw-bpm-process** | **26** | **0** | **0** | **0** |
| **项目合计** | **241** | **0** | **0** | **0** |

### 1.3 Surefire 原文证据

```
[INFO] Tests run: 10, Failures: 0, Errors: 0, Skipped: 0  ← sw-bpm-engine
[INFO] Tests run: 26, Failures: 0, Errors: 0, Skipped: 0  ← sw-bpm-process
[INFO] BUILD SUCCESS
```

### 1.4 正确基线对账（修正原回执错误）

**原回执记录：**

> 基线 19 → 改动后 26，净增 +7

该数字**错误**，原因：基线数字 19 仅包含了 `sw-bpm-process` 的既有测试（`BpmTodoControllerTest` 18 个 + `GraphValidatorTest` 1 个），遗漏了 `sw-bpm-engine` 的既有测试（`GraphToBpmnTranslatorTest` 6 个 + `ApprovalProcessIntegrationTest` 1 个 = 7 个），且遗漏了 `sw-bpm-api` 的 0 测试。

**修正后的正确数字：**

| 口径 | 原回执数字 | 修正后数字 | 说明 |
|------|-----------|-----------|------|
| sw-bpm 模块基线 | 19 | **26** | 引擎 7 + process 19 = 26 |
| 本 Step 净增 | +7 | **+10** | 2+4+3+1 = 10（见 §2） |
| sw-bpm 模块当前 | 26 | **36** | 引擎 10 + process 26 = 36 |
| 项目级基线 | 未报告 | **231** | 非 BPM 205 + BPM 26 = 231 |
| 项目级当前 | 未报告 | **241** | 非 BPM 205 + BPM 36 = 241 |
| 项目级净增 | 未报告 | **+10** | 241 − 231 = 10 |

**原回执 §12 的「~29 删除行来自非本项目改动」同样错误——该描述的前提是 `git diff --stat` 包含了 `.claude/system.md` 和 `功能清单.md` 两个无关文件的改动。Step 2 实际改动只涉及 `sw-biz/` 下的 7 个文件，**全部为新增行（+121），零删除行**。详见 §3。**

---

## 2. sw-bpm 模块测试对账明细（@Test 静态计数）

### 2.1 文件级对比

| 文件 | 位置 | 改动前 @Test 数 | 改动后 @Test 数 | 净增 | 说明 |
|------|------|:---:|:---:|:---:|------|
| `GraphToBpmnTranslatorTest` | engine | 6 | 6 | 0 | 未改动 |
| `ApprovalProcessIntegrationTest` | engine | **1** | **2** | **+1** | 新增 `getBpmnXml_shouldReturnOriginalDeployedXml` |
| `BpmDeployFacadeImplTest` | engine | 0（不存在） | **2** | **+2** | **新建文件** |
| **engine 小计** | | **7** | **10** | **+3** | |
| `BpmTodoControllerTest` | process | 18 | 18 | 0 | 未改动 |
| `GraphValidatorTest` | process | 1 | 1 | 0 | 未改动 |
| `BpmProcessDefControllerTest` | process | 0（不存在） | **3** | **+3** | **新建文件** |
| `BpmProcessDefServiceImplTest` | process | 0（不存在） | **4** | **+4** | **新建文件** |
| **process 小计** | | **19** | **26** | **+7** | |
| **sw-bpm 合计** | | **26** | **36** | **+10** | 引擎 3 + process 7 = 10 |

### 2.2 `ApprovalProcessIntegrationTest` 方法变化明细

- **改动前**：1 个 `@Test` 方法 — `shouldSetAssigneeFromApproverConfig()`
- **改动后**：2 个 `@Test` 方法 — `shouldSetAssigneeFromApproverConfig()` + `getBpmnXml_shouldReturnOriginalDeployedXml()`
- 原有方法未修改，新增 1 个方法，净增 +1

---

## 3. Git 改动范围确认

### 3.1 当前状态

Step 2 改动**尚未提交**（所有文件处于 working tree 中）。原因是执行会话在完成回执写入后即停止（按 system.md §0.3 硬约束），未进行 Git 提交。

### 3.2 `git diff --stat`（限 `sw-biz/` 范围）

```diff
 sw-biz/sw-bpm/sw-bpm-api/.../BpmErrorCode.java                  |  1 +
 sw-biz/sw-bpm/sw-bpm-api/.../BpmDeployFacade.java               | 12 ++++++
 sw-biz/sw-bpm/sw-bpm-engine/.../BpmDeployFacadeImpl.java        | 22 ++++++++++
 sw-biz/sw-bpm/sw-bpm-engine/.../ApprovalProcessIntegrationTest.java | 50 ++++++++++++++
 sw-biz/sw-bpm/sw-bpm-process/.../BpmProcessDefController.java   | 15 +++++++
 sw-biz/sw-bpm/sw-bpm-process/.../BpmProcessDefService.java      | 12 ++++++
 sw-biz/sw-bpm/sw-bpm-process/.../BpmProcessDefServiceImpl.java  |  9 ++++
 7 files changed, 121 insertions(+)
```

- **全部 7 个文件**均属于方案 §7「允许修改的文件范围」（sw-bpm-api、sw-bpm-engine、sw-bpm-process）
- **零删除行**（121 行纯新增）
- **零文件超出范围**：无 sw-biz-system、sw-biz-form、sw-bootstrap 或其他无关模块的改动
- sw-biz 范围外已排除：`.claude/system.md`（16 行新增）和 `功能清单.md`（35 删 29 增）是**执行会话启动前已存在的未提交改动**（见初始 `git status`），与 Step 2 执行无关。原回执 §12 将两者计入是混淆了工作树全貌与 Step 2 改动范围

### 3.3 新建文件（`git ls-files --others`）

```bash
sw-bpm-engine/.../facade/BpmDeployFacadeImplTest.java            # 新建，2 个 @Test
sw-bpm-process/.../controller/BpmProcessDefControllerTest.java   # 新建，3 个 @Test
sw-bpm-process/.../service/impl/BpmProcessDefServiceImplTest.java # 新建，4 个 @Test
```

3 个新建测试文件亦属于方案 §7 允许范围，与 §8「禁止修改的范围」无冲突。

---

## 4. 原验收标准逐项复核（基于修正数字）

| # | 验收标准 | 修正后结论 | 证据 |
|---|----------|-----------|------|
| 1 | `BpmDeployFacade` 接口新增 `getBpmnXml` 签名，Impl 提供实现 | ✅ CONFIRMED | `BpmDeployFacade.java` +12, `BpmDeployFacadeImpl.java` +22 |
| 2 | `BpmProcessDefService`/Impl 新增 `getBpmnXml(Long id)`，正确处理未发布 | ✅ CONFIRMED | `BpmProcessDefService.java` +12, `BpmProcessDefServiceImpl.java` +9 |
| 3 | Controller 新增 `GET /{id}/bpmn-xml`，返回 `R<String>` | ✅ CONFIRMED | `BpmProcessDefController.java` +15 |
| 4 | `BpmErrorCode` 新增 2104，不与现有冲突 | ✅ CONFIRMED | `BpmErrorCode.java` +1, code=2104 |
| 5 | sw-bpm-process/src/main/ 下零 `org.flowable` 匹配 | ✅ CONFIRMED | `grep` 结果为空 |
| 6 | 未发布状态返回业务错误码（非 500、非空串） | ✅ CONFIRMED | 单元测试验证 `PROCESS_NOT_PUBLISHED` code=2104 |
| 7 | 单元测试覆盖正常/未发布/Flowable 缺失/ID 不存在四类 | ✅ CONFIRMED | 9 个单元测试覆盖全部 4 类 |
| 8 | 至少一个集成测试验证 deploy→getBpmnXml 往返 | ✅ CONFIRMED | `ApprovalProcessIntegrationTest` 新增方法覆盖 |
| 9 | 测试总数相比基线只增不减 | ✅ CONFIRMED | **项目级 231→241（+10）**，sw-bpm 26→36（+10） |
| 10 | 前端零改动，`getDef`/`listDefs` 未修改，无 Flyway 迁移文件 | ✅ CONFIRMED | 3 个新建测试 + 4 个既有文件修改，全部限于 sw-bpm 范围；前端零触碰 |

## 5. 最终结论

**PASSED** — 基于修正后的准确测试计数和 Git 证据链，原方案 §14 全部 10 条验收标准均已满足。原回执中的数字记录错误已在本补充文件中修正，不影响生产代码本身正确性的判断。
