# F1 阶段 1 补充执行提示（第 2 次）

日期：2026-11-04。下发角色：规划；承接角色：执行。依据：`planning-review-f1-stage1-02.md`。本提示替代 `planning-execution-prompt-f1-stage1-01.md`，作为 F1 阶段 1 的唯一当前执行入口。

## 锁定项（不得重验）

第一轮 a)～d) 与四项修复；本次通过的 G1、G4、G5、G6。只有本轮改动触及这些路径时才复验受影响项，并写明依据。

## 剩余两项

| ID | 只做这些 | 完成条件 | 证据 |
|---|---|---|---|
| F1S1-G2 | 修正连通性测试结果弹窗的标题判定 | 401/403 鉴权失败时标题不是"网络不可达"，与消息"鉴权失败"一致；真实连不上（如端口无监听）时标题仍是"网络不可达"；成功时仍是"服务可达" | 可见浏览器（headless=false）三张截图：成功、401、端口无监听；可用本地桩，不用真实密钥 |
| F1S1-G3 | 运行 `sw-bootstrap` 中的迁移相关测试，至少包括 Flyway 全链测试（H2、PG）和升级演练测试；因新增 V0.2.2 而失败的断言按实际迁移条数更新；补一个升级测试断言 D022-03 搬运结果 | 上述测试在 H2 和 PG 上全部通过；新断言覆盖：ollama 行格式为 `OPENAI_CHAT` 且地址补 `/v1`，other 行停用，旧 id 原样；若 pom 依赖改动影响其他模块，报告受影响模块及其测试结果 | 测试类名单、命令、`Tests run/Failures/Errors/Skipped` 计数与原始输出位置；原始输出保存在可读文件中，不随验证目录删除 |

## 边界

- 只改上表范围；不改业务语义，不扩到阶段 2。
- 不使用真实 API Key；不改 UAT。
- 通过门禁后提交推送；回执 `product/0.2.2/receipts/f1-stage1-4.md`。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 2,
  "previous_revision": 1,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/f1-stage1-3.md",
  "items": [
    {
      "origin_id": "F1S1-G1",
      "subject": "旧模型配置、旧 graph、旧会话迁移",
      "criterion": "迁移前已有配置迁移后可用：旧 graph 不改即可执行，旧会话可打开；ollama→OPENAI_CHAT，other→停用，旧 id 可解析",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage1-3.md G1", "product/0.2.2/receipts/assets/g2-e2-model-test-ok.png"],
      "scope": {
        "targets": ["V0.2.2 迁移搬运", "旧 agentModelConfigId 解析"],
        "allowed_actions": ["准备 0.2.1 结构验证库", "写入 verify- 前缀旧数据", "执行迁移并回读", "修复迁移或解析缺陷"],
        "forbidden_actions": ["用新建数据冒充存量", "改写 graph_json 后再执行", "改 UAT 库", "密钥写入文件或提交"],
        "constraints": {"迁移库": "PG 与 H2 各一次", "旧数据行": "openai、ollama、other 三行"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S1-G2",
      "subject": "前端供应商与模型两级管理",
      "criterion": "方向阶段 1 第 6 步：两级管理页可新建供应商、增模型、测连通，密钥脱敏且留空保留",
      "status": "REWORK",
      "failed_rounds": 2,
      "evidence": ["product/0.2.2/receipts/f1-stage1-3.md G2", "product/0.2.2/receipts/assets/g2-e3-wrong-key-401.png"],
      "diagnosis": {
        "location": "/agent/model 连通性测试结果弹窗标题行",
        "observed": "401 鉴权失败时标题显示“测试结果：网络不可达”，消息行显示“鉴权失败（HTTP 401）”",
        "expected": "鉴权失败时标题不为“网络不可达”且与消息一致；连不上时为“网络不可达”；成功时为“服务可达”",
        "cause": "标题判定把非成功结果一律归为网络不可达（据截图推断，执行核实）",
        "next_action": "只修标题判定逻辑，并在可见浏览器复验成功、401、端口无监听三态"
      },
      "planner_self_audit": "首轮断言已写明“显示鉴权失败提示”；本轮截图标题与消息矛盾，属真实显示错误而非口径问题。新建、增模型、留空保留密钥、脱敏已在截图和回执中成立，本轮目标收窄为标题判定一处。",
      "scope": {
        "targets": ["模型管理"],
        "allowed_actions": ["浏览器验证", "修复该页面缺陷"],
        "forbidden_actions": ["headless 结果冒充正式证据", "截图中出现明文密钥", "使用真实 API Key"],
        "constraints": {"浏览器": "headless=false", "复验三态": "成功、HTTP 401、端口无监听", "修复位置": "仅连通性测试结果弹窗标题判定"}
      },
      "acceptance": ["401 时标题非“网络不可达”且与消息一致", "端口无监听时标题为“网络不可达”", "成功时标题为“服务可达”"]
    },
    {
      "origin_id": "F1S1-G3",
      "subject": "阶段 1 门禁",
      "criterion": "证据清单第 2 项：Server 受影响模块测试与 H2/PG 双库迁移；Web typecheck、lint、单测、build",
      "status": "REWORK",
      "failed_rounds": 2,
      "evidence": ["product/0.2.2/receipts/f1-stage1-3.md G3", "product/0.2.1-bugfix/receipts/release-sync-021-01.md §3"],
      "diagnosis": {
        "location": "sw-bootstrap 迁移测试（Flyway 全链 H2/PG、升级演练）",
        "observed": "只运行 sw-basic-agent 328/328；sw-bootstrap 迁移测试未运行；H2 迁移原始输出已删除",
        "expected": "sw-bootstrap 迁移相关测试在 H2 与 PG 通过，并有断言覆盖 D022-03 搬运结果",
        "cause": "受影响模块只按 Agent 代码判定，遗漏迁移所在模块；0.2.1 发布首轮 CI 已因同类断言未计入新增迁移而失败",
        "next_action": "运行并修正 sw-bootstrap 迁移测试，补 D022-03 搬运断言，原始输出留存"
      },
      "planner_self_audit": "首轮只写“受影响模块测试”未点名模块，规划口径偏宽；本轮点名 sw-bootstrap 迁移测试，Web 门禁本轮无代码改动沿用结果不再要求。",
      "scope": {
        "targets": ["V0.2.2 迁移"],
        "allowed_actions": ["运行门禁", "修复门禁失败"],
        "forbidden_actions": ["跳过失败测试", "推算计数", "删除原始测试输出"],
        "constraints": {"迁移": "H2 与 PG", "门禁所在模块": "sw-bootstrap", "修复门禁失败含": "更新迁移条数断言、新增 D022-03 搬运断言", "必含测试": "Flyway 全链 H2、Flyway 全链 PG、升级演练", "搬运断言": "ollama→OPENAI_CHAT 且补 /v1、other 停用、旧 id 原样"}
      },
      "acceptance": ["必含测试全部通过且计数来自原始输出", "搬运断言存在并通过", "pom 改动影响的其他模块测试结果已报告"]
    },
    {
      "origin_id": "F1S1-G4",
      "subject": "模型与供应商启用校验",
      "criterion": "方向阶段 1 第 4 步：图执行与调试校验模型和供应商是否启用",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage1-3.md G4"],
      "scope": {
        "targets": ["图执行校验", "调试校验"],
        "allowed_actions": ["验证", "补实现启用校验"],
        "forbidden_actions": ["改动阶段 2 范围"],
        "constraints": {"停用场景": "模型停用、供应商停用各一次", "覆盖路径": "图执行与单步调试"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S1-G5",
      "subject": "多密钥轮换覆盖图执行与调试",
      "criterion": "D022-05：429 时同组切换密钥并冷却，覆盖图执行与调试",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage1-3.md G5"],
      "scope": {
        "targets": ["图执行轮换", "调试轮换"],
        "allowed_actions": ["本地桩验证", "补实现轮换"],
        "forbidden_actions": ["对真实供应商压测"],
        "constraints": {"429 来源": "本地桩服务"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S1-G6",
      "subject": "Spring AI 组件与配置移除",
      "criterion": "方向阶段 1 第 4 步：移除 Spring AI OpenAI/Ollama 组件，清理未使用的 spring.ai 配置",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage1-3.md G6"],
      "scope": {
        "targets": ["Server 依赖", "application.yml"],
        "allowed_actions": ["检索验证", "移除组件与配置"],
        "forbidden_actions": ["升级 Spring Boot 主版本"],
        "constraints": {"检索范围": "sw-basic-agent 依赖树与全部 application*.yml"}
      },
      "acceptance": ["已锁定"]
    }
  ],
  "history_summary": {"revision": 1, "review": "product/0.2.2/receipts/planning-review-f1-stage1-02.md", "retained_count": 4, "status_counts": {"RESOLVED": 4}}
}
```
