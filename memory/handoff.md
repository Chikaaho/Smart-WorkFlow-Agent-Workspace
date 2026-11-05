# 0.2.2 整版交付交接

## 1. 功能名称

0.2.2 整版交付（F1 Agent 完善 XL 三阶段＋F2 应用导入导出 L；D022-16 整版登记为第 50 个正式功能）。

## 2. 功能目标

F1、F2 验收通过后，完成整版回归、操作说明与状态同步，随后合并、发布 0.2.2、发布后同步。当前目标已全部执行完毕，待规划第 7 阶段终态复核。

## 3. 当前状态

功能级 `PASSED`；第 4—6 阶段已完成（2026-11-05）。总 7 阶段：已完成 6，未开始 1（结束/规划复核）。方向 `product/0.2.2/ready/direction-022-close-release.md`（revision 13，FINISH）。

## 4. 已完成内容

- 第 3 阶段：整版回归（Web 四项绿；Server 7 例测试侧失败经 C022-G1 修复后全绿）、f1v4b 冒烟、操作说明、knowledge/memory 同步；回执 `close-sync-022-01/02/03.md`。
- 第 4 阶段：C022-G2 菜单断言返工（升级前 id 全保留/无重复/总数=升级前+动态新增，`d3138a03`）；Server feature→develop `2b9482e1`→main `0bf4c938`，Web `a2f8859`→develop `c9f09f4`→main `3bcd7c2`；CI 四跑全绿（三次成功跑 2351/0/0/33，drill 1/1 Skipped 0、P62 gate 2/2）；feature 分支双仓删除。回执 `close-sync-022-04.md`。
- 第 5 阶段：两仓 tag `0.2.2`＋语义 Release（Server 资产 `bootstrap-0.2.2.jar` 220,778,675 B sha256 `c13eccd8…`；Web `sw-web-dist-0.2.2.zip` 6,191,084 B sha256 `aa8d5832…`；`build-<sha>` 保留）；UAT 清理 69,881 文件/3.58 GB、health 恢复 UP；DB clean dump 661,324 B/178 表并恢复演练；pgvector 0.8.7 先启用；UAT 升级后启动 173.794s、ERROR 0、health UP、Flyway v0.2.6、`embedding` vector、页面 200（入口 `assets/index-D6vkuidr.js`）。回执 `release-sync-022-01.md`。
- 第 6 阶段：knowledge（current-status/feature/handoff）、memory 四件、两仓 README、`docs/ops/production-ops.md` 0.2.2 记录已同步；发布后 C022-S1 分支同步：两仓 main fast-forward 回并 develop，`ls-remote` 回读 Server `main`=`develop`=`3c4942f0`、Web `main`=`develop`=`9dd7e7b`，tag 指向不变。回执 `release-sync-022-02.md`。

## 5. 实际工程结果

正式/部署/DB 版本均 0.2.2；当前分支头 Server `main`=`develop`=`3c4942f0`、Web `main`=`develop`=`9dd7e7b`（tag 指向 `0bf4c938`/`3bcd7c2` 不变）；开发版本 Server `0.2.2-SNAPSHOT`、Web `0.2.2`；迁移终点 V0.2.6（UAT 与 f1v4b 实测）。功能数 50、清单 46/22/22＝90、ADV64/问题57、P 编号不核销、基线新增 []。UAT 换包后磁盘可用 2.2G。

## 6. 验收规则

F1、F2 已通过验收项全部锁定；第 3 阶段断言不重验；第 4—6 阶段以回执事实与回读为准。

## 7. 当前系统基线

UAT 运行 0.2.2（后端 `build.version=0.2.2`、前端 `index-D6vkuidr.js`），health UP，pgvector 0.8.7；本地 `smart_workflow_f1v4b` 保留不清库（v0.2.6）。任一 Key 未进入文件/提交/回执/日志。

## 8. 未完成内容

第 7 阶段：Planner 复核 `close-sync-022-04.md`、`release-sync-022-01.md`、`release-sync-022-02.md` 并做终态复核；通过后 0.2.2 `COMPLETED` 与方向归档。

## 9. 已知风险

UAT 剩余磁盘 2.2G（reasonix 近期会话仍在增长，需持续观察）；Owner 已在 `/agent/model` 添加 CommandCode（OpenAI Chat）与 Openrouter（页面显示 Anthropic 格式）供应商，Embedding 需要 OpenAI Chat 格式端点，若 OpenRouter 保持 Anthropic 格式则 `/embeddings` 不可用，待 Owner 核对；通知 Boot 测试族与 `P62CompatRollbackPgTest` 为已登记抖动（同提交 rerun 通过）。

## 10. 唯一下一动作

C022-S1 已完成：两仓 main 已 fast-forward 合并回 develop（Server `main`=`develop`=`3c4942f0`、Web `main`=`develop`=`9dd7e7b`），knowledge→memory/todo 已同步，回执 `release-sync-022-02.md`；唯一下一动作＝Planner 第 7 阶段终态复核。

## 11. 下一轮完成标准

三份回执事实一致、覆盖矩阵完整、UAT 回读无变化，规划终态复核通过。

## 12. 必须读取

`system.md`、`roles/executor.md`、方向 `ready/direction-022-close-release.md`、`decision-records-022.md`、三份本轮回执、两端工程宪法。

## 13. 常规决定

D022-01～16（`product/0.2.2/decision-records-022.md`）；真实 Embedding 用 OpenRouter（D022-09）；UAT 顺序 pgvector 先装后升级（D022-07/09）。
