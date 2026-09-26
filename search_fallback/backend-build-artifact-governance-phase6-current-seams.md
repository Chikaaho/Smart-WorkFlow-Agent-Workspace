# Phase 6 构建、制品与版本治理当前接缝 · 回执

> 执行 / 2026-09-25 / **只读探索，零实施**
> 后端仓 `develop@76dc947`（269 项未提交 = Phase 5 最终工作树）；Maven 全程 `-o` + `MAVEN_OPTS="-Xmx2g"`，仅模型与解析查询，未 compile/test/package/install
> 裁决 `CONFIRMED` 5/5；**BAO-10 由 Phase 2 `PARTIAL` 升级 `CONFIRMED`**
> 证据：同前缀 10 个 TSV（十项问答全文在 `qa`，清单见 §6 末）

## 1. 五项裁决

- **BAO-03 CONFIRMED**：5 处硬编码第三方版本（tencent iotexplorer／fastjson2 ×2／poi-ooxml／embedded-postgres）+ 1 个 zonky BOM import；解析值＝声明值；BOM 五者 **0 命中**。
- **BAO-04 CONFIRMED**：effective `build/plugins` **0/32**、零 execution；`mvn validate` exit 0 不触发；**声明的 plugin dep GA 错误，激活前即解析失败**。
- **BAO-08 CONFIRMED**：h2 仅 bootstrap 且 `scope=runtime`（全仓唯一），9 个 `*-biz` 为 test；制品含 **`h2-2.3.232.jar`**；dev/local 配置随制品发布。
- **BAO-09 CONFIRMED**：坐标 `0.1.0` 对应 **≥4 个不同提交**；无 `${revision}`/flatten、无 `distributionManagement`；tag `0.0.2` 的 pom 实为 `1.0.0-SNAPSHOT`。
- **BAO-10 CONFIRMED（升级）**：prod 排除规则**全仓无 `-Pprod`** ⇒ 从未生效；制品内嵌 **6 个 P58Debug class／3 顶层类型**；**prod 显式选中 `MockCloudProvider`**。

## 2. 关键补充

- **Phase 5 fastjson2 承接**：`bpm-process` 因契约抽取（换用零依赖 `sw-basic-iot-api`）失去传递来源，4 个生产文件直接用 `com.alibaba.fastjson2`，故按 POM 注释冻结局部声明 `2.0.53`（**未提交、属 Phase 5 工作树**）；BAO-03 声明点由 3 增至 4，取值已正确故集中化版本中性。
- 反应堆 **32 模块**复算成立；POM 数因 Phase 5 新增 `iot-api` 由 33 增至 **34**（绕过面见 `artifact-facts.tsv` B6-B10）。


## 3. 共同依赖与回滚边界

- **A 依赖治理（03+04）→ 合并（内部两步）**：无文件交集但语义强耦合——4/14 冲突构件直接源于 03 的硬编码版本，而 03 单独完成**不能**使守门通过；回滚仍按步骤粒度。
- **B 生产制品隔离（08+10）→ 合并（内部三步）**：同属「机制已写、激活路径缺失」，共需**显式生产构建入口**（如 `-Pprod package`）与同一制品内容断言。
- **C 版本身份（09）→ 独立且排在 A、B 之后**：改 34 个 POM、需 Owner 裁决策略、与锁定的 0.1.0 身份及在途 0.1.1 列车耦合。
- **D 展示收口 → 独立且最后**：唯一交集为根 POM 一行 `<url>`（`your-org` 占位），不构成共同回滚边界，无需前置。

## 4. Enforcer 激活即时影响（未修复、未放宽任何规则）

**63 条 conflict 标记（compile 61／runtime 2／test 0）→ 去重 38 → 14 个构件、4 个模块**（`sw-bootstrap`／`knowledge`／`agent`／`storage-biz`），余 28 模块 0；**10/14 与 BAO-03 无关**，明细见 `convergence-blockers.tsv`。全落 compile/runtime ⇒ 不依赖 test scope 语义；GA 错误的 plugin dep 须先移除。

## 5. 推荐阶段拆分

- **6A-1｜BAO-03**：BOM 集中化、取值不变；验收＝`dependency:list` 版本集合恒等，冲突标记不增（基线 63）。
- **6A-2｜BAO-04**：execution 绑 `validate` + 修 plugin dep + 收敛 14 构件；验收＝32 模块 exit 0 且负向探针必失败。
- **6B｜BAO-08+10**：建显式生产构建入口，处理 h2 与 dev-only 类；验收＝制品无 h2 jar／无 `P58Debug`·`VerificationRunner`／无 dev 配置与 devseed，且 dev 仍可启动。
- **6C｜BAO-09**：版本表达式 + 34 POM 父版本 + CI 版本链路；策略待 Owner 裁决。

风险、非目标、最小面与回滚点见 `scope-risks.tsv`。

## 6. 未确认与证据边界

- **制品时点**：`bootstrap.jar` mtime `2026-09-24 16:51`，**早于 Phase 5**（Phase 5 仅跑测试未重新打包）；H2/Debug 结论仅在该时点成立，不以旧 Jar 冒充当前结果。所依据 POM/profile 在 Phase 5 前后未变，故结论可传递，仍须实施时以真实构建复核。
- **远程引用新鲜度**：`origin/*` 最后更新 `2026-09-22 00:36`，未 fetch ⇒「`origin/main`=0.1.0」为 3 日前观测。
- 未确认：仓外是否传 `-Pprod`、是否注入 `sw.knowledge.enabled`、是否有仓外消费方依赖 `0.1.0` 坐标；`dependencyConvergence` 的 scope 语义未以真实运行确认（已按 compile/runtime 全命中规避）。无方向冲突，无需继续探索。
- 其余 9 个 TSV 见同前缀文件：裁决／显式版本／Enforcer／制品／版本身份／收敛／方案／风险／命令。

## 7. 只读、零实施

未改任何 POM、源码、测试、Profile、版本号、分支或 Git 历史；未 commit/push/merge/tag/Release/部署；未读取或输出任何 PostgreSQL 连接值。为解除离线解析阻塞，仅在**临时副本**内向临时 local repo（`/tmp/bao6/`）`install` 了 `sw-basic-iot-api:0.1.0`。复核 coding 仓仍 269 项未提交、22 个 `target` mtime 未变。
