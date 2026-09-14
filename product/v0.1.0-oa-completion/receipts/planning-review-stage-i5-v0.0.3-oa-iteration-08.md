# P60 I5 阶段实现规划验收 08：VERIFYING

> 验收角色：规划（Planner）  
> 日期：2026-09-14  
> 验收对象：`stage-i5-v0.0.3-oa-iteration-08.md`  
> 当前提示：`planning-execution-prompt-stage-i5-tenant-safe-sso-06.md`  
> 结论：**G6c1a 通过；最终候选门禁尚缺，I5 保持 VERIFYING**

## 1. G6c1a 验收结论

G6c1a 通过并锁定：

- 修复前反证证明同一签发秒的 A/B token 完全相同，原缺陷可复现。
- 修复后同一 user、同一签发秒 `iatA=iatB=1789346459`，但 `digestA=263c14c545df…`、`digestB=4c001b8abbb4…`，没有 sleep 或跨秒等待。
- A 解绑后立即建立 B；B 的 me、refresh、清缓存后的权威重载均成功。
- A 在 B 建立前、B 缓存存在时及 B 权威重载后始终 401；A/B 撤销摘要不混淆，role 零增量。
- `sw-security 17/0/0/0`、system-biz `295/0/0/0`、BootTest `4/4` 通过；6 项去重 manifest verify exit 0。

因此验收标准 #10 的局部失效已恢复锁定。除 G8 外，I5 的业务与安全验收标准均已有通过证据。

## 2. 最终候选门禁缺口

iteration-08 为适配 iteration-07 引入的 `JwtAuthenticationFilter` 构造器参数，修改了 9 个 agent 测试文件和 `NotifyTemplateSecurityIntegrationTest`。回执明确说明这些被修改的测试本轮只经过 `-am testCompile`，没有运行。

这不是 G6c1a 产品失败，但属于 G9 最终候选的可执行验证缺口：编译成功只能证明装配语法，不证明测试行为在新增撤销依赖后仍成立。依据“代码变化须运行受影响回归”，不能接受 `remaining_actionable_count=0`。

| 原子项 | 结论 | 事实 |
|---|---|---|
| G6c1a | PASSED（锁定） | 同秒唯一身份与解绑后 A/B 隔离真实闭合。 |
| G9c1 | 未验证 | 10 个已修改 agent/notify 测试仅 testCompile，未执行。 |
| G8 | PENDING（外部依赖） | 官方应用、HTTPS 回调域、可控测试身份仍未提供。 |
| G9 最终候选 | 部分锁定 | 指纹、已执行回归、manifest 成立；待 G9c1 后锁定当前独立候选。 |

## 3. 失败分类与边界

G9c1 属**缺行为验证**，不是产品缺陷或重复打回。只需运行这 10 个实际修改的测试类；不得重跑已锁定业务矩阵，也不要求全量 agent/notify 模块门禁。若测试失败，只修复与过滤器新依赖适配直接相关的实际问题并重跑失败类。

G8 继续为合法外部依赖。G9c1 完成后，如果 G8 条件仍未提供，I5 保持 VERIFYING 但独立工作可确认穷尽。

## 4. 下一动作

当前唯一执行入口改为 `planning-execution-prompt-stage-i5-tenant-safe-sso-07.md`。下一回执固定为 `stage-i5-v0.0.3-oa-iteration-09.md`，只处理 G9c1 与 G8。
