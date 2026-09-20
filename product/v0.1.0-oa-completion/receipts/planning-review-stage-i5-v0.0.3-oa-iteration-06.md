# P60 I5 阶段实现规划验收 06：VERIFYING

> 验收角色：规划（Planner）  
> 日期：2026-09-14  
> 验收对象：`stage-i5-v0.0.3-oa-iteration-06.md`  
> 当前提示：`planning-execution-prompt-stage-i5-tenant-safe-sso-04.md`  
> 结论：**原三项通过；新增受影响回归未闭合，I5 保持 VERIFYING**

## 1. 验收结论

提示 04 的三个可执行缺口均通过：

- G3b2：一个全启用正向进程健康成功并回读三个 Provider `enabled=1`；六个 missing/placeholder 负向进程均 exit 1，首因为 Provider 配置门，日志原值零命中。
- G6a1：同一 PostgreSQL barrier 批次前后真实 Redis 会话键均为 0，绑定成功侧和冲突侧均未生成会话。
- G6b1：过期租户的新票据、refresh、权威装载均拒绝；解绑后既有会话拒绝、缓存不重建、refresh 撤销、role 零增量成立。

manifest 11 项回读 exit 0；`SsoAuthServiceTest 22/22`、system-biz `295/0/0/0`、两 BootTest `5/5` 可采信。G8 仍为合法外部依赖。

但本轮为满足 G6b1 新增了 userId 级撤销标记，并修改 `LoginUserLoader`：标记只在缓存未命中时检查，同时回执声明新登录不受影响。现有证据只证明“解绑后、建立新会话前”的旧 token 被拒，未证明新会话建立或缓存重载后旧 token 不会复活，也未证明新会话不会被同一 userId 撤销标记误伤。该变化触及验收标准 #10 的第一方登录/refresh 既有契约与 §3.2 会话撤销边界，按快照失效规则必须补受影响行为证据，不能仅以模块测试计数锁定。

## 2. 核销与锁定

| 原子项 | 结论 | 事实 |
|---|---|---|
| G3b2 | PASSED（锁定） | 正向替代符合提示 04；六个独立负向及原始日志齐全。 |
| G6a1 | PASSED（锁定） | session/cache before/after 与同一并发对象和时间窗关联，零增量。 |
| G6b1 | PASSED（锁定既有断言） | 过期与解绑后的即时权威收敛均成立。 |
| G6c1（由 G6b1 新增拆分） | 未验证 | 缺“解绑旧 token A → 新第一方会话 B → B 缓存重载仍有效 → A/旧 refresh 始终拒绝”的同对象序列。 |
| G8 | PENDING（外部依赖） | 官方测试应用、HTTPS 回调域、可控测试身份仍未提供。 |
| G9 | 部分锁定 | 指纹与 manifest 成立；解绑实现触及的认证会话行为须由 G6c1 补齐后再锁定最终候选。 |

验收标准 #1—#9、#12、#13、#15—#17 继续锁定；#10 仅撤销此次实现触及的“解绑后新旧会话隔离”子断言，其他第一方契约继续锁定；#11 未通过；#14 本地边界锁定、真实 Provider 页面闭环随 #11 未完成。

## 3. 缺口分类

G6c1 属**新增实现导致快照局部失效 / 缺行为证据**。这不是对 G6b1 原要求的重复打回，也不预判产品一定失败；但按当前 userId 级共享缓存与仅缓存未命中检查的证据描述，存在旧 access token 在新登录填充缓存后复活、或新 token 在再次缓存未命中时被旧撤销标记误伤的可判定风险。

G8 继续为合法外部依赖，不计执行失败。

## 4. 下一动作

当前唯一执行入口改为 `planning-execution-prompt-stage-i5-tenant-safe-sso-05.md`。下一回执固定为 `stage-i5-v0.0.3-oa-iteration-07.md`，只处理 G6c1 与 G8；不得重验 G3b2、G6a1、G6b1 或其他锁定项。
