# Phase 6A · 第三方版本集中化与 Enforcer 依赖收敛

> 下发角色：规划（Planner）  
> 指定实施角色：执行（Executor）  
> 所属总体任务：`backend-architecture-optimization`  
> 对应候选：BAO-03 + BAO-04  
> 任务等级：XL  
> 状态：PASSED（规划功能验收通过，2026-09-25）  
> 日期：2026-09-25

## 1. 目标

建立单一第三方版本所有权，并让 Maven Enforcer 的 `dependencyConvergence` 在正常生命周期中真实执行。阶段内分为两个可回滚步骤：先版本集中化且解析值不变，再激活守门并收敛当前 14 个冲突构件。

## 2. Step A · 版本集中化

1. 将 Tencent IoT SDK、fastjson2、POI、embedded-postgres 及 zonky embedded-postgres binaries BOM 的版本统一放入 `sw-dependencies` 管理；业务/实现 POM 只声明坐标，不写 version。
2. Phase 5 在 `sw-bpm-process` 新增的 fastjson2 `2.0.53` 与 IoT 的同项声明必须由同一 BOM 条目供给。
3. Step A 完成时，上述依赖的解析版本必须与探索基线逐项一致：Tencent `3.1.1235`、fastjson2 `2.0.53`、POI `5.2.5`、embedded-postgres `2.1.0`、zonky BOM `17.5.0`；先证明集中化版本中性，再进入 Step B。
4. H2 保持现有 BOM 管理，不做额外集中化改造；它是 test/dev 辅助验证环境，生产数据库行为以 PostgreSQL 为优先。

## 3. Step B · Enforcer 激活与收敛

1. 删除错误且多余的 `org.apache.maven.plugins:maven-enforcer-rules` 插件依赖声明；使用 Maven Enforcer 官方插件自身规则依赖。
2. 在根 `build/plugins` 中配置可继承 execution，绑定 `validate`，规则至少包含 `dependencyConvergence`；execution ID 稳定且日志可识别。
3. 收敛探索记录的 14 个冲突构件。优先由 `sw-dependencies` 明确管理版本；排除只用于确有语义理由的无效传递边，禁止用全局 wildcard、跳过模块或关闭规则换取绿色。
4. 选择收敛版本时按当前直接声明、Spring Boot/Spring AI/Flowable/Tika/MinIO/腾讯云等兼容矩阵最小变更；不得顺手升级到收敛无关的新版本。任何跨 major（如 okhttp 3→4）必须有对应调用域回归证据。
5. Enforcer 必须在默认 `validate/test/package` 生效，不依赖手工 `enforcer:enforce`、特定 profile 或 CI 私有参数。

## 4. 验收门禁

1. 显式第三方版本扫描：业务/实现 POM 中本阶段五项 version 为 0；`sw-dependencies` 成为唯一版本所有者。Step A 前后解析版本集合逐项恒等并有机器 diff。
2. effective POM：32 个反应堆模块均在 `build/plugins` 继承同一 Enforcer execution；`pluginManagement` 不能是唯一落点。
3. `mvn -B validate` 与 `mvn -B -o validate` 在依赖已缓存后均成功，日志证明 Enforcer 被实际执行；不得仅以 exit 0 推断。
4. 在临时副本/临时 local repository 中制造一个最小版本分叉，默认 `validate` 必须因 `dependencyConvergence` 非零失败；探针不得污染工作树或正式本地仓。
5. 最终 dependency tree 中探索记录的 14 个构件均不存在版本分叉；不得通过移除实际生产能力或改为 test scope 规避。
6. 受影响域定向回归至少覆盖：Form Excel/POI、IoT 腾讯云与命令链、Storage MinIO/Qiniu/COS、Knowledge/Agent Tika/PDFBox/Spring AI、BPM/Flowable。
7. 后端全量 `mvn -B -o test` 不低于当前 1559 基线，failures/errors/skipped 均为 0；测试数变化逐项解释。
8. 最终命令、effective POM 摘要、版本集合 diff、冲突清单、负向探针、测试日志形成哈希并现场回读；秘密扫描 CLEAN。

## 5. 非目标与停止条件

- 不处理 H2 的生产运行时隔离、P58Debug/dev-only 制品边界或生产 profile/CI 打包入口（Phase 6B）。
- 不处理 develop/main/tag 版本表达式和 34 POM 父版本迁移（Phase 6C）。
- 不修改 GitHub About、根 POM `<url>` 或最终展示项。
- 不改业务功能、HTTP 契约、数据库迁移、groupId/artifactId；不 commit/push/merge/tag/Release/部署。
- 若某个收敛项要求生产源码适配、跨 major 升级且无法用定向回归证明兼容，停止并在回执中单列，不得放宽 Enforcer 或静默排除。
- 若 Enforcer 无法在默认生命周期真实触发，阶段不得提交为完成。

## 6. 回滚

Step A 可独立回滚为原业务 POM version；Step B 可独立回滚根插件 execution 与冲突收敛项。回执必须分别记录两步修改面和回滚命令语义，不得把 6A 与 6B/6C 混为单次回退。

## 7. 完成回执

提交：

`product/backend-architecture-optimization/receipts/completion-phase6a-dependency-version-enforcement-01.md`

回执状态先写 `EXECUTION_SUBMITTED`，不得自行写 `PASSED`、`COMPLETED` 或启动 Phase 6B。
