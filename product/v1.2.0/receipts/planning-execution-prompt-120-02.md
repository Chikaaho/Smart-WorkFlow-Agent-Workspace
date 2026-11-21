# 执行提示 120-02：1.2.0 阶段 3 第 2 轮

2026-11-21｜规划 → 执行｜依据 `planning-review-120-02.md`｜本提示替代 `planning-execution-prompt-120-01.md`，是当前唯一的执行入口，120-01 只作追溯。方向 `direction-v1.2.0.md` 仍然有效。已验收轮数：1；E1-1、E1-2 已经没过 1 轮。

## 1. 先解决的阻塞（按顺序）

| ID | 内容 | 完成条件 |
|---|---|---|
| X1-deploy | 在 1.1.3 基线上，用同一种启动方式发布一个普通流程，判断 XSD 加载失败是启动方式的问题，还是 1.2.0 引起的；按结果修正启动方式或修根因。**回退 `deployModelGraph` 绕过和 classloader 改动** | 回执给出对照结果、根因、回退提交。回退后普通流程和带 Graph 节点的流程都能走原来的部署路径发布 |
| X2-expired | 查清 Graph 节点执行成功后 FLOW_START 被判 EXPIRED、实例没有落库的根因并修复 | 回执写明根因。一条带 Graph 节点的实例完整落库：sw_bpm_instance 有行，命令状态正常 |
| X3-endpanel | 修 Graph 设计器结束节点「输出参数」存不上的问题（1.1.0 G1-4 的缺陷，并入本版） | 在界面上添加一个输出参数并保存，重新打开后还在；截图，不改库 |
| X4-cred | 用一笔新提交，把 `execution-120-04.md`、`-06`、`-10` 里的口令改成「种子默认口令（见对应迁移脚本）」 | 改完后 `grep` 回执目录查不到口令；不改写历史 |
| X5-diag | 删除 `[iso120-diag]` 等临时诊断输出 | 回执写明删在哪笔提交 |
| X6-idx | 核对两个新索引名长度是否满足支持的最老 Oracle、DM 版本；超长就改名，并同步九库脚本和测试断言 | 回执写出各库的上限和实际长度 |

## 2. 取证（阻塞解决之后）

规则不变：截图在本机可见浏览器会话里拍，sha1 互不相同，画面描述对着图写，头部和要证明的区域放在同一张图里。回执写 URL、视口、登录身份（**不写口令**）、对象 ID。

| 原子 ID | 完成条件 | 必要的反向断言 | 最小充分证据 |
|---|---|---|---|
| E1-1 | 修掉面板里重复的通用字段（第二个「节点名称」、原样显示的「入参映射 []」）；版本下拉的时间改成 `yyyy-MM-dd HH:mm:ss`；入参和出参映射都选好之后截图。R2-ui：选 CONTINUE 时的分流说明，以及条件节点里可选的状态变量，放在同一张或相邻的截图里 | 面板里没有重复字段 | 2 张截图 |
| E1-2 | 发布报错同时写明节点名称和字段；发布失败时不能同时弹出成功提示 | 没有「草稿已保存」类的成功提示和报错叠在一起 | 截图 |
| E1-3 | 换一张按输入给出不同输出的图（例如城市在名单里 score=high，否则 low），用两条实例分别走到条件分支的两边 | — | 两条实例的轨迹截图 + 变量值 |
| E1-3T | 3 个实例同时停在慢 Graph 节点上，第 4 个普通审批正常完成；被卡住就加并发上限后重测 | 普通审批没有被卡住 | 时间戳对照 + 截图 |
| E1-4 | 超时、报错、出参缺字段三种情况 × CONTINUE/BLOCK，共 6 个结果 | 不出现「成功但出参为空」 | 截图或 API + 变量值 |
| E1-5 | 直接引用和子图引用含人工节点的 Graph，发布时都被拒 | — | 2 张截图 |
| E1-6 + F1-type | 提交前触发成功并回填；提交前失败时阻止提交；按钮触发成功回填；按钮失败只提示、已填内容还在；类型不符时，提交前阻止并点名字段，按钮提示并且不回填 | 失败后已填字段没有被清空；不合法的值没有写进记录 | 6 个结果，截图为主 |
| E1-7 + R3-iot | 实例详情里能看到 Graph 执行编号、耗时、结果，并能跳到执行详情；列表按来源筛选（流程/表单/直接调用/IoT）；一次 IoT 触发后 DB 里的值是 IOT | 筛选结果里没有别的来源 | 截图 + DB 值 |
| E1-8 | 跨租户的 Graph 发布时被拒，运行时也被拒 | — | 两次拒绝的响应 |
| E2-2 补图 | 修复后把 ROOT 调成 DEBUG，页面上配置等级列显示 DEBUG | — | 1 张截图 |
| E2-3 前端 | 造一个有「日志查询」等系统管理权限、唯独没有 `system:loglevel:manage` 的用户；截侧边栏：有系统管理、有日志查询、没有日志等级；画面里要看得出是哪个用户登录的 | 侧边栏里没有日志等级 | 1 张截图 |
| E3-1 | 修复前引用 `.iso113/evidence/113-B1-during-waiting.png`、`113-B4-entry-fixed.png`；修复后在 iso120 拍执行列表（「共 N 条」和行数一致）和系统日志列表（分页条正常显示） | — | 2 张修复后截图 |

## 3. 锁定项（不要重验）

T1-thread、E2-1、E2-4、E2-5、E2-3 后端、GATE（记为限制）、R4/R5、§3 回答，以及 `planning-review-120-02.md` 列出的已接受修复。只有 X1 回退部署路径之后，才需要重跑 bpm 模块测试和一次普通流程发布；其他锁定项不受影响，不重跑。

## 4. 环境

- iso120 继续用本机 5432 上的 `sw_iso120` 库，不连别的库。阶段 7 清理时只删这个库，并回读库列表。
- 不要尝试登录本机 MySQL 或其他用户服务。
- `/tmp/token.txt` 等临时凭据文件用完就删，回执写一行。

## 5. 回执与进度

回执 `execution-120-12.md` 起编号，可以分批。**每批都要推进至少一个原子 ID 到「有证据」**，不要只交环境或造数的中间态。

共 7 个阶段：已完成 2 个，进行中 1 个（验收第 2 轮），未开始 4 个。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.2.0",
  "revision": 2,
  "previous_revision": 1,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.2.0/receipts/execution-120-11.md",
  "items": [
    {"origin_id": "X1-deploy", "status": "OPEN", "failed_rounds": 0, "evidence": ["execution-120-07.md#4"], "scope": {"targets": ["BpmDeployFacade.deployModelGraph", "BpmEngineAutoConfiguration classloader"], "allowed_actions": ["1.1.3 基线对照", "修启动方式或根因", "回退绕过"], "forbidden_actions": ["保留绕过 XSD 校验的部署路径"], "constraints": {}}, "acceptance": ["对照结果与根因", "回退提交", "原路径发布成功"]},
    {"origin_id": "X2-expired", "status": "OPEN", "failed_rounds": 0, "evidence": ["execution-120-08.md#4"], "scope": {"targets": ["FLOW_START 准入/对账与 Graph 节点"], "allowed_actions": ["诊断", "修复"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["根因", "实例完整落库"]},
    {"origin_id": "X3-endpanel", "status": "OPEN", "failed_rounds": 0, "evidence": ["execution-120-06.md#2"], "scope": {"targets": ["Graph 设计器 EndPanel"], "allowed_actions": ["修复"], "forbidden_actions": ["改库代替界面操作"], "constraints": {}}, "acceptance": ["界面保存后重开仍在"]},
    {"origin_id": "X4-cred", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["execution-120-04/06/10.md"], "allowed_actions": ["新提交更正"], "forbidden_actions": ["改写历史"], "constraints": {}}, "acceptance": ["回执目录查不到口令"]},
    {"origin_id": "X5-diag", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["临时诊断日志"], "allowed_actions": ["删除"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["提交 SHA"]},
    {"origin_id": "X6-idx", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["V1.2.0 两个索引名"], "allowed_actions": ["核对", "必要时改名并同步九库与断言"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["各库上限与实际长度"]},
    {"origin_id": "E1-1", "status": "OPEN", "failed_rounds": 1, "evidence": ["E1-1-graph-exec-panel.png"], "scope": {"targets": ["Graph 执行器面板", "R2-ui"], "allowed_actions": ["修复并重拍"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["无重复字段", "版本时间格式", "映射已选", "分流说明与状态变量"]},
    {"origin_id": "E1-2", "status": "OPEN", "failed_rounds": 1, "evidence": ["E1-2-publish-missing-input.png"], "scope": {"targets": ["发布校验报错"], "allowed_actions": ["修文案并重拍"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["节点+字段", "无成功提示叠加"]},
    {"origin_id": "E1-rest", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["E1-3", "E1-3T", "E1-4", "E1-5", "E1-6+F1-type", "E1-7+R3-iot", "E1-8"], "allowed_actions": ["iso120 取证"], "forbidden_actions": [], "constraints": {"前置": "X1、X2、X3"}}, "acceptance": ["§2 表中各行"]},
    {"origin_id": "E2-tail", "status": "OPEN", "failed_rounds": 0, "evidence": ["E2-2-root-debug-applied.png", "E2-3-noperm-menu.png"], "scope": {"targets": ["E2-2 补图", "E2-3 前端"], "allowed_actions": ["造数", "截图"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["配置等级列 DEBUG", "侧边栏有日志查询无日志等级"]},
    {"origin_id": "E3-1", "status": "OPEN", "failed_rounds": 0, "evidence": [".iso113/evidence/113-B1-during-waiting.png", ".iso113/evidence/113-B4-entry-fixed.png"], "scope": {"targets": ["执行列表", "系统日志列表"], "allowed_actions": ["截图"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["2 张修复后截图"]}
  ]
}
```
