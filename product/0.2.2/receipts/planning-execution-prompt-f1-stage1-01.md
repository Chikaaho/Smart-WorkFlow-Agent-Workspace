# F1 阶段 1 补充执行提示（第 1 次）

日期：2026-11-04。下发角色：规划；承接角色：执行。依据：`planning-review-f1-stage1-01.md`。本提示是 F1 阶段 1 的唯一当前执行入口；方向 `product/0.2.2/ready/direction-022-f1-agent.md` 不变。

## 锁定项（不得重验）

回执 `f1-stage1-2.md` §1 a)～d) 和 §2 四项修复。只有本轮改动触及这些路径时，才复验受影响项，并写明依据。

## 剩余缺口

| ID | 完成条件 | 对象与最小证据 |
|---|---|---|
| F1S1-G1 旧数据迁移 | 准备一个**升级前（0.2.1 结构）**的库，写入旧表 `sw_agent_model_config` 三行：openai（指向 Command Code Chat 兼容口，key 由 Owner 提供）、ollama、other；一个已发布 graph，其 LLM 节点引用 openai 行的旧 id；一个引用该旧 id、带消息的会话。执行 V0.2.2 升级迁移后：① 三行分别迁为"供应商+模型"，ollama 行格式为 `OPENAI_CHAT` 且地址为兼容口，other 行为停用；② 不改 graph_json 直接执行该 graph，成功并有真实模型输出；③ 会话详情接口能返回原消息；④ 引用 other 行的执行返回可读的"模型已停用"类错误 | PG 与 H2 各跑一次迁移；PG 上做 ②～④。SQL 查询结果、HTTP 响应摘要（key 打码）。验证数据带 `verify-` 前缀，结束后清理 |
| F1S1-G2 前端两级管理 | 用户可见浏览器（headless=false）走通：新建供应商（选格式、填地址和密钥，密钥脱敏）→ 在其下新增模型并标能力 → 测试连通成功；编辑供应商密钥留空保存后仍能连通；错误密钥测试显示鉴权失败提示 | 浏览器截图 + URL + 视口；密钥打码 |
| F1S1-G3 门禁 | Server：受影响模块测试全量结果，并写明模块名单；V0.2.2 迁移在 H2 和 PG 上都执行成功。Web：typecheck、lint、单测、build | 命令与原始输出位置、计数 |
| F1S1-G4 启用校验 | 分别停用模型、停用供应商后，执行和调试引用它的 graph 都被拒绝，返回可读原因；重新启用后恢复 | HTTP 响应摘要，或集成测试结果（层级如实标注） |
| F1S1-G5 轮换覆盖 | 同组两把密钥，第一把返回 429 时，图执行和调试都切换到第二把并成功，第一把进入冷却 | 本地桩服务模拟 429 即可，不对真实供应商压测；集成测试或 HTTP 结果 |
| F1S1-G6 旧组件移除 | Server 依赖树中没有 `spring-ai-*` 的 OpenAI/Ollama 组件；`application.yml` 中没有 spring.ai openai/ollama 默认配置；服务正常启动 | 依赖树检索结果、配置检索结果、启动健康结果 |

G4～G6 如果已经实现，直接给出真实结果；未实现的，在阶段 1 范围内补上。

## 边界

- 不扩大到阶段 2、3；不改动锁定项以外的已通过行为。
- API Key 规则沿用方向文档：不写入任何文件、提交、日志或截图；验证后从本地库删除。
- 每个内聚批次通过门禁后提交推送。回执写为 `product/0.2.2/receipts/f1-stage1-3.md`，按上表逐项给结果和原始输出位置。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 1,
  "previous_revision": 0,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/f1-stage1-2.md",
  "items": [
    {
      "origin_id": "F1S1-A-connectivity",
      "subject": "三种 API 格式连通性",
      "criterion": "三种格式各配供应商与模型，真实连通性测试成功",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": ["product/0.2.2/receipts/f1-stage1-2.md §1 a)"],
      "scope": {"targets": ["供应商与模型装配"], "allowed_actions": ["无"], "forbidden_actions": ["重验锁定项"], "constraints": {}},
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S1-B-three-llm-graph",
      "subject": "三 LLM 节点 graph 执行",
      "criterion": "已发布 graph 三个 LLM 节点分用三种格式执行成功",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": ["product/0.2.2/receipts/f1-stage1-2.md §1 b)"],
      "scope": {"targets": ["graph 执行"], "allowed_actions": ["无"], "forbidden_actions": ["重验锁定项"], "constraints": {}},
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S1-C-auth-failure",
      "subject": "错误密钥处理",
      "criterion": "错误密钥报鉴权失败，响应与日志不含密钥",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": ["product/0.2.2/receipts/f1-stage1-2.md §1 c)"],
      "scope": {"targets": ["连通性测试"], "allowed_actions": ["无"], "forbidden_actions": ["重验锁定项"], "constraints": {}},
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S1-D-hot-reload",
      "subject": "配置热生效",
      "criterion": "修改参数后下一次调用生效，不重启",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": ["product/0.2.2/receipts/f1-stage1-2.md §1 d)"],
      "scope": {"targets": ["单例失效重建"], "allowed_actions": ["无"], "forbidden_actions": ["重验锁定项"], "constraints": {}},
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S1-G1",
      "subject": "旧模型配置、旧 graph、旧会话迁移",
      "criterion": "迁移前已有配置迁移后可用：旧 graph 不改即可执行，旧会话可打开；ollama→OPENAI_CHAT，other→停用，旧 id 可解析",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage1-2.md §1 e)、§3"],
      "diagnosis": {
        "location": "V0.2.2 升级迁移（D022-03 搬运）及旧 id 解析路径",
        "observed": "空库上新建不含 LLM 节点的 START→END 图作等价覆盖，迁移搬运与旧 id 解析均未执行",
        "expected": "0.2.1 结构库中旧三行配置、引用旧 id 的已发布 graph 和会话，升级后按 D022-03 可用",
        "cause": "本地为全新空库，无存量数据；回执已自述该限制",
        "next_action": "在 0.2.1 结构库写入旧数据后执行升级迁移，回读迁移结果并真实执行旧 graph、打开旧会话"
      },
      "scope": {
        "targets": ["V0.2.2 迁移搬运", "旧 agentModelConfigId 解析"],
        "allowed_actions": ["准备 0.2.1 结构验证库", "写入 verify- 前缀旧数据", "执行迁移并回读", "修复迁移或解析缺陷"],
        "forbidden_actions": ["用新建数据冒充存量", "改写 graph_json 后再执行", "改 UAT 库", "密钥写入文件或提交"],
        "constraints": {"迁移库": "PG 与 H2 各一次", "旧数据行": "openai、ollama、other 三行"}
      },
      "acceptance": ["三行迁移结果符合 D022-03", "未改 graph_json 的旧 graph 真实执行成功", "旧会话详情返回原消息", "引用停用行的执行返回可读错误"]
    },
    {
      "origin_id": "F1S1-G2",
      "subject": "前端供应商与模型两级管理",
      "criterion": "方向阶段 1 第 6 步：两级管理页可新建供应商、增模型、测连通，密钥脱敏且留空保留",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage1-2.md（未提及前端）"],
      "diagnosis": {
        "location": "Web Agent 供应商/模型管理页（Web 65b30fa）",
        "observed": "回执无任何前端页面结果",
        "expected": "用户可见浏览器走通新建、增模型、测连通、留空保留密钥、错误密钥提示",
        "cause": "回执只覆盖后端接口验证",
        "next_action": "在可见浏览器中走通该流程并截图；有缺陷则修复"
      },
      "scope": {
        "targets": ["供应商管理页", "模型管理"],
        "allowed_actions": ["浏览器验证", "修复该页面缺陷"],
        "forbidden_actions": ["headless 结果冒充正式证据", "截图中出现明文密钥"],
        "constraints": {"浏览器": "headless=false"}
      },
      "acceptance": ["五个动作在可见浏览器中结果正确"]
    },
    {
      "origin_id": "F1S1-G3",
      "subject": "阶段 1 门禁",
      "criterion": "证据清单第 2 项：Server 受影响模块测试与 H2/PG 双库迁移；Web typecheck、lint、单测、build",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage1-2.md §2（仅 328/328 单测）"],
      "diagnosis": {
        "location": "回执门禁结果",
        "observed": "只有 328/328 单测，未注明模块，无双库迁移和 Web 门禁结果",
        "expected": "受影响模块名单与测试计数、双库迁移成功、Web 四项门禁结果",
        "cause": "回执未列出",
        "next_action": "运行并回报上述门禁"
      },
      "scope": {
        "targets": ["Server 受影响模块", "V0.2.2 迁移", "Web 门禁"],
        "allowed_actions": ["运行门禁", "修复门禁失败"],
        "forbidden_actions": ["跳过失败测试", "推算计数"],
        "constraints": {"迁移": "H2 与 PG"}
      },
      "acceptance": ["门禁全部通过且有原始输出位置"]
    },
    {
      "origin_id": "F1S1-G4",
      "subject": "模型与供应商启用校验",
      "criterion": "方向阶段 1 第 4 步：图执行与调试校验模型和供应商是否启用",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage1-2.md（未回报）"],
      "diagnosis": {
        "location": "图执行与调试的执行前校验",
        "observed": "回执未回报",
        "expected": "停用模型或供应商后执行与调试被拒并返回可读原因，重新启用后恢复",
        "cause": "探索确认旧实现不检查 enabled；新实现结果未知",
        "next_action": "给出真实结果，未实现则补上"
      },
      "scope": {
        "targets": ["图执行校验", "调试校验"],
        "allowed_actions": ["验证", "补实现启用校验"],
        "forbidden_actions": ["改动阶段 2 范围"],
        "constraints": {"停用场景": "模型停用、供应商停用各一次", "覆盖路径": "图执行与单步调试"}
      },
      "acceptance": ["停用模型、停用供应商两种情况下执行与调试均被拒，启用后恢复"]
    },
    {
      "origin_id": "F1S1-G5",
      "subject": "多密钥轮换覆盖图执行与调试",
      "criterion": "D022-05：429 时同组切换密钥并冷却，覆盖图执行与调试",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage1-2.md（未回报）"],
      "diagnosis": {
        "location": "图执行与调试的模型调用路径",
        "observed": "回执未回报",
        "expected": "第一把密钥 429 时切换到第二把成功，第一把进入冷却",
        "cause": "旧实现只有编排入口轮换",
        "next_action": "用本地 429 桩验证，未实现则补上"
      },
      "scope": {
        "targets": ["图执行轮换", "调试轮换"],
        "allowed_actions": ["本地桩验证", "补实现轮换"],
        "forbidden_actions": ["对真实供应商压测"],
        "constraints": {"429 来源": "本地桩服务"}
      },
      "acceptance": ["图执行与调试各一次切换成功且冷却生效"]
    },
    {
      "origin_id": "F1S1-G6",
      "subject": "Spring AI 组件与配置移除",
      "criterion": "方向阶段 1 第 4 步：移除 Spring AI OpenAI/Ollama 组件，清理未使用的 spring.ai 配置",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage1-2.md（未回报）"],
      "diagnosis": {
        "location": "Server 依赖与 application.yml",
        "observed": "回执未回报",
        "expected": "依赖树无 spring-ai OpenAI/Ollama 组件，配置无对应默认项，服务正常启动",
        "cause": "回执未列出",
        "next_action": "给出依赖树与配置检索结果及启动健康，未完成则补上"
      },
      "scope": {
        "targets": ["Server 依赖", "application.yml"],
        "allowed_actions": ["检索验证", "移除组件与配置"],
        "forbidden_actions": ["升级 Spring Boot 主版本"],
        "constraints": {"检索范围": "sw-basic-agent 依赖树与全部 application*.yml"}
      },
      "acceptance": ["依赖与配置检索零命中且服务健康 UP"]
    }
  ]
}
```
