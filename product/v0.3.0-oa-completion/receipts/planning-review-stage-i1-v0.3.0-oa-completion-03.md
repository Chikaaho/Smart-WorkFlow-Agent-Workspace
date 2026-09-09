# P60 I1「组织与权限底座」规划验收 03

> 验收角色：规划（Planner）  
> 验收日期：2026-09-09  
> 执行回执：`stage-i1-v0.3.0-oa-completion-03.md`  
> 上轮审查：`planning-review-stage-i1-v0.3.0-oa-completion-02.md`  
> 结论：**VERIFYING，I1 仍未通过**

## 1. 总体结论

本轮已经关闭并锁定 G1b、G2b、G3b、G5b，代码修复后的 Server/Web 正式门禁也通过。Planner 对四张浏览器截图、HTTP/H2 行为原始流、流程逐节点断言、工程门禁和 SHA256 清单进行了独立回读，业务验收结论成立。

唯一未关闭项仍是 G7b 的终态封装子项：

1. `MANIFEST-SHA256.txt` 当前确有 18 条，Planner 在声明 cwd 独立执行 `shasum -a 256 -c MANIFEST-SHA256.txt` 得到 18 项全部 `OK`、exit=0；这一部分通过并锁定；
2. 回执正文与 `manifest-verify.txt` 均声明 18 项，但回执最后一行的 `work_items` 和 `tool_results` 两处仍声明 16 项，终态载荷与当前证据事实不一致；
3. `terminal-validator.txt` 只有三行摘要，仅保留 `validator_exit=0` 和手写式比较结论，没有保存实际 Validator 输入、原始 stdout、原始 stderr，无法独立复算“回执最后一行 = Validator 输入 = Validator 输出”。

因此 I1 不能判定 PASSED，也不得进入 I2。该失败属于一级提示后仍存在的同类终态封装缺口，按规则下发二级补充执行提示；所有已通过业务原子禁止重验。

## 2. 原子核销矩阵

| 原子 | 本轮实际证据 | 规划结论 |
|---|---|---|
| G1b 负责人回显/角色成员 | 四张真实浏览器截图显示 I1D1/I1D2 负责人；I1_ROLE 完成成员加入、确认移除、空列表；最终 DB 回读 0 行 | **PASSED，锁定** |
| G2b 非零租户会话 | tenant 5 真实登录与 `/auth/me` 成功；本租户正向、tenant 0↔5 双向读隔离、跨租户写 403 与零写入回读成立 | **PASSED，锁定** |
| G3b 正确 taskId 办理拒绝 | 锁定 taskId `2da1b771…`，停用前同一 token 对正确 complete 路径返回 401，紧随快照仍为 PENDING | **PASSED，锁定** |
| G5b 历史身份冻结 | 同一实例覆盖 DEPT_LEADER/POST/DEPT_POST；组织变更前后逐节点与快照一致，`BEFORE_ASSERT PASS`、`AFTER_ASSERT PASS`、`G5B_ALL_PASS` | **PASSED，锁定** |
| G7b1 SHA256 清单 | 18 个载荷文件、清单排除自身、统一相对路径；Planner 现场复算 18×OK、exit=0 | **PASSED，锁定** |
| G7b2 终态载荷/Validator | 终态 JSON 两处写 16，与实际 18 冲突；无实际 terminal input/stdout/stderr 原始文件 | **未通过** |
| 最终工程门禁 | Server 12 模块 1223/0/0/0、BUILD SUCCESS、exit=0；Web typecheck/lint/test/build 均 exit=0，1176 passed + 3 skipped | **PASSED，锁定** |

## 3. 直接证据指针

- G1b：`evidence/i1-03/browser/01-dept-leader-column.png`、`02-role-member-added.png`、`03-role-member-removed.png`、`04-role-member-removed-done.png` 与 `g1b-role-member-readback.txt`。
- G2b：`evidence/i1-03/g2b-tenant-isolation.txt`。
- G3b/G5b：`evidence/i1-03/g5b-g3b-process-assertions.txt`。
- 工程门禁：`evidence/i1-03/server-module-gate-summary.txt`、`server-mvn-test-raw.txt` 与四份 `web-*-raw.txt`。
- G7b1：`evidence/i1-03/manifest-verify.txt:1-5`、`MANIFEST-SHA256.txt`；Planner 独立复算得到 `manifest_entries=18 actual_payload_files=18 manifest_exit=0`。
- G7b2：`evidence/i1-03/terminal-validator.txt:1-3` 未包含实际输入/stdout/stderr；回执 `stage-i1-v0.3.0-oa-completion-03.md:52` 声明 18 项，但同文件 `:83` 的终态载荷两处声明 16 项。

## 4. 已锁定且禁止重验

以下结论继续有效，后续只做报告封装，不得修改实现、环境或业务数据，不得重跑业务场景和工程门禁：

- ADV 64 条清单同步；
- G1a/G1b、G2a/G2b、G3a/G3b、G4、G5a/G5b、G6；
- G7a 最终候选身份、工作树指纹、Server/Web 工程门禁；
- G7b1 `evidence/i1-03/` 的 18 项 SHA256 清单与 Planner 独立复算结果。

只有新增反证表明实现或证据目录被修改，才如实报告快照失效；不得主动制造变化后重跑已锁定项。

## 5. 下一执行入口

二级补充执行提示（替代一级提示 01 作为唯一当前入口）：

`product/v0.3.0-oa-completion/receipts/planning-execution-prompt-v0.3.0-oa-completion-i1-02.md`

下一回执：

`product/v0.3.0-oa-completion/receipts/stage-i1-v0.3.0-oa-completion-04.md`

唯一剩余原子为 G7b2。I1 保持 VERIFYING，I2 不得开始。

## 6. 裁决

- I1：**VERIFYING，暂不 PASSED**。
- 本轮新增锁定：G1b、G2b、G3b、G5b、G7b1，以及最终 Server/Web 门禁。
- 唯一剩余账本：G7b2 终态载荷与 Validator 原始往返证据。
- 下一动作：Executor 只更正终态封装并提交回执 04；不改代码、不重跑业务、不进入 I2。

