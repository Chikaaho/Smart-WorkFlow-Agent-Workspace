# P60 I5 三级继续收敛执行提示 07

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-14  
> 当前状态：P60=IN_PROGRESS，I5=VERIFYING  
> 下一回执：`stage-i5-v0.0.3-oa-iteration-09.md`

## 1. 唯一入口

本提示替代 `planning-execution-prompt-stage-i5-tenant-safe-sso-06.md`。G6c1a 与此前全部业务原子项已锁定；旧提示和回执仅作证据追溯。

权威输入为正式 I5 方向、`planning-review-stage-i5-v0.0.3-oa-iteration-08.md` 与本提示。

## 2. 唯一剩余账本

| 原子 ID | 失败事实 | 完成条件 | 反向断言 | 对象身份 | 最小充分证据 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|
| G9c1 | iteration-08 修改的 9 个 agent 测试和 1 个 notify 测试只完成 testCompile，未运行 | 从最终工作树机械枚举这 10 个被修改测试类并逐一实际执行；tests/failures/errors/skipped 与进程 exit 可回读，全部 0 failure/error | 不得漏类、以 testCompile 替代运行、或只运行同模块其他测试 | iteration-08 最终候选 `30fd54b2…` 或其仅含验证修正的后继；测试类必须与实际 diff 一致 | 一份工具生成的“修改测试文件→测试类→命令结果”清单，加 Maven 原始流与 exit；若零代码改动，可沿用 G6c1a/G9 指纹底证 | 运行 10 个聚焦测试；失败则仅处理过滤器依赖适配的直接问题并重跑 | 真实构建工具不可用且替代路径穷尽时按契约登记 |
| G8 | 三 Provider 官方成功链未执行 | 三 Provider 逐一完成方向 #11 全链 | 解绑后拒绝与 Provider 失败恢复，秘密零残留 | 官方测试应用、HTTPS 回调域、可控身份 | 每 Provider 真实浏览器/HTTP/绑定/会话/审计结果 | 条件到位后补证；未到位保持 PENDING | 外部条件仍缺，`dependency_satisfied=false` |

## 3. 锁定与禁止重验

G6c1a、G6c1、G3b2、G6a1、G6b1，以及审查 05 的全部锁定项禁止重验。G9c1 只运行 iteration-08 实际修改的 10 个测试类，不扩大为模块全量，也不重建业务证据。

## 4. 允许范围与顺序

| 维度 | 范围 |
|---|---|
| 允许读取 | I5 方向、审查 08、本提示、iteration-08 回执/G9 证据、实际 Git diff 和对应测试配置 |
| 允许修改 | 默认零代码修改；仅测试真实失败时，允许修复过滤器新增依赖导致的直接装配问题；追加 iteration-09 与 `evidence/i5-09/` |
| 允许命令 | Git diff 文件枚举、10 个聚焦 Maven 测试、候选指纹和去重 manifest 回读 |
| 顺序 | 工具枚举 10 文件 → 映射测试类 → 一次或按模块运行 → 汇总原始结果 → 若改代码则重跑受影响类 → 指纹/manifest → 回执 |
| 禁止 | 重验锁定项、只做 testCompile、修改业务方向、开始 I6/小程序、写 PASSED/COMPLETED、推送 |

## 5. 相对提示 06 的变化

- **删除**：删除已经通过的 G6c1a 行为序列与 JWT 修复工作。
- **原子化**：只保留 10 个实际修改测试类的执行结果，不要求模块全量。
- **替代路径**：允许按模块分组运行，但必须逐类勾稽；testCompile 没有替代资格。
- **提交条件**：10/10 测试类实际执行且零 failure/error，最终候选和去重 manifest 一致；G8 可继续 PENDING。

## 6. 证据与终态门禁

回执只保留 `G9c1 → 文件/类清单 → 原始结果 → 边界`。提交前确认：

- [ ] 10 个文件由最终 diff 工具枚举，未手抄漏项？
- [ ] 10 个测试类全部实际运行，不是 testCompile？
- [ ] 汇总计数与 Maven 原始输出逐字一致，exit=0？
- [ ] 若发生修正，失败反证、重跑和新候选指纹均保留？
- [ ] manifest 去重并 verify exit 0？
- [ ] G8 条件仍缺时保持 PENDING，`remaining_actionable_count` 与 G9c1 真实状态一致？

完成 G9c1 后即可提交 iteration-09；I5 仍由 Planner 根据 G8 决定是否继续 VERIFYING。
