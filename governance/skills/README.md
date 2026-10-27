# 工作区 Skill 前置依赖

初始化总入口为[init指引](../../init/README.md)，状态/全局版本遵循system.md §0.0.1。管理员统一准备Skill，普通角色通过只读init/check.py核验并按§0.5使用以下两个Skill：

| 登记名 | 用途 | 安装来源 |
| --- | --- | --- |
| `humanizer-zh`（仓库名 `humanizer-zh-cn`） | 审校中文表达，保留事实、原意和不确定性 | [holygeek00/humanizer-zh-cn](https://github.com/holygeek00/humanizer-zh-cn) |
| `no-negative-echo`（No Negative Echo） | 清理交付内容中无关的讨论残留，按最终目标表达 | [LB623/no-negative-echo](https://github.com/LB623/no-negative-echo) |

## 检查与安装

以下为管理员准备或兼容旧入口。普通角色先执行init/check.py；未初始化/过期提醒管理员，不直接安装。命令在根目录运行，仅依赖Python标准库；缺少依赖时需要访问GitHub。

macOS / Linux：

```bash
python3 governance/skills/ensure-skills.py
```

Windows：

```powershell
py -3 governance/skills/ensure-skills.py
```

入口先查找用户级及仓库级技能目录，识别 `AGENT_SKILLS_DIR`、`CODEX_HOME`、`CLAUDE_CONFIG_DIR` 和名称别名。已存在且声明名正确、规范可读的安装直接复用；缺少时从 `required-skills.json` 声明的仓库下载并安装到 `AGENT_SKILLS_DIR` 指定目录，未设置时使用当前用户的 `.agents/skills/`。不会覆写已有但无效的同名目录，遇到这种情况会报告实际路径，供修复后重试。

只检查、不安装：

```bash
python3 governance/skills/ensure-skills.py --check
```

`--skills-dir <目录>` 可指定唯一的检查与安装目录，适用于宿主自定义位置或隔离验证。输出逐项列出 `READY`、`INSTALLED`、`MISSING` 或 `ERROR`，成功返回 0，否则返回 1。Agent 应读取成功结果中的两份 `SKILL.md`，再继续任务；宿主的技能目录若需重新加载，会在下一回合发现新安装，本回合可直接读取返回路径中的规范。

下载限制为每个依赖一次请求、连接/读取超时 15 秒、下载循环 30 秒，压缩包不超过 8 MiB，解压内容不超过 32 MiB。临时目录由入口清理，已有安装不会更新或重复下载。新机器管理员根据init指引准备和验证，后续每个任务通过只读初始化检查核验安装状态；本会话已经读过且未变化的规范可复用。

## 使用范围

规则随当前仓库生效。安装技能只提供可读取的规范，不修改用户的全局 Agent 指令。

中文进度、最终回复和交付文件正文使用 `humanizer-zh` 的嵌入模式完成初稿、审校和修订，通常只展示终稿。代码、命令、数字、链接目标和必要的专业术语保持准确。

所有任务在交付前使用 `no-negative-echo` 检查标题、文件名、正文、注释、提交信息和交接。表达用户接受的目标与实际结果，去掉仅属于讨论过程的废弃提案和无关对比；保留理解结果所必需的风险、限制、审计记录和用户要求的前后对照。工具或 Hook 改过交付内容后，回读并检查受影响部分。

## Harness 接入

所有 Harness 共用本目录的来源声明、检查器和 `system.md` §0.5 规则。检查器仅依赖 Python 标准库，输出可直接读取的技能路径，不调用宿主专属 API。

| 指令入口 | 接入方式 |
| --- | --- |
| `AGENTS.md` | Codex 及支持此入口的 Harness 先读取 `system.md`，按 §0.5 检查依赖。 |
| `CLAUDE.md` | Claude Code 通过 `@system.md` 加载同一规则。 |
| 其他 Harness 的规则或启动提示 | 将入口指向工作区 `system.md`，先按system.md运行只读初始化/版本检查，再按角色门禁读取返回的规范路径。 |

宿主有自定义技能目录时，可设置 `AGENT_SKILLS_DIR`，或通过 `--skills-dir` 明确指定。宿主暂不支持自动发现技能时，Agent 仍需按返回路径读取并使用规范。是否会自动加载仓库指令取决于 Harness 本身；新增 Harness 必须核实其实际入口，不能仅凭目录存在宣称已接入。

`.codex/governance/ensure-skills.py` 保留为旧命令的转发入口；安装来源和行为仅在本共享目录维护。
