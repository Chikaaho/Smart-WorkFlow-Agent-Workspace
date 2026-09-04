# 执行补充提示 01 回执 · sync-b-01-correction-02（B1a/B1b/B1c/B2a）

> 功能：知识库全量整理与同步（knowledge-full-reconciliation，L 级）
> 角色：Executor；日期：2026-09-04；状态：**自验通过，待规划复核**；任务保持 VERIFYING，不自行 PASSED/COMPLETED
> 依据：`product/knowledge-full-reconciliation/receipts/planning-execution-prompt-knowledge-full-reconciliation-01.md`（一级执行补充提示，唯一当前执行入口；替代 planning-review-sync-b-01 的补证待办）
> 前置复验：`planning-review-sync-b-02.md`（锁定五行状态变化、P/I 零增删、历史备份与 HEAD 比对、B3 范围偏差登记及保留裁决、A 阶段及 G1—G5；41 业务计数、业务测试基线不变）
> 范围：仅补充提示 §4 许可文件；未改业务代码、ESLint 配置、正式计数/基线、P/I 源注册表、历史附件、方向目录；未提交/推送、未编译/测试/迁移/部署。

## 原子项完成矩阵（B1a/B1b/B1c/B2a）

### B1a：I 完整映射（54 个稳定键逐项）

| 项 | 结果 | 附件/位置 |
|---|---|---|
| 持久子表 | 新增 `knowledge/feature-reconciliation-issues.md`：54 行，每项含当前状态、源锚点（known-issues.md 索引行）、对应 P/明细/交付或独立范围 | 主索引 §3 明确链接；全文导出 evidence-sync-b-correction-02/final/feature-reconciliation-issues.md |
| 正向断言 | 期望 54 键（raw-i-ids.txt）⊆ 实际表键，差集空 | check-i-diff.txt（diff exit=0，空输出） |
| 反向断言 | 实际表键 ⊆ 期望 54 键；重复键 0；不以 22 个代表编号替代 54 项；不推断缺失 I27 状态 | check-i-diff.txt（exit=0）；check-i-duplicates.txt（空=0 重复）；I27 仅备案于主索引 §5，未混入在册集合 |
| 原始输出 | 期望/实际唯一键、missing/extra/duplicate 结果均来自工具 diff | evidence-sync-b-correction-02/check-i-*.txt（awk 提取行首键 + diff + sort/uniq -d，exit 已记录） |
| 分类数字 | 原「39/15」汇总无可靠统一口径，已删去；逐行状态以 known-issues 索引行实际文字为准，子表注明 | issues 子表「集合校验」段 |

### B1b：product 目录完整映射（55 个稳定目录键逐项）

| 项 | 结果 | 附件/位置 |
|---|---|---|
| 持久子表 | 新增 `knowledge/feature-reconciliation-products.md`：55 行（A 组 41 正式功能目录 + B 组 2 非功能 + C 组 2 ready + D 组 7 receipts-only + E 组 3 特例），每项含完整目录键、性质、已有证据指针、对应明细/P 或独立范围 | 主索引 §4 明确链接；全文导出 final/feature-reconciliation-products.md |
| 正向断言 | 期望 55 键（raw-product-dirs-audited.txt）与表键双向差集空、重复 0 | check-products-diff.txt（exit=0，空）；check-products-duplicates.txt（空） |
| 反向断言 | 不称 41 功能与目录严格一一对应：子表注明 Walking Skeleton 第 1 项无独立目录（承载于 bpm-single-node-approval/process-initiation/form-binding/workflow-process-def-create）、P58 系列多方向目录同属一功能 | products 子表「集合校验」段 + X3 记录 |
| 覆盖检查 | 不以 grep「55」一次充当覆盖检查：逐行键提取（awk/grep -oE）+ 双向 diff | check-products-table-keys.txt（55 行，exit=0） |
| 复用 | A 组复用审计账本 B 逐目录记录（性质/证据指针），引用历史证据不重验旧业务 | 每行证据指针指向 product/*/receipts 与 knowledge/features/*.md |

### B1c：当前语义（P1 核销 / P47 历史限定）

主索引 `knowledge/feature-reconciliation-index.md` 两行修正，原文与修正后对照：

| 位置 | 修正前（错误/过期） | 修正后（当前语义） |
|---|---|---|
| §1 M02 表 M02-F01-01 行 | `\| M02-F01-01 角色管理 \| 🟦 \| P1 其余缺口开放 \| 菜单/按钮已覆盖；用户组绑定子集已关 \|` | `\| M02-F01-01 角色管理 \| 🟦 \| P1 已核销（2026-08-20）；其余范围独立待核 \| 菜单/按钮已覆盖（P1 全部子项 I31/I36/F02/F03 已闭合核销）；该明细剩余缺口（角色管理完整维护范围）未完成，保持 🟦 \|` |
| §1 M04 表 M04-F01-01 行 | `\| M04-F01-01 流程设计器拖拽 \| 🟦 \| P47 \| 前端无设计器路由（I3 按设计排除）；M04-F01-01 ID 不被其他交付占用 \|` | `\| M04-F01-01 流程设计器拖拽 \| 🟦 \| P47 \| 「前端无设计器路由（I3 按设计排除）」为 P47 登记的旧实现结论（历史快照，未经本轮对账验证），不宣称当前已验证；M04-F01-01 ID 不被其他交付占用；当前事实以代码与后续规划为准 \|` |

- 同文件 P1 状态对照（§2 P 编号全集）：P1 在「已核销/完成（19）」列表内（与 requirement-pool P1 行 ✅ 已核销一致）；M02-F01-01 明细保持 🟦（不因 P1 核销升级）。
- 三类查询（M04-F05-01/P4）、P3（发送记录子集/剩余）、五项部分实现（P34/P35/P37/P38/P39）口径未动；不升降其他明细、不新核销 P 编号。
- 历史事实不清除：P47 旧结论保留为历史限定表述，仅标注未经验证。

### B2a：最终证据封装

| 项 | 结果 | 输出 |
|---|---|---|
| 最终全文导出 | 修改结束后一次导出主索引+两子表全文至 final/，源/副本哈希逐一相同 | final/feature-reconciliation-{index,issues,products}.md；逐文件 shasum 源==副本 ✓ |
| 最终 diff 导出 | 主索引含本轮 B1c 修正的完整 diff（git diff --no-index 全量）；两新子表首次引入全量 diff | final/diff-index-full.txt（19KB）、diff-issues-full.txt（9KB）、diff-products-full.txt（13KB） |
| 机器生成清单 | 相对 final/ 固定目录的 SHA256SUMS 由工具生成（shasum -a 256，exit=0）并回读 | final/SHA256SUMS：7 项全部 OK（3 全文 + 3 diff + source-final.sha256）；回读 exit=0 |

## 固定集合与锁定项确认

- 固定审计集合：I=54、product=55、P=56；P13/P23、I27 在备案区（主索引 §2/§5），未混入在册集合；本轮新增审计目录（knowledge-full-reconciliation 自身与 governance）未混入原 55 目录（raw-product-dirs-audited 已排除）。
- 源集合实际键与本轮实际键双向 diff exit=0（I 与 product），无调整期望数掩盖。
- 锁定项复核：A 阶段/G1—G5、41 业务计数、业务测试基线、五个明细 ⬜→🟦 与其余 85 行不变、P/I 源集合零增删、历史备份 770bf2c4 与 HEAD 比对、B3 范围偏差登记与保留裁决——均未破坏（未重跑测试/迁移/备份，未重新收集历史回执）。
- memory 本轮实测：8 文件共 **16,098B**（<20KB）、最大 4,113B（<5KB）——为修改后实际字节，非沿用旧值。

## 修改文件集合（本轮 = 补充提示 §4 许可）

| 文件 | 改动 |
|---|---|
| knowledge/feature-reconciliation-index.md | B1c 两行语义修正 + §3/§4 链接两个新子表（修改后 10a224b2…） |
| knowledge/feature-reconciliation-issues.md | **新增**（B1a 子表，f94942cb…） |
| knowledge/feature-reconciliation-products.md | **新增**（B1b 子表，7be9296d…） |
| knowledge/current-status.md | 仅下一动作/审计任务状态段（→复核 sync-b-01-correction-02） |
| knowledge/session-handoff.md | 仅下一动作/任务指针段（同上 + 子表链接） |
| knowledge/features/knowledge-full-reconciliation.md | 仅补证入口段（B1a—B2a 记录） |
| memory/state.md | 仅当前任务/下一动作段 |
| memory/handoff.md | 仅下一动作段 |
| todo/requirement-pool.md | 仅统一下一动作两处（→correction-02） |

其余文件（含 A 阶段全部账本/回执、sync-b-01、sync-b-01-correction-01、history 快照）只读未改写；ESLint 待办保留。

## 自验结论

B1a/B1b/B1c/B2a 四原子项全部满足正向/反向断言：54 I 与 55 目录逐项持久子表双向差集空、重复 0；P1 核销与 P47 历史限定修正且上下文无残留；最终全文/diff 由机器生成 SHA 清单覆盖并回读 7/7 OK、源==副本一致。当前指针统一为「Planner 复核 sync-b-01-correction-02（B1a/B1b/B1c/B2a）」，状态 VERIFYING。**自验通过，待规划复核；不自行进入 PASSED/COMPLETED 或阶段三。**

附件：`receipts/evidence-sync-b-correction-02/`（final/ 7 项产物 + check-* 原始输出 + 键集合文件）。