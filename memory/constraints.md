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

## Owner默认交付流程（2026-10-16）

后续固定：①新需求评估→②执行并从develop拉新分支→③验收与信息同步→④开发分支→develop→main（develop内按发布要求压缩种子/版本收敛）→⑤发版，版本必须用户确认→⑥再次同步信息→⑦结束。只有Owner明确“不发版”，才在③结束；版本未给不等于不发版。已确认版本不重复询问，0.1.6为上轮已确认版本，本轮0.1.7已由Owner确认。第三步业务功能完成不等于默认交付结束；维持风险分级与角色边界。完整裁决：`product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`。

## 0.1.7 Bug修复（Owner 2026-10-16）

唯一清单 `product/0.1.7-bugfix/0.1.7bug.md`，发布版本0.1.7已确认。Owner与Executor直接反复修复/复测：Executor修复自验后填“是”，Owner填回归结果；修复验收由Owner完成。Owner宣布修复结束后，规划办理信息同步与发版确认，Executor承接合并、发布及发布后同步。细则见 `product/0.1.7-bugfix/ready/direction-bugfix-017.md`。

清单自 2026-10-18 起仅本地留存：已退出 Git 跟踪并加入 `.gitignore`（历史已按 Owner 精确授权在根仓 `develop-sw` 重写，其他克隆需按新 SHA 重新对齐）。不得用 `git add -f`、新建受跟踪副本或其他方式把清单正文带回仓库。语义 Release 经既有 git 凭据通道创建：不索要明文 token，不在日志、文档或回执中回显凭据值。
