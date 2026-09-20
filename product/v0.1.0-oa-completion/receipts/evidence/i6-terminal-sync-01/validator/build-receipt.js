// Writes the I6 stage-three terminal-sync receipt with the exact terminal payload
// from validator/input.json as its physical last line.
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = 'E:/code/Smart-WorkFlow-Agent-Workspace';
const dir = path.join(ROOT, 'product/v0.1.0-oa-completion/receipts/evidence/i6-terminal-sync-01/validator');
const payload = fs.readFileSync(path.join(dir, 'input.json'), 'utf8').trim();
if (!payload.startsWith('{"schema":"agent-coding-engine.executor-terminal.v2"')) {
  throw new Error('unexpected validator payload');
}
const receiptPath = path.join(ROOT, 'product/v0.1.0-oa-completion/receipts/terminal-sync-stage-i6-v0.0.3-oa-iteration-01.md');

const body = `# P60 I6「通知与版本收口」阶段三终态同步回执 01

- 日期：2026-09-15；角色：执行（Executor）；任务等级：XL。
- 唯一执行入口：\`product/v0.1.0-oa-completion/ready/direction-stage-i6-terminal-sync.md\`。
- 前置裁决：\`product/v0.1.0-oa-completion/receipts/planning-review-stage-i6-notification-version-closure-07-owner-deferral-passed.md\`（I6 功能级 \`PASSED\`；Owner 2026-09-15 裁决「先过吧，记一个 P2 级 todo」）。
- 证据根：\`product/v0.1.0-oa-completion/receipts/evidence/i6-terminal-sync-01/\`。
- 本轮性质：**机械终态同步**。只按唯一终态值清单写 \`knowledge/\`、\`memory/\`、\`todo/\`、工程《功能清单》与三个方向文件的当前指针，并只读复算 R7 三仓内容指纹。**未修改业务实现、未重跑 L1—L37、未执行五渠道真实调用、未核销任何 P 编号、未执行 commit/push/tag/Release。**
- 合法状态：I6 \`COMPLETED（待规划确认，2026-09-15）\`、P60 \`IN_PROGRESS\`、机器 \`TERMINAL_SYNC_SUBMITTED\`、\`remaining_actionable_count=0\`、\`next_action_type=WAIT_PLANNER\`。未写 I6「规划已确认」，未把 P60 写成 \`PASSED/COMPLETED\`。

---

## 1. 唯一终态值的实际同步位置与全文回读

| 字段 | 唯一授权值 | 实际同步位置 | 实际值 | 一致 |
|---|---|---|---|---|
| P60 功能状态 | \`IN_PROGRESS\` | \`knowledge/current-status.md\`、\`knowledge/session-handoff.md\`、\`knowledge/features/v0.1.0-oa-completion.md\`、\`Smart-WorkFlow-aPaaS-server/功能清单.md\`（当前焦点）、\`todo/v0.1.0-oa-plan.md\`、\`todo/requirement-pool.md\`、P60 主方向、\`memory/state.md\`、\`memory/features.md\`、\`memory/handoff.md\` | \`IN_PROGRESS\` | 是 |
| I1 阶段状态 | \`COMPLETED（规划已确认，2026-09-09）\` | 同上全部入口（按清单保持，未改写语义） | \`COMPLETED（规划已确认，2026-09-09）\` | 是 |
| I2 阶段状态 | \`COMPLETED（规划已确认，2026-09-10）\` | 同上（保持） | \`COMPLETED（规划已确认，2026-09-10）\` | 是 |
| I3 阶段状态 | \`COMPLETED（规划已确认，2026-09-12）\` | 同上（保持） | \`COMPLETED（规划已确认，2026-09-12）\` | 是 |
| I4 阶段状态 | \`COMPLETED（规划已确认，2026-09-13）\` | 同上（保持） | \`COMPLETED（规划已确认，2026-09-13）\` | 是 |
| I5 阶段状态 | \`COMPLETED（规划已确认，2026-09-14）\` | 同上（保持） | \`COMPLETED（规划已确认，2026-09-14）\` | 是 |
| I6 阶段状态 | \`COMPLETED（待规划确认，2026-09-15）\` | 同上全部入口，另写入 I6 已归档主方向头部「阶段状态」、终态同步方向头部「当前指针/阶段状态」与本回执 | \`COMPLETED（待规划确认，2026-09-15）\` | 是 |
| I6 功能级验收 | \`planning-review-stage-i6-notification-version-closure-07-owner-deferral-passed.md\` | \`knowledge/current-status.md\`（快照/最近审查/启动提示词）、\`knowledge/session-handoff.md\`、\`knowledge/features/v0.1.0-oa-completion.md\`、\`Smart-WorkFlow-aPaaS-server/功能清单.md\`、\`todo/v0.1.0-oa-plan.md\`、\`todo/requirement-pool.md\`、\`memory/state.md\`、\`memory/features.md\`、\`memory/handoff.md\` | \`product/v0.1.0-oa-completion/receipts/planning-review-stage-i6-notification-version-closure-07-owner-deferral-passed.md\` | 是 |
| 正式完成功能数 | 44，不增加 | 全部入口 | **44** | 是 |
| 90 条清单 | ✅46 / 🟦22 / ⬜22 | 全部入口；工程《功能清单》90 行逐行未改 | **✅46 / 🟦22 / ⬜22** | 是 |
| ADV | 64 条，保持规划映射现状，不计入 90 条 | \`knowledge/current-status.md\`、\`knowledge/session-handoff.md\`、\`knowledge/features/v0.1.0-oa-completion.md\`、工程《功能清单》当前焦点（未改写 ADV 章节） | 8 模块 / 64 条，独立规划登记、不并入审计集合 | 是 |
| P 编号 | P60、P31、P37、P38、P39 及其他开放编号保持现状，本阶段不核销 | 全部入口；\`knowledge/known-issues.md\`、\`knowledge/feature-reconciliation-index.md\` 未被本轮触碰 | 无核销、无新增、无删除；P21 已核销（2026-09-08）不变；I 集合 54 条不增删 | 是 |
| R8 例外 | 五渠道 = \`Owner延期 / 未验证\`，P2 待办已登记 | \`knowledge/current-status.md\`（验证例外/下一动作/未关闭项）、\`knowledge/session-handoff.md\`、\`knowledge/features/v0.1.0-oa-completion.md\`、工程《功能清单》当前焦点、\`todo/v0.1.0-oa-plan.md\`、\`todo/requirement-pool.md\`、\`memory/state.md\`、\`memory/handoff.md\`、\`memory/decisions.md\`、\`memory/issues.md\` | SMS、EMAIL、FEISHU、DINGTALK、WECHAT_WORK 均为「Owner 延期 / 未验证」；全文无「真实通过/沙箱通过/外部联调完成」表述 | 是 |
| 活动主功能 | P60 \`v0.1.0-oa-completion\` | \`knowledge/current-status.md\`（当前活动正式功能） | \`v0.1.0-oa-completion\`（XL，IN_PROGRESS） | 是 |
| 当前唯一动作 | I6 阶段三状态同步与候选只读核对 | 本回执 §1—§4 | 已执行完毕 | 是 |
| 同步后唯一下一动作 | 等待 Planner 终态复核；确认 I6 \`COMPLETED\` 后启动 P60 整体 14 条标准独立复核 | \`knowledge/current-status.md\`（当前唯一下一动作/新会话启动提示词）、\`knowledge/session-handoff.md\`（唯一下一动作）、\`knowledge/features/v0.1.0-oa-completion.md\`、\`todo/v0.1.0-oa-plan.md\`、\`todo/requirement-pool.md\`、工程《功能清单》当前焦点、P60 主方向 §9、\`memory/state.md\`、\`memory/features.md\`、\`memory/handoff.md\`、\`memory/README.md\` | 「等待 Planner 对 I6 阶段三终态同步回执 01 的终态复核；确认 I6 \`COMPLETED\` 后启动 P60 整体 14 条标准独立复核」 | 是 |
| P60 主方向 | \`product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md\` | 该文件本身（头部功能状态、§4.1、§9），路径未变 | 路径未变；当前指针已更新为 I6 待规划确认 + 下一动作 | 是 |
| I6 主方向 | \`product/v0.1.0-oa-completion/passed/direction-stage-i6-notification-version-closure.md\` | 文件系统与各入口引用；头部「阶段状态」 | 已由 Planner 在功能级 PASSED 时归档 \`passed/\`，本轮未移动，仅同步头部阶段状态 | 是 |
| I6 终态同步方向 | \`product/v0.1.0-oa-completion/ready/direction-stage-i6-terminal-sync.md\` | 文件系统与各入口引用；头部「当前指针/阶段状态」 | 仍在 \`ready/\`（Planner 终态复核后方可移入 \`passed/\`） | 是 |
| 标签与 Release | 不创建、不发布 | 三仓 | 未创建任何 0.1.0 标签 / Release（\`git tag\` 回读仅见历史 0.0.1/0.0.2 系列） | 是 |

全文回读：上述每个入口文件在本回执落盘前已逐文件重新读取核对；机器断言脚本 \`readback/verify-terminal-values.js\` 覆盖终态值、路径存在性、归档状态、计数、指纹与 memory 限额共 **152 项，pass=152 / fail=0，exit=0**（原始输出 \`readback/terminal-values-readback.txt\`）。

## 2. memory 压缩前后字节数

采集口径：\`wc -c memory/*.md\`（字节）。

| 文件 | 同步前 | 同步后 |
|---|---:|---:|
| \`memory/README.md\` | 611 | 648 |
| \`memory/architecture.md\` | 857 | 857 |
| \`memory/constraints.md\` | 713 | 713 |
| \`memory/decisions.md\` | 4377 | 4904 |
| \`memory/features.md\` | 2445 | 3063 |
| \`memory/handoff.md\` | 2532 | 2997 |
| \`memory/issues.md\` | 1722 | 1672 |
| \`memory/state.md\` | 3392 | 4395 |
| **合计** | **16649** | **19249** |

- 约束核对：每个短文件 **< 5KB**（最大 \`memory/decisions.md\` 4904 字节），\`memory/\` 总量 **19249 字节 < 20KB**。**均满足**。
- 压缩方式：\`issues.md\` 把已收敛的历史轮次（p21、P59/P58/P57/P56/P52、全量对账、治理审计）合并为单条并去掉逐轮重复表述（1722→1672）；\`state.md\` 把 p21/v0.0.2/更早功能的历史明细合并收敛后，再补入 I6 终态口径。同步后总量比同步前增加 2600 字节，全部为 I6 终态口径（I6 状态与验收、I6 门禁基线、候选与指纹、R8 例外与 P2 待办、推送边界、下一动作）的必要登记；未引入任何与 \`knowledge/current-status.md\` 冲突的口径。
- 未把 I6 \`COMPLETED\` 写成 P60 \`COMPLETED\`；未提前写「规划已确认」；R8 五渠道未写成已验证成功。

## 3. 三仓只读候选核对与 R7 指纹复算

复算脚本：\`readback/verify-r7-fingerprint.ps1\`（逐条镜像 \`evidence/i6-06/R7-CONTENT-FINGERPRINT/scripts/generate-fingerprint.ps1\` 的排除规则与规范化算法，只读、不覆盖任何锁定产物）。**技术说明**：本机 PowerShell 5.1 经管道读取 git 输出时默认按代码页解码，首次运行会把 45 个含中文名的工作区路径读成乱码而误报为缺失；已在脚本中显式 \`[Console]::OutputEncoding = UTF-8\` 后重跑，本回执全部数字取自重跑结果。

### 3.1 同步前（任何写动作之前）

| 仓库 | base HEAD | 记录/现存文件 | 逐文件命中 | 内容指纹复算 |
|---|---|---|---|---|
| server | \`e941d74\`（与 manifest 一致） | 1312 / 1312 | **1312/1312** | \`46f8563cd43d7b98e7b7538f19059393cb5eb26184551a53e4c478d24c3f3fd0\`，与锁定值**相等** |
| web | \`0a746e3\`（与 manifest 一致） | 405 / 405 | **405/405** | \`c801e4c6c3222d42db6041b555d512d10ceb3b282bce06a02ed5912a3c59dcc6\`，与锁定值**相等** |
| workspace | \`bb2f47f\`（记录） / 实际 \`8e87899\` | 5566 / 5574 | 5550 | 变更 15、缺失 1、新增 9，逐项均为 R7 快照（09-15 11:20）之后的治理/规划产物与本轮同步产物 |

结论：**受测内容（Server/Web）与 R7 锁定候选逐字节一致，未发生漂移**；Workspace 差集不含任何 I6 业务实现或证据对象，属方向 §3 允许记录的快照后变化（治理门禁提交 \`8e87899\`、review 07 产物、\`todo\` 登记与本轮同步写入），不触发停止条件。

### 3.2 同步后复算（本轮可复读产物）

产物：\`readback/r7-recompute-post.json\`、\`readback/r7-recompute-post.txt\`（同步前那次运行输出在脚本加入 \`Phase\` 参数前使用固定文件名，随后被 post 运行取代；其逐仓结果即 §3.1 记录值）。

| 仓库 | 现存 | 命中 | 变更 | 缺失 | 新增 | 指纹比对 |
|---|---:|---:|---:|---:|---:|---|
| server | 1312 | 1311 | **1** | 0 | 0 | 唯一变更 = \`功能清单.md\`（方向 §4 第 2 项授权的「正式功能清单当前焦点」同步，90 行业务明细与 ADV 章节零变化） |
| web | 405 | **405** | **0** | 0 | 0 | 复算值 \`c801e4c6…\` 与锁定值**相等**——Web 本轮零修改 |
| workspace | 5573 | 5544 | 21 | 1 | 8 | 差集 = 治理/规划产物（\`.codex/governance/\`6 项、\`system.md\`、\`roles/executor.md\`、\`todo/admin-machine-gate-continuous-visible-browser.md\`）+ 本轮同步写入（\`knowledge/\`3 项、\`memory/\`6 项、\`todo/\`2 项、三个方向文件）+ review 07 产物（\`planning-review-…-06-blocked.md\`、\`-07-owner-deferral-passed.md\`、\`ready/direction-stage-i6-terminal-sync.md\`、\`passed/direction-stage-i6-notification-version-closure.md\`、\`todo/i6-external-notification-channels-real-verification.md\`）与本轮证据脚本；缺失 1 项 = 已按 review 07 归档移动的 \`ready/direction-stage-i6-notification-version-closure.md\`（其新路径出现在新增集内，非丢失） |

- 三仓 base HEAD 与 R7 记录的关系：server、web 与 manifest 完全一致；workspace 由 \`bb2f47f\` 前进到 \`8e87899\`（方向 §5 要求只读记录，不作为停止条件）。
- 本轮新增的 \`evidence/i6-terminal-sync-01/\`（复算脚本、报告、断言脚本、Validator 四件套）与本回执本身在复算之后写入，属自引用，与 R7 排除自身证据目录同口径，故不出现在上表。

### 3.3 manifest 自身一致性

- \`fingerprint-manifest.sha256\` 侧车文本与 \`sha256(fingerprint-manifest.json)\` 实测均为 \`3942311b2d2712e490a011594102183ee2806abb11eefc46c0bb449ba16e716f\`，与方向 §3 记录一致；\`recompute-output.json\` 记录的独立复算 \`matchesManifest=true\`、exit=0 复核成立。
- 以 manifest 自身记录顺序重放其逐文件条目，三个仓库均能复现各自的 \`contentFingerprint\`（\`manifestSelfConsistent=true\`），说明清单内部自洽、无事后改写。

## 4. 三仓只读状态、提交与发布边界

采集脚本：\`readback/repo-git-state.txt\`（未执行 \`fetch\`，远端值经 \`git ls-remote\` 只读获取）。

| 仓库 | 根 | 分支 | HEAD | upstream | ahead/behind | 工作树 | 远端当前 SHA | 本轮 Git 动作 |
|---|---|---|---|---|---|---|---|---|
| Workspace | \`E:/code/Smart-WorkFlow-Agent-Workspace\` | \`develop-sw\` | \`8e87899ab8d45e5289efa643fa6489c55168dfa3\` | \`origin/develop-sw\` | 19 / 0 | DIRTY（31 项） | \`69c319777a27b489fd985591f63c388787e6a948\` | **无** |
| Server | \`…/Smart-WorkFlow-aPaaS-server\` | \`develop\` | \`e941d74ffb3e5388e1b3ac3efb234d4634436aea\` | \`origin/develop\` | 8 / 0 | DIRTY（17 项 = I6 候选 16 项 + 本轮授权的《功能清单》当前焦点行） | \`4c7fc241de3710b58a718ff2c072ceac784b43f3\` | **无** |
| Web | \`…/Smart-WorkFlow-aPaaS-Web\` | \`develop\` | \`0a746e3d6e0e0aaa0c4ee8633c58c75c295546d6\` | \`origin/develop\` | 4 / 0 | DIRTY（4 项，与本轮前一致） | \`5788ead33c4347214a350d124331237e85068bdf\` | **无** |

最后一次回读在上述同步写入与本回执落盘之后执行（\`readback/repo-git-state.txt\`，含三仓 HEAD 末次提交、脏文件清单与标签清单）。

- 方向 §5 明确「本方向不授权 commit、push、tag、Release、合并、rebase、强推或历史改写」，故本轮**未创建任何提交**、**未执行任何推送**、未合并/rebase/强推、未创建标签或 Release，也未清理或覆盖任何既有脏文件；Server 的 8 个本地提交、Web 的 4 个本地提交、Workspace 的 19 个本地提交均保持未推送。
- 与 I5 轮的差异说明：I5 终态同步方向曾授权「整理并提交 I5 task-owned 变化」，本轮方向未授权提交，因此包括 Server《功能清单》当前焦点在内的全部写入均留在工作树，等待 Owner 对远端/分支/范围另行授权后统一处理。

## 5. 与方向的偏差

1. **无内容级偏差**：唯一终态值、路径与归档状态、计数、P 编号与 R8 例外表述均与方向及审查 07 一致。
2. **workspace 指纹移动（已报告，非偏差）**：见 §3.1/§3.2，差集全部为快照后的治理/规划与本轮同步产物，受测内容零漂移，不满足方向 §3 的停止条件。
3. **复算脚本自修正（已披露）**：首次复算因本机代码页解码导致 45 个中文路径误报缺失，已在证据中如实记录并改用显式 UTF-8 解码重跑；所有对外数字均取自重跑结果。
4. **memory 总量净增 2600 字节**：为 I6 终态口径的必要登记，仍满足「每文件 <5KB、总量 <20KB」硬约束。

## 6. 终态值回读、Validator 与末行逐字节比较

| 项 | 位置 | 结果 |
|---|---|---|
| 终态值逐入口断言 | \`readback/verify-terminal-values.js\` → \`readback/terminal-values-readback.txt\` | **152 项 pass / 0 fail，exit=0** |
| 终态输入 | \`validator/input.json\` | 见本回执物理末行（同内容） |
| Validator stdout / stderr / exit | \`validator/stdout.txt\`、\`validator/stderr.txt\`、\`validator/exit.txt\` | stdout 空、stderr 空、**exit=0**（\`.codex/governance/validate-terminal.ps1\`；\`.sh\` 变体因本机缺 \`jq\` 不可用，与 I3/I4/I5 轮记录一致） |
| 末行逐字节比较 | \`readback/lastline-compare.txt\` | 本回执末行去掉固定前缀 \`ENGINE_TERMINAL \` 后与 \`validator/input.json\` \`cmp\` 相等（cmp=0） |

## 7. 自验结论与合法终态

- I6 唯一终态值已机械同步至全部要求入口；\`knowledge/current-status.md\` 为唯一当前快照权威；未写「规划已确认」，未把 I6 写成 P60 完成，R8 五渠道统一记录为 \`Owner延期 / 未验证\` 并指向 P2 待办。
- 只读候选核对与 R7 复算证明 **Server 1312/1312、Web 405/405 与锁定候选逐字节一致**；Server 唯一变化是方向 §4 授权同步的《功能清单》当前焦点行，Web 零修改。
- 未修改业务实现、未重跑 L1—L37、未执行五渠道真实调用、未核销 P 编号或新增完成功能数、未创建标签或 Release、**未执行任何提交与远程动作**。
- 唯一外部依赖：I6 五通道真实链与三 Provider 真实链均由 Owner 裁决延期，已登记 P2 待办，不构成本轮阻塞；下一动作由 Planner 执行终态复核。
- 自验结论：**自验通过，提交 \`TERMINAL_SYNC_SUBMITTED\`，待 Planner 终态复核**。

后续由 Planner 复核本回执与 \`evidence/i6-terminal-sync-01/\`；复核通过并确认 I6 \`COMPLETED\` 后，才进入 P60 整体 14 条标准的独立复核，并把本终态同步方向归档 \`passed/\`。

ENGINE_TERMINAL ${payload}
`;

fs.writeFileSync(receiptPath, body, 'utf8');
const size = fs.statSync(receiptPath).size;
const lines = body.split('\n');
console.log(`receipt=${receiptPath}`);
console.log(`bytes=${size} lines=${lines.length - 1}`);
console.log(`lastline=${lines[lines.length - 2].slice(0, 40)}...`);
