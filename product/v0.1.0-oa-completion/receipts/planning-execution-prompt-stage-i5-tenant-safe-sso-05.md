# P60 I5 三级继续收敛执行提示 05

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-14  
> 当前状态：P60=IN_PROGRESS，I5=VERIFYING  
> 下一回执：`stage-i5-v0.0.3-oa-iteration-07.md`

## 1. 唯一入口

本提示替代 `planning-execution-prompt-stage-i5-tenant-safe-sso-04.md`。旧提示与 iteration-01—06 仅供本提示明确引用的锁定证据追溯，不同时构成待办。

权威输入为正式 I5 方向、`planning-review-stage-i5-v0.0.3-oa-iteration-06.md` 和本提示。不改变产品方向或授权边界。

## 2. 唯一剩余账本

| 原子 ID | 失败事实 | 完成条件（正向） | 必要反向断言 | 固定对象 | 最小充分证据 | 允许替代 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|---|
| G6c1（G6b1 新增子项） | userId 级撤销标记与共享缓存新增后，未验证新登录/缓存重载不会复活旧 token 或误伤新 token | 同一 user 在解绑后可通过既有第一方登录建立新会话 B；B 的 access/refresh 成功，主动清除 B 的登录缓存后 B 仍可由权威装载恢复 | 解绑前的旧 access A、旧 refresh A 在 B 建立前、B 建立后、B 缓存重载后始终拒绝；A 不得借 B 的 userId 缓存恢复；B 不得被解绑 A 的撤销标记拒绝 | 同 tenant、同 user、同一次绑定；旧 access/refresh A 与新 access/refresh B 分别记录 digest；真实 HTTP、真实 Redis、权威账号/租户 | 一份时间顺序原始包：建立 A→解绑→A 拒绝→第一方登录 B→B 成功→A 再拒绝→清 B 缓存→B 权威装载成功→A 再拒绝；每步 HTTP、Redis key/marker、refresh 结果 | 若该测试用户无第一方密码，可创建同租户可第一方登录的隔离本地用户并绑定；不得用再次签发本地 SSO 票据替代第一方登录。真实 Provider 再登录仍归 G8 | 先运行该序列；若出现 A 复活或 B 被误伤，修复会话撤销隔离后只重取本包和相称认证回归 | 仅真实 HTTP/Redis/第一方夹具无法建立且安全替代穷尽时按契约登记 |
| G8 | 三 Provider 官方成功链未执行 | 三 Provider 逐一完成方向 #11 全链 | 解绑后拒绝与 Provider 失败恢复，秘密零残留 | 官方测试应用、HTTPS 回调域、可控身份 | 每 Provider 真实浏览器/HTTP/绑定/会话/审计结果 | 无 | 条件到位后补证；未到位保持 PENDING | 外部条件仍缺，`dependency_satisfied=false` |

## 3. 锁定项与禁止重验

G3b2、G6a1、G6b1 及审查 05 的全部锁定项禁止重验。G6c1 只验证本轮解绑实现新增的会话代际隔离；如果修复触及共享认证/refresh/cache 路径，只运行相称的认证模块回归与本序列，不重跑表单、流程、IoT、Provider 配置矩阵或浏览器入口。

## 4. 对象与生命周期

- A/B 必须属于同一 local user，但 token/refresh digest 必须不同且可勾稽。
- 先建立 A 和绑定，再解绑；B 必须通过第一方登录产生。不得改变顺序或用另一个用户的 B 替代。
- 清缓存只用于触发 B 的权威装载，不得删除撤销证据或 refresh 撤销状态；每次清理前后均回读真实 Redis。
- G8 外部对象未提供时不创建假对象、不写秘密。

## 5. 允许范围与顺序

| 维度 | 范围 |
|---|---|
| 允许读取 | I5 方向、审查 06、本提示、iteration-06 的 G6b1/G9 证据、相关认证/会话实现与工程配置 |
| 允许修改 | 仅 G6c1 确证缺陷所需的 session/token/cache/refresh/解绑路径及直接验证资产；追加 iteration-07 与 `evidence/i5-07/` |
| 允许命令 | 隔离 BootTest 或真实服务 HTTP、真实 Redis 回读、受影响认证回归、候选指纹与 manifest 校验 |
| 顺序 | 建立对象账本 → 原样运行 G6c1 序列 → 失败则保存反证并修复 → 重取 G6c1 → 相称回归 → 指纹/manifest → 回执 |
| 禁止 | 修改历史证据、重验锁定项、开始 I6/小程序、写 PASSED/COMPLETED、推送、把旧/新 token 明文写入 product |

## 6. 相对提示 04 的变化

- **删除**：删除已通过的 G3b2、G6a1、G6b1 三项工作，只保留新增 G6c1 与外部 G8。
- **原子化**：把解绑即时收敛与“新会话建立后的代际隔离”拆开；前者已锁定，后者固定为 A/B 单用户时间序列。
- **替代路径**：G6c1 使用第一方登录验证，不等待 G8；真实 Provider 再登录仍不作替代。
- **提交条件**：B 在缓存命中与权威重载均有效，A/旧 refresh 在三个检查点始终无效，且相称回归与候选指纹一致；G8 可继续 PENDING。

## 7. 证据与终态门禁

证据包只写 `原子 ID → 原始文件/位置 → 实际结果 → 覆盖边界`，token/refresh 只保存不可逆 digest。提交前逐项确认：

- [ ] A 与 B 同 user、不同 token digest，生命周期顺序无替换？
- [ ] B 登录后及缓存重载后均能访问和 refresh？
- [ ] A access/refresh 在 B 前、B 后、B 重载后均拒绝？
- [ ] Redis cache/marker/revocation 的每一步有真实回读，且无 token 明文？
- [ ] 若修复实现，受影响认证回归通过且证据绑定最终候选？
- [ ] G8 条件仍缺时保持 PENDING，机器终态与账本一致？

可执行项未闭合时继续执行或按真实工具结果报告合法阻塞。I5 保持 VERIFYING，Executor 不得进入阶段三。
