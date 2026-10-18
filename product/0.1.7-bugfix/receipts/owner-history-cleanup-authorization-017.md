# 0.1.7 Bug清单历史清理授权记录

## Owner精确历史改写授权（2026-10-18）

Owner已在本规划会话对以下具体范围回复“确认”，该授权已取得，执行侧无需重复询问：

- 仓库：Chikaaho/Smart-WorkFlow-Agent-Workspace；远程目标：origin的refs/heads/develop-sw。
- 清理路径：product/0.1.7-bugfix/0.1.7bug.md及重命名前product/0.1.7-bugfix/1.0.7bug.md，覆盖该分支历史中的目标文件内容。
- 本地范围：对应develop-sw/远端跟踪引用与已核实包含目标文件的Codex checkpoint；无关checkpoint保持。
- 保留本地清单，退出Git跟踪并忽略；重写前保存仓库外恢复备份及原引用。备份仍含历史内容须如实记录。
- 允许备份后使用绑定操作前实际远端SHA的精确force-with-lease更新develop-sw；不得使用无保护强推。并行远端更新导致lease失败时重新核实并保留新工作，不覆盖。
- main、两业务子仓及其tag/Release不在本次历史改写范围；P65和其它并行内容保留。
- Owner已知悉受影响提交SHA改变、其他克隆需要重新对齐。操作前刷新当前引用与范围，不沿用旧35提交快照作为现状。

完成后回传清理前后引用、取消跟踪/忽略结果、远端回读及全新克隆复核，保留托管缓存、其他克隆与本地备份的清理边界。此记录为授权证据，不表示Git清理已经执行。
