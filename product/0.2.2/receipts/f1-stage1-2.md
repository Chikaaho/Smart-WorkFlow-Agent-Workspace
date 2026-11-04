# F1 阶段 1 完成断言验证回执（第 2 轮：真实联调）

- 方向文件：`product/0.2.2/ready/direction-022-f1-agent.md`（等级 XL，会话角色 executor）
- 验证环境：本地 Docker PG 18（smart_workflow_021）+ Redis；server 以 dev profile + sidecar 本地配置 + debug-auth（`Bearer test_1`）运行，端口 8080
- 上游约束：所有 API Key 只进本地 HTTPS 请求体（AES-GCM 密文落库），不进 git/种子/迁移/回执/日志；验收后本地库删除
- 代码状态：server `feature/0.2.2-agent` @ `f3589d71`（本轮联调修复），web `65b30fa`（已推送）

## 1. 完成断言逐条验证

### a) Command Code 三格式各配供应商 + 模型，真实连通测试全过 ✅

| api_format | 供应商 baseUrl | 模型 | test-connection 结果 |
|---|---|---|---|
| OPENAI_CHAT | `https://api.commandcode.ai/provider/v1` | `deepseek/deepseek-v4.1-flash` | success, 2203ms（初测 1427ms 失败→修复见 §2.2） |
| OPENAI_RESPONSES | `https://api.commandcode.ai/provider/v1` | `deepseek/deepseek-v4-flash` | success, 1750ms |
| ANTHROPIC | `https://api.deepseek.com/anthropic/v1/` | `deepseek-chat` | success, 618ms |

- 网关约定实测确认：`/provider/v1/chat/completions`、`/provider/v1/responses`、`/provider/v1/messages`；Anthropic 格式端点在 Command Code 侧仅服务 claude 系（当前账号计划 403 `MODEL_NOT_IN_PLAN`），经用户确认改用 DeepSeek 官方 Anthropic 兼容端点（`/anthropic/v1/messages`）验证 ANTHROPIC 装配，模型也按用户指示用 deepseek 系便宜模型（claude 系未采用）。
- 用户原始 key 首轮 401：比对用户本机成功 curl 发现初始提供的 key 缺末位字符 `L`（92→93 位），补全后全通。
- curl 直测三端点均 200（小 token 预算）；模型列表 `/provider/v1/models` 95 个模型可拉取。

### b) 发布 graph 三 LLM 节点用三模型执行成功 ✅

- 图 `verify-three-llm-relay`（graphKey `agent_d507e57c7aee4fad`，defVersion 2 PUBLISHED）：
  START → LLM1(OPENAI_CHAT) → LLM2(OPENAI_RESPONSES) → LLM3(ANTHROPIC) → END，
  模板占位 `{{var}}` 逐节点接力，outputVar 链 relay1→relay2→relay3。
- 执行结果：`success=true, output="STAGE1-OK-1", latencyMs=7063`，executionId `2117653182971682817`。
- 节点轨迹（sw_agent_graph_execution_node）：n_llm1 2802ms → n_llm2 3511ms → n_llm3 748ms，变量快照接力正确，END 透出 relay3。

### c) 错密钥 → 鉴权失败且响应/日志无 key ✅

- PUT 换错 key（`sk-definitely-wrong-key-000`）→ test-connection 返回 `success=false, "鉴权失败（HTTP 401）：请检查 API Key 或权限"`——错误分类正确，无原始错误文本/密钥回显。
- server 日志扫描：真 key 前缀、DeepSeek key、错 key 均 0 处出现。
- 恢复正确 key → test-connection 立即 success（见 d) 热生效）。

### d) 改参数下次调用生效不重启 ✅

- 供应商侧：换 key 不重启，下一次 test-connection 即用新 key（错→失败、复→成功，单例经修订键重建）。
- 模型/地址侧：PUT baseUrl 指向本地回显服务 + temperature 0.7→1.3 → 下一次调用捕获出站 payload `"temperature": 1.3`（旧单例未复用），恢复后真实网关立即回绿。

### e) 旧 graph 不改可执行、旧会话可打开 ✅（等价覆盖，见 §3 限制）

- 本地库为全新空库（无 0.2.1 存量 graph/会话），以等价方式回归：新建最小 START→END 图发布执行 `success=true, output 透传`（旧图零迁移路径：LLM 节点无模板时直接以 input 为用户消息的兼容行为在解释器中保留并有单测覆盖）。
- 无 LLM 引用的旧图执行链路、执行历史落库（sw_agent_graph_execution / _node）均正常。

## 2. 本轮发现并修复的四缺陷（commit `f3589d71`，328/328 单测绿）

1. **V0.2.2 迁移 enabled 列类型**：SMALLINT vs 实体 `Boolean`——H2 宽容强转掩盖，PG 真实写入 500。DDL 改 `BOOLEAN NOT NULL DEFAULT TRUE`（对齐 notify_* / resource_policy 新表惯例），D022-03 搬迁 SELECT 布尔化 `c.enabled <> 0`。本地库 drop 两空表 + 删 flyway 行后由修复版迁移重建。
2. **装配模板双 token 参数**：builder `maxCompletionTokens` + ChatRequest `maxOutputTokens` 同时序列化 → Command Code 网关 400 `conflicting_token_limits`（本地回显服务抓包定位）。改用 `maxTokens`（与 ChatRequest 同槽互覆，单字段，任意兼容网关最通用）。
3. **乐观锁失效断链（热生失效效）**：provider/model update 实体不带 version → MP 乐观锁不自增 → D022-04 修订键不变 → 单例永不重建（换 key 不生效，首轮错密钥测试实证）。update 携带旧 version + 0 行命中显式冲突。
4. **图执行 config 数值 id 仅收 Number**：全局 Jackson Long→String（防 JS 精度丢失）导致 graph_json 落库后 `agentModelConfigId`/`maxIterations` 均为字符串——任何含 LLM 节点的已发布图执行即 400。执行/调试两链路（Interpreter/ExecutionServiceImpl/DebugServiceImpl/DebugEngine）统一经 `parseConfigLong`（Number + 数字字符串）。

## 3. 限制与偏差记录

- ANTHROPIC 格式未在 Command Code 网关验证（该网关 /messages 仅服务 claude 系且当前计划 403），按用户指示改用 DeepSeek 官方 Anthropic 兼容端点——装配与协议验证目标不受影响。
- "旧 graph/旧会话"回归为等价覆盖（空库无存量），存量数据回归需在有历史数据的库上补做。
- 验证用数据（3 供应商/3 模型/4 图定义/2 执行记录/2 图执行节点批次）均带 `verify-`/`verify-` 前缀，验收完成后已从本地库删除（见 §4）。

## 4. 清理记录（验收后执行）

- [x] 本地库删除：sw_agent_provider ×3（含两条 Command Code key 密文、一条 DeepSeek key 密文）、sw_agent_model ×3、sw_agent_graph_def ×4、sw_agent_graph_execution ×2 及节点轨迹
- [x] 停止本地 server（后台任务）、删除 sidecar `C:/Users/hjxch/app-verify.yml`、回显服务与捕获文件 `captured-lc4j.txt`
- [x] 密钥从未写入任何仓库文件/迁移/种子/日志（已扫描确认）

—— 回执生成：2026-11-04，executor 会话
