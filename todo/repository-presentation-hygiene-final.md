# 最终仓库展示与元数据收口

> 登记角色：规划（Planner）  
> Owner 指令日期：2026-09-24  
> 等级：L（正式执行涉及双仓 GitHub 外部元数据与后端 POM）  
> 状态：**`COMPLETED（规划已确认，2026-09-26）`**（Final 功能级 `PASSED` 8/8，裁决 `product/backend-architecture-optimization/receipts/planning-review-completion-final-03-passed.md`）  
> 已归档方向：`product/backend-architecture-optimization/passed/direction-final-repository-presentation-hygiene.md`  
> 完成回执：`product/backend-architecture-optimization/receipts/completion-final-repository-presentation-hygiene-01.md`（补证 01、计数纠偏 02 与 `evidence/final-01/`、`evidence/final-supplement-01/` 同属审计链）  
> 正式入口（历史）：`product/backend-architecture-optimization/ready/direction-final-repository-presentation-hygiene.md`（已归档 `passed/`）

## 1. 目标

修正后端、前端 GitHub 仓库对外展示过弱的问题，并移除后端根 POM 中明显的示例占位链接，使面试官或工程使用者看到的仓库描述与项目真实能力一致。

## 2. 明确修改

1. 后端 GitHub About description 由 `Agent workflow & iot` 改为：

   `Enterprise low-code aPaaS platform with dynamic forms, BPM workflow, RBAC, multi-tenancy, notifications, agent workflows and IoT integration.`

2. 前端 GitHub About description 由 `SmartWorkFlowWebView` 改为：

   `Web console for an enterprise low-code aPaaS platform with dynamic forms, BPM workflow, RBAC, multi-tenancy, notifications and IoT integration.`

3. 后端根 `pom.xml` 中的 `https://github.com/your-org/smart-workflow` 替换为后端仓库实际 canonical HTTPS URL。执行前以该仓库 `origin` 与 GitHub 页面身份双向确认，禁止猜测 owner/repository 名称。

4. 对后端受 Git 跟踪的 POM/项目元数据做一次精确残留检索；若发现同一 `your-org/smart-workflow` 占位值，只修正语义相同的仓库 URL 元数据，不借机扩展 README、品牌文案或其他代码改造。

## 3. 验收

- `gh repo view` 或等价 GitHub API 回读后端、前端仓库的 `nameWithOwner/url/description`，两个 description 与上述目标逐字一致。
- 后端根 POM 可被 Maven 正常解析，项目 URL 与后端 canonical GitHub HTTPS URL 一致。
- 后端受跟踪文件中 `github.com/your-org/smart-workflow` 残留为 0。
- 回执记录修改前后值、精确仓库身份、命令退出码和本地 diff；不得记录 token、凭据或私人环境值。
- 本项不授权 commit、push、merge、tag、Release、部署或历史改写；GitHub About 两项外部元数据修改由本 Owner 指令明确授权。

## 4. 后续正式方向

已由 Planner 转为独立正式方向；本文件仅保留 Owner 原始登记与审计来源，执行以 `product/backend-architecture-optimization/ready/direction-final-repository-presentation-hygiene.md` 为唯一入口。
