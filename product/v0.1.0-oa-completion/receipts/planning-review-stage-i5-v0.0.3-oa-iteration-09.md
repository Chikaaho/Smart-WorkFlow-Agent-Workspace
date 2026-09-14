# P60 I5 阶段实现规划验收 09：VERIFYING / WAIT_EXTERNAL_G8

> 验收角色：规划（Planner）  
> 日期：2026-09-14  
> 验收对象：`stage-i5-v0.0.3-oa-iteration-09.md`  
> 当前提示：`planning-execution-prompt-stage-i5-tenant-safe-sso-07.md`  
> 结论：**G9c1 通过；独立工作全部锁定，仅 G8 外部依赖未完成**

## 1. G9c1 验收

G9c1 通过并锁定：

- `git diff --name-only HEAD` 枚举的 10 个实际修改测试文件与对象账本逐项一致。
- 9 个 agent 测试类全部实际运行，逐类计数合计 `104/0/0/0`，BUILD SUCCESS、exit 0。
- `NotifyTemplateSecurityIntegrationTest` 实际运行 `12/0/0/0`，BUILD SUCCESS、exit 0。
- 本轮零代码修改；`git write-tree=30fd54b2a7ddab4addeb9e30cbe0a2fae9ee7b91`，与 iteration-08 候选一致。
- 4 项去重 manifest 均 OK，verify exit 0。

因此 G9 最终候选锁定。iteration-09 的 `remaining_actionable_count=0` 与当前独立工作事实一致。

## 2. I5 总体裁决

I5 **暂不 PASSED，保持 VERIFYING**。17 项验收标准中：

- #1—#10、#12、#13、#15—#17：PASSED 并锁定。
- #14：PC/移动本地页面、普通会话、错误安全态已锁定；真实 Provider 登录/绑定/解绑页面闭环随 G8 未完成。
- #11 / G8：PENDING。企业微信、飞书、钉钉仍缺官方测试应用、HTTPS 回调白名单域和可控测试身份，未完成各自真实授权、回调换票、绑定、已绑定登录、解绑后拒绝和 Provider 失败恢复。

所有不依赖外部条件的代码、数据库、安全、HTTP、浏览器、回归和候选证据均已穷尽并锁定。缺少 G8 不允许虚构完成，也不应继续重验已通过项。

## 3. 当前停止与恢复条件

当前为外部条件等待，不是执行层可操作缺口。恢复条件为 Owner/环境为三 Provider 分别提供：

1. 官方测试应用及安全注入的凭据；
2. 可用 HTTPS 回调域并完成官方白名单配置；
3. 可控测试身份。

条件到位后，只执行 G8 三 Provider 真实成功链与直接受影响的最终候选核对，提交 `stage-i5-v0.0.3-oa-iteration-10.md`。若 Owner 要求免验或改变 #11，必须由 Owner 对该验收标准作明确例外裁决；Planner 不自行降级。

## 4. 当前唯一入口

G8 恢复入口为 `planning-execution-prompt-stage-i5-tenant-safe-sso-08.md`。在外部条件到位前不得启动新一轮执行，也不得开始 I6、归档 I5 或进入阶段三。
