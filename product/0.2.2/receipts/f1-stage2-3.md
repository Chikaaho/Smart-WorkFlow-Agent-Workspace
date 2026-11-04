# F1 阶段 2 补充执行回执（第 3 轮）

- 执行入口：`product/0.2.2/receipts/planning-execution-prompt-f1-stage2-02.md`
- 代码状态：web `feature/0.2.2-agent` @ `10c5f50`；server 本轮未改动，仍为 `feature/0.2.2-agent` @ `6aa674d9`
- 远端回读（`git ls-remote origin`）：
  - Web：`10c5f50455b9a6c089f2581bfb3ca932fa53d5b9`
  - Server：`6aa674d935ce2ccbeaf2a0d8fe8d97eea8548411`
- 验证环境：本地 PG 18（`smart_workflow_f1v4b`，沿用保留库）、server 8080（local profile）、vite 5174；可见浏览器（ZCode 应用内浏览器，headless=false，1440×900）。
- 本轮边界：只改 Token 合计计算与显示，未改 Token 采集，未调用真实模型。

## 一、F1S2-G4 总 Token 字符串拼接 ✅

### 原因（前端计算位置，数值以字符串到达）

- 后端全局 Jackson 配置 `JacksonLongToStringConfig` 把所有 `Long` 序列化为字符串（雪花 id 精度保护）。`inputTokens/outputTokens` 在 DTO 中是 `Long`，因此前端实际收到 `"728"`、`"104"`，而不是数字。
- 前端契约把 Token 字段声明为 `number`，编译期无法发现问题；以下 4 处直接使用 `+` 或 `+=`，运行时变成字符串拼接：
  1. `ExecutionList.vue` → `totalTokensOf()`：`return input + output`（列表“总 Token”列）。
  2. `ExecutionDetail.vue` → `totalTokens`：`return input + output`（详情“Token 使用统计”）。
  3. `DebugSessionView.vue` → `totalTokens`：`return i + o`（调试会话 Token 汇总）。
  4. `ConversationDetail.vue` → `tokenSummary`：`totalInput += msg.inputTokens` / `totalOutput += msg.outputTokens`，再 `totalInput + totalOutput`（会话消息汇总）。
- 因此出现 728104、11、22、128 等错误显示。

### 修复

- 新增 `src/modules/agent/utils/token.ts`：
  - `toTokenNumber()`：`number | string | null` → number；缺失/空串/非法文本/负数 → `null`（未知）。
  - `sumTokens()`：先归一化再相加；任一侧未知返回 `null`，不以 0 补齐。
- 上述 4 处合计全部改用 `sumTokens()/toTokenNumber()`；执行列表、执行详情、调试页、节点轨迹、会话详情的单值格式化也统一走归一化，字符串 `"1234"` 可正常按千分位显示。
- 工作台“最近执行”表没有 Token 列，无需修改；已检查无其他 Token 合计位置。

### 单测

| 用例 | 结果 |
|---|---|
| `token.spec.ts` — `F1S2-G4: 字符串数值按数值相加（728 + 104 = 832）` | 通过 |
| `token.spec.ts` — `F1S2-G4: 数字与字符串混合时仍按数值相加` | 通过 |
| `token.spec.ts` — `F1S2-G4: 任一侧未知时合计为 null，不以 0 补齐` | 通过 |
| `token.spec.ts` — `toTokenNumber 保留 0，并将非法文本视为未知` | 通过 |
| `ExecutionDetail.spec.ts` — `F1S2-G4: 字符串 Token 按数值相加 - 728/104 显示总 832 而非 728104` | 通过 |
| `ExecutionList.spec.ts` — `F1S2-G4: 列表 Token 为字符串时按数值相加 - 728/104 总 832 而非 728104` | 通过 |
| `ConversationDetail.spec.ts` — `F1S2-G4: 字符串 Token 按数值聚合 - 10/20 + 30/40 总 100` | 通过 |

定向 5 个测试文件 81 用例通过；全量 vitest 见门禁。

### 浏览器复验（可见浏览器）

- 执行历史列表（截图 `assets/f1-stage2-3-g4-executions.png`）：
  - `verify-real-tool-graph`：输入 728 / 输出 104 / **总 832**（原先 728104）；
  - `verify-tool-graph`：1 / 1 / **2**（原先 11）；
  - `verify-tool-graph`：2 / 2 / **4**（原先 22）；
  - `verify-tool-graph`：12 / 8 / **20**（原先 128）；
  - `verify-timeout-graph`：输入/输出/总均为“未知”，未显示 0。
- 执行详情（截图 `assets/f1-stage2-3-g4-execution-detail.png`，执行 `2117852944224350209`）：输入 728 / 输出 104 / **总 832**。

## 二、门禁结果

| 项 | 结果 | 原始输出 |
|---|---|---|
| Web typecheck | 0 错误 | — |
| Web lint | 0 错误 | — |
| Web vitest | **2012 passed + 3 skipped**（231 文件通过/1 跳过） | `assets/f1-stage2-3-web-vitest.log` |
| Web build | ✓ built in 4.48s | — |

本轮未改后端，未补跑服务端测试。

## 三、Key 与清理

- 本轮未调用真实模型，未读取或输出任何 Key。
- 本地验证库 `smart_workflow_f1v4b` 保留；真实 Key 仍只以 AES-GCM 密文存在于 `sw_agent_provider.api_key_cipher`。
- 验证用 server/vite 进程已停止，临时日志目录已删除。
