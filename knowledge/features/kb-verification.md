# 功能追踪：kb-verification（知识库运行期验证）

> 功能追踪文件 — 记录本功能的规划、Step 状态、验收结论与遗留问题。
> 可信度标记：CONFIRMED = 代码/测试确认 · REPORTED = 回执报告 · ASSUMED = 推测 · SUPERSEDED = 已替代

**最终状态：COMPLETED ✅（2026-07-22，VB1 + VF1 均 PASSED，验收标准逐条独立复核通过）**

---

## 1. 功能目标

把「规划层无法确证、需运行 `mvn`/`pnpm` 才能裁决」的运行期声明交执行代理复验并回填知识库：后端测试运行期真值（vs 静态 203）、前端四连校验门是否当前仍全绿、前后端测试用例真实计数。产出运行期证据后，将 current-status §1/§9 相关计数由 REPORTED 恢复为 CONFIRMED（若数字被证伪则更正）。

## 2. 非目标（明确排除）

- 不改任何业务代码 / 测试 / 配置 —— 本功能是「只读运行 + 记录」
- 不修 lint 告警、不补测试、不改 pom/package.json
- 不复验功能正确性（功能验收已有逐项证据），仅复验**数字与全绿结论**

## 3. 背景

知识库对账（2026-07-22）以只读证据核对全库，发现两类运行期声明规划层无法确证：

| 声明 | 知识库记载 | 静态取证 | 缺口 | 复验结果 |
|------|-----------|---------|------|---------|
| 后端测试数 | 406 tests / 26 files（曾 CONFIRMED） | 26 文件吻合；`@Test`=203；参数化/重复=0 | 406≈2×203 **无静态解释**（原「参数化展开」假设已证伪），见 [[known-issues]] I24 | ✅ VB1 PASSED：运行期真值 **203**，与静态完全吻合；原「406」SUPERSEDED（推断为 B4 回执误报，具体成因未可溯，标 ASSUMED） |
| 前端测试数 + 四连 | 54 files / 471 tests / 四连全绿（曾 CONFIRMED） | 54 文件吻合；`it/test` 调用=463；全绿属运行期事实 | 471 vs 463 差 8；全绿未复验，见 [[known-issues]] I25 | ✅ VF1 PASSED：运行期真值 **471**，四连全绿；463→471 差值 +8 定位为 `tokens.spec.ts` 循环展开（CONFIRMED，代码实证） |

对账已将 current-status §1/§9 后端/前端计数由 REPORTED 恢复为 **CONFIRMED**（2026-07-22 复验完成）。

## 4. Step 拆解与状态

| Step | 域 | 内容 | 模型 | 状态 |
|:----:|----|------|------|:----:|
| VB1 | 后端 | 运行 `mvn -q compile && mvn -q test`，回填运行期 Tests run + 解释 203 差异 | flash（实际 pro） | **PASSED** ✅ |
| VF1 | 前端 | 运行四连校验门，回填各退出码 + Vitest 真实计数 + 解释 463 差异 | flash（实际 pro） | **PASSED** ✅ |

- 两 Step 相互独立、无先后依赖（分属前后端职责域，方案已按 §6.18 前后端分离）
- 方案已归档至 `product/kb-verification/passed/`（验收通过后从 `ready/` 移出）
- 两 Step 实际均使用 `deepseek-v4-pro` 而非方案推荐的 `deepseek-v4-flash`（执行代理自行选择，回执未说明切换原因；任务本身为纯运行+记录，未违反关键约束，验收不受影响，但记为方案-执行偏差）

## 5. 影响范围

- 仅新增回执文件于 `product/kb-verification/receipts/`
- 回填目标：`knowledge/current-status.md` §1/§9、`knowledge/known-issues.md` I24/I25

## 6. 依赖与风险

- 依赖：需可运行的后端（JDK 21 + Maven）/ 前端（Node + pnpm）环境
- 风险：环境不可用时 Step 标 BLOCKED，数字继续维持 REPORTED，不阻塞其他功能

## 7. 验收进展

### VB1（后端）— PASSED ✅（2026-07-22）

逐条对照方案 §14 验收标准（均满足）：
1. `mvn -q compile` 退出码 0 ✅
2. `mvn -q test` 退出码 0 + Surefire XML 汇总运行期 `Tests run` 总数 203，逐模块分解齐全（sw-biz-form 76 / sw-biz-system 37 / sw-basic-job 37 / sw-bpm 26 / sw-basic-storage 12 / sw-basic-notify 7 / sw-security 4 / sw-common 4）✅
3. 运行期总数 203，与静态 `@Test` 计数 203 完全吻合、零差异；原「406」判定为回执误报（ASSUMED，未能溯源具体成因） ✅
4. `git status` 确认 `Smart-WorkFlow/` 无源码 diff（规划层独立复核：`git status --short` 无输出） ✅
5. 结论 PASSED ✅

**规划层独立复核**：git status 干净性已由根代理自行执行 `git status --short` 验证（非仅采信回执），证据一致。

### VF1（前端）— PASSED ✅（2026-07-22）

逐条对照方案 §14 验收标准（均满足）：
1. 四条命令退出码：typecheck=0, lint=0（0 errors/0 warnings), test=0, build=0 ✅
2. 运行期 `Test Files 54 passed (54)`、`Tests 471 passed (471)` ✅
3. 运行期用例总数 471；与静态 463 差值 +8，来源为 `src/styles/tokens.spec.ts` 的 `for` 循环包裹 9 类 token、单 `it(` 展开为 9 用例 ✅
4. `git status` 确认 `Smart-WorkFlow-Web/` 无源码/配置 diff ✅
5. 结论 PASSED ✅

**规划层独立复核**：根代理独立读取 `tokens.spec.ts` 源码，确认 `CATEGORIES` 恰有 9 个条目且被 `for...of` 包裹 `it(`，与回执声称的差异根因完全一致；另独立执行 `git status --short` 确认两个子项目均无源码 diff。均为独立验证，非仅采信回执 PASSED 结论。

## 8. 遗留与已知问题

- I24（后端计数）、I25（前端计数）均已 ✅ 修复关闭（见 `known-issues.md`）
- 已回填：`current-status.md` §1/§2.1/§5/§9 计数标记（REPORTED→CONFIRMED，406→203）、`known-issues.md` I24/I25 状态（已修复）、`session-handoff.md` 基线数字
- 遗留的方案-执行偏差（非阻塞）：两 Step 执行代理均使用 `deepseek-v4-pro` 而非方案推荐的 `deepseek-v4-flash`，且未按前端 CLAUDE.md §13.2 要求说明切换原因；因任务性质为纯运行+记录，不影响验收结论，仅记录为流程偏差
- 遗留的真正未解之谜：原「406」数字的具体产生原因（是否为 B4 回执双重累加、复制粘贴错误等）无法进一步追溯，只能确认其为误报而非真实运行期值
