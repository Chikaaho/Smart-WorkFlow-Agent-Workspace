# 必要硬约束摘要

> 截至/同步点：2026-09-24；权威来源：`system.md`、`roles/*.md` 与当前已下发产品方向。

- 必须先由用户显式声明且只认领一个角色；角色边界贯穿会话。
- Planner 不读 knowledge/业务代码；Executor 不作规划裁决；Admin 不碰业务实现与业务状态裁决。
- 当前状态单一源为 `knowledge/current-status.md`；终态机器契约与 Validator 分别为 `.codex/governance/terminal-contract.json`、`.codex/governance/validate-terminal.sh`。
- 历史任务知识库全量整理（knowledge-full-reconciliation）专属方向 §7（不自动约束P62）：不实施新业务功能、不修改权限/认证/迁移、不重跑全量业务测试、不自动创建 P 编号、不提交/推送 Git。
- Smart-WorkFlow 的本机真实 PostgreSQL 验证参数统一从 Git 工作区外的 `~/.config/smart-workflow/pg.env` 读取，并由 `~/.zshenv` 自动加载。新会话先检查 `PG_HOST`、`PG_PORT`、`PG_USERNAME`、`PG_PASSWORD` 是否存在；变量齐全时不得再次向 Owner 索要连接值。
- 数据库连接值属于本机秘密：仓库文件、方向、回执、证据、命令文本和日志只允许引用变量名，不得写入或回显变量值。只有变量确实缺失或文件不可读且已完成本机检查时，才能报告环境输入缺失；不得把秘密复制进 Git 工作区。

- Owner 2026-10-08：Server/Web从develop建立`feature/xxx`任务分支；工作区规划文档在现有分支维护。commit保持Angular/Conventional Commits格式，中文短主题，只说明核心改动，正文仅在必要时补充。

- Owner2026-10-11：任务授权内、目标子仓提交已验证并已推送的常规Git指针调整，由代理自行核实决定并报告，不逐项请示；当前根Server7fffef9/Web4333145已认可保留。

- Planner方法修正2026-10-11：验证按风险取最小充分证据，不默认新建整包哈希；哈希仅为具体产物身份/完整性疑点，已声明值仍核真实。一次列齐必要缺口，原件足够的转录直接纠偏、已过未变项沿用；同类两次不过先核口径/换方法，不用XL解释无效往返。详见product/P64阶段Ⅱ过程复盘。
