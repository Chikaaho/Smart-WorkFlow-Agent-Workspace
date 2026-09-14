# P60 I5 三级继续收敛执行提示 06

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-14  
> 当前状态：P60=IN_PROGRESS，I5=VERIFYING  
> 下一回执：`stage-i5-v0.0.3-oa-iteration-08.md`

## 1. 唯一入口

本提示替代 `planning-execution-prompt-stage-i5-tenant-safe-sso-05.md`。旧提示和 iteration-01—07 只作锁定证据追溯，不同时构成待办。

权威输入为正式 I5 方向、`planning-review-stage-i5-v0.0.3-oa-iteration-07.md` 与本提示。提示 05 已授权 session/token/cache/refresh/解绑路径；同秒 token 唯一性属于该授权目标内的确证缺陷，不因涉及 JWT claim 而转为范围外。

## 2. 唯一剩余账本

| 原子 ID | 失败事实 | 完成条件（正向） | 必要反向断言 | 固定对象 | 最小充分证据 | 允许替代 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|---|
| G6c1a | 同一秒内同用户 A/B 登录产生相同 token；解绑撤销 A 后立即登录的 B 被误伤 | 无人为等待地在同一秒内为同一 user 建立两代不同 access token；解绑 A 后立即第一方登录 B，B 的 me/refresh 与缓存重载均成功 | A 的 me/refresh 在 B 建立前后及 B 缓存重载后始终拒绝；B 不得命中 A 的撤销摘要；不得靠 sleep、等待跨秒、延后重试或缩短撤销 TTL 通过 | tenant 100、同一 local user/绑定；A/B 分别记录不可逆 digest 与可判定唯一会话标识；真实 HTTP、Redis、refresh 存储 | 一份同秒原始序列：记录 A/B 签发时间秒相同且 digest 不同；A→解绑→立即 B→B 成功→A 持续拒绝→清 B 缓存→B 权威恢复；Redis/refresh/role 前后回读 | 可用 `jti`、会话版本或等价不可预测唯一 claim；不指定实现。测试可使用可控时钟固定同一秒，但登录/过滤器/Redis/refresh 必须走真实应用链，不得只测 JwtUtil 单元方法 | 先保留同秒失败反证，修复后重取本包并运行相称认证回归 | 只有真实运行工具不可用且替代路径穷尽时按契约登记；产品缺陷本身不是外部阻塞 |
| G8 | 三 Provider 官方成功链未执行 | 三 Provider 逐一完成方向 #11 全链 | 解绑后拒绝与 Provider 失败恢复，秘密零残留 | 官方测试应用、HTTPS 回调域、可控身份 | 每 Provider 真实浏览器/HTTP/绑定/会话/审计结果 | 无 | 条件到位后补证；未到位保持 PENDING | 外部条件仍缺，`dependency_satisfied=false` |

## 3. 锁定项与禁止重验

提示 05 中 digest 不同的跨秒 A/B 子链锁定；G3b2、G6a1、G6b1 及审查 05 的全部锁定项继续禁止重验。G6c1a 只针对同秒 token 唯一性与解绑后的新旧会话隔离。

若修复触及 JWT 签发/解析或认证过滤器，运行对应聚焦测试、system-biz/实际承载安全模块的相称回归及 G6c1a 真实序列；不重跑表单、流程、IoT、Provider 矩阵或浏览器入口。

## 4. 对象与生命周期

- A/B 必须同 user、签发落在同一秒且 token digest 不同；证据不可通过等待制造差异。
- 先用 A 解绑并确认 A 被撤销，再立即用第一方登录建立 B；不得先跨秒或替换用户。
- 清 B 缓存只触发 B 权威装载，不得删除 A 的撤销标记。
- 若增加唯一 claim，证据只记录 claim 是否存在、是否不同及其不可逆摘要，不把完整 token 写入 product。

## 5. 允许范围与执行顺序

| 维度 | 范围 |
|---|---|
| 允许读取 | I5 方向、审查 07、本提示、iteration-07 的 G6c1/G9 证据、相关 JWT/认证/session/cache/refresh/解绑实现与工程配置 |
| 允许修改 | 仅 G6c1a 所需的 token 唯一性、撤销隔离、直接验证资产；追加 iteration-08 与 `evidence/i5-08/` |
| 允许命令 | 真实 HTTP/Redis/数据库序列、可控时钟运行、聚焦及受影响模块回归、候选指纹与 manifest 校验 |
| 顺序 | 对象账本 → 无等待同秒失败重现 → 修复 → 同秒完整序列 → 相称回归 → 唯一清单/指纹回读 → 回执 |
| 禁止 | sleep/跨秒规避、缩短安全窗口、修改历史证据、重验锁定项、开始 I6/小程序、写 PASSED/COMPLETED、推送、token 明文落盘 |

## 6. 相对提示 05 的变化

- **删除**：删除已通过的跨秒 G6c1 主体，只保留其主动披露的同秒失败。
- **原子化**：将 G6c1a 固定为“相同签发秒、不同 token 身份、A 撤销、B 立即可用”的单一序列。
- **替代路径**：允许固定时钟稳定制造同秒条件；禁止等待跨秒。唯一 claim 的实现方案由 Executor 在授权范围内选择。
- **提交条件**：A/B 同秒且 digest 不同，B 全链有效，A 全程拒绝，安全回归和最终候选一致；G8 可继续 PENDING。

## 7. 证据与终态门禁

证据包只保留 `原子 ID → 原始文件/位置 → 实际结果 → 覆盖边界`，完整 token、refresh 与秘密不得进入 product。manifest 输入列表须去重并回读。

提交前全部为“是”：

- [ ] A/B 为同一 user、同一签发秒、不同 digest，且没有 sleep/跨秒规避？
- [ ] B 的 access/refresh 与缓存权威重载均成功？
- [ ] A 的 access/refresh 在所有检查点始终拒绝？
- [ ] A 撤销标记与 B 身份不混淆，role/权限无新增？
- [ ] 受影响认证回归通过，证据与最终候选指纹一致？
- [ ] manifest 无重复项且 verify exit 0？
- [ ] G8 未满足时保持 PENDING，机器终态与账本一致？

G6c1a 未闭合时不得提交完成声明。I5 保持 VERIFYING，Executor 不得进入阶段三。
