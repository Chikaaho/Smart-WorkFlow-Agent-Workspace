# P60 I5 三级继续收敛执行提示 04

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-14  
> 当前状态：P60=IN_PROGRESS，I5=VERIFYING  
> 下一回执：`stage-i5-v0.0.3-oa-iteration-06.md`

## 1. 唯一入口与替代关系

本提示替代 `planning-execution-prompt-stage-i5-tenant-safe-sso-03.md`，是当前唯一执行入口。提示 03 及更早提示/回执只作追溯，不同时作为待办。

权威输入仅为正式 I5 方向、`planning-review-stage-i5-v0.0.3-oa-iteration-05.md`、本提示，以及审查 05 明确锁定的 iteration-05 证据。方向与授权边界不变。

## 2. 唯一剩余账本

| 原子 ID | 失败事实 | 完成条件（正向） | 必要反向断言 | 固定对象 | 最小充分证据 | 允许替代 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|---|
| G3b2 | 只有全禁用正向及 WECOM-missing、FEISHU-placeholder、DINGTALK-missing | WECOM/FEISHU/DINGTALK 各自在 `enabled=true`、语法有效且非真实秘密的测试配置下通过配置门并启动 | 每 Provider 分别以 missing、placeholder 两个独立进程 fail-fast；共六个负向，首因是该 Provider 配置门，日志不含配置原值 | 与 iteration-05 相同 prod profile、真实 PG、最终 jar；每进程只改变目标 Provider 配置 | 三个有效正向进程 + 六个负向进程的命令摘要、exit、首因、health（正向）及原值零命中扫描 | 若同一“全启用有效配置”进程能逐 Provider 回读 enabled 且健康成功，可替代三个正向进程；六个负向不得合并 | 补齐矩阵后生成一份新的 G3b2 原始包 | 仅真实进程/PG 工具不可用且替代路径穷尽时按契约登记 |
| G6a1 | PG 并发结论成立，但无 session/cache before/after | 沿用同一类两租户同主体 barrier，并明确回读成功/失败双方均未因 `bind` 直接创建会话 | session/cache 总数及两 user 的键/行在并发前后均不增；失败方仍是业务冲突而非 500 | tenant 0/user 1、tenant 100/user 9001、同 Provider/subject digest、真实 PG；真实 session 存储 | iteration-05 G6a1 可作为并发/绑定/role/audit底证；仅补一次真实 session/cache 前后回读及与该并发批次的时间/对象关联 | 可使用真实 Redis key/TTL 回读或项目实际权威 session 持久层；不得用 mock 调用次数或代码说明 | 在不重跑无关场景的前提下补 session 零增量证据 | session 存储真实不可访问且安全替代穷尽时按契约登记 |
| G6b1 | 缺过期租户和解绑后的既有会话收敛 | 有效绑定会话建立后，分别证明租户过期与解绑会触发既有会话在下一次权威装载时拒绝；停用链可引用 iteration-05 | 过期后新票据/refresh/权威装载拒绝且 session 清理；解绑后原会话权威装载拒绝且 role 表不增 | tenant 100、同一绑定用户/Provider、同一真实 Redis 与受控票据边界；若测试内存库重建需登记新 binding/user ID | 带时间顺序的真实 HTTP、tenant/binding SQL、Redis session before/after；只需新增过期与解绑会话两段 | “解绑后重新经真实 Provider 回调登录”归 G8，不在本项强求；本项只验既有会话收敛 | 扩充或重取 G6b1，保留 iteration-05 已通过子链指针 | 仅环境无法建立可控过期/解绑时间序列且替代穷尽时按契约登记 |
| G8 | 三 Provider 官方成功链未执行 | 企业微信、飞书、钉钉逐一完成方向 #11 全链 | 解绑后拒绝、Provider 失败恢复，秘密零残留 | 官方测试应用、HTTPS 回调域、可控身份 | 每 Provider 真实浏览器/HTTP/审计/绑定会话结果 | 无；受控对端不能替代 | 外部条件到位后补证；未到位保持 PENDING | 三项外部条件仍未提供，`dependency_satisfied=false` |

## 3. 锁定项与禁止重验

审查 05 已锁定 G1、G2、G3b1、G4、G5 本地/受控边界、G7、G9，以及 G6a1/G6b1 已通过子断言。禁止重跑或重写这些证据。只有 G3/G6 实现发生变化并确实触及锁定路径时，才运行相称的受影响回归并写明失效依据；纯补证不重跑全量门禁。

验收标准 #8 继续永久锁定于本阶段；G8 不得用无效凭据的官方失败响应、SDK 初始化或本地票据冒充真实成功链。

## 4. 对象与生命周期

- G3b2 每个负向进程只改变目标 Provider 的一个失败条件；进程日志标记 Provider/场景/exit，但不得写配置原值。
- G6a1 的 session 回读必须与并发批次建立同一时间窗和 user 关联；不能以另一次普通登录的“无新增”替代。
- G6b1 先建立绑定与会话，再改变租户权威状态或解绑，再触发权威装载并回读清理；不得倒置生命周期。
- 内存对象已销毁时可新建隔离对象，但须登记旧→新 ID；不要求恢复 iteration-05 原对象。

## 5. 读取、修改、命令与顺序

| 维度 | 范围 |
|---|---|
| 允许读取 | I5 方向、审查 05、本提示、iteration-05 的 G3b2/G6a1/G6b1/G8/G9 证据，以及实现/工程配置 |
| 允许修改 | 仅确证缺陷所需的 Provider 配置门、绑定/会话路径、直接验证资产；追加 iteration-06 与 `evidence/i5-06/` |
| 允许命令 | 独立 prod 进程、真实 PG/Redis、隔离 HTTP、受影响测试、指纹与 manifest 校验 |
| 固定顺序 | 建立 i5-06 对象账本 → G3b2/G6a1/G6b1 逐项采集 → 若发现缺陷则修复并只重取受影响项 → 核对最终快照 → 生成回执与机器终态 |
| 禁止事项 | 修改历史证据/审查、重验锁定项、扩大到 I6/小程序、写 PASSED/COMPLETED、推送或写入真实秘密 |

## 6. 相对提示 03 的方法变化

- **删除**：删除提示 03 中已通过的 18 个原子包及全量门禁要求，只保留三项可执行缺口和 G8。
- **原子化**：G3b2 固定为 `3 正向 + 6 负向` 进程矩阵；G6a1 只补 session/cache 零增量；G6b1 只补过期与解绑会话收敛。
- **替代路径**：撤回有缺陷的 CLOB 直读要求；G2 按真实入口身份/对象冲突验收；G6b1 的真实 Provider 再登录明确留给 G8。
- **可判定提交条件**：G3b2 九格齐全（或文中允许的一次全启用正向替代三个正向）、G6a1 session 前后零增量、G6b1 两段时间序列均闭合；G8 未具备外部条件时保持 PENDING。

## 7. 证据包与提交门禁

每项仅写：`原子 ID → 原始文件/位置 → 实际结果 → 覆盖边界`，原始流单独保存。哈希、计数和 manifest 必须由工具生成并实际回读，声明工作目录；不得把测试类名或自述当结果。

提交前全部为“是”：

- [ ] G3b2 的正向和六个独立负向均有真实进程结果？
- [ ] G6a1 session/cache before/after 与同一并发对象关联且零增量？
- [ ] G6b1 过期租户、解绑后既有会话均在权威装载时拒绝并清理？
- [ ] 新实现若触及锁定路径，已运行相称的受影响回归且候选指纹一致？
- [ ] G8 未满足时仍为 PENDING、`dependency_satisfied=false`，未冒充成功？
- [ ] `ENGINE_TERMINAL` 与剩余账本、`remaining_actionable_count`、实际工具结果和浏览器状态一致？

任一可执行项为否时继续执行或按真实工具结果登记合法阻塞，不得提交虚假 `EXECUTION_SUBMITTED`。I5 保持 VERIFYING，Executor 不得进入阶段三。
