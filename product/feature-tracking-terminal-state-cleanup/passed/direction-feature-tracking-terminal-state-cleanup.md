# 历史功能追踪终态一次性清理

## 当前状态

**PASSED** — 执行层已完成 `knowledge/features/` 全目录终态一致性清理，规划层于 2026-08-18 对照六项验收方向最终验收通过。

## 功能目标

一次性清除完整知识库所有功能追踪文件中“功能已经规划层最终验收，但追踪文件仍写待验收、进行中或旧归档路径”的状态残留，使每个已完成追踪文件与 `memory/features.md`、活跃决策、product 归档和完成回执一致。

## 规划裁定

1. 已知必须修正的三个文件：
   - `knowledge/features/sysrole-v5-column-alignment.md`：应对齐 D86 `PASSED`。
   - `knowledge/features/status-semantics-alignment.md`：应对齐既有最终验收与 product 归档；没有独立 D 编号时如实写“规划层最终验收 PASSED”，不得虚构编号。
   - `knowledge/features/bpm-plugin-architecture.md`：应对齐 D82 `PASSED`。
2. 不只修这三个文件。执行角色必须扫描 `knowledge/features/*.md` 全目录，将每个追踪文件的当前状态与 `memory/features.md`、`memory/decisions.md`、对应 `product/*/passed/` 和 receipts 交叉核对。
3. 只修正有明确证据支持的终态漂移；如果某文件没有规划层最终验收证据，必须保持原状态并在回执中列为未确认，不得自行宣布 `PASSED`。
4. 历史过程段中的“当时待验收”可以保留，但必须有日期/阶段语境；文件首页当前状态、总结、下一动作、归档路径和页脚不得继续把已验收功能描述为待验收。
5. 本任务是知识状态清理，不建立新的 P/I 编号，不改变功能清单状态，不改变任何业务验收结论。

## 必须检查范围

- `knowledge/features/*.md` 全目录（排除 `_template.md` 的状态判定，但检查模板是否误写具体功能状态）。
- `memory/features.md`：作为压缩功能终态索引。
- `memory/decisions.md`：作为 D47+ 活跃验收裁定依据。
- 对应的 `product/*/passed/` 与 `product/*/receipts/`：用于确认归档路径和最终验收事实。
- `knowledge/current-status.md`、`knowledge/session-handoff.md`：只读交叉验证完成数量和最新终态；除非发现本任务直接造成的功能追踪索引引用错误，否则不扩大修改。

## 非目标

- 不修改后端、前端代码、测试、迁移、配置或依赖。
- 不运行 Maven、pnpm/npm、部署或数据库命令。
- 不修改 `Smart-WorkFlow/功能清单.md` 的任何状态。
- 不重新验收业务功能，不补造缺失测试证据，不新建需求方向或问题编号。
- 不机械替换历史过程叙述，不重写已经正确的功能实现详情。

## 验收方向

完成回执必须证明：

1. `knowledge/features/` 非模板追踪文件已 100% 扫描，并列出文件总数及逐文件判定（已一致/已修正/未确认）。
2. 三个已知欠账全部闭合，分别与 D86、既有 status-semantics 最终验收、D82 一致。
3. 全目录当前状态字段中，对已经有最终验收证据的功能，`待规划层最终验收`、`READY`、`VERIFYING`、`IN_PROGRESS` 等旧状态零残留。
4. 所有修正后的归档路径真实存在；D 编号只引用已有决策，不虚构编号。
5. `memory/features.md` 与 `knowledge/features/` 的功能名、完成状态和追踪文件数量重新核对一致；若 agent-model-orchestration 等功能没有独立追踪文件，继续明确披露而不是伪造文件。
6. 功能清单、代码、测试、迁移均零改动；回执提供修改文件清单、全文搜索结果、合法历史命中分类、未确认项和 Git diff 摘要。

## 风险方向

- **误判完成风险**：只认规划层最终验收或等价明确归档证据，不以执行层自称完成代替最终验收。
- **历史失真风险**：只改当前状态入口，保留带语境的历史过程。
- **遗漏风险**：必须全目录扫描，不允许只修已知三个文件。
- **编号造假风险**：status-semantics 无独立 D 编号时如实记录，不为了格式统一创造决策号。

## 执行交付要求

执行角色完成纯知识同步和全文复核后，将回执写入：

`product/feature-tracking-terminal-state-cleanup/receipts/completion.md`

规划层最终验收已通过；本文档归档至 `passed/`。
