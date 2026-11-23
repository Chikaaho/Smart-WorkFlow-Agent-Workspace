# 执行提示 120-03：1.2.0 阶段 3 第 3 轮

2026-11-23｜规划 → 执行｜依据 `planning-review-120-03.md`；E4 是 Owner 当天并入的（账本 rev 4）｜本提示替代 `planning-execution-prompt-120-02.md`，是当前唯一的执行入口。方向 `direction-v1.2.0.md` 仍然有效。已验收轮数：2；E1-1 已经没过 2 轮（缺证据），E1-3 没过 2 轮。

## 1. 安全（最先做，完成前不做别的）

| ID | 内容 | 完成条件 |
|---|---|---|
| S1-untrack | 用 `git rm --cached` 取消跟踪 `.iso120/run/config/login-rsa-private-key.pem`、`.iso120/run/config/application-dev.yml`、`.iso120/evidence/` 下全部文件、`.zcode/plans/*.md`；把 `.iso120/`、`.zcode/plans/` 写进根 `.gitignore`。本机文件保留。**不改写历史、不强推** | 回执贴出 `git ls-files .iso120 .zcode/plans` 的输出，必须为空 |
| S1-receipt | 新提交两处更正：① 120-12 §1 中「安全更正出 Git」的表述改成实际情况，并注明由本次 S1 完成；② 120-12 第 54 行 grep 命令里的口令原文改成「两个种子默认口令」 | `grep` 回执目录查不到口令；不改写历史 |

Owner 2026-11-23 裁定：这些是本机隔离环境的文件，没有价值，别人拿到也用不了，**不轮换、不改写历史**。取消跟踪是为了守住「凭据和截图不进 Git」这条规则。回执里不要贴文件内容。

## 2. 返修和补证

规则不变：在本机可见浏览器会话里截图，sha1 互不相同，画面描述对着图写，头部和要证明的区域放在同一张图里。回执写 URL、视口、登录身份（不写口令）、对象 ID。**截图必须在修复提交之后拍**，回执里写明拍摄时间晚于哪笔提交。

| 原子 ID | 完成条件 | 反向断言 | 证据 |
|---|---|---|---|
| X3 | 在 Graph 设计器的结束节点上，从界面添加一个输出参数，保存后关掉页面再打开，参数还在 | 不改库 | 重开后的截图 |
| E1-1 | 面板从上到下滚动完整截图（可以 2 张），能看出通用字段没有重复；失败策略选 CONTINUE，截分流说明；条件节点面板截「Graph 执行状态变量」列表 | 面板里没有第二个「节点名称」或「入参映射 []」 | 2～3 张 |
| E1-3 | 换一张真正按输入给出不同输出的图，例如 CONDITION 判断城市是否在名单里，两个 END 分别输出常量 `high` 和 `low`，**不能把输入原样回传**。两条实例分别走到分支两边。查清楚为什么执行详情的「输入内容」「输出内容」是空的：是缺陷就修，修不了就说明原因 | 输出值里不出现城市名 | 两条实例各一张轨迹图（未命中的那条要能看到已到 END，比如在流转记录里显示已完成），执行详情能看到输出，变量值 |
| E1-3T | 截图要对上回执里的对象：三条慢执行显示「运行中」时拍一张，普通审批完成时拍一张，画面里有对象 ID 或时间，能和 DB 时间戳对应 | 普通审批没有被卡住 | 2 张 + 时间戳对照 |
| E1-4 | CONTINUE 的那一组流程要带条件分支：按 `graphExec.node_ge.status == 'FAILED'` 走失败侧（比如一个审批节点「Graph 失败人工处理」），三种失败原因各一条实例，都走到失败侧。BLOCK 的那一组要说明发起人从界面哪里能看到失败原因，给截图；如果看不到，就是缺陷，修掉再拍。超时 CONTINUE 时请求层分类是 EXECUTION_ERROR、节点变量是 TIMEOUT，说明这两层为什么不一样，不一样就统一 | 不出现「成功但出参为空」 | CONTINUE 三条走到失败侧的轨迹；BLOCK 原因在界面上可见 |
| E1-6 | 修完这几处后重拍 #2/#3/#4/#6：成功提示显示 i18n 键原文 `common.operationSuccess`；按钮失败的提示写成「表单提交失败」；按钮类型不符时，警告和成功提示叠在一起出现（类型不符时不应弹成功）；提交前失败时只提示「表单提交失败」，没有原因（120-13 的 `48681c08` 之后重拍）。截图里要能看出是哪个页面 | 失败后已填的字段还在；没有成功提示和失败提示叠在一起 | 4 张 |
| E1-7 筛选 | 解释 DB 计数（PROCESS 53、DIRECT 1）和页面筛选（流程 19、直接调用 8）为什么对不上，以及全部来源共 55 条和 DB 合计 63 条为什么对不上；6 条「E1-4超时图v2」直接调用一直停在「运行中」，查清楚原因，是残留就收尾 | — | 回执里给出 SQL 计数和页面计数逐项对照 |
| X1-timeline | 更正 120-12 §2 的时间线（21:39/22:02/21:48 前后矛盾）。之后只要再出现 schema null，就贴出异常栈 | — | 回执一段 |

## 3. E4 线上缺陷（Owner 2026-11-23 并入 1.2.0）

验收标准见方向 §1 E4（已追加）。先查根因，然后修复，最后在 iso120 取证。

| 原子 ID | 完成条件 | 反向断言 | 证据 |
|---|---|---|---|
| E4-1 P76 | 审批详情「动作/意见」列里，非文本的意见字段显示成可读的值。Owner 截图里的流程是「跨部门灾备演练计划审批」，节点有现场指挥确认、总公司科技部会签等，字段有「演练准备就绪」「风险评级」「预计停机时长」等。在 iso120 造一个审批意见表单，至少包含单选/开关、数字带单位、人员或多选三类字段，走两个节点后看详情。回执写明根因，以及检查过哪些同源的地方（任务详情、会签弹窗、打印/PDF） | 页面上没有 `DynamicData@` 或其他 `com.sw.` 开头的串；普通文本意见显示不变 | 修复前后同一对象各一张截图，同类检查清单 |
| E4-2 P77 | 用户端工作台「我的待办」卡片的「已办」页签，按钮显示「查看」，打开只读详情并能正常加载。回执写明根因：文案从哪里来、跳到了哪个路由、为什么提示「流程不存在」。检查个人中心「我的已办」和抄送页签 | 已办里没有「办理」；不出现「流程不存在」；待办页签仍然是「办理」，能正常办理 | 已办页签截图，点进去后的详情截图，待办页签截图 |

## 4. 锁定项（不要重验）

第 1 轮锁定：T1-thread、E2-1、E2-4、E2-5、E2-3 后端、GATE（记为限制）、R4/R5。第 2 轮锁定：X1 回退、X2、X5、X6、E1-2、E1-5、E1-7 关联、E1-8、E2-2、E2-3 前端、E3-1；E1-1 的映射已选和版本时间格式；E1-6 的 #1 和 #5。只有修复牵涉到这些项的代码时才重测，回执要写明理由。

## 5. 环境

- iso120 继续用本机 5432 上的 `sw_iso120`。阶段 7 清理时删掉 `sw_iso120` 和 `sw_iso120_x1`，停掉 18094 上的 1.1.3 worktree 进程并删除这个 worktree，回读库列表。
- 不要尝试登录本机 MySQL 或其他用户服务。临时凭据文件用完就删。
- 不提交 `Smart-WorkFlow-aPaaS-Web`、`-server` 两个 gitlink 的变更。

## 6. 回执与进度

回执从 `execution-120-14.md` 起编号，可以分批，S1 单独一批先交。每批至少推进一个原子 ID 到「有证据」。

共 7 个阶段：已完成 2 个，进行中 1 个（验收第 3 轮），未开始 4 个。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.2.0",
  "revision": 4,
  "previous_revision": 3,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.2.0/receipts/execution-120-13.md",
  "items": [
    {"origin_id": "S1", "status": "OPEN", "failed_rounds": 0, "evidence": ["06f1c410", "7de697f9"], "scope": {"targets": [".iso120/run/config/*", ".iso120/evidence/*", ".zcode/plans/*", "execution-120-12.md"], "allowed_actions": ["git rm --cached", "补 ignore"], "forbidden_actions": ["改写历史", "强推", "回执贴密钥内容"], "constraints": {"顺序": "最先", "Owner": "本机文件无价值，不轮换"}}, "acceptance": ["ls-files 为空", "回执更正"]},
    {"origin_id": "X3-endpanel", "status": "OPEN", "failed_rounds": 1, "evidence": [], "scope": {"targets": ["Graph 设计器 EndPanel"], "allowed_actions": ["截图"], "forbidden_actions": ["改库"], "constraints": {}}, "acceptance": ["重开后仍在的截图"]},
    {"origin_id": "X4-cred", "status": "OPEN", "failed_rounds": 1, "evidence": ["execution-120-12.md#6"], "scope": {"targets": ["execution-120-12.md"], "allowed_actions": ["新提交更正"], "forbidden_actions": ["改写历史"], "constraints": {"合并到": "S1-receipt"}}, "acceptance": ["回执目录查不到口令"]},
    {"origin_id": "E1-1", "status": "OPEN", "failed_rounds": 2, "evidence": ["E1-1-panel-fixed.png"], "scope": {"targets": ["面板全貌", "R2-ui"], "allowed_actions": ["截图"], "forbidden_actions": [], "constraints": {"已锁": "映射已选、版本时间"}}, "acceptance": ["无重复字段", "分流说明", "状态变量"]},
    {"origin_id": "E1-3", "status": "OPEN", "failed_rounds": 2, "evidence": ["E1-3-instance-hit-trace.png", "E1-3-instance-miss-trace.png", "E1-3-exec-detail-beijing.png"], "scope": {"targets": ["分流测试图", "执行详情输入输出"], "allowed_actions": ["换图", "修复"], "forbidden_actions": ["原样回传输入"], "constraints": {}}, "acceptance": ["输出为常量 high/low", "两侧轨迹", "详情有输出"]},
    {"origin_id": "E1-3T", "status": "OPEN", "failed_rounds": 1, "evidence": ["execution-120-13.md#3"], "scope": {"targets": ["对象对应的截图"], "allowed_actions": ["重测重拍"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["运行中截图", "审批完成截图", "时间戳对照"]},
    {"origin_id": "E1-4", "status": "OPEN", "failed_rounds": 1, "evidence": ["execution-120-13.md#4"], "scope": {"targets": ["CONTINUE 失败侧分支", "BLOCK 原因可见", "分类口径"], "allowed_actions": ["重测", "修复"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["三条走失败侧", "BLOCK 原因界面可见", "口径说明"]},
    {"origin_id": "E1-6", "status": "OPEN", "failed_rounds": 1, "evidence": ["E1-6-*.png"], "scope": {"targets": ["i18n 键", "按钮失败文案", "提示叠加", "提交前失败原因"], "allowed_actions": ["修复并重拍 #2/#3/#4/#6"], "forbidden_actions": [], "constraints": {"已锁": "#1、#5"}}, "acceptance": ["4 张修复后截图"]},
    {"origin_id": "E1-7-filter", "status": "OPEN", "failed_rounds": 1, "evidence": ["E1-7-source-*.png"], "scope": {"targets": ["来源计数", "残留运行中"], "allowed_actions": ["解释", "收尾"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["SQL 与页面计数逐项对照"]},
    {"origin_id": "X1-timeline", "status": "OPEN", "failed_rounds": 0, "evidence": ["execution-120-12.md#2"], "scope": {"targets": ["回执时间线"], "allowed_actions": ["更正"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["时间线一致"]},
    {"origin_id": "E4-1", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["审批详情意见字段显示及同源位置"], "allowed_actions": ["根因修复", "iso120 取证"], "forbidden_actions": ["页面逐个打补丁", "迁移旧数据", "连演示库"], "constraints": {}}, "acceptance": ["无对象串", "三类字段可读", "同类检查清单"]},
    {"origin_id": "E4-2", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["工作台已办按钮与路由", "我的已办", "抄送"], "allowed_actions": ["根因修复", "iso120 取证"], "forbidden_actions": ["连演示库"], "constraints": {}}, "acceptance": ["已办显示查看", "详情能加载", "待办不受影响"]}
  ]
}
```
