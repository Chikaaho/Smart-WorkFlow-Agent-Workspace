# Phase 6 构建、制品与版本治理当前接缝复核

> 下发角色：规划（Planner）  
> 指定执行角色：执行（Executor）  
> 所属总体任务：`backend-architecture-optimization`  
> 候选：BAO-03/04/08/09/10  
> 性质：只读探索，不构成实施授权  
> 日期：2026-09-25

## 1. 目标

基于 Phase 5 最终工作树，复核第三方版本治理、Maven Enforcer 生命周期、H2 生产制品边界、develop/release 版本身份及 Debug 代码隔离的当前事实，判断五项候选是否仍成立、是否有共同回滚边界，以及 Phase 6 应拆成几个实施阶段。

## 2. 必答问题

1. **BAO-03**：列出所有业务/实现 POM 内仍显式锁定的第三方版本及其实际解析版本，至少覆盖 Tencent IoT SDK、fastjson2、POI 和 Phase 5 新增的 BPM fastjson2 直属声明；说明哪些已由 `sw-dependencies` 管理、哪些重复或缺失管理。
2. **BAO-04**：通过根/模块 effective POM 和实际生命周期配置证明 Enforcer 是否绑定 `validate`；列出当前规则、执行 ID、继承范围及普通 `validate/test/package` 是否会触发。区分 `pluginManagement` 声明与真实 execution。
3. **BAO-08**：确认 H2 在 Bootstrap 的声明 scope、最终 runtime dependency tree 与生产 Boot Jar 内容中的实际状态；区分 test/dev/profile 与默认生产制品。不得仅凭源码 POM 一行下结论。
4. **BAO-09**：只读确认 develop、main/tag 的当前 Maven 版本表达式及制品坐标区分能力；不 checkout、不 pull、不改分支。若远程引用不可用，明确证据边界，不猜测。
5. **BAO-10**：确认 `P58Debug*` 排除规则的实际生效位置、覆盖范围和默认生产制品结果；检索其他 debug/dev-only 类是否绕过命名模式，并判断应使用 source set、dev-only module 还是现有机制。
6. 对五项分别给出 `CONFIRMED / PARTIAL / NOT_REPRODUCED / OBSOLETE`，不得沿用 Phase 2 旧结论而不复核 Phase 5 后事实。
7. 给出共同依赖与回滚边界：至少比较“BAO-03+04 依赖治理”“BAO-08+10 生产制品隔离”“BAO-09 版本身份”三组，判断可合并或必须拆分。
8. 评估 Enforcer 激活后对当前 32 模块依赖收敛的即时影响；列出预期阻塞项，但不得在探索中修复或放宽规则。
9. 明确每个推荐阶段的最小修改面、验收命令、回滚点、风险和非目标；说明 Phase 5 fastjson2 临时局部声明如何进入 BAO-03。
10. 判断最终仓库展示收口与本组是否有共同回滚边界；默认保持独立且继续排在所有架构阶段之后，除非有代码事实证明必须前置。

## 3. 允许与禁止

- 允许只读 POM/effective POM、dependency tree、现有制品清单、Git refs/remote 只读查询及精确源码/配置扫描；输出文件写入 `search_fallback/`。
- Maven 使用离线模式与 `MAVEN_OPTS="-Xmx2g"`；所有输出写临时目录或回执证据，不得污染 coding 仓。
- 不运行全量测试，不重新打包生产制品；若现有 Jar 已过时，标记时点，不以旧 Jar 冒充当前结果。
- 禁止修改 POM、源码、测试、Profile、版本号、分支、Git 历史、GitHub metadata 或最终展示项；禁止 commit/push/merge/tag/Release/部署。
- PostgreSQL 与本探索无关，不读取或输出任何连接值。

## 4. 回执

提交：

`search_fallback/backend-build-artifact-governance-phase6-current-seams.md`

并提供紧凑 TSV：候选裁决、显式版本清单、Enforcer effective execution、H2/Debug 制品事实、版本身份、方案比较、风险/非目标/验收。主回执目标 `<5KB`，关键计数可复算；末尾明确“只读、零实施”。
