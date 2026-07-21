---
name: backend-only-repo
description: Smart-WorkFlow 工作区根仓库仅处理后端变更和测试，禁止前端操作
metadata:
  type: project
---

本仓库（Smart-WorkFlow 工作区根目录）仅执行后端（`Smart-WorkFlow/`）的变更和测试。

**前端（`Smart-WorkFlow-Web/`）禁止在此仓库操作。** 前端任务应单独在 Smart-WorkFlow-Web 仓库中处理。

**Why:** 用户明确指定本仓库只处理后端。

**How to apply:**
- 规划功能时，如果功能涉及前端变更，应提示用户需在 Smart-WorkFlow-Web 仓库中执行
- 后端架构规划、后端代码 Step 方案可正常生成
- 纯前端功能应绕过或标注为"需在前端仓库执行"
- 前后端联调的后端部分可在此规划，前端部分需告知用户切换到前端仓库

**Note:** M02-F01-01 通知模块前端落地（纯前端功能）是此规则确立前已完成的历史功能，不受此限制约束。
