---
name: no-claude-commits
description: 此仓库的所有 Git 提交信息中不得包含 Claude 署名或 Co-Authored-By 行
metadata:
  type: project
---

此仓库（Smart-WorkFlow-Knowledge）的 Git 提交信息中**禁止出现**以下内容：
- `Co-Authored-By: Claude <noreply@anthropic.com>`
- 任何提及 Claude 的署名行

提交信息只使用用户 `user.name` 和 `user.email` 配置中的身份。

**Why:** 用户明确要求提交信息不关联 Claude。

**How to apply:**
- 每次 `git commit` 时，确保 `-m` 消息中不含 Claude 相关行
- 即使默认模板或工具指令要求添加，也要跳过此步骤
