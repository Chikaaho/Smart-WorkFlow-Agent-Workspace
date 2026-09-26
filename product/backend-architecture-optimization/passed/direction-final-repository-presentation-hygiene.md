# Final · 仓库展示与项目元数据收口

> 下发角色：规划（Planner）  
> 指定实施角色：执行（Executor）  
> 所属总体任务：`backend-architecture-optimization`  
> 任务等级：L（跨两个 coding 仓库及 GitHub 外部元数据）  
> 状态：PASSED（规划功能验收通过，2026-09-26；待总体终态同步）  
> 日期：2026-09-26  
> Owner 授权来源：`todo/repository-presentation-hygiene-final.md`
> 规划验收：`../receipts/planning-review-completion-final-03-passed.md`

## 1. 目标

完成总体架构优化的最后一个展示收口：让后端、前端 GitHub About description 与项目真实能力一致，并把后端根 POM 的示例仓库 URL 替换为经双向确认的后端 canonical HTTPS URL。

## 2. 强制结果

1. 后端 GitHub About description 精确更新为：

   `Enterprise low-code aPaaS platform with dynamic forms, BPM workflow, RBAC, multi-tenancy, notifications, agent workflows and IoT integration.`

2. 前端 GitHub About description 精确更新为：

   `Web console for an enterprise low-code aPaaS platform with dynamic forms, BPM workflow, RBAC, multi-tenancy, notifications and IoT integration.`

3. 后端根 `pom.xml` 的项目 URL 必须替换为后端仓库实际 canonical GitHub HTTPS URL。执行前必须用后端 `origin` 身份与 GitHub API 页面身份双向确认 `nameWithOwner/url`，不得根据目录名或记忆猜测。
4. 对后端受 Git 跟踪的 POM 和项目元数据做精确残留检查；`github.com/your-org/smart-workflow` 必须为 0。若存在语义相同的仓库 URL 元数据，可在本方向内一并改为同一 canonical URL；不得扩展至 README、品牌重写或业务代码。

## 3. 执行边界

- GitHub About 两项外部元数据修改已由 Owner 明确授权；仅允许修改 description，不修改 visibility、homepage、topics、default branch、features 或仓库权限。
- 允许修改后端根 `pom.xml` 及第 2.4 条命中的同义项目 URL 元数据；不得修改版本、依赖、插件、模块或构建逻辑。
- 两个 coding 仓当前工作树已有其他阶段现场，必须先记录各自 branch、HEAD、`origin`、tracked/untracked 状态并保留，不得清理、覆盖、reset、checkout 或吸收无关变化。
- 不执行 commit、push、merge、rebase、tag、Release、deploy、分支切换、历史改写或远端 Git ref 更新。
- 不修改 Phase 1—6C 的代码、证据、回执、基线或归档方向；不重跑其业务测试。
- GitHub 身份或写权限若不可用，必须保存真实 API/CLI 结果并按终态契约报告；不得伪造回读或只修改本地文案冒充远端已更新。

## 4. 验收门禁

1. 后端、前端仓库分别冻结 `origin` 与 GitHub API 的 `nameWithOwner/url/description` 修改前值，仓库身份双向一致。
2. 两个 About description 修改后由 GitHub API/`gh repo view` 回读，必须与 §2 的目标文本逐字一致。
3. 后端根 POM 的项目 URL 与 GitHub API 返回的 canonical HTTPS URL 精确一致；Maven 能在当前 CI-friendly `${revision}` 契约下解析该项目 URL。
4. 后端受 Git 跟踪文件中 `github.com/your-org/smart-workflow` 残留为 0；不得用删除整个元数据块替代修正。
5. 本地 diff 只包含授权的项目 URL 元数据；前端 coding 仓不得出现为 description 修改而产生的本地文件变化。
6. 两仓 branch/HEAD 与远端 refs 前后不变；无 commit、push、tag、Release、deploy 或历史改写。
7. 回执记录 GitHub 修改前后值、精确仓库身份、命令退出码、后端 diff 和 Maven URL 解析结果；秘密扫描不得记录 token、凭据或私人环境值。
8. 本项不需要浏览器验收，`browser_status=NOT_APPLICABLE`；权威行为证据是 GitHub API 写后回读与本地 Maven/残留检查。

## 5. 总体任务边界

本方向通过后，只表示 Final 功能级 `PASSED`。Planner 仍需下发总体任务终态同步方向，统一确认 10 项候选最终去向、Phase 1—6C + Final 状态和总体摘要后，才能把 `backend-architecture-optimization` 写为 `COMPLETED`。

## 6. 完成回执

提交：

`product/backend-architecture-optimization/receipts/completion-final-repository-presentation-hygiene-01.md`

回执状态先写 `EXECUTION_SUBMITTED`，不得自行写 Final `PASSED/COMPLETED` 或总体任务 `COMPLETED`。最后一个非空物理行必须是合法 `ENGINE_TERMINAL {json}`；`remaining_actionable_count=0` 后以 `WAIT_PLANNER` 等待复核。
