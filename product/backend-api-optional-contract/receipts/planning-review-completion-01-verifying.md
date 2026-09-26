# `backend-api-optional-contract` 完成回执 01 规划验收

> Planner · 2026-09-24  
> 审查对象：`completion-backend-api-optional-contract-01.md`、`completion-backend-api-optional-contract-evidence-supplement-01.md`、`stage-a-contract-ledger-01.md`、`evidence/completion-01/`  
> 结论：**`VERIFYING`（14 项锁定通过，标准 7 尚有一个同类残留集合；不得进入终态同步）**

## 1. 证据完整性复核

- 补充证据目录实际包含 27 个文件；`evidence.sha256` 的 25 个有效条目均可现场回读为 `OK`。清单含 5 行非 checksum 元数据而产生 warning，但有效条目无失败，不构成内容不一致。
- 行为输入记录为 312 个文件、312 OK / 0 FAILED；当前受验身份为 Server `develop`、HEAD `76dc947`、194 个 tracked 修改文件和 16 个 untracked 文件。
- 权威变更文件口径修正为 **210 个实际文件**（194 tracked + 16 untracked）；原回执的 204 是默认 `git status` 折叠后的 194 文件 + 10 目录条目，不再作为“实际文件数”。tracked shortstat 权威值为 194 files、+3124/−1736。
- 六组持久日志均记录命令、工作目录、起止时间和真实退出码：`test-compile` exit 0；守门 6/0/0/0；边界 8/0/0/0；system 13/0/0/0；notify 118/0/0/0；全量 Maven 1457/0/0/0，全部 `BUILD SUCCESS`。
- 守门反例实际报告非 Optional、raw、`Optional<Void>`、嵌套 Optional、公开 static 非 Optional 五类违规，合规夹具 0 误报，足以证明守门不是恒通过。
- 运行时发现前端长驻 dev 进程。执行层没有停止或操作该进程，后端命令串行且使用 2G 限额；本轮重新取证来自 Owner 当前明确要求，规划接受该次执行，不据此退回测试证据。

## 2. 方向 §7 验收矩阵

| 标准 | 裁决 | 锁定证据/差异 |
|---|---|---|
| 1. 121 个 AM ID 闭合 | PASSED | 机器复算 121 = 113 保留 + 8 删除，连续、唯一 |
| 2. 保留方法全部参数化 Optional，nullable 边界归零 | PASSED | 账本复算与架构守门双重得到 113 方法、0 违规 |
| 3. 24 个原 void 类型化 | PASSED | 无 `Optional<Void>`；5 个结果类型及语义账本闭合 |
| 4. 各返回类别与异常语义、Javadoc | PASSED | 禁止模式、边界测试与方法账本共同支持 |
| 5. AM-035/AM-062/TenantValidity | PASSED | 边界 8 项与 system 13 项行为测试通过 |
| 6. ZERO_CALLER 与 AM-120 | PASSED | 8 删除三层零可疑残留；5 个零调用项与 AM-120 保留迁移 |
| 7. 实现与调用方显式迁移 | **NOT PASSED** | `optional-consumer-scan.txt` 自身 exit 1；存在忽略 Optional 返回值的生产调用，见 G1 |
| 8. 集合/Map 两层语义 | PASSED | 上下文缺失与合法零结果有行为证据 |
| 9. boolean/数值 false/zero 与 empty | PASSED | 专项语义证据与哨兵扫描支持 |
| 10. 原 void 成功/缺失/幂等 | PASSED | 类型化结果与对应行为测试支持 |
| 11. Optional/Result 分层与 HTTP 边界 | PASSED | 嵌套结果与 HTTP Optional 均 0；既有边界映射有证据 |
| 12. 自动架构守门及反例 | PASSED | 6 项守门测试 + 五类实际反例消息 |
| 13. 受影响与全量门禁 | PASSED | 当前权威值 1457/0/0/0；原回执旧逐模块数字由补充回执更正 |
| 14. 前端/数据库/HTTP 非目标 | PASSED | 迁移目录、路由注解、前端及正式状态零漂移 |
| 15. 回滚、范围与远程边界 | PASSED | 回滚点、210 文件实际范围和无 Git 写/发布动作已记录 |

上述 14 项锁定。后续只有实现变化影响到相应输入时，才重验受影响项；不得重新展开已锁定的账本、删除项或方案讨论。

## 3. 唯一剩余缺口

### G1：生产调用方仍忽略 Optional 规范结果

**失败事实**：

- `optional-consumer-scan.txt` 报告 183 个生产调用点中存在被忽略的 Optional 返回值并以 exit 1 结束；
- AM-107 `DynamicBranchPort#recordAction` 在 `DynamicBranchTaskListener` 中可能返回 empty（分支尚未冻结），调用方完全未消费；
- 同一证据的原始输出实际列出 6 处忽略调用，而 D.1/摘要称 8 处，另提及 `delegateTask`、`resumeProcessInstance`、`validateSubmission`，当前清单计数不一致；
- “Javadoc 声明恒 present”不构成调用方豁免。方向 §1/§4.8 明确要求调用方显式处理 Optional，原 `void` 改造的结果也不能在消费端继续当作 void。

**完成条件**：

1. 先生成唯一、完整、可复算的忽略返回值清单，闭合 6/8 数量差异；
2. 所有实际忽略 Optional 的生产调用均显式处理结果：可能 empty 的方法必须处理 empty；恒 present 方法必须显式断言/消费其类型化结果，使契约违背时不能静默通过；
3. 不得用 `get()`、`orElse(null)`、哨兵、空集合或 catch 后 empty 规避处理；真实异常继续沿既有异常边界传播；
4. AM-107 至少提供 present、empty 两条调用方行为证据，证明未冻结分支不会被静默当作成功；
5. 更新后的消费者扫描必须以 exit 0 证明“忽略 Optional 返回值”的生产调用为 0；
6. 因代码输入会变化，重新保存受影响测试、`test-compile`、消费者扫描及后端全量 Maven 门禁的原始输出、退出码、精确计数与新输入/证据哈希。API 定义和 121 项处置不变时，无需重做账本探索。

## 4. 已接受的更正与非阻塞观察

- 测试逐模块权威计数以补充回执为准：System 305、BPM Engine 58、IoT 50、Agent 346，总计仍为 1457。
- 原回执 +3123/−1735 被补充证据更正为 +3124/−1736；这是固定输入时间点更正，不再作为缺口。
- `evidence.sha256` 与 `behavior-input.sha256` 的元数据行会触发 `sha256sum` 格式 warning，但有效条目分别 25/25、312/312 通过；后续清单宜将说明移出 checksum 文件，不要求因此单独返工。
- 远端引用观察与 Phase 1 功能验收无关；未 fetch/push，不在本轮裁决。

## 5. 下一提交边界

Executor 仅处理 G1，提交新回执 `product/backend-api-optional-contract/receipts/completion-backend-api-optional-contract-02.md` 和新的固定证据目录；不得覆盖 completion-01 证据，不得启动 BAO-01—BAO-10，不得写 `PASSED/COMPLETED`，不得执行 Git 写动作或发布。

这是 G1 的首次失败裁决，先按精确差异收敛，不下发升级版零裁量补充提示。下一轮若同类“忽略 Optional 返回值”仍存在，再按治理规则升级执行提示。
