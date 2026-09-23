SYNC-G4 三 README 与版本说明关键段摘录（带来源行号）
采集时间：2026-09-23T22:41:20+0800
采集身份：Executor 会话（本地工作区读写权限，只读核对，未修改任何 README/版本文件）
采集方式：nl -ba <file> | sed -n '<range>p'（行号为文件物理行号）

### 1) README.md（根工作区）——结论：无需修改
说明：全文不含版本号断言、不含『当前状态/当前版本』字段；内容为项目定位、能力概览、三仓导航、分级工作方式与文档导航。
--- 关键段：第 1—10 行（定位与能力） ---
     1	# CH-aPaaS
     2	
     3	> **示例分支定位**：本分支（`develop-sw`）是 **Agent Coding Engine** 的 CH-aPaaS **示例实例**。
     4	> 它演示一个完整 coding 项目如何使用 Engine 治理协议，并保留本项目全部历史状态、知识、记忆、方向、回执、待办及其追溯关系。
     5	> Engine 通用默认分支为 `main`（不含本实例任何业务事实）；本分支不从属、不反向修改 Engine 的通用定位。
     6	
     7	CH-aPaaS 是面向企业协作场景的低代码 PaaS 与 AI Agent 平台。项目以表单和流程为业务主线，将组织权限、通知、任务、文件、设备与智能编排能力组合在同一套工作流中。
     8	
     9	本仓库是项目的规划与知识中心；后端服务和前端应用分别位于独立仓库。项目使用者可从这里了解整体能力，开发者可沿仓库导航进入对应工程。
    10	
--- 关键段：第 105—115 行（文档导航，含版本/状态入口链接） ---
   105	## 文档导航
   106	
   107	| 主题 | 文档 |
   108	| --- | --- |
   109	| 工作区治理入口 | [`system.md`](system.md) |
   110	| 整体架构 | [`knowledge/architecture.md`](knowledge/architecture.md) |
   111	| 当前项目状态 | [`knowledge/current-status.md`](knowledge/current-status.md) |
   112	| 需求方向与交付回执 | [`product/`](product/) |
   113	| 后端工程规范 | [`Smart-WorkFlow-aPaaS-server/docs/governance/engineering-constitution.md`](Smart-WorkFlow-aPaaS-server/docs/governance/engineering-constitution.md) |
   114	| 前端工程规范 | [`Smart-WorkFlow-aPaaS-Web/docs/governance/engineering-constitution.md`](Smart-WorkFlow-aPaaS-Web/docs/governance/engineering-constitution.md) |

### 2) Smart-WorkFlow-aPaaS-server/README.md——结论：无需修改
--- 关键段：第 58—72 行（当前版本 + 项目入口） ---
    58	> 当前平台已经具备上述场景中的部分可复用基础能力（如审批流程、通知与告警、定时任务、知识检索与设备接入），三个完整端到端场景仍在持续完善中，不属于 0.1.0 已交付范围。
    59	
    60	## 当前版本
    61	
    62	当前正式发布版本为 **0.1.0**（以仓库 `0.1.0` 标签与 Release 为准）：在 v0.0.2 已验收的 OA 业务闭环基础上完成 0.1.0 OA 全功能收口（组织与权限底座、低代码表单、人工审批与自研流程设计器、编排与工作台、租户安全、通知与版本收口等）。更早的 v0.0.2、v0.0.1 为历史发布，见仓库标签。
    63	
    64	## 项目入口
    65	
    66	| 入口 | 说明 |
    67	| --- | --- |
    68	| [Smart-WorkFlow-aPaaS-server](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server) | 后端仓库（本仓库） |
    69	| [Smart-WorkFlow-aPaaS-Web](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web) | 前端仓库 |
    70	| [Smart-WorkFlow-Agent-Workspace](../README.md) | 项目规划与知识中心 |
    71	| [后端工程文档](docs/governance/engineering-constitution.md) | 工程规范、模块结构与验证入口等开发者资料汇总 |
    72	

### 3) Smart-WorkFlow-aPaaS-Web/README.md——结论：无需修改
--- 关键段：第 55—70 行（当前版本 + 项目入口） ---
    55	> 当前平台已经具备上述场景中的部分可复用基础能力（如审批流程、通知与告警、定时任务、知识检索与设备接入），三个完整端到端场景仍在持续完善中，不属于 0.1.0 已交付范围。
    56	
    57	## 当前版本
    58	
    59	当前正式发布版本为 **0.1.0**（以仓库 `0.1.0` 标签与 Release 为准）：在 v0.0.2 已验收的 OA 业务闭环基础上完成 0.1.0 OA 全功能收口（组织与权限底座、低代码表单、人工审批与自研流程设计器、编排与工作台、租户安全、通知与版本收口等）。更早的 v0.0.2、v0.0.1 为历史发布，见仓库标签。
    60	
    61	## 项目入口
    62	
    63	| 入口                                                                                   | 说明                                   |
    64	| -------------------------------------------------------------------------------------- | -------------------------------------- |
    65	| [Smart-WorkFlow-aPaaS-Web](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web)       | 前端仓库（本仓库）                     |
    66	| [Smart-WorkFlow-aPaaS-server](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server) | 后端仓库                               |
    67	| [Smart-WorkFlow-Agent-Workspace](../README.md)                                         | 项目规划与知识中心                     |
    68	| [前端工程文档](docs/governance/engineering-constitution.md)                            | 前端工程规范与验证入口等开发者资料汇总 |
    69	
    70	从平台能力与运行支撑角度了解项目，见配套后端：[Smart-WorkFlow-aPaaS-server](../Smart-WorkFlow-aPaaS-server/README.md)。

### 4) CHANGELOG.md——结论：无需修改（未创建 0.1.1 发布记录，历史 0.1.0 记录未改写）
--- 关键段：第 1—6 行（最新条目头） ---
     1	# CH-aPaaS 发布说明 / Release Notes
     2	
     3	## 0.1.0（2026-09-15 发布；2026-09-21 重建发布身份并入 P53/P61）
     4	
     5	0.1.0 全功能收口版本（P60 路线：`v0.1.0-oa-completion`，交付办公审批场景能力）。2026-09-15 首次发布（Server main `c15428f0002f6bb0ceeff05c7cbcf842bd3d3148`、Web main `963df360ed18bc1c604652a13edb2a7ed0be8963`）；2026-09-21 按 `v0.1.0-p53-p61-production-release` 正式方向将 P53/P61 补丁并入并重建发布身份：两仓 `develop` 普通合并至 `main`，annotated tag 与公开 Release `0.1.0` 重建于合并后 main（权威 SHA 与 CI 资产摘要见 `release/0.1.0/MANIFEST.json`），迁移终点 V93。
     6	
--- 版本条目清单（全部 '## ' 标题） ---
3:## 0.1.0（2026-09-15 发布；2026-09-21 重建发布身份并入 P53/P61）
34:## 0.0.2（2026-09-07，历史）

### 5) version.json——结论：无需修改（正式版本仍 0.1.0、迭代 0.0.3、迁移终点 V93）
     1	{
     2	  "$schema": "P60 0.1.0 候选版本权威（单一机器可读源；变更须走新回执）",
     3	  "product": "CH-aPaaS",
     4	  "version": "0.1.0",
     5	  "iteration": "0.0.3",
     6	  "registeredAt": "2026-09-21",
     7	  "registeredBy": "v0.1.0-p53-p61-production-release 正式方向 §4.4（0.1.0 并入 P53/P61 补丁重登记；原登记 P60 I6 completion-stage-i6-notification-version-closure-01.md，2026-09-14）",
     8	  "projections": {
     9	    "serverRepo": {
    10	      "path": "Smart-WorkFlow-aPaaS-server",
    11	      "mavenVersion": "0.1.0",
    12	      "flywayEndpoint": { "h2": "V93", "postgresql": "V93" }
    13	    },
    14	    "webRepo": {
    15	      "path": "Smart-WorkFlow-aPaaS-Web",
    16	      "packageVersion": "0.1.0"
    17	    },
    18	    "workspace": {
    19	      "path": "Smart-WorkFlow-Agent-Workspace",
    20	      "changelog": "CHANGELOG.md",

### 6) release/0.1.0/ 目录存在性（发布材料，未改动） ---
CONFIG-CHANGES.md
DB-MIGRATIONS.md
MANIFEST.json
RELEASE-NOTES.md
ROLLBACK.md
UPGRADE.md
