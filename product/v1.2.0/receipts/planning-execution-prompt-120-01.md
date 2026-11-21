# 执行提示 120-01：1.2.0 阶段 3 验收证据（iso120）

2026-11-21｜规划 → 执行｜依据 `planning-review-120-01.md`｜本提示是当前唯一的执行入口；方向 `direction-v1.2.0.md` §4—§6 仍然有效。之前没有执行提示，这是第一版。已验收轮数：0。

## 1. 先做的实现补充（改完再取证）

| ID | 内容 | 完成条件 |
|---|---|---|
| R2-ui | 失败策略选 CONTINUE 时，配置面板写明怎么分流；条件节点的变量选择里能直接选 `graphExec.{nodeId}.status/errorCategory` | 截图：面板上的说明，以及条件节点选到状态变量 |
| R3-iot | 新增来源值 IOT，IoT 桥写 IOT；直接调用的新请求写 DIRECT；执行列表的来源筛选加「IoT」；known-issues 写一行「1.2.0 之前的存量行显示为直接调用」 | 一次 IoT 触发后 DB 值为 IOT，列表显示 IoT |
| T1-thread | 写清 Graph 执行器节点在各入口跑在哪类线程上 | 回执里列出：入口 → 线程类别 |
| F1-type | 表单回填类型不符：提交前触发时阻止提交并点名字段；按钮触发时提示原因并且不回填 | 两种触发方式各有一条行为证据 |

## 2. iso120 验收证据

隔离环境沿用端口 18093/5275/5433/56379，不连本机现有库，Vite 加 `--strictPort`。截图放 `.iso120/evidence/`，在本机可见浏览器会话里拍。每张图附 sha1，不能有两张 sha1 相同；**画面描述对着图写，头部和要证明的区域放在同一张图里，DOM 断言不能代替截图**。回执写明 URL、视口、登录身份（不写密码）、对象 ID。

| 原子 ID | 完成条件（正向） | 必要的反向断言 | 最小充分证据 |
|---|---|---|---|
| E1-1 | 服务节点选 Graph 执行器，绑定固定版本；入参和出参都从声明里选 | 只列出已发布的 Graph | 配置面板截图 |
| E1-2 | 缺必填入参时发布报错，指出节点和字段 | — | 报错截图 |
| E1-3 | 一条实例跑通：Graph 出参写回变量，条件分支走到预期的一边 | — | 实例轨迹截图 + 变量值 |
| E1-3T | 3 个实例同时停在慢 Graph 节点上，另一个普通审批正常完成 | 普通审批没有被卡住；如果被卡住，按审查记录加并发上限后重测 | 时间戳对照（Graph 节点进入时间、普通审批提交和完成时间）+ 截图 |
| E1-4 | 超时、Graph 报错、出参缺字段三种情况：CONTINUE 时走失败侧分支，原因写进变量；BLOCK 时节点失败，实例上能看到原因 | 不出现「节点成功但出参为空」 | 两组共 6 个结果（截图或 API + 变量值） |
| E1-5 | 引用含人工节点的 Graph（包括子图里有人工节点）时发布被拒，写明原因 | — | 报错截图，直接引用和子图引用各一张 |
| E1-6 | 提交前触发成功并回填；提交前触发失败时阻止提交；按钮触发成功回填；按钮触发失败时只提示，已填内容还在 | 失败后已填字段没有被清空 | 4 张截图 |
| E1-7 | 流程实例详情里能看到 Graph 执行编号、耗时、结果，并能跳到执行详情；执行列表按来源筛选（流程/表单/直接调用/IoT） | 筛选结果里没有别的来源 | 截图 + DB 中关联列的值 |
| E1-8 | 跨租户的 Graph 发布时被拒；运行时也被拒（直接改库或改请求绕过发布校验） | — | 两次拒绝的响应 |
| E2-1/2 | 日志等级页面能列出、搜索；调整一个 logger 后，同一请求前后的日志输出不同；恢复默认后回到原来的等级 | — | 页面截图 + 日志片段对照 |
| E2-3 | 无权限用户看不到菜单，后端拒绝访问；操作日志里有谁、哪个 logger、改前改后的等级 | — | 截图 + 403 响应 + 操作日志截图 |
| E2-4 | 重启后恢复配置文件里的等级 | — | 重启前后对照 |
| E2-5 | ROOT 调到 DEBUG 时弹出二次确认 | — | 截图 |
| E3-1 | 执行列表「共 N 条」和实际行数一致，页数正确；系统日志列表的分页条正常显示 | — | 修复前（1.1.3 基线）和修复后的对照截图 |
| E3-2 | I5 用例在 main CI 里实际运行通过 | — | 阶段 4 补 run 号和用例名 |
| MIG | 九库迁移结论（按 P66 口径，跑不了的写原因）；测试断言更新清单（120-01 已给出，可以引用） | — | 每个库一行结论 |
| GATE | Server 全量 `mvn test` 计数（环境类失败照旧记为限制）；Web typecheck/lint/test/build | — | 计数 |

## 3. 不用重做的

- 120-01 到 120-03 的模块级测试结果、§3 四问的回答、R4/R5 已接受的实现形态：都不重跑，不重写。
- 补充 §1 只复测受影响的项。

## 4. 回执与进度

回执 `execution-120-04.md`，可以分批，每批写明覆盖哪些 ID。全部通过后进入阶段 4 合并。

共 7 个阶段：已完成 2 个（评估、实施），进行中 1 个（验收），未开始 4 个。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.2.0",
  "revision": 1,
  "previous_revision": null,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.2.0/receipts/execution-120-03.md",
  "items": [
    {"origin_id": "R2-ui", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["流程设计器 Graph 执行器面板", "条件节点变量选择"], "allowed_actions": ["前端提示与变量选择"], "forbidden_actions": ["新造 BPMN 异常边"], "constraints": {}}, "acceptance": ["面板说明截图", "条件节点选到状态变量"]},
    {"origin_id": "R3-iot", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["business_source 取值", "IoT 桥", "来源筛选"], "allowed_actions": ["新增 IOT 值", "新请求写 DIRECT"], "forbidden_actions": ["回填存量行"], "constraints": {}}, "acceptance": ["IoT 触发后 DB 值为 IOT 且列表显示 IoT"]},
    {"origin_id": "T1-thread", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["Graph 执行器节点运行线程"], "allowed_actions": ["说明", "必要时加并发上限"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["入口 → 线程类别清单", "E1-3T 通过"]},
    {"origin_id": "F1-type", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["表单 Graph 动作回填"], "allowed_actions": ["类型校验"], "forbidden_actions": ["写入不合法值"], "constraints": {}}, "acceptance": ["提交前阻止并点名字段", "按钮提示且不回填"]},
    {"origin_id": "E1", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["E1-1~E1-8、E1-3T"], "allowed_actions": ["iso120 取证"], "forbidden_actions": ["连本机现有库"], "constraints": {"截图": "对着图写，sha1 互不相同，头部与证明区同框"}}, "acceptance": ["§2 表中各行"]},
    {"origin_id": "E2", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["E2-1~E2-5"], "allowed_actions": ["iso120 取证", "重启 iso120 Server"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["§2 表中各行"]},
    {"origin_id": "E3", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["E3-1", "E3-2"], "allowed_actions": ["iso120 取证"], "forbidden_actions": [], "constraints": {"E3-2": "run 号在阶段 4 补"}}, "acceptance": ["对照截图", "main CI 运行通过"]},
    {"origin_id": "MIG-GATE", "status": "OPEN", "failed_rounds": 0, "evidence": ["product/v1.2.0/receipts/execution-120-01.md#5"], "scope": {"targets": ["九库迁移", "两仓全量门禁"], "allowed_actions": ["运行测试"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["每库一行结论", "全量计数"]}
  ]
}
```
