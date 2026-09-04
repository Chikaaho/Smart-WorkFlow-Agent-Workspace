# P59 精确发布清单01（待Owner授权）

日期：2026-09-04；Planner。依据审查06，本地验收项已闭合；本清单供确认，尚未授权执行远程动作。

## 固定候选

来源：`evidence-03/d3a-final-candidates.json`，SHA256=`84da75ebd8a7d91e2ff2ffe97f6c24e05cba73990ad8009e4fa676663ebcbcdb`。完整提交列表及name-status以该文件为准；以下由该JSON生成，共17个提交。

| 远程 | 分支 | 起点 | 发布到 | 提交数 | 文件数 |
|---|---|---|---|---:|---:|
| `git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git` | `develop-sw` | `0712bb9ed2b888252d4d8be6fe431610e269ddc0` | `a933a78335c4dfe7b15a5c95061999270a12ef28` | 6 | 47 |
| `git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git` | `main` | `cece78474c37c552677770a3a249ce1e8e682a80` | `29f70338d0390810e932bdd040e82956743d343b` | 1 | 222 |
| `git@github.com:Chikaaho/Smart-WorkFlow-sPaaS-server.git` | `develop` | `11612df019deb15d2cd6c224c8b9cb8543c4edce` | `fca198ddd1fa03978a2013b1533ea4a93d2813ff` | 1 | 1 |
| `git@github.com:Chikaaho/Smart-WorkFlow-sPaaS-server.git` | `main` | `e0e899d1d79a297d9d98d924d21b1ba544a787c2` | `6ab9ae50080b2ae884eefaa728ae021702661ece` | 5 | 3 |
| `git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git` | `develop` | `4b62076e55af29dd639f3ec2280de38446474ab3` | `db297d038f6b8b26caa32fa18143c95c5b784ed5` | 1 | 1 |
| `git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git` | `main` | `9a22a66b82507032f8cf04cc4ddacc4e4b1c9526` | `f9dca42317e33fd31254ed38d6c28f34473d40e5` | 3 | 1 |

## 请求授权的动作与影响

由Executor先推送各开发分支的固定候选，再推送各main固定候选。各分支只快进到表中完整SHA，不合并其他分支历史、不强推、不删除远端分支。执行前实际回读远程地址和分支；远端若已等于候选则无需重复推送，若出现候选范围外变化则回报差异，不自动增加提交。

工作区develop-sw包含说明及已有回执；工作区main以一个定向修复提交移除211个实例文件、恢复11个文件，已验收正确分支/历史完整保留相关内容。后端main包含自动构建发布配置与两个Flyway测试计数修正，前端main包含自动构建发布配置。完整差异范围以JSON为准。

前后端main推送会触发GitHub Actions并创建带产物的GitHub Release，消耗Actions运行资源；外部构建尚未经真实运行确认，可能暴露环境差异。授权包含该自动发布及必要的同提交Actions重跑；重跑仅可重建同提交Release并保留其tag，其他提交的发行物不得覆盖。

后端预计tag：`build-6ab9ae50080b2ae884eefaa728ae021702661ece`；前端预计tag：`build-f9dca42317e33fd31254ed38d6c28f34473d40e5`。不得为补证另造无关提交来触发发布。

本轮新规划记录和后续补证仍保存在工作区，不自动加入这17提交的发布集合；本清单不授权部署、设备动作或示例流程实施。

## 授权后验收交付

仅执行D3b：回读六分支最终SHA，保全两仓真实push触发run的URL、event、headSHA及结果；核对同提交Release/tag与资产元数据；实际下载jar/zip并记录名称、大小、指纹及与构建输出的对应关系。构建失败如实保留日志及无成功新发行物的事实，定位实际差异后再决定必要修复，不能标记整体通过。

追加`receipts/release-p59-01.md`及独立证据附件；已通过项不重跑。P59保持VERIFYING交Planner验收，通过后再下发阶段三。

## Owner确认

确认对象为本清单三仓六分支17提交的固定候选，以及上述main自动发版和真实产物核验。根据`system.md` §0.8及主方向§5，收到Owner明确同意后方可执行。
