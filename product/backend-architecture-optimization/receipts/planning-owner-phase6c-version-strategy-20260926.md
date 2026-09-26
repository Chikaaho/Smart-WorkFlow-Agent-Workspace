# Phase 6C 版本身份策略 · Owner 裁决记录

> 记录角色：规划（Planner）  
> Owner 裁决日期：2026-09-26  
> 对应候选：BAO-09  
> 裁决：采用 Maven CI-friendly `${revision}`

## 1. 唯一策略

1. 根 POM 与全部模块统一使用 `${revision}` 作为工程版本表达式；不得继续在 34 个 POM 中复制工程版本字面量。
2. 仓内开发默认值固定为 `revision=0.2.0-SNAPSHOT`。
3. 正式发布构建必须显式覆盖为 `revision=0.2.0`；Release 标题、发布制品名、生产制品版本标记与 Maven effective version 必须使用同一个解析值。
4. 引入 Flatten Maven Plugin，以 `resolveCiFriendliesOnly` 生成可消费 POM；安装/发布路径不得留下未解析 `${revision}`。
5. 发布门禁对 SNAPSHOT、未解析占位符、模块版本不一致和 Release 元数据不一致统一 fail closed。

## 2. 当前 Git 身份

- 本地后端：`develop@76dc947da5e031cca557cee7f3983a64c0d682dc`，工作树已有 304 项，属于此前各架构阶段累积现场。
- 2026-09-26 只读远端回读：`develop=51afb8fbcbe305f4e618c8191d4a8fe193981d15`，`main=d18e9a39c552918615be8b158dfe0cc278cb309f`；远端 `0.1.0` 是 annotated tag `c258386…`，peeled commit 为 `d18e9a39…`；`0.1.1` tag 不存在。
- 远端 develop 对象当前不在本地对象库，故不虚构 ahead/behind 数值。本阶段不 fetch、pull、merge、rebase、checkout、push、移动 tag 或重建 Release；实施前由 Executor 再次 `ls-remote` 冻结事实。

## 3. 范围边界

该裁决只授权 Phase 6C 的版本表达式、Flatten、构建/发布版本解析链路和机械门禁。GitHub About 与后端根 POM canonical URL 仍属于 Final；任何 commit、push、merge、tag、Release、deploy 或历史改写均未授权。

正式实施入口：

`product/backend-architecture-optimization/ready/direction-phase6c-ci-friendly-version-identity.md`
