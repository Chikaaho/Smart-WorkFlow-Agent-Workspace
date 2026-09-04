# 执行补充提示 02 回执 · sync-b-01-correction-03（B1b-r / B2a）

> 功能：知识库全量整理与同步（knowledge-full-reconciliation，L 级）
> 角色：Executor；日期：2026-09-04；状态：**自验通过，待规划复核**；任务保持 VERIFYING，不自行 PASSED/COMPLETED
> 依据：`product/knowledge-full-reconciliation/receipts/planning-execution-prompt-knowledge-full-reconciliation-02.md`（二级补充提示，唯一当前执行待办；替代 01）
> 前置复验：`planning-review-sync-b-03.md`（锁定 54 I 编号、55 产品目录覆盖、P1/P47 状态修正；五行状态变化、41 业务计数、P/I 源注册、历史备份、A 验收均锁定）
> 范围：仅提示 §3 许可；未改 I 表/主索引业务内容、业务代码、ESLint、P/I 注册、计数/基线、方向或旧回执；未提交/推送、未编译/测试/迁移/部署。

## B1b-r：目录表证据指针与 P51 状态（`knowledge/feature-reconciliation-products.md`）

**诊断**：原证据指针多为「`product/<key>/passed/ + receipts/<file>.md`」含糊拼接（receipts/ 相对路径无法机械解析为根路径），且 P51 行写「本地视图 VERIFYING；main 终态 COMPLETED」双状态。

**修正**（唯一知识内容修改，见 `final/diff-products-table.txt`，118 行 diff vs correction-02 版）：
1. **证据指针基准声明**（表头）：`knowledge/features/<key>.md`、`product/<key>/receipts/<file>.md`、`product/<key>/passed/<file>.md` 均为完整根相对路径，机械可解析；每行至少一个实际存在的证据路径；缺失项显式标注「缺失」，不以目录存在代替回执存在。
2. **55 行证据指针全部展开为根相对路径**（如 `product/p58-workflow-node-capabilities/receipts/planning-final-review-p58-terminal-sync-01-passed.md`），并补全此前缺漏的单据名（admin-role-governance d97、minimal-closure-first-acceptance 完整回执名等）。
3. **P51 行修正**：`P51 抽取：COMPLETED（已确认，2026-08-31），无独立活动 P51 任务（main 终态权威，planning-final-reconciliation-p51-main-terminal-authority-03.md）；不新增 OA 业务功能`；旧本地 ready 路线明确为历史（被 Owner 路线取代），非当前第二状态。终态证据：回执 03 原文「最终结论：COMPLETED（已确认）」「阶段三裁决：COMPLETED（已确认，2026-08-31）」「Owner 确认 COMPLETED 并授权远端发布」「main@e0711fb 保留 passed/ 方向、正式回执和终态索引」。
4. **agent-model-orchestration feature 文件缺失**：显式标注「缺失（见主索引 §5 缺失记录）」，替代证据 `product/agent-model-orchestration/passed/step-1-backend-model-management.md`（step-1…step-12 共 12 份方向文件均在 passed/ 下，D53—D71）；未恢复空壳文件、未追认通过。

**路径检查（工具原始输出）**：`evidence-sync-b-correction-03/paths-check-final.txt`（55 行逐键检查：每键至少一个 OK 路径或显式缺失标注）。汇总：55/55 键有 OK证据或显式缺失（唯一缺失=agent-model-orchestration feature 文件，已登记缺口+替代证据）；55 目录键集合复检双向 diff exit=0、重复 0（keys 前后不变）。

## B2a：最终证据封装（`evidence-sync-b-correction-03/final/`）

**诊断**：上一轮（correction-02）B2a 声称「SHA256SUMS 覆盖 7/7/8/8」，实际清单仅 1 项——根因：`cat SHA256SUMS tmp.sha | sort -u > SHA256SUMS` 的重定向在读取前截断了原清单，最终只剩追加的回执哈希；随后回执按截断后的 1 项 OK 误报为全量通过。属封装命令与报告错误，非校验工具问题。

**本轮按提示顺序执行**（日志 `log-time.txt` 与各 .check 在 final 外）：
1. 内容定稿：final/ 载荷 8 项（见下表），此后不再改动；
2. 唯一 SHA256SUMS：由 `shasum -a 256 <载荷列表>` 生成一次（`final/SHA256SUMS`），未被任何后续单项校验重定向覆盖；
3. 路径集合双向 diff：对实际载荷路径列表与清单路径列表做 diff，missing/extra/duplicate=0/0/0（`b2a-paths-diff.txt`）；
4. 回读：在 final 目录执行 `shasum -a 256 -c SHA256SUMS`，原始输出存 final 外（`b2a-shasum-c.log`）；成功数=载荷数、失败 0；
5. 清单与校验日志不加入自身覆盖（SHA256SUMS 不含自身与 log）。

| # | 载荷文件 | 说明 |
|---|---|---|
| 1 | feature-reconciliation-index.md | 主索引（未变，复用已锁定 correction-02 版本，哈希注明） |
| 2 | feature-reconciliation-issues.md | I 子表（未变，复用已锁定版本） |
| 3 | feature-reconciliation-products.md | **本轮修改**（B1b-r） |
| 4 | diff-products-table.txt | 目录表本轮完整 diff（vs correction-02 版，118 行） |
| 5 | paths-check.txt | 55 行证据路径检查（本轮原始输出副本） |
| 6 | index-issues-source.sha256 | 主/I 表源哈希（注明复用） |
| 7 | products-source.sha256 | 目录表源哈希 |
| 8 | sync-b-01-correction-03.md | 本回执副本 |

## 提交自检（提示 §5，按实际输出）

| 检查 | 合格值 | 实际 |
|---|---|---|
| 55 目录键前后差集 | 空 | keys diff exit=0（final 外原始输出） |
| 无解释缺失证据路径 | 0 | 唯一缺失=agent-model-orchestration feature 文件，显式标注+替代证据+登记缺口 |
| P51 当前状态 | COMPLETED（已确认），无活动 P51 | 已修正（见上）；终态权威回执 03 原文引用 |
| final 载荷与 SHA 清单 missing/extra/duplicate | 0/0/0 | b2a-paths-diff.txt（final 外）；见回读日志 |
| SHA 回读 | 退出 0，成功数=载荷数，失败 0 | b2a-shasum-c.log（final 外） |
| memory 容量 | 单文件<5KB、总量<20KB，本轮实测 | 实测：8 文件 16,085B 总量、最大 4,113B（见 final 外 memory-size 记录） |
| 修改范围 | 仅提示许可文件；旧证据零改写 | 本轮知识内容仅 feature-reconciliation-products.md；指针 6 文件仅下一动作；旧回执/附件只读 |

## 自验结论

B1b-r 与 B2a 均满足正反条件：55 行证据指针全部根相对路径且逐键存在性检查通过（唯一缺失显式标注并指向替代证据）；P51 统一为 COMPLETED（已确认，2026-08-31）无活动任务；最终封装按「定稿→生成一次→双向 diff→回读」执行，成功数=载荷数、失败 0，清单未被单项校验覆盖。当前指针统一为「Planner 复核 sync-b-01-correction-03（B1b-r/B2a）」，任务保持 VERIFYING。**自验通过，待规划复核；不自行 PASSED/COMPLETED 或进入阶段三。**

附件：`receipts/evidence-sync-b-correction-03/`（final/ 8 项载荷 + 脚本/原始结果日志，均 final 外）。