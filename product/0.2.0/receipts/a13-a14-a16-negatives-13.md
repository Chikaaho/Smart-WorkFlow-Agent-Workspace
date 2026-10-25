# 0.2.0 统一执行·批次 12（A13 监听运行时＋A14 入口/暂存/废弃＋A16 必要负向；含挂起阻断缺口修复）

2026-10-25｜Executor｜PG dev 环境（同稳定对象：流程 bpm_3e373530637b4888 / 表单 a11_events_probe）；Server `d0b0186..a8fff47`

## A13 统一监听·发布版本运行时（补 j020-a13-unified-listeners-02 的浏览器/运行缺口）

- 触发器 `tg_a13_marker`（PROCESS_START，脚本 `设置流程变量('a13_marker','v2-fired')`）：**启用版发布→新实例恰好一条变量效果**（act_ru_variable 直读 `8675b19d|a13_marker|v2-fired`，单次无重复）；**停用版发布→新实例零效果**（`5f6faae4` 无该变量）；旧实例快照不变。口径注记：触发器 `variables` 是授权读取清单（须 varId 且定义在图级 variables，source ∈ MAIN_FORM/NODE_FORM/SYSTEM 白名单）；脚本 `设置流程变量` 写引擎变量无需声明——三次 2435 拒绝（名称 vs varId、TEXT 类型、SYSTEM 白名单）均为校验器如实拦截，最终以空授权清单+脚本直写达成。
- 既有锁定的单测语义（禁用监听零执行、旧配置默认启用）在本轮运行态得到同向印证。

## A14 入口与暂存（浏览器可见会话＋PG 直读）

- **暂存→恢复→完成**：详情弹窗填备注→「审核意见已暂存」→关闭重开**备注原文恢复**（`A14暂存恢复验证备注`）→同意→「已通过」→实例 `9cfd4cfd` **APPROVED**（PG 直读）。截图 `a14-draft-recovery-1920.png`。更多菜单（转办/委托/沟通/加签）入口在弹窗保留（A15 批次深入）。
- **版本挂起/激活**：`versions/{v}/suspend|activate` 均 200；**挂起阻断缺口实锤并修复**（见下）；激活后提交恢复正常发起。
- **废弃**：RUNNING 实例 `POST /instances/{pid}/discard` → PG status=**DISCARDED**。

## 挂起阻断缺口修复（Server `a8fff47`，bpm-engine 177/0）

- **实锤**：挂起窗口内（等待 5s）新提交仍真实发起成功——Flowable 部署缓存不反映挂起态，`startProcessInstanceByKeyAndTenantId` 绕过 `isSuspended` 检查。
- **修复**：`BpmRuntimeFacadeImpl.startProcess` 前置 DB 权威状态闸门（latestVersion().singleResult().isSuspended() → WARN + 空返回=目标缺失语义，表单数据已落库）；激活后既有命令重试机制自动恢复发起。
- **修复后实证**：挂起窗口内两次尝试均被拦（`BPM process start blocked by suspended definition` WARN×2），激活后同一命令恢复发起成功——挂起真实生效、恢复语义干净。

## A16 必要负向（同稳定对象）

- **跨用户实例不可见**：nobody 直读 admin 实例对象 → **403「无权查看该流程实例」**；nobody 我发起的列表 0 行（对象归属过滤）。
- **终态/重放不可重复生效**：重复完成已审批任务 → 「审批命令幂等命中: key=TASK_APPROVE:{taskId}:9001」——同身份重放命中原命令 ID，零第二效果，实例保持 APPROVED。
- **无权审批**：nobody 对 admin 活动任务提交审批 → 受理后执行段 **「无权处理该任务」** → 有界重试（5 次）→ **命令终态失败**，任务保持原待办、零越权效果（受理-执行两段制下的真实拒绝链）。

## 边界与剩余

- A13「失败/重投递结果」以命令队列既有重试/终态失败机制承接（本轮挂起-恢复链已演示）；A15 加签、A12 函数目录、A16 跨租户负向（当前 devseed 无第二活跃租户可用身份，t200admin 租户停用登录即拒）归后续批次。
- 本批零 Web 改动；Server 提交仅挂起闸门（BpmRuntimeFacadeImpl＋测试构造）。

## 服务收尾

- 后端（8080）与前端（5175）按监听进程树终止、端口回读不可达；PG/Redis 容器保持。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
