# 下一功能候选探索回执（2026-08-21）

## 探索结论

推荐 **M07-F02-02 Prompt 配置** 为唯一候选。基于代码直读和知识库核对，七组候选全部核实完毕。

---

## 一、各候选：已有 / 缺口 / 迁移

| 候选 | 已有基础 | 关键缺口 | 迁移 |
|------|----------|----------|:----:|
| **C1 M07-F02-02 Prompt** | GraphElement.config通道; LlmPanel(三字段); callModel()可加systemPrompt | 无promptTemplate/systemPrompt键; Interpreter未解析新config | ❌ |
| **C2 M07-F04-02 Token** | ChatResponse.usage已调用但未提取 | Entity/DTO/type全线无token; 需F01+F02采集 | ✅V35+ |
| **C3 P7单步调试** | NodeExecutionTrace(V28)有trace; 三个只读端点 | 无断点语义; 无step API; 需改执行模型 | ⚠️ |
| **C4 助手/RAG/SSE** | Conversation list只读; Session/Messages表 | 无聊天执行端点; 无Assistant; RAG零代码; SSE从零 | ✅ |
| C5-M03表单(I38-I40) | FormDesigner/FormRender前端; CRUD骨架 | 控件8/17; 无DELETE(I39); 列表配置自动派生 | ❌ |
| C5-M05通知(I41-I42) | NotifyFacade.send(); GET/msg+POST/read | 无删除(I41); 无过滤(I42); Send无公开API | ❌ |
| C6 IoT | IotAutoConfig(+MqttProperties) | 零ECSS; IotHome.vue占位 | ✅ |
| C7 OpenAPI | package-info ×2 | **纯空壳**; OpenapiHome占位 | ✅ |

---

## 二、前三优先候选分析

### C1 — Prompt 配置（第1名）
**复用**：config通道零迁移存prompt; callModel()可传systemPrompt给Spring AI; LlmPanel扩展textarea; agent:model:manage(V33)已注册。**迁移/契约**：DB零迁移，仅graphAdapter.ts加常量。**未定问题**：prompt模板语言——MVP用纯字符串插值。

### C2 — Token 统计（第2名）
**复用**：ChatResponse.usage已调用但丢弃; Spring AI API稳定。**迁移/契约**：**必须V35+迁移**在execution加token列，Factory(F01)+Interpreter(F02)两处采集。

### C3 — 单步调试（第3名）
**复用**：NodeExecutionTrace机制固化; RUNNING/SUCCESS/FAILED状态机。**迁移/契约**：需Debug抽象层+Breakpoint管理; LangGraph4j不支持断点，需改造。

---

## 三、最小端到端闭环边界

| 候选 | 闭环 | 复杂度 |
|------|------|:------:|
| C1 | 后端2引擎读config + 前端LlmPanel→1次图执行验证 | 最低 |
| C2 | V35迁移+entity/DTO+usage采集+前端展示 | 低中 |
| C3 | 解释器改造+断点+control API+调试UI | 高 |
| C4 | 至少3子功能各自排期，无法单一闭环 | — |
| C5-M03/M05 | M03多Step; M05 delete+filter较完整 | 中 |
| C6/C7 | 从0建Module纵向打通 | 高 |

---

## 四、六项评价与唯一推荐

| 候选 | 用户价值 | 复用基础 | 契约确定性 | 跨栈风险 | 验证可行性 | M07连续性 |
|------|:--------:|:--------:|:----------:|:--------:|:----------:|:---------:|
| **C1 Prompt** | **高** | **高** | **高** | **低** | **高** | **高** |
| C2 Token | 中 | 中 | 高 | 中 | 中 | 中 |
| C3 单步调试 | 高 | 中 | 中 | 高 | 低 | 高 |
| C4 助手/RAG/SSE | 高 | 极低 | 低 | 极高 | 低 | 中 |
| C5-M03/M05 | 中~中低 | 中 | 高 | 中 | 高 | — |
| C6/C7 | 低 | 极低 | 低 | 中 | 低 | — |

**推荐：C1 M07-F02-02 Prompt 配置**

理由：①M07占已完成功能80%，补齐F02最连续; ②技术风险最低(config零迁移改动面小); ③复用最好(LlmPanel可扩展+Engine链直接拦截); ④闭环最小(后端2引擎+前端1面板→1次图执行可验); ⑤无未定产品问题(不同C4选型/C3架构)。

**改变选择的关键问题**：若token看板优先于prompt则C2为首选——但实施复杂度高于C1且偏运营侧。

---

## 五、冲突核查

无冲突。current-status基线、功能清单、known-issues、requirement-pool均与代码实证一致。

---

## 六、证据索引

| 发现 | 路径 |
|------|------|
| GraphElement.config不透明Map | `sw-basic-agent/.../dto/graph/GraphElement.java` L32-35 |
| callModel Prompt构造(Spring AI) | `.../orchestration/AgentGraphFactory.java` L175-187 |
| Interpreter config语义 | `.../AgentGraphInterpreter.java` doc comment |
| 执行实体无token字段 | `.../entity/AgentGraphExecution.java` |
| LlmPanel仅三字段 | `Web/src/modules/agent/views/panels/LlmPanel.vue` |
| graphAdapter键常量 | `Web/src/modules/agent/utils/graphAdapter.ts` L21-27 |
| NotifyController无DELETE | `.../notify/controller/NotifyController.java` |
| Form无DELETE | grep: FormDefController 9端点无DeleteMapping |
| IoT仅AutoConfig | `.../iot/config/IotAutoConfiguration.java` |
| OpenAPI空壳 | `sw-biz-openapi-api/biz/package-info.java` ×2 |

**范围**：2026-08-21，后端sw-basic-agent(66文件)+form/notify/iot/openapi+前端对应.all vue/ts+Flyway V1-V34+文档。
**合规**：未改任何代码/配置/知识文件; 未运行mvn/pnpm/node/db; 未生成需求方向。

**执行终态：COMPLETED**
