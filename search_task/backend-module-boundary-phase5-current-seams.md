# BAO-02 当前模块边界复核探索

> 本会话角色：规划  
> 委派角色：执行  
> 所属总体任务：`backend-architecture-optimization`  
> 性质：只读探索；作为 Phase 5 是否立项及如何拆分 IoT API/Biz 的决策输入

## 任务目标

在 Phase 4 可靠事件改造后的最终工作树上，复核 IoT、Knowledge、Agent 的真实跨模块调用面、传递依赖与拆分回滚边界，判断 BAO-02 当前是否仍成立，以及下一阶段应只拆 IoT、分批拆分，还是暂不实施。

## 需要回答的问题

1. 当前哪些模块以 compile/runtime 方式依赖 `sw-basic-iot`、`sw-basic-knowledge`、`sw-basic-agent`？逐条列出 POM 依赖、直接 Java import 和真实调用入口。
2. 跨模块消费者实际使用哪些类型？按 facade/port、DTO/VO、entity、mapper、service、implementation、configuration 分类并计数，标出不应成为公共契约的实现类型。
3. `sw-bpm-process → sw-basic-iot` 在 Phase 4 后新增或变化了哪些可靠事件、持久命令、恢复调度与事务依赖？若拆 IoT，必须保持哪些原子提交、幂等和恢复语义？
4. `sw-basic-agent → sw-basic-knowledge` 的调用面与 IoT/BPM 是否同构？哪些事实支持独立拆分，哪些事实反对机械复制 `api/biz` 结构？
5. 与 Storage/Notify/Job 既有 `*-api`/`*-biz` 模式相比，IoT/Knowledge/Agent 缺少哪些边界资产（接口、DTO、事件、异常码、POM、Spring 装配），可复用模式和不可复用差异分别是什么？
6. 从消费者的依赖树复算重型实现依赖泄漏：MQTT/Paho、GraalJS、Tencent IoT、Tika/PDFBox、pgvector 等分别通过哪条路径进入哪些消费者；区分 direct、transitive 与仅测试依赖。
7. 给出最小迁移单元、先后依赖、兼容窗口与回滚点。至少比较：仅 IoT 拆分、IoT 后再 Knowledge/Agent、三者同阶段、暂不拆分四种去向。
8. 判断 BAO-01（轻量 kernel）是否是 BAO-02 的真实前置条件；若不是，说明如何避免把两项捆绑。
9. 返回建议裁决：`CONFIRMED/PARTIAL/NOT_CONFIRMED`、推荐下一唯一阶段范围、非目标、主要风险和需要的行为/构建验收类别。不得直接生成正式产品方向。

## 搜索范围

- 根与相关聚合 POM、`sw-dependencies`；
- `sw-basic-iot`、`sw-basic-knowledge`、`sw-basic-agent`；
- 其所有直接消费者，重点 `sw-bpm-process` 与 Agent→Knowledge；
- Storage/Notify/Job 的 API/Biz 模块，仅用于边界模式对照；
- Phase 4 最终实现相关调用面与既有工程治理文档。

允许使用 `rg`、POM/源码只读检查，以及离线 `mvn dependency:tree`、`help:effective-pom` 等依赖模型命令。不得运行 compile/test/package、服务、数据库、浏览器或迁移。

## 禁止范围

- 不修改任何代码、POM、配置、测试、迁移、knowledge、memory、product 或 todo；
- 不创建模块、不移动类、不调整依赖、不实施 BAO-01/02/03/04/08/09/10；
- 不执行 Git 写操作、发布、部署或远程变更；
- 不把类名/目录存在当作行为已通过，也不把审计建议直接当成实施方向。

## 预期证据

- 依赖边清单：消费者 → 模块 → scope → direct/transitive → 重型依赖；
- 跨模块符号清单：消费者文件与行号 → 被消费类型 → 分类 → 建议归属；
- Phase 4 可靠性不变量清单：拆分时不得破坏的事务、幂等、恢复与守门；
- 四种去向比较及推荐裁决，关键结论均带当前工作树路径/行号或依赖树输出摘要；
- 工作树身份、命令、cwd、退出码与未修改声明。

## 完成标准

10 个问题全部有明确答案，关键计数可复算，IoT 与 Knowledge/Agent 不混为同一结论，并能让 Planner 不读取代码即可决定是否形成 Phase 5 正式方向。

## 失败处理

若离线 Maven 模型命令因缓存缺失失败，记录命令、cwd、退出码和错误摘要，继续用 POM 与 import 证据完成可独立部分；只有关键调用面仍无法确认时才如实标记缺口，不得修改工程绕过。

## 回执位置

将压缩结论（目标 `<5KB`）写入：

`search_fallback/backend-module-boundary-phase5-current-seams.md`

