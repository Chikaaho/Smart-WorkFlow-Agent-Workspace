# P60 I1 终态同步二级执行补充提示 02

> 日期：2026-09-09  
> 功能：P60 `v0.3.0-oa-completion` / I1 组织与权限底座  
> 依据：`planning-review-terminal-sync-stage-i1-v0.3.0-oa-completion-03.md`  
> 等级：二级提示（一级提示后仍有同类终态差异）

## 1. 唯一入口与替代关系

本提示替代一级提示 01，成为当前唯一执行入口；一级提示、规划复核 01—03、终态回执 01—03只作追溯。输入只需读取本提示、规划复核 03、回执 03及其 `evidence/i1-terminal-sync-03/`。

## 2. 唯一剩余原子矩阵

| 原子 ID | 失败事实 | 正向完成条件 | 反向断言 | 对象 | 唯一证据 | 下一动作 | 合法停止 |
|---|---|---|---|---|---|---|---|
| TS-K1a | session-handoff 当前任务指针仍写“进行中，六阶段 I1—I6 未启动”，旧扫描未覆盖 | 该当前指针改为 I1 业务 PASSED、终态待规划确认、I2—I6 未开始；最新复核为 03，当前入口为本提示，下一动作是 Planner 复核回执 04 | 对四个当前文档精确搜索 `进行中，六阶段 I1—I6 未启动` 和 `六阶段 I1—I6 未启动` 均为 0；不得改历史段 | `knowledge/session-handoff.md:任务指针`，其余三个当前入口只读 | 修改后完整副本、源 SHA256；命令、cwd、pattern、逐文件命中、exit 原始输出 | 只改这一处当前句并重取四副本 | 真实工具错误且安全替代穷尽 |
| TS-G1b | 回执 03 只有整理后的远端 OK 摘要，没有 push/ls-remote/远端逐文件比对的原始输出及退出码；发布边界文字互相冲突 | 将本提示、复核 03、TS-K1a、memory/todo 当前指针、回执 04及预发布证据冻结为 Workspace 发布集合并提交推送当前分支；保存本次 commit、push、ls-remote、远端逐文件 expected/actual/compare 的原始流和 exit；Server `328ff2…`、Web `d20a191…` 只读回读 | 不声称 post-push 文件包含于其证明提交；不再出现“未交付”与“远端对象 OK”冲突；不重推无变化 Server/Web；不得改 main/强推/夹带残留 | Workspace 当前分支及其本次文档提交；Server/Web 已锁定远端 ref | 预发布集合；post-push 本地包中的 commit/push stdout/stderr/exit、ls-remote stdout/stderr/exit、逐文件 expected/actual/compare/summary/exit、最终 status | 先冻结并写完回执 04，再提交推送，最后生成本地 post-push 原始包 | 远端真实失败且命令/错误/exit 在案 |
| TS-R1 | 终态载荷引用不存在的 `features-v0.3.0-oa-completion.md` | 回执 04 evidence 使用实际存在且命名固定的 `knowledge-readable-copies/v0.3.0-oa-completion.md`；全部 evidence 路径逐项 `is_file=true` | missing_count 必须为 0；不得改写回执 03 | 回执 04 末行与其 terminal input | 自动抽取末行、逐字 cmp、JSON 解析、evidence 存在性逐项输出、Validator 四件套 | 一次生成正确载荷，验证后不再编辑 | 工具真实失败且替代穷尽 |

## 3. 已删除与锁定内容

- 相对一级提示删除：T4、T7、TS-K1 已正确的三个入口、Server 功能清单修改、Web、I1 全部业务与测试。
- 原子化：TS-K1 只剩 TS-K1a 一句话；TS-G1 只剩 TS-G1b 原始发布流；新增 TS-R1 路径转录核对。
- 替代方法：精确扫描实际漏网字符串；发布证明从汇总 OK 改为原始命令流+expected/actual+exit；终态 evidence 增加存在性遍历。
- 提交条件：三个原子全部具备正反向机器结果，不能只写 PASS 摘要。

## 4. 精确范围与执行顺序

| 维度 | 范围 |
|---|---|
| 允许修改 | `knowledge/session-handoff.md` 一处当前句；Planner 当前指针所需 `memory/{state,features,handoff,README}.md`、`todo/requirement-pool.md`；新增回执 04和 `evidence/i1-terminal-sync-04/`；不得修改旧回执/旧证据 |
| 允许命令 | 精确文本扫描、SHA256、Workspace 当前分支 status/add/commit/push/fetch/ls-remote/show、Server/Web 只读 fetch/ls-remote、现行 Validator；暂存必须是显式文件集合 |
| 执行顺序 | 建账本 → 修 TS-K1a → 生成副本/精确扫描 → 生成正确终态及存在性核对 → 冻结发布集合 → Workspace 显式提交并推送当前分支 → 生成 post-push 原始包并远端逐文件比对 → 最终 status/manifest → 提交 Planner |
| 禁止事项 | 业务/测试/浏览器/迁移重验；Server/Web 新提交或推送；main/标签/Release；处理既有无关残留；用汇总 PASS 代替原始字段 |

## 5. 原始输出字段

post-push 本地证据包必须逐项保存：

1. repo root、branch、local HEAD、upstream；
2. commit stdout/stderr/exit 与 commit SHA；
3. push stdout/stderr/exit；
4. fetch/ls-remote stdout/stderr/exit 与远端完整 SHA；
5. 发布集合每项 `path / expected_sha256 / actual_remote_sha256 / cmp_exit`，以及总项目数、失败数、总 exit；
6. `git status --short` 原始输出，明确 post-push 本地附件和既有残留；
7. 回执末行与 terminal input 的 cmp exit、JSON exit、evidence 总数/missing 明细、Validator stdout/stderr/exit；
8. manifest 复算逐项输出和 exit。manifest 不覆盖自身；post-push 包不声称已推送。

## 6. 提交前核对

- [ ] TS-K1a 两个精确模式在四当前文档中均零命中；
- [ ] 回执 04 evidence 全部存在，missing_count=0；
- [ ] Workspace 本次 push 原始流与 exit=0 在案；
- [ ] 远端 SHA 与本地提交一致，发布集合逐文件 expected=actual、失败数0；
- [ ] Server/Web 只读回读，无重复推送；
- [ ] 除明确的 post-push 本地证据包及既有无关残留外，无本轮未提交文件；
- [ ] Validator、manifest 均 exit=0；
- [ ] 三原子均 COMPLETED，剩余可执行项0，下一动作 WAIT_PLANNER。

输出固定为 `terminal-sync-stage-i1-v0.3.0-oa-completion-04.md`。合法状态仍为 I1 `COMPLETED（待规划确认）`、P60 `IN_PROGRESS`、`TERMINAL_SYNC_SUBMITTED`；不得自行确认 I1 或开始 I2。
