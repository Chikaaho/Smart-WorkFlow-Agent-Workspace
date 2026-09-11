# G17c Validator 真实运行证据
- 命令：`sh .codex/governance/validate-terminal.sh < terminal-payload.json`
- payload：回执 05 §6 契约 JSON + ENGINE_TERMINAL 行字段合并（/tmp/i3-03/terminal-payload.json，17 键，remaining_actionable_count=0）
- validator-stdout.txt / validator-stderr.txt / validator-exit.txt：真实原始输出与退出码
- **VALIDATOR_EXIT=0**（stdout/stderr 均为空 = 无诊断错误，契约校验通过）
