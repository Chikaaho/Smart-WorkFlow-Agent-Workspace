# 0.2.3 Agent 执行生命周期实施方案回执 01

2026-11-05｜Executor｜XL｜实施承接。依据 `product/0.2.3/ready/direction-023-agent-execution-lifecycle.md` 连续实施；本回执只确认承接、前置收口和工程方案，不表示业务实现完成。

## 工程起点

- Workspace：`develop-sw`，本地与 `origin/develop-sw` 均为 `b4ffbffd0e9a56f9e96574f10aa232765425613a`。
- Server：`feature/023-agent-execution-lifecycle`，本地与远端均为 `2d81f3fe9bc7290b20caaa3cbfbd6113b3f5e25f`；该分支从已核实的 `develop` 建立。
- Web：`feature/023-agent-execution-lifecycle`，本地与远端均为 `9dd7e7b0d047330d6230313d35bc7481cc336345`；`vite.config.ts` 是用户在途改动，保持未暂存。
- 工作区 `.tmp-a03-schema.json`、`.zcode/plans/` 和 search 目录材料不属于本批，不暂存。

## 前置清单收口

权威值保持：正式功能 50；M 59/18/13=90；ADV 1/7/56=64；实际 P63；已核销 P2/P4/P9/P15/P19/P29/P34/P47/P65；P35 部分；问题 57；正式验证基线不变。`knowledge/current-status.md` 和 `knowledge/session-handoff.md` 已优先切换到 0.2.3 正式方向、七阶段 1/1/5 和 Executor 实施下一动作；Planner 在途 memory/todo/product 文件归入此前已批准裁决的当前路由收口。P20 不核销。

## 实施决策与内部批次

1. **受理与持久状态（A01/A02/A04/A05/A06）**：在现有执行记录上增加稳定幂等身份、发起人、队列/取消状态与恢复字段；受理事务先落库，再由有界执行器领取。状态更新使用条件更新保证单终态；排队容量和租户并发均有上限。
2. **事件与增量（A03）**：执行事件按 `executionId + sequence` 持久化，SSE 以最后序号续传；节点状态、文本增量、快照和终态使用同一有序事件流。断线只断订阅，不取消或重启执行。
3. **三格式模型路径（A03/A07）**：为 OPENAI_CHAT、OPENAI_RESPONSES、ANTHROPIC 装配真实 streaming client；增量直接来自供应商协议回调并聚合为最终文本。已输出后不做 429 换 Key 重放；无输出时才允许沿既有冷却策略选择候选。
4. **取消、超时和调试（A04/A05/A07）**：解释器在节点调度和工具调用前检查取消令牌；运行中取消先进入 `CANCEL_REQUESTED`，确认执行线程退出后才写 `CANCELLED`。服务重启将无法证明安全续跑的在途记录标为 `INTERRUPTED`，排队记录可重新领取。调试 stop 复用相同停止检查。
5. **Web（A08）**：现有图执行入口改异步提交，详情页订阅 SSE 并按序去重；支持取消、刷新回查、快照补取和终态展示，不新建聊天产品。
6. **验证与提交**：核心、流式兼容、Web 分为内聚批次；各批聚焦验证后提交推送并回读远端 SHA。最终执行 Server 全量 compile/test、Web 四连、真实 API、有界可控三格式对端与至少一条可用真实供应商增量链；正式 UI 使用用户可见 headed 浏览器，保存 URL、视口、身份、对象、截图和网络索引。

## 偏差与风险

现有同步执行包在长事务内运行，需拆分受理事务和执行事务；现有 LangChain4j 装配只有同步 `ChatModel`，三格式 streaming 需要新增装配接缝。真实供应商证据取决于现有已授权配置是否可用；不会读取或外传密钥。无法取得时只报告该证据缺口，继续所有独立验证。

## 整体进度

总 7 阶段：已完成 1（需求评估）；进行中 1（实施）；未开始 5（验收同步、feature→develop→main、发布 0.2.3、发布后同步、结束）。前置收口不代表 0.2.3 实施完成。业务自验完成后的下一动作是 Planner 独立验收。
