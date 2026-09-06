# G8b 索引：逐报告计数与退出可复算

## 断言→原件→实际值→结论
1. 逐报告计数 → g8b-surefire-per-report.txt → 工具（python 递归扫描 */target/surefire-reports/*.txt）输出 SUMMARY：REPORT_FILES=173 TOTAL=1121 FAILURES=0 ERRORS=0 SKIPPED=0（generated_at 2026-09-06T13:35:13+0800，scan_root=Smart-WorkFlow-Server），随后 173 行逐报告 {report, tests, failures, errors, skipped, sha256_16} → 可独立复算 → 成立。
2. 实际退出 → g8b-surefire-per-report.txt 尾部 → run5 日志（最终源码 mvn test 全量）BUILD SUCCESS + MVN_EXIT=0 → 成立；该全量运行对应本轮最终后端源码（run5 之后后端零改动，前端改动不进入后端套件）。
3. 计数与锁定差异说明 → 本文件 → 相对上轮 172/1114：本轮新增 MyProcessedRealSourceTest(3)+CrossTenantReadIsolationTest(2)+G1a 合并用例(1)+MyDrafts 空态用例记前端 → 后端 1121=1114+7；报告文件 173=172+新类报告-壳文件净变化 → 差异可解释、可复算。
4. 前端门禁 → /tmp/p4-frontend-vitest2.log 关键行誊录 → vitest：121 files passed | 1 skipped，Tests 1153 passed | 3 skipped（含 MyDrafts 新增空态用例，11/11）；eslint MyDrafts.vue/MyInstances.vue --max-warnings=0 通过；vue-tsc 0 错；vite build ✓ built in 1.29s → 成立。

## 边界
本轮后端最终源码以 run5（MVN_EXIT=0）为最终门禁；其后仅前端 MyDrafts.vue/MyInstances.vue/MyDrafts.spec.ts 变更并重跑前端四门禁。原始报告本体保留于各模块 target/surefire-reports/（哈希前 16 位在逐报告行中，可对账）。
