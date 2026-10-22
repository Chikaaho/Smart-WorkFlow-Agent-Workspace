# T020 已认领动作的身份与租约

2026-10-23｜Executor｜XL｜IN_PROGRESS

七阶段：需求评估完成；分支实施进行中；验收同步、合并、发布、发布后同步、结束未开始。承接 `t020-work-admission-05.md` 的消费者窗口，不代表 A08 或整版验收完成。

## 实施

BPM 生产消费者先回读当前持久租约，核对 PROCESSING、claimToken、租户和发起人。租约不匹配直接跳过旧消费者，不装载身份、不执行 Handler、不调用失败补偿。有效租约再通过明确的已认领身份契约回查用户启停、归属、角色和最新权限，保留这一次认领的租户准入结果；P0 消费仍实时校验专用权限。

普通 HTTP、登录、刷新和缓存装载沿原实时租户有效性机制；已认领身份不写登录缓存，也不对外提供 HTTP 入口。security SPI 的兼容实现仍走普通权威装载并核对用户/租户；生产实现只对已经由消费者验证租约的单次动作保留准入结果。用户被停用、归属不匹配或权限撤回仍拒绝。

## 验证

`tenant-claimed-identity`：缓存与 SPI 回归 5、身份范围 14、消费者与 P0 优先 11、实际 H2/隔离 PG 新增 2，共 32 用例，零失败、零错误、零跳过，BUILD SUCCESS。H2/PG 通过真实队列认领后再将租户停用，实际 Dispatcher、权威身份实现和受控 Handler 持原用户/租户完成该 commandId；随后普通身份装载仍拒绝。错误租户和已停用用户也不能取得已认领身份。受控 Handler 仅核对身份并返回测试结果，不冒称真实业务审批链。数据库用例 18.08 秒。

新增旧租约单测证明不回查身份、不执行或补偿；P0 撤权反例继续通过。随后 SPI 增加空归属和错误用户防御，`tenant-iot-and-identity` 中兼容契约 6、消费者 9 再次通过，相关 IoT 20 用例也通过，BUILD SUCCESS。原文在 `C:/Users/hjxch/.codex/evidence-020/tenant-identity/tenant-claimed-identity.log`、`tenant-iot-and-identity.log` 及结果文件；MAVEN_OPTS=-Xmx2g，无前后端重任务并发。

Server `6ee2756d9083465059b8f71c8e72ffcb9cd15d3c`，6 文件、126 insertions / 3 deletions，已普通推送。范围为 UserDetailsProvider SPI、System 身份实现、Dispatcher、两个相关测试类和 bootstrap 数据库验证。Web 保持 `dd29316`。IoT 接入仍在未提交工作树中，不计入本提交。

## 继续

IoT 预约/发送/补偿与触发、通知与回调、BPM 时限准入、启停/过期审计继续实施；随后 F020/J020/W020 和全局 U020。A03 整体及 A08 未通过，功能数、P 核销和正式验证基线保持。
