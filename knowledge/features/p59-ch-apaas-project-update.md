# p59-ch-apaas-project-update（P59 CH-aPaaS 项目说明、仓库与 main 分支整理及自动发版）

> 统一交付任务（非新增业务功能，不进入正式功能计数）；**任务状态 COMPLETED，规划已确认（2026-09-05）**。
> 状态：**任务状态 COMPLETED**；**确认进度：规划已确认（2026-09-05，最终裁决 `receipts/planning-final-review-p59-terminal-sync-02-passed.md`；T1/T2 已核销）**。功能级验收 PASSED（2026-09-04，规划第七轮审查 `planning-review-p59-07-passed.md`）保留为历史。

## 任务目标（Owner 2026-09-04 五项统一需求）

1. 更新项目说明：产品名称 **CH-aPaaS**、项目类型 **PaaS**。
2. 三仓远端改名后的本地配置、引用与分支跟踪核对。
3. 工作区 main 误提交处理（保留历史的定向修复）。
4. GitHub main 分支自动编译发版（前后端 Actions 构建成功后生成 Release 并附构建产物）。
5. 三个示例流程原始记录（3.1 多部门灾备演练审批、3.2 校园大门流量异常、3.3 厂房 MES 温度告警——**本轮仅记录，未实施**）。

## 规范事实（终态同步唯一值）

| 项 | 值 |
|---|---|
| 产品名称/类型 | CH-aPaaS / PaaS |
| 后端规范地址 | `git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-server.git` |
| 前端规范地址 | `git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git` |
| 工作区规范地址 | `git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git` |

三仓 origin 已于 2026-09-04 回读核对，与上表一致。早期规划与发布清单中的 sPaaS 名称及旧 SHA 保留为历史追溯，当前值以本表为准（后端规范名按 Owner 更正为 Smart-WorkFlow-aPaaS-server）。

## 发布时点唯一事实（2026-09-04 已验收发布时点，不要求后续 ref 永久停在该 SHA）

| 仓库/分支 | 发布时点 SHA |
|---|---|
| Workspace develop-sw | `721f034e6f1cc1cd80993e358087201dab6626a2` |
| Workspace main | `29f70338d0390810e932bdd040e82956743d343b` |
| Server develop | `d62c8436bd4a20deea13b2700ab4998ce0052934` |
| Server main | `6ab9ae50080b2ae884eefaa728ae021702661ece` |
| Web develop | `f2647e151ab40c00efd5dbd7df753e97721bc916` |
| Web main | `4c044c671318627599560320efd217a0a520b5aa` |

- 累计提交数 **26**（原 17＋增量 9，审查07核定）；Server 成功 run **33889195373**、Web 成功 run **33889880505**；两仓 tag 分别为 `build-`＋对应 main 完整 SHA。
- 资产指纹及证据边界引用审查07与 `planning-online-verification-p59-07.json`，不重复下载或构建（Server `bootstrap.jar` 154357403 B；Web `dist-4c044c67….zip` 766936 B；Web 失败历史 run 33889202310/33889635018 已由成功 run 替代）。
- P59 main 构建 957 与发布运行是分支限定证据，不覆盖 develop 正式业务基线。

## 计数与基线边界（不得改写）

- 非新增业务功能：正式业务功能数 **41**（41＋0，不适用新增功能＋1公式）；90 条明细、✅34/🟦28/⬜28 与里程碑零变化。
- 原正式业务基线保持：Server **1035/0/0/0**（152 份 Surefire 报告）；Web **117 files passed＋1 skipped / 1110 tests passed＋3 skipped**（lint 47 warnings/0 errors）；Flyway **H2 V49（49）/PG V49（48）**；本轮验证基线更新集合为空 `{}`。
- **P59 已核销**（2026-09-04 功能级 PASSED）；本轮不改变其他 P 编号；场景 3.1—3.3 仅原始记录、未实施。

## 验收与证据链

- 功能级验收：`product/p59-ch-apaas-project-update/receipts/planning-review-p59-07-passed.md`（**PASSED**；A—E 及 D3b 全部闭合；Planner 独立在线核验 run/tag/Release/资产 digest；evidence-06 哈希 6/6 通过；六远端 ref 实际回读）。
- 审查与补充链（历史）：`planning-review-p59-01..06.md`、`planning-release-scope-p59-01.md`、`planning-execution-prompt-p59-01..04.md`、`supplement-p59-01..05.md`。
- 执行回执：`completion-p59-ch-apaas-project-update.md`、`release-p59-01.md`；证据包 `evidence-02..06/` 与 `attachments/`。
- 方向归档：主方向与终态同步方向均已归档 `passed/`（direction-p59-ch-apaas-project-update.md、direction-p59-ch-apaas-project-update-terminal-sync.md）。
