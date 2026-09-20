# ZCode 能力矩阵（2026-09-16）

## 本机基线

- ZCode Desktop：`3.11.2.6792`，Electron `41.0.3`。
- ZCode runtime CLI：`0.16.5`，入口 `F:\soft\zcode\resources\glm\zcode.cjs`。
- 工作区：`E:\code\Smart-WorkFlow-Agent-Workspace`。
- 本方向真实会话：`sess_216aa7b3-4cf4-4122-a077-8da0cddd68a7`；由 app-server `session/list` 在规范化工作区内唯一匹配，非子代理会话。

## 能力结论

| 集成面 | 实测 | 保证等级 | 采用结论 |
|---|---|---|---|
| Desktop 公开 CLI 参数 | `--resume <sessionId>`、`--json`、`app-server --stdio` 存在 | 结构化 | 可作为启动/恢复入口 |
| app-server `session/list` | 反斜杠工作区查询返回 24 个主会话；正斜杠同路径返回空集 | 结构化、版本相关 | Adapter 统一 Windows 规范路径并过滤 `sess_subagent_*` |
| `session/resume` + `session/read` | 对本方向 session 成功；snapshot hash=`cef652be…15a54` | 结构化回读 | 可证明 workspace/session 精确绑定与冷恢复 |
| `session/subscribe` + turn events | 0.16.5 协议要求 `deliveryKind=desktop-continuous`；Adapter 已实现 `turn.started` 与 terminal event 配对 | 结构化、待真实发送闭环 | 不依赖 GUI 焦点 |
| `session/send` | 对本方向 session 返回 `-32031`；只读状态显示会话模型 `openai/gpt-5.6-sol`，新 app-server 的 `modelCatalog.available/providers` 均为空 | 真实失败结果 | 不读取/复制凭据，不擅自切换模型；待可信 provider broker 或宿主现有连接暴露 |
| Server 反向请求 | `session/requestRuntimePreferences` 必须应答；Adapter 使用三项 `false`；未知交互、权限与浏览器请求 fail closed | 结构化 | 已实现并有单元测试 |
| Desktop UI Automation | 当前 Codex CUA 只暴露浏览器，原生 `getApp` 不可调用 | 能力不可用 | 不采用坐标点击，不降级猜测线程 |
| 多窗口误投防护 | Adapter 在发送前重新 `session/list`，要求 session ID 唯一且 workspace 精确一致；事件回读要求每条 `sessionId` 相同 | 结构化静态/单元证据 | 逻辑已实现；两个真实可见窗口负向证据未完成 |

## 最强可用路径

选择 ZCode 0.16.5 `app-server --stdio` 结构化路径。其 session ID、workspace、事件序列和发送回读能力强于 GUI Automation；GUI 不作为当前正式实现。`.codex/governance/zcode-host-adapter.py` 负责协议，`.codex/governance/zcode-adapter.ps1` 只转发 Supervisor 决策并核对目标。

发送功能保持 fail closed：只有 Supervisor 决策为 `reinject/replan`、`send_required=true`，且 target host/workspace/thread 与参数完全相同，Adapter 才调用 `session/send`。当前真实会话因 app-server 未获得可用 provider 而未完成发送，不以读取 `credentials.json`、复制 API key 或改写模型配置绕过。

## 解除真实集成缺口的最小条件

满足任一项即可继续阶段 C 的真实回合验证：

1. ZCode Desktop 暴露其已连接 app-server 的受支持 IPC/扩展入口；或
2. 受治理启动器由用户明确授权的凭据代理向新 app-server 注入可用 provider（Adapter 本身不读取秘密）；或
3. 当前会话由 ZCode 正常选择一个可用模型后，结构化 app-server 能在不复制秘密的前提下恢复该 provider。

满足后仍需执行：十个工作项、连续五次 TURN_ENDED 自动恢复、两个真实窗口零误投、ZCode/Adapter 进程实际重启恢复，以及用户可见会话制品保存。
