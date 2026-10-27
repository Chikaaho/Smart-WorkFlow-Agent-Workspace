# Hook参考与本机适配

现有`.codex/hooks/`、`.claude/hooks/`及Harness list列出的文件是参考实现，不是所有机器都能直接安装的通用包。先检查本机系统、运行时、Harness版本/事件协议和实际能力，再决定直接复用、修改适配或重新编写。初始化入口不会复制Hook或覆写宿主配置。

公共终态行为只来自`.codex/governance/terminal-contract.json`及公共Validator；规划收口行为见`product/governance/planner-convergence.md`。新适配只做稳定身份/角色绑定、真实载荷规范化、调用公共校验、投影当前宿主的允许/拒绝结果和必要脱敏审计，不复制另一套业务或终态规则。

1. 从Harness真实文档/现有配置确认指令入口、初始化检查时点、事件与载荷字段。不能仅凭产品同名假定CLI与Desktop一致。
2. 用实际事件确认显式人类角色、任务/会话身份、当前工作目录与关联worktree。字段缺失时先解决绑定；`ROLE_UNBOUND`放行记录不能证明角色门禁有效。
3. 选择适合本机的解释器/argv通道和配置位置。Windows、POSIX、用户级/工作区级配置分别核实，保护原有配置与其他Hook；保留可恢复备份。宿主信任由用户实际批准，适配脚本不能伪造信任。
4. 实现本机验证脚本，按local-profile中每项断言核实startup_gate、role_binding、allow、reject、dispatch。初始化指令、有效结果、无效结果、宿主实际派发分开验证；不以单测、命令存在或文件复制证明自动派发。检查输出聚焦JSON摘要，不输出秘密。
5. 在`init/local-profile.json`记录真正安装位置、兼容性判断、采用的策略和实际验证命令，管理员调用complete。检查失败不生成成功result；没有真实dispatch证据时保持未完成。

可复用适配与验证脚本放入版本管理的`init/adapters/`或既有治理目录，并更新Harness list和update版本；带本机路径的个性化脚本放`init/local-adapters/`（忽略），profile/result也忽略。不要把只在本机的实现误登记为新机器可直接使用。

其他Harness用独立ID登记；清单的custom只表示待探索入口。宿主无所需事件能力时，登记不支持或需特殊化，不能编一个成功检查、静默关闭门禁或把未适配写成初始化完成。
