# 0.2.0 验证阻断修复：Windows worker 归档路径

2026-10-22｜Executor｜整版仍在分支实施。七阶段：已完成需求评估；分支实施进行中；验收同步、合并、发布、发布后同步、结束未开始。

本轮 `mvn -q test` 在 sw-bpm-engine 失败：`WorkerLaunchPlanTest.nestedUrlsResolveToOuterJar` 将 `/C:/.../fat jar.jar` 交给 `Path.of(String)`，Windows 抛 InvalidPathException；该模块 152 个测试中 1 error，后续模块尚未执行。它直接阻断本版完整门禁，按方向的关联缺陷范围修复。

WorkerLaunchPlan 改按文件 URI 解析嵌套归档路径，由文件系统转换 Windows 盘符形态，并保留文件名中的加号与 Unicode；不合法 URI 返回不可解析。新增加号、Unicode 和非法转义用例；既有 nested / jar:file / jar:nested / trailing-slash 用例保持。

原始日志位于 `C:/Users/hjxch/.codex/evidence-020/tenant-identity/`：`full-test.log` / `full-test-result.txt` 保存失败；`worker-path.log` / `worker-path-result.txt` 保存修正后目标检查。`mvn -pl sw-biz/sw-bpm/sw-bpm-engine -am -Dtest=WorkerLaunchPlanTest -Dsurefire.failIfNoSpecifiedTests=false test` 使用 MAVEN_OPTS=-Xmx2g，编译与 6 个用例通过、exit 0。该结果不代表全工程已通过，后续继续完整门禁。

Server `eada29fcf07a211aba28f038970d36c1cff42e5f` 已普通推送至 `origin/codex/0.2.0-tenant-form-flow` 并回读一致，仅提交上述实现与测试两文件。T020 管理员稳定关联、创建幂等和维护入口仍为本地在途修改；H2/PG 迁移与服务测试已有结果，须完成剩余门禁和真实浏览器验证后提交。未合并、未发布，计数和正式基线未变。
