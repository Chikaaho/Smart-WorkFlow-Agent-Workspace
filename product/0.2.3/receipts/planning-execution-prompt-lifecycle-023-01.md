# 0.2.3 实施验证继续执行提示 01

2026-11-05｜Planner。主方向仍为 product/0.2.3/ready/direction-023-agent-execution-lifecycle.md；本提示限定本轮剩余动作，不新立任务或search。依据同目录planning-review-lifecycle-023-01.md，原始输入为execution-submitted-023-04.md及01—03回执。

## 当前动作

先核对本分支构建与运行API身份，在授权本地环境受控加载当前候选或建立隔离验证实例。不得停止/替换用户既有服务、按端口批量杀进程或清理smart_workflow_f1v4b。仅在确需用户秘密、破坏性或授权外动作时请求具体授权；已有dev/test输入不是新确认门槛。验证任务按system.md具备有界量、观察、退出和自身资源清理。

先定位并保留已有测试原始输出；位置不在product下时可引用允许访问的持久位置或保存原输出，不因格式重跑。未覆盖的原方向行为继续取得；只修真实缺陷。

| 剩余ID | 允许对象与动作 | 最小充分结果 |
|---|---|---|
| LC023-01 | 当前候选异步API、执行存储、受控调度/取消/重启、原权限身份 | 同一执行受理/状态/终态回读；原A01/A02/A04/A05/A06正反向结果与必要副作用次数 |
| LC023-02 | 三种现有模型格式的流式客户端、可控对端、已授权真实供应商、事件续传与轮换 | 集成增量事件及最终文本、断线接续、部分输出错误/429行为；真实供应商链准确标层级 |
| LC023-03 | 当前候选Web和API的执行/记录入口 | headed提交→增量→取消或完成→刷新回查；身份、对象、请求和视觉结果对应 |
| LC023-04 | 同步兼容、调试stop、轮换/RAG/工具、受影响迁移与代理配置、已有测试输出 | 原方向受影响行为及门禁输出；全量失败与单类复验分列，给实际失败是否影响候选的依据 |

已锁定：清单M59/18/13、ADV1/7/56与9项P核销；历史业务验收不重做。当前没有A01—A08功能通过项，不能以提交或装配测试代替运行通过。不得扩成全仓审计、新聊天产品或无来源的测试要求。

追加完整回执到本目录，按剩余ID引用现有原文/结果即可，不要求独立证据包。进度保持整体7阶段1/1/5，实施尚未完成；功能验收前不得合并发布或标PASSED/COMPLETED。存在可执行项继续完成；真实阻塞提供工具结果、已尝试路径与独立工作已穷尽事实，沿原终态契约，不以旧服务未加载新API作为停止理由。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.3",
  "revision": 1,
  "previous_revision": 0,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.3/receipts/execution-submitted-023-04.md",
  "items": [
    {"origin_id":"LC023-01","subject":"核心生命周期与隔离运行证据","criterion":"A01/A02/A04/A05/A06","status":"OPEN","failed_rounds":1,"evidence":["execution-submitted-023-04.md:10-14","execution-backend-023-02.md:14-19"],"scope":{"targets":["候选异步API","执行状态","权限与恢复"],"allowed_actions":["加载隔离候选服务","取得真实请求和状态结果","修复原断言缺陷"],"forbidden_actions":["清用户库","停止用户服务","改产品范围"],"constraints":{"候选":"本分支实际API","证据":"同一执行身份"}},"acceptance":["原核心正反向有可复核结果"]},
    {"origin_id":"LC023-02","subject":"三格式流式与真实供应商","criterion":"A03/A07","status":"OPEN","failed_rounds":1,"evidence":["execution-submitted-023-04.md:14"],"scope":{"targets":["三格式streaming","事件接续","轮换"],"allowed_actions":["可控协议集成","现有授权供应商验证","修复真实差异"],"forbidden_actions":["读取或外传密钥","模拟结果冒充真实供应商"],"constraints":{"格式":"OPENAI_CHAT/OPENAI_RESPONSES/ANTHROPIC","真实链":"至少一条原授权链"}},"acceptance":["真实增量、接续及部分输出失败语义符合原方向"]},
    {"origin_id":"LC023-03","subject":"候选页面运行闭环","criterion":"A08/A02/A04","status":"OPEN","failed_rounds":1,"evidence":["execution-submitted-023-04.md:12-13"],"scope":{"targets":["图执行页面","执行记录"],"allowed_actions":["headed浏览器验证","绑定候选服务","修复原交互缺陷"],"forbidden_actions":["旧服务结果冒充候选通过","新增像素标准"],"constraints":{"headless":"false","链路":"提交/增量/取消或完成/刷新"}},"acceptance":["原方向用户链在当前候选实际通过"]},
    {"origin_id":"LC023-04","subject":"兼容与门禁证据","criterion":"A07/A08及方向第五节","status":"OPEN","failed_rounds":1,"evidence":["execution-backend-023-02.md:16-19","execution-web-023-03.md:8-14"],"scope":{"targets":["受影响兼容路径","现有测试原始结果"],"allowed_actions":["定位既有输出","仅补未验证行为","按工程门禁复验"],"forbidden_actions":["以单类复验改写全量失败","因文字位置重跑已过业务"],"constraints":{"范围":"原方向实际受影响模块"}},"acceptance":["完整结果可回读且证据层级真实"]}
  ]
}
```
