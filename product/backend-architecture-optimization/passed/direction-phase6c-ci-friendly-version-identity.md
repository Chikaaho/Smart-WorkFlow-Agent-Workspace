# Phase 6C · CI-friendly 版本身份

> 下发角色：规划（Planner）  
> 指定实施角色：执行（Executor）  
> 所属总体任务：`backend-architecture-optimization`  
> 对应候选：BAO-09  
> 任务等级：XL  
> 状态：PASSED（规划功能验收通过，2026-09-26；待终态同步）  
> 日期：2026-09-26  
> Owner 裁决：`../receipts/planning-owner-phase6c-version-strategy-20260926.md`
> 规划验收：`../receipts/planning-review-completion-phase6c-03-passed.md`

## 1. 目标

把后端 32 模块的工程版本统一为 Maven CI-friendly `${revision}`：develop 工作树默认解析为 `0.2.0-SNAPSHOT`，正式发布构建显式解析为 `0.2.0`。版本解析值必须贯穿 reactor、可消费 POM、生产制品身份、Release 标题与上传制品名，并由仓内门禁阻止占位符泄漏、SNAPSHOT 发布和模块身份分叉。

## 2. 起始事实与预检

1. 当前本地后端为 `develop@76dc947da5e031cca557cee7f3983a64c0d682dc`，已有 304 项工作树变更；这些是此前阶段现场，不得清理、覆盖或吸收到不相关叙述。
2. 规划只读远端回读（2026-09-26）：`develop=51afb8fbcbe305f4e618c8191d4a8fe193981d15`、`main=d18e9a39c552918615be8b158dfe0cc278cb309f`、`0.1.0^{}`=`d18e9a39c552918615be8b158dfe0cc278cb309f`，远端无 `0.1.1` tag。
3. Executor 开始前必须重跑 `git status --porcelain`、当前 branch/HEAD 与 `git ls-remote`，记录差异；远端 develop 对象若仍不在本地，只报告“无法计算提交图”，不得猜测 ahead/behind。
4. 不 fetch、pull、merge、rebase、checkout 或修改 refs。当前脏工作树原地实施；只修改本方向授权文件。

## 3. CI-friendly POM 契约

1. 根工程版本改为 `<version>${revision}</version>`，根 `<properties>` 的唯一开发默认值为 `<revision>0.2.0-SNAPSHOT</revision>`。
2. 其余 33 个 POM 的 `com.sw.ck` 工程父版本统一改为 `${revision}`；不得保留工程自身/父级 `0.1.0` 字面量。第三方依赖版本不属于本步骤。
3. 根 `build/plugins` 配置并固定 Flatten Maven Plugin，所有模块继承：
   - `flatten` 绑定 `process-resources`；
   - `flatten.clean` 绑定清理；
   - `flattenMode=resolveCiFriendliesOnly`；
   - `updatePomFile=true`，包括 `packaging=pom` 模块；
   - 插件版本集中定义，不允许模块自行覆盖。
4. `.flattened-pom.xml`、临时仓库和构建输出均为过程产物，不进入 Git。
5. 不修改 `groupId`、`artifactId`、模块树、业务依赖版本、根 POM `<url>` 或发布历史。

## 4. 构建与发布身份链路

1. 新增仓内可复用版本门禁（建议 `scripts/check-version-identity.sh`），至少支持：
   - develop 模式：32 模块 effective version 全为 `0.2.0-SNAPSHOT`；
   - release 模式：显式 `-Drevision=0.2.0` 后 32 模块全为 `0.2.0`；
   - 34 个 POM 工程版本/父版本表达式一致；
   - 可消费 POM 无未解析 `${revision}`；
   - Release 版本不得含 `SNAPSHOT` 或占位符。
2. `scripts/build-prod.sh` 必须完整透传 `-Drevision=<value>` 到 clean test、prod package 与制品门禁，不能测试一个版本、打包另一个版本。
3. GitHub Release workflow 必须通过 Maven effective version 读取开发版本，验证其为 `0.2.0-SNAPSHOT`，解析正式值 `0.2.0`，再以 `-Drevision=0.2.0` 调用唯一生产构建入口。禁止用 XML grep 得到字面 `${revision}`。
4. Release 标题、上传制品名与生产制品中的版本标记必须来自同一个已验证的 effective release version；不得各自拼接版本。现有 `build-<full-SHA>` tag 身份可保留，不在本阶段更换 Git tag 规则。
5. 扩展 Phase 6B 制品门禁：正式 Jar 的 Manifest 或 `META-INF/production-build.properties` 必须记录解析后的 `0.2.0`，且与 CI effective version 一致。
6. workflow 只做静态/本地等价验证，不实际创建 Release、tag 或上传资产。

## 5. 验收门禁

1. **POM 结构**：34/34 POM 的工程版本链统一；根为 `${revision}`，33 个子 POM 的 `com.sw.ck` parent version 为 `${revision}`，旧工程版本字面量命中 0。
2. **develop 解析**：默认执行时 32/32 模块 effective version 精确为 `0.2.0-SNAPSHOT`，无空值、表达式残留或模块分叉。
3. **release 解析**：`-Drevision=0.2.0` 时 32/32 模块精确为 `0.2.0`，不得含 `SNAPSHOT`。
4. **可消费 POM**：使用唯一临时 Maven local repository 执行 release override 的 install；逐项检查已安装 POM 版本/父版本均为 `0.2.0` 且 `${revision}` 命中 0。不得污染默认 `~/.m2`。
5. **发布链路**：workflow 通过 Maven 求值并以同一 release version 驱动生产构建、Release 标题、上传制品名与制品版本标记；静态检查和本地等价脚本均通过。
6. **fail-closed 探针**：在临时副本分别注入未解析 revision、release SNAPSHOT、单模块父版本分叉、Release 元数据版本不一致，门禁均必须非零失败；正式工作树与最终制品 hash 不得被探针污染。
7. **Phase 6B 回归**：显式 release revision 调用 `scripts/build-prod.sh` 整体 exit 0；正式 Jar 既有负向 10 项全 0、正向 6 项齐备、prod marker 保持，并新增版本一致性断言。
8. **全量回归**：默认 develop revision 下后端全量 `MAVEN_OPTS="-Xmx2g" mvn -B -o test` 不低于 1570，failures/errors/skipped 均为 0；release 构建与默认测试串行执行。
9. **历史身份保护**：只读回读本地/远端 branch/tag；既有 tag/Release 指针零修改，未创建 `0.1.1` 或 `0.2.0` tag/Release，未 deploy。
10. **可复跑证据**：保存 ref 身份、POM/version 矩阵、effective version、flatten/install 结果、workflow 版本链、正负探针、全量测试、生产制品门禁、hash 回读、秘密扫描和机器终态；全部哈希现场回读通过。

若 Flatten 插件首次需要联网解析，可在记录插件坐标与来源后完成一次缓存引导；最终必须提供同一源码快照的离线门禁结果。不得因离线缓存缺失删除 Flatten 或放宽验收。

## 6. 边界与停止条件

- 不执行 commit、push、merge、tag、Release、deploy、分支切换、历史改写或远端引用更新。
- 不修改历史 tag/Release，不把远端当前状态改写成期望状态；远端 ref 在验收时再次只读回读。
- 不执行 GitHub About、前端描述或根 POM canonical URL；这些仍属于 Final。
- 不改变业务功能、公开 API、数据库模型/迁移、依赖收敛结果、H2/dev 边界或 IoT 生产语义。
- 不使用 `versions:set` 等导致无关 POM 重排的大范围黑盒改写；34 个 POM 的修改必须可逐项审计。
- 若 `${revision}` 无法在当前 Maven/reactor/IDE 约束下形成可消费 POM，保留原始失败与最小复现并停止，不能退回字面版本复制或只改 CI 标题。
- 若 release override 导致 Phase 6B 正式构建、Enforcer 或全量测试失败，按真实缺口补正；不得跳过测试、Flatten、制品门禁或使用旧 Jar 冒充。

## 7. 回滚

整体回滚点为根 POM、33 个子 POM、生产构建/制品门禁脚本和 Release workflow 的本阶段改动；回滚后必须重新构建，清理 `.flattened-pom.xml` 与临时 local repository，并证明此前 Phase 6A/6B 文件内容未被误改。既有 tag/Release 无需也不得回滚，因为本阶段不修改它们。

## 8. 完成回执

提交：

`product/backend-architecture-optimization/receipts/completion-phase6c-ci-friendly-version-identity-01.md`

回执状态先写 `EXECUTION_SUBMITTED`，不得自行写 `PASSED`、`COMPLETED` 或执行 Final。最后一个非空物理行必须是合法 `ENGINE_TERMINAL {json}`。
