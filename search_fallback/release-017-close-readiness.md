# 0.1.7 收口及历史清理范围核实（执行回传）

核实时点 2026-10-18（本地只读核实＋授权内发布准备推进）。明细见附表 `release-017-close-readiness-details.md`。

## 结论

1. 修复成果已合入 develop（**未发布**）：两子仓修复分支快进合入并推送回读（Server `700559e`、Web `4e89249`，含版本收敛提交）；两仓无 0.1.7 tag/Release。
2. 清单历史只在根仓 develop-sw 一条引用链，重写范围 `679a0e6f^..054bc3b9`＝35 提交；无第三别名，另有 3 处文本引用、1 个本地隐藏引用（附表 §2）。
3. knowledge 权威入口落后 memory：`current-status.md` 顶部仍 0.1.6 终态（唯一下一动作＝无），未登记 0.1.7；待规划唯一值。
4. 版本已收敛至 0.1.7（Server `0.1.7-SNAPSHOT`、Web 包 0.1.7，门禁通过）；**种子收敛未做**（附表 §3.4）。
5. 边界：已披露项 2 项已关闭、9 项仍在；第 25 项原表 N、增补 15 与 Owner 整体收口分别记录，不重开。

## Q1 三仓 Git 与验证绑定

| 仓 | 分支 | HEAD＝远端 | 本轮范围 |
|---|---|---|---|
| 根 | develop-sw | `054bc3b9` | 9 项文档改动待提交 |
| Server | develop | `700559e` | 修复 8 提交（`fab3d5e..2d776ef`）＋版本收敛 |
| Web | develop | `4e89249` | 修复 31 提交（`442ba79..fe1712b`）＋版本收敛 |

- 合并均为快进；Server 合入 main 还差 1 提交（`eca43b7`）＋本轮，Web main 仍 `a60a819`。
- 验证绑定：Web `fe1712b`＝vitest 1607/3 skipped、vue-tsc 0、eslint 0 错误；Server `2d776ef`＝FlywayFullChain H2 17/17、PG 12/12。原文 `receipts/bugfix-round-01.md` 增补 24/26/27。版本收敛门禁：check-version-identity pom/workflow/develop 三模式 PASS。
- 根仓待提交：memory 五件、`0.1.7bug.md`、修复方向、需求池已改；4 项未跟踪（handoff 方向、planning-close 回执、本探索任务、p65 待办）。gitlink：Web 记录 `61c61ba1`→实际 `4e89249`，Server 记录 `2d776ef`→实际 `700559e`。
- 部署（远程只读回读）：后端 `build.version`＝0.1.6、健康 UP；DB versioned 终点＝单条 `0.1.6`（＝S1 形态）；前端入口 `assets/index-BMLiWa_O.js`。通道 `E:\code\ssh\ssh\ssh\`＋`config/personal.pem`。

## Q2 历史清理范围

- 路径（均在 `product/0.1.7-bugfix/` 下）：`1.0.7bug.md`（`679a0e6f` 增、`6c4b5b2a` 删）、`0.1.7bug.md`（`6c4b5b2a` 增→`054bc3b9`）；共 24 提交触及，全历史仅此两名。
- 受影响引用仅 develop-sw 本地＋origin；根仓 main 非同谱系不含清单，无 tag/PR 引用。
- 恢复：重写前 `clone --mirror`/`bundle`（含 `refs/codex/*`）并记录三个原 SHA；重写后以 `git log --all -- <两路径>` 为空＋`rev-list --all --objects` 无命中＋`ls-remote` 回读＋全新 clone 复核。边界：GitHub 侧不可达对象/缓存与其他克隆不在本地清除范围。

## Q3 版本与 0.1.7 缺口

- 版本分列：正式 0.1.6（tag：Server `e115857`、Web `e5aa357`）；开发已收敛 Server `0.1.7-SNAPSHOT`、Web 0.1.7；部署 0.1.6（远程回读）；0.1.7 未发布。
- 收敛点（行号见附表 §3.3）：Server `pom.xml` revision＋CI 断言＋`build-prod.sh`/`check-version-identity.sh`；Web `package.json`＋`README`。`sw-dependencies/pom.xml` 的 `pgvector.version` 是依赖版本，不得随之收敛。
- 缺口：①种子未收敛（迁移目录仍 V0.1.6 基线 311,144B＋V0.1.7 增量 2,009B＋12 `R__`，链测试断言 14）；②无 `db/upgrade/0.1.7/` 通道（UAT＝S1 形态，需 `upgrade-to-0.1.7-from-0.1.6`）；③`R__0.1.7_org_demo_seed.sql` 演示种子随迁移自动装载（是否随正式版本发布待规划确认）。
- 需同步入口（附表 §3.2）：knowledge 相关文件、根 `README.md`、`CHANGELOG.md`、Server/Web `README.md`、两仓版本来源、`todo/requirement-pool.md`。

## Q4 边界存续

- 仍在 9 项（附表 §4）：TABLE 表单发布新版本被拒、节点字段三态运行期未消费、description 填报态未渲染、未纳入的说明性文案、dev:mock 菜单种子未同步 #6、TaskDetail 底部页签保留、表单级 visibility_scope 未混用、已发布表单「保存」只更新工作定义、流程定义列表统计卡未动。
- 已关闭：Docker 停止期种子授权行遗留（增补 24）→增补 25 闭环。

## 冲突与未确认

- 冲突：knowledge 权威入口（0.1.6 COMPLETED、唯一下一动作＝无）与 memory 摘要（0.1.7 修复结束待同步发布）不一致；本探索不改状态，待规划唯一值。
- 未确认：其他克隆/托管缓存残留；历史重写授权未取得（普通发布持续授权不替代）。

## 是否需继续探索

无；未确认项已附工具结果与缺口原因。执行侧继续推进授权内发布准备（种子收敛→main→发布）。
