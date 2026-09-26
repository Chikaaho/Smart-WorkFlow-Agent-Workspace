# Final 仓库展示与项目元数据收口 · 规划复核 01

> 复核角色：规划（Planner）  
> 日期：2026-09-26  
> 复核对象：`completion-final-repository-presentation-hygiene-01.md` 与 `evidence/final-01/`  
> 结论：`VERIFYING`（远端 About、canonical URL 与边界已成立；POM 增量归属和证据计数待补）

## 1. 已确认并锁定

1. 后端身份为 `Chikaaho/Smart-WorkFlow-aPaaS-server`，canonical URL 为 `https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server`；前端身份为 `Chikaaho/Smart-WorkFlow-aPaaS-Web`。
2. 两个 GitHub About description 的 `gh repo edit` 均 exit 0，冻结的写后 API 回读与目标文本逐字一致。Planner 于复核时再次只读调用 `gh repo view --json nameWithOwner,url,description`，当前值仍逐字一致。
3. Maven `project.url` 解析为后端 canonical HTTPS URL；受跟踪文件中 `github.com/your-org/smart-workflow` 与任意 `your-org` 命中均为 0。
4. 前端工作树保持 3 个既有未跟踪文件；两仓 branch/HEAD、本地 tag 数未变，无 commit/push/merge/rebase/tag/Release/deploy/远端 ref 更新。
5. `final-01/` 实际有 9 个物理文件，其中 7 个哈希载荷；Planner 现场重放 7/7 OK。秘密扫描 CLEAN，机器终态可解析。

上述事项锁定；补证不得再次修改 GitHub description、POM 或任何 refs，不得重跑 Maven 构建/测试。

## 2. 未通过项

### F1 · 证据回读计数转录错误

`final-readback.txt` 写成“7 个载荷 + 清单/回读 2 个 = 物理文件 8（7+2=8）”，而现场目录实际是 **9** 个文件。主体回执与机器终态写 9，哈希载荷确为 7，因此这是报告转录错误，不推翻 7/7 哈希结果；但新补证必须准确写为 7+2=9，不能改写旧证据包。

### F2 · 现有证据不能复算 Final 对根 POM 的增量范围

`final-worktree-checks.txt` 显示根 `pom.xml` 相对 HEAD 已有 83 insertions / 13 deletions，展示的首个 hunk 是 Phase 6C 的 `${revision}` 变化，而非 Final URL。`final-worktree-notes.txt` 声明 Final 只改 URL 一行，但没有 Final 修改前的 POM hash/diff 快照，也没有把当前每个 POM diff hunk 逐项归属到已完成的 Phase 6A、Phase 6C 或本 Final。

由于工作树本来就脏，不能用“当前总 diff 很大”判定越界，也不能只凭声明认定增量恰为一行。可接受的等强度补证是：冻结当前根 POM 零上下文完整 diff，并对每个 hunk 做穷尽归属；除 URL hunk外，所有 hunk必须能指向 Phase 6A/6C 已归档方向或既有回执，且不得存在无法解释的新 hunk。URL hunk必须精确是一处旧 placeholder 删除和 canonical URL 添加。

## 3. 当前状态与下一动作

Final 保持 `VERIFYING`；总体任务保持 `IN_PROGRESS`。唯一下一动作：Executor 执行：

`product/backend-architecture-optimization/receipts/planning-execution-prompt-final-evidence-supplement-01.md`

不得归档 Final 主方向、同步 Final/总体任务 `COMPLETED`，也不得执行 Git 发布动作。
