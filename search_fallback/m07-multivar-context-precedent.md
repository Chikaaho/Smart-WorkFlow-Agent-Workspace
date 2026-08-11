# 探索回执：M07「多变量执行上下文」前置调研

**执行时间**：2026-08-11
**执行模型**：deepseek/deepseek-v4-flash
**任务文件**：`search_task/m07-multivar-context-precedent.md`
**结论**：7 问全部有现场证据；文件均为磁盘现存内容完整贴出。Step8 归档描述与现场一致（无偏差需纠正）。

---

## 问题 1：`AgentGraphInterpreter.java` 当前真实完整源码

**文件路径**（现场确认）：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphInterpreter.java`

全文（361 行，磁盘现存完整内容）：

```java
package com.sw.ck.agent.orchestration;

import com.sw.ck.agent.dto.graph.GraphElement;
import com.sw.ck.agent.dto.graph.ProcessGraph;
import com.sw.ck.agent.entity.AgentModelConfig;
import com.sw.ck.common.crypto.AesGcmCipher;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.ai.util.json.JsonParser;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 图解释执行引擎（M07-F02 Step8 第一版，纯 Java 无 Spring 注解，可独立单测）。
 * <p>
 * 直接解释 {@link ProcessGraph#getElements()}（Step7 产物）：从唯一 START 节点出发，
 * 按 elements 顺序遍历节点与边，执行 LLM 节点（单跳调用，无工具无历史）/工具节点
 * （按名称精确定位单个 {@link ToolCallback} 直接调用）/条件分支节点（关键词子串匹配
 * 选路），直到 END 节点，返回最终累积文本。
 * </p>
 * <p>
 * <b>执行上下文（本版极简）</b>：单一 {@code String currentText}（初始 = 请求
 * {@code input}），LLM/工具节点输出<b>整体覆盖</b>（非追加、非结构化多变量），
 * END 时 currentText 即为最终 output。多变量执行上下文是后续批次演进方向，本版不做。
 * </p>
 * <p>
 * <b>与 F01 的关系（方案 §2-A）</b>：本类是与 {@link AgentGraphFactory}/LangGraph4j
 * 并存的独立执行路径，互不修改、互不依赖。F01 是"LLM 自主决定是否调工具"的单跳
 * agentic 调用；本类是"用户显式画出的多步顺序，工具何时调、条件怎么分支由图拓扑
 * 决定"的图解释执行——复用更底层的构造块 {@link ChatModelFactory#build} 与
 * {@link AgentToolCallbackFactory#buildToolCallbacks}，但以不同方式调用：
 * LLM 节点按 {@code config.agentModelConfigId} 指向单个配置单跳调用；
 * 工具节点从白名单装载结果中<b>按名称精确定位单个</b> {@link ToolCallback} 调用，
 * 而非像 F01 把全部工具注入 LLM。
 * </p>
 * <p>
 * <b>节点 config 语义（本 Step 定义的执行契约）</b>：LLM 节点
 * {@code config.agentModelConfigId}（Long，必填）；TOOL 节点
 * {@code config.toolName}（String，必填）；CONDITION 出边
 * {@code config.keyword}（String，可选，空/null 的边为默认边）。config 其余字段仍为
 * 不透明 Map 原样透传（Step7 禁令），本类只消费上述三个已定义键。
 * </p>
 * <p>
 * <b>明文 API Key 生命周期</b>（对齐 F01 惯例）：解密出的明文 Key 仅存在于局部变量，
 * 用于当次 {@code ChatModelFactory.build}，finally 中置 null，不进日志/异常/响应。
 * </p>
 * <p>
 * <b>死循环防护</b>：{@code maxSteps}（由调用方按 elements 节点数 × 2 计算）硬上限，
 * 超限抛 {@link GraphExecutionException}，不无限执行。
 * </p>
 *
 * @see GraphExecutionException
 */
public class AgentGraphInterpreter {

    // ==================== 节点类型常量（String 非 enum，D52 精神） ====================

    /** 开始节点 */
    public static final String NODE_TYPE_START = "START";

    /** 结束节点 */
    public static final String NODE_TYPE_END = "END";

    /** LLM 节点（config.agentModelConfigId 指定模型配置） */
    public static final String NODE_TYPE_LLM = "LLM";

    /** 工具节点（config.toolName 指定白名单工具） */
    public static final String NODE_TYPE_TOOL = "TOOL";

    /** 条件分支节点（纯路由点，按出边 config.keyword 子串匹配选路） */
    public static final String NODE_TYPE_CONDITION = "CONDITION";

    // ==================== 节点 config 键（本 Step 定义的执行契约） ====================

    /** LLM 节点 config 键：模型配置 id（Long） */
    public static final String CONFIG_KEY_AGENT_MODEL_CONFIG_ID = "agentModelConfigId";

    /** TOOL 节点 config 键：白名单工具名（String） */
    public static final String CONFIG_KEY_TOOL_NAME = "toolName";

    /** CONDITION 出边 config 键：关键词（String，空/null 的边为默认边） */
    public static final String CONFIG_KEY_KEYWORD = "keyword";

    // ==================== 依赖（纯构造注入，无 Spring 注解，可 mock 单测） ====================

    private final ChatModelFactory chatModelFactory;

    private final AgentToolCallbackFactory toolCallbackFactory;

    /** LLM 节点引用的模型配置（执行前校验已确认全部可解析到租户内配置，此处直接消费） */
    private final Map<Long, AgentModelConfig> modelConfigs;

    private final AesGcmCipher cipher;

    /** 工具白名单装载的租户过滤条件（null 时不显式过滤，由 MyBatis-Plus 租户拦截器隔离） */
    private final Long tenantId;

    /** 执行步数硬上限（防死循环兜底，调用方按 elements 节点数 × 2 计算） */
    private final int maxSteps;

    /**
     * @param chatModelFactory    动态模型客户端工厂（F01 既有，只读复用）
     * @param toolCallbackFactory 工具回调工厂（F01 既有，只读复用；null 时 TOOL 节点抛错）
     * @param modelConfigs        图内全部 LLM 节点引用的模型配置（id → 配置，执行前校验产物）
     * @param cipher              AES 解密器（解密 apiKeyCipher）
     * @param tenantId            当前租户（透传给工具白名单装载）
     * @param maxSteps            执行步数上限（防死循环）
     */
    public AgentGraphInterpreter(ChatModelFactory chatModelFactory,
                                 AgentToolCallbackFactory toolCallbackFactory,
                                 Map<Long, AgentModelConfig> modelConfigs,
                                 AesGcmCipher cipher,
                                 Long tenantId,
                                 int maxSteps) {
        this.chatModelFactory = chatModelFactory;
        this.toolCallbackFactory = toolCallbackFactory;
        this.modelConfigs = modelConfigs;
        this.cipher = cipher;
        this.tenantId = tenantId;
        this.maxSteps = maxSteps;
    }

    /**
     * 解释执行整图：START → 按 elements 顺序走节点/边 → END，返回最终累积文本。
     *
     * @param graph 已发布图（Step7 产物，config 不透明字段按本类契约消费）
     * @param input 请求入参文本（初始累积文本）
     * @return END 节点处的最终累积文本
     * @throws GraphExecutionException 条件分支无匹配且无默认边 / 步数超限 / 拓扑非法等运行时错误
     */
    public String run(ProcessGraph graph, String input) {
        List<GraphElement> elements = graph.getElements();
        GraphElement current = findStart(elements);
        String text = input;
        int steps = 0;
        while (!NODE_TYPE_END.equals(current.getType())) {
            if (++steps > maxSteps) {
                throw new GraphExecutionException("执行步数超限，图可能存在环路");
            }
            switch (current.getType()) {
                case NODE_TYPE_LLM -> text = callLlmNode(current, text);
                case NODE_TYPE_TOOL -> text = callToolNode(current, text);
                // START/CONDITION 为纯路由点，不动累积文本
                case NODE_TYPE_START, NODE_TYPE_CONDITION -> { }
                default -> throw new GraphExecutionException(
                        "不支持的节点类型: " + current.getType() + "（节点 " + current.getId() + "）");
            }
            current = findNode(nextNodeId(current, elements, text), elements);
        }
        return text;
    }

    // ==================== LLM 节点 ====================

    /**
     * LLM 节点执行：config.agentModelConfigId → 解密 Key → {@code ChatModelFactory.build}
     * → 以当前累积文本为 UserMessage 单跳调用（不带工具、不带历史）→ 输出覆盖累积文本。
     */
    private String callLlmNode(GraphElement node, String text) {
        Long modelConfigId = requireConfigId(node, CONFIG_KEY_AGENT_MODEL_CONFIG_ID);
        AgentModelConfig modelConfig = modelConfigs.get(modelConfigId);
        if (modelConfig == null) {
            // 执行前校验已拦截（PARAM_ERROR），此处为防御性兜底
            throw new GraphExecutionException("LLM 节点引用的模型配置不存在: " + modelConfigId);
        }
        String plainApiKey = null;
        try {
            if (modelConfig.getApiKeyCipher() != null && !modelConfig.getApiKeyCipher().isEmpty()) {
                plainApiKey = cipher.decrypt(modelConfig.getApiKeyCipher());
            }
            ChatModel chatModel = chatModelFactory.build(modelConfig, plainApiKey);
            ChatResponse response = chatModel.call(new Prompt(new UserMessage(text)));
            String output = response.getResult().getOutput().getText();
            if (output == null) {
                throw new GraphExecutionException("LLM 节点未返回文本: " + node.getId());
            }
            return output;
        } finally {
            plainApiKey = null;
        }
    }

    // ==================== TOOL 节点 ====================

    /**
     * TOOL 节点执行：config.toolName → 白名单装载结果中按名称精确匹配单个
     * {@link ToolCallback} → 以当前累积文本为入参直接调用 → 返回文本覆盖累积文本。
     * <p>
     * 与 F01 的区别：F01 把全部启用工具注入 LLM 由模型自行决定；本节点由图的拓扑
     * 决定调用哪个工具，只定位这一个回调并直接调用。每次执行即时装载（工厂非启动
     * 缓存语义：白名单配置变更即时生效）。
     * </p>
     */
    private String callToolNode(GraphElement node, String text) {
        String toolName = requireConfigString(node, CONFIG_KEY_TOOL_NAME);
        if (toolCallbackFactory == null) {
            throw new GraphExecutionException("工具工厂未装配，无法执行 TOOL 节点: " + toolName);
        }
        ToolCallback target = toolCallbackFactory.buildToolCallbacks(tenantId).stream()
                .filter(cb -> toolName.equals(cb.getToolDefinition().name()))
                .findFirst()
                .orElseThrow(() -> new GraphExecutionException(
                        "TOOL 节点引用的工具不存在或未启用: " + toolName));
        // 工具回调契约（与 F01 一致，工厂回执 §3 实测）：FunctionToolCallback 的 call()
        // 入参为 JSON 字符串字面量（LLM 按 {"type":"string"} schema 发送），白名单方法
        // 收到 JSON 编码字符串；返回值同样经 JSON 编码（实测 "echo:你好" → "\"echo:你好\""）。
        // 解释器把累积文本 JSON 编码后传入，并把返回的编码文本解码还原为纯文本后覆盖
        // 累积文本（图执行上下文是给下游节点/最终输出使用的用户可读文本，与 F01 中
        // LLM 直接消费编码文本的用途不同）。
        String result = target.call(JsonParser.toJson(text));
        String decoded = decodeIfJsonString(result);
        if (decoded == null) {
            throw new GraphExecutionException("TOOL 节点未返回文本: " + node.getId());
        }
        return decoded;
    }

    // ==================== 条件分支与选路 ====================

    /**
     * 确定下一节点 id：CONDITION 节点按 §2-C 关键词子串匹配（elements 原始顺序即优先级，
     * 不排序）；其余节点取唯一出边。
     *
     * @throws GraphExecutionException 条件无匹配且无默认边 / 默认边不唯一 / 出边数量非法
     */
    private String nextNodeId(GraphElement current, List<GraphElement> elements, String text) {
        List<GraphElement> edges = outgoingEdges(current, elements);
        if (NODE_TYPE_CONDITION.equals(current.getType())) {
            // 按 elements 出现顺序逐条匹配关键词，取第一个命中（不排序，原始顺序即优先级）
            for (GraphElement edge : edges) {
                String keyword = keywordOf(edge);
                if (keyword != null && text.contains(keyword)) {
                    return edge.getTarget();
                }
            }
            // 未命中 → 唯一无 keyword 边为默认边；默认边不存在 → 图设计缺陷，不静默吞掉
            List<GraphElement> defaultEdges = edges.stream()
                    .filter(e -> keywordOf(e) == null)
                    .toList();
            if (defaultEdges.size() == 1) {
                return defaultEdges.get(0).getTarget();
            }
            if (defaultEdges.isEmpty()) {
                throw new GraphExecutionException("条件分支无匹配且无默认边: " + current.getId());
            }
            throw new GraphExecutionException("条件分支默认边不唯一: " + current.getId());
        }
        // 非条件节点：必须且只能有一条出边（START/END/LLM/TOOL）
        if (edges.isEmpty()) {
            throw new GraphExecutionException("节点没有出边，无法继续执行: " + current.getId());
        }
        if (edges.size() > 1) {
            throw new GraphExecutionException("非条件节点的出边不唯一: " + current.getId());
        }
        return edges.get(0).getTarget();
    }

    /**
     * 读取边的条件关键词（执行契约键 {@code config.keyword}）：无 config / 键缺失 /
     * 值非 String / 空串均视为"无关键词"（该边为默认边候选）。
     */
    public static String keywordOf(GraphElement edge) {
        Map<String, Object> config = edge.getConfig();
        if (config == null) {
            return null;
        }
        Object keyword = config.get(CONFIG_KEY_KEYWORD);
        if (!(keyword instanceof String s) || s.isBlank()) {
            return null;
        }
        return s;
    }

    /** 当前节点的出边列表（kind=edge 且 source == 节点 id），按 elements 出现顺序 */
    private List<GraphElement> outgoingEdges(GraphElement node, List<GraphElement> elements) {
        List<GraphElement> edges = new ArrayList<>();
        for (GraphElement element : elements) {
            if ("edge".equals(element.getKind()) && node.getId().equals(element.getSource())) {
                edges.add(element);
            }
        }
        return edges;
    }

    // ==================== 内部辅助 ====================

    /** 定位唯一 START 节点（执行前校验已保证唯一，此处防御性兜底） */
    private GraphElement findStart(List<GraphElement> elements) {
        for (GraphElement element : elements) {
            if ("node".equals(element.getKind()) && NODE_TYPE_START.equals(element.getType())) {
                return element;
            }
        }
        throw new GraphExecutionException("图中不存在 START 节点");
    }

    /**
     * 工具返回解码：JSON 字符串字面量（如 {@code "hello"}）解码还原为纯文本；
     * 非 JSON 字符串（如外部工具返回的裸文本/JSON 对象）原样保留，不做转换。
     */
    private String decodeIfJsonString(String result) {
        if (result == null) {
            return null;
        }
        try {
            return JsonParser.fromJson(result, String.class);
        } catch (Exception e) {
            return result;
        }
    }

    /** 按 id 定位节点（防御：边引用了不存在的节点） */
    private GraphElement findNode(String id, List<GraphElement> elements) {
        for (GraphElement element : elements) {
            if ("node".equals(element.getKind()) && id.equals(element.getId())) {
                return element;
            }
        }
        throw new GraphExecutionException("边引用了不存在的节点: " + id);
    }

    /** 读取节点 config 中的 Long 型必填键（缺失/非数值 → 运行时错误，防御性兜底） */
    private Long requireConfigId(GraphElement node, String key) {
        Map<String, Object> config = node.getConfig();
        if (config == null || !(config.get(key) instanceof Number n)) {
            throw new GraphExecutionException("节点缺少 " + key + ": " + node.getId());
        }
        return n.longValue();
    }

    /** 读取节点 config 中的 String 型必填键（缺失/空白 → 运行时错误，防御性兜底） */
    private String requireConfigString(GraphElement node, String key) {
        Map<String, Object> config = node.getConfig();
        if (config == null || !(config.get(key) instanceof String s) || s.isBlank()) {
            throw new GraphExecutionException("节点缺少 " + key + ": " + node.getId());
        }
        return s;
    }

    /**
     * 图执行运行时错误（Step8 定义）：条件分支无匹配且无默认边 / 步数超限（疑似环路）/
     * 拓扑非法（出边数量、悬空引用、未知节点类型等）。由执行 Service 捕获并转
     * {@code success=false} + errorMessage（不上抛，与 F01 run() success=false 语义一致）。
     */
    public static class GraphExecutionException extends RuntimeException {

        public GraphExecutionException(String message) {
            super(message);
        }

        public GraphExecutionException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
```

### 关键结论（供规划层直接使用）

| 项 | 现场事实 |
|---|---|
| `run()` 签名 | `public String run(ProcessGraph graph, String input)`，返回 `String`（第 136 行） |
| 累积文本传递 | **方法体局部变量** `String text = input`（第 139 行），非字段；在 `while` 循环中逐节点赋值、传给 `nextNodeId(current, elements, text)` 做条件匹配（第 153 行） |
| `callLlmNode` | `private String callLlmNode(GraphElement node, String text)` → `String`（第 164 行），输出整体覆盖入参 text |
| `callToolNode` | `private String callToolNode(GraphElement node, String text)` → `String`（第 199 行），同上 |
| 条件匹配 | `nextNodeId(GraphElement current, List<GraphElement> elements, String text)` → `String`（第 231 行），`text.contains(keyword)` 子串匹配 |
| 字段 | 全部为构造注入依赖（chatModelFactory/toolCallbackFactory/modelConfigs/cipher/tenantId/maxSteps），**无任何执行期可变状态字段**——解释器实例本身无状态，多变量上下文如落地为字段或传入参数均可，当前结构两者都不冲突 |
| 无"变量名"语义 | 全文无 variable/varName/inputVar/outputVar 字段或键 |

---

## 问题 2：`AgentGraphExecutionServiceImpl.java` + 两个执行 DTO 当前真实完整源码

### `AgentGraphExecutionServiceImpl.java`

**文件路径**：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImpl.java`

全文（323 行，磁盘现存完整内容）：

```java
package com.sw.ck.agent.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sw.ck.agent.dto.AgentGraphExecuteRespDTO;
import com.sw.ck.agent.dto.graph.GraphElement;
import com.sw.ck.agent.dto.graph.ProcessGraph;
import com.sw.ck.agent.entity.AgentGraphDef;
import com.sw.ck.agent.entity.AgentModelConfig;
import com.sw.ck.agent.entity.tool.AgentToolExternalConfig;
import com.sw.ck.agent.entity.tool.AgentToolInternalConfig;
import com.sw.ck.agent.mapper.AgentGraphDefMapper;
import com.sw.ck.agent.mapper.AgentModelConfigMapper;
import com.sw.ck.agent.mapper.tool.AgentToolExternalConfigMapper;
import com.sw.ck.agent.mapper.tool.AgentToolInternalConfigMapper;
import com.sw.ck.agent.orchestration.AgentGraphInterpreter;
import com.sw.ck.agent.orchestration.AgentToolCallbackFactory;
import com.sw.ck.agent.orchestration.ChatModelFactory;
import com.sw.ck.agent.service.AgentGraphExecutionService;
import com.sw.ck.common.crypto.AesGcmCipher;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import com.sw.ck.common.security.LoginContextProvider;
import com.sw.ck.common.service.BaseServiceImpl;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Agent 图执行 Service 实现（M07-F02 Step8 图解释执行引擎第一版）。
 * <p>
 * 流程（方案 §5）：加载图定义（requireEntity，NOT_FOUND 语义同 Step7）→ 校验
 * PUBLISHED → 反序列化 graph_json → 执行前校验（方案 §2-D 五项，任一失败即
 * PARAM_ERROR + 具体原因，不做部分执行）→ 调 {@link AgentGraphInterpreter} 解释执行。
 * </p>
 * <p>
 * <b>错误语义</b>：校验失败 → {@link BaseException}（全局惯例 HTTP 200 + body.code）；
 * 运行时错误（条件无匹配且无默认边 / 步数超限 / 模型或工具调用异常）→
 * {@code success=false} + errorMessage 返回（不上抛，与 F01 run() 语义一致）；
 * 不存在的 graphDefId / 跨租户 → NOT_FOUND。本 Step 不落库（不写会话/消息表，
 * 不新建执行日志表），返回值即结果。
 * </p>
 * <p>
 * <b>LLM 节点模型配置</b>：执行前校验一次性加载图内全部 LLM 节点引用的
 * {@link AgentModelConfig}（租户拦截器自动隔离）并传给解释器——单一查询、无
 * 校验与执行之间的 TOCTOU 窗口，解释器保持纯 Java 无 DB 访问。
 * </p>
 */
@Service
public class AgentGraphExecutionServiceImpl
        extends BaseServiceImpl<AgentGraphDefMapper, AgentGraphDef>
        implements AgentGraphExecutionService {

    /** 状态常量（varchar + String，不建 enum 类，D52 决策） */
    private static final String STATUS_PUBLISHED = "PUBLISHED";

    private final ObjectMapper objectMapper;
    private final AgentModelConfigMapper modelConfigMapper;
    private final AgentToolInternalConfigMapper internalToolMapper;
    private final AgentToolExternalConfigMapper externalToolMapper;
    private final ChatModelFactory chatModelFactory;
    private final AesGcmCipher cipher;
    private final LoginContextProvider loginContextProvider;

    /**
     * 工具回调工厂（可选注入，与 F01 同款模式）：{@code sw.agent.enabled} 未开启时
     * 为 null，TOOL 节点执行时由解释器抛运行时错误转 success=false。
     */
    @Autowired(required = false)
    private AgentToolCallbackFactory agentToolCallbackFactory;

    public AgentGraphExecutionServiceImpl(ObjectMapper objectMapper,
                                          AgentModelConfigMapper modelConfigMapper,
                                          AgentToolInternalConfigMapper internalToolMapper,
                                          AgentToolExternalConfigMapper externalToolMapper,
                                          ChatModelFactory chatModelFactory,
                                          AesGcmCipher cipher,
                                          LoginContextProvider loginContextProvider) {
        this.objectMapper = objectMapper;
        this.modelConfigMapper = modelConfigMapper;
        this.internalToolMapper = internalToolMapper;
        this.externalToolMapper = externalToolMapper;
        this.chatModelFactory = chatModelFactory;
        this.cipher = cipher;
        this.loginContextProvider = loginContextProvider;
    }

    @Override
    public AgentGraphExecuteRespDTO execute(Long graphDefId, String input) {
        // 参数校验（对齐 F01 run() 校验惯例：Service 层手动校验）
        if (input == null || input.isBlank()) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR, "input 不能为空");
        }
        // NOT_FOUND（selectById 经租户拦截器自动过滤 tenant_id，同 Step7 requireEntity）
        AgentGraphDef entity = requireEntity(graphDefId);
        // 执行只认发布版本（草稿不可执行，对齐"发布版本是执行引用的稳定锚点"）
        if (!STATUS_PUBLISHED.equals(entity.getStatus())) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR, "图未发布，无法执行");
        }
        ProcessGraph graph = parseGraph(entity.getGraphJson());
        if (graph == null || graph.getElements() == null || graph.getElements().isEmpty()) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR, "图数据为空，无法执行");
        }
        // 执行前校验（§2-D）：任一失败即 PARAM_ERROR，不做部分执行；返回校验通过的
        // 模型配置映射（LLM 节点执行数据，解释器直接消费）
        Map<Long, AgentModelConfig> modelConfigs = validateForExecution(graph);

        long start = System.currentTimeMillis();
        AgentGraphExecuteRespDTO resp = new AgentGraphExecuteRespDTO();
        try {
            int nodeCount = (int) graph.getElements().stream()
                    .filter(e -> "node".equals(e.getKind()))
                    .count();
            // §2-E 死循环防护：maxSteps = 节点数 × 2（经验值，允许条件分支来回但不允许无限绕圈）
            String output = new AgentGraphInterpreter(chatModelFactory, agentToolCallbackFactory,
                    modelConfigs, cipher, loginContextProvider.getTenantId(), nodeCount * 2)
                    .run(graph, input);
            resp.setSuccess(true);
            resp.setOutput(output);
        } catch (Exception e) {
            // 运行时错误（GraphExecutionException / 模型或工具调用异常）：不上抛，
            // success=false + 异常摘要（与 F01 run() success=false 语义一致）
            resp.setSuccess(false);
            resp.setErrorMessage(summarizeError(e));
        }
        resp.setLatencyMs(System.currentTimeMillis() - start);
        return resp;
    }

    // ==================== 执行前校验（方案 §2-D） ====================

    /**
     * 执行前最小校验（非完整拓扑校验器，方案 §3 已裁定）：
     * ①PUBLISHED（调用方已校验）②唯一 START + 至少一个 END 可达 ③LLM 节点
     * agentModelConfigId 可解析到租户内 AgentModelConfig ④TOOL 节点 toolName 精确
     * 匹配 enabled=1 白名单 ⑤CONDITION 出边默认边唯一。
     *
     * @return 图内全部 LLM 节点引用的模型配置（id → 配置）
     */
    private Map<Long, AgentModelConfig> validateForExecution(ProcessGraph graph) {
        List<GraphElement> elements = graph.getElements();
        List<GraphElement> nodes = elements.stream()
                .filter(e -> "node".equals(e.getKind()))
                .toList();

        // —— ② START 唯一 ——
        List<GraphElement> starts = nodes.stream()
                .filter(n -> AgentGraphInterpreter.NODE_TYPE_START.equals(n.getType()))
                .toList();
        if (starts.size() != 1) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR,
                    "图中 START 节点必须唯一（当前 " + starts.size() + " 个）");
        }
        // —— ② 至少一个 END 可达（从唯一 START 沿边 BFS） ——
        if (!hasReachableEnd(starts.get(0), elements, nodes)) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR, "图中不存在可达的 END 节点");
        }

        // —— ③④⑤ 按节点类型逐项校验 ——
        Map<Long, AgentModelConfig> modelConfigs = new HashMap<>();
        for (GraphElement node : nodes) {
            switch (node.getType()) {
                case AgentGraphInterpreter.NODE_TYPE_LLM -> {
                    Object idObj = configValue(node, AgentGraphInterpreter.CONFIG_KEY_AGENT_MODEL_CONFIG_ID);
                    if (!(idObj instanceof Number n)) {
                        throw new BaseException(CommonErrorCode.PARAM_ERROR,
                                "LLM 节点缺少模型配置引用: " + node.getId());
                    }
                    Long modelConfigId = n.longValue();
                    AgentModelConfig mc = modelConfigMapper.selectById(modelConfigId);
                    if (mc == null) {
                        throw new BaseException(CommonErrorCode.PARAM_ERROR,
                                "LLM 节点引用的模型配置不存在: " + modelConfigId);
                    }
                    modelConfigs.put(modelConfigId, mc);
                }
                case AgentGraphInterpreter.NODE_TYPE_TOOL -> {
                    Object nameObj = configValue(node, AgentGraphInterpreter.CONFIG_KEY_TOOL_NAME);
                    if (!(nameObj instanceof String toolName) || toolName.isBlank()) {
                        throw new BaseException(CommonErrorCode.PARAM_ERROR,
                                "TOOL 节点缺少工具名: " + node.getId());
                    }
                    if (!toolExists(toolName)) {
                        throw new BaseException(CommonErrorCode.PARAM_ERROR,
                                "工具节点引用的工具不存在或未启用: " + toolName);
                    }
                }
                case AgentGraphInterpreter.NODE_TYPE_CONDITION -> {
                    // ⑤ 默认边唯一（≥2 条无 keyword 边 → 图非法）；0 条默认边允许通过
                    // 校验，运行时未命中关键词时由解释器抛 GraphExecutionException
                    long defaultEdgeCount = outgoingEdges(node, elements).stream()
                            .filter(e -> AgentGraphInterpreter.keywordOf(e) == null)
                            .count();
                    if (defaultEdgeCount > 1) {
                        throw new BaseException(CommonErrorCode.PARAM_ERROR,
                                "条件分支默认边不唯一: " + node.getId());
                    }
                }
                default -> { /* START/END 及其他：无执行前校验 */ }
            }
        }
        return modelConfigs;
    }

    /** 节点 config 读取（config 为不透明 Map，本校验只按执行契约读已定义键，null 安全） */
    private Object configValue(GraphElement node, String key) {
        return node.getConfig() == null ? null : node.getConfig().get(key);
    }

    /** 当前节点的出边列表（kind=edge 且 source == 节点 id），按 elements 出现顺序 */
    private List<GraphElement> outgoingEdges(GraphElement node, List<GraphElement> elements) {
        List<GraphElement> edges = new ArrayList<>();
        for (GraphElement element : elements) {
            if ("edge".equals(element.getKind()) && node.getId().equals(element.getSource())) {
                edges.add(element);
            }
        }
        return edges;
    }

    /** 从唯一 START 沿边 BFS，判断是否存在可达的 END 节点 */
    private boolean hasReachableEnd(GraphElement start, List<GraphElement> elements, List<GraphElement> nodes) {
        Map<String, String> typeById = new HashMap<>();
        for (GraphElement node : nodes) {
            typeById.put(node.getId(), node.getType());
        }
        Map<String, List<String>> adjacency = new HashMap<>();
        for (GraphElement edge : elements) {
            if ("edge".equals(edge.getKind()) && edge.getSource() != null && edge.getTarget() != null) {
                adjacency.computeIfAbsent(edge.getSource(), k -> new ArrayList<>()).add(edge.getTarget());
            }
        }
        Set<String> visited = new HashSet<>();
        Deque<String> queue = new ArrayDeque<>();
        queue.add(start.getId());
        while (!queue.isEmpty()) {
            String id = queue.poll();
            if (!visited.add(id)) {
                continue;
            }
            if (AgentGraphInterpreter.NODE_TYPE_END.equals(typeById.get(id))) {
                return true;
            }
            for (String next : adjacency.getOrDefault(id, List.of())) {
                if (!visited.contains(next)) {
                    queue.add(next);
                }
            }
        }
        return false;
    }

    /**
     * 工具白名单精确匹配：internal/external 两表任一存在 name 精确相等且 enabled=1 的记录。
     * enabled 用数字字面量 1（非 Boolean 参数）：H2/PG 下 SMALLINT 列比对惯例（Step4 现场实证）。
     */
    private boolean toolExists(String toolName) {
        Long internal = internalToolMapper.selectCount(
                Wrappers.<AgentToolInternalConfig>lambdaQuery()
                        .eq(AgentToolInternalConfig::getName, toolName)
                        .eq(AgentToolInternalConfig::getEnabled, 1));
        if (internal != null && internal > 0) {
            return true;
        }
        Long external = externalToolMapper.selectCount(
                Wrappers.<AgentToolExternalConfig>lambdaQuery()
                        .eq(AgentToolExternalConfig::getName, toolName)
                        .eq(AgentToolExternalConfig::getEnabled, 1));
        return external != null && external > 0;
    }

    // ==================== 内部辅助 ====================

    /** 按 id + 租户加载（selectById 经租户拦截器自动过滤），不存在抛 NOT_FOUND（同 Step7） */
    private AgentGraphDef requireEntity(Long id) {
        if (id == null) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR, "id 不能为空");
        }
        AgentGraphDef entity = baseMapper.selectById(id);
        if (entity == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND);
        }
        return entity;
    }

    private ProcessGraph parseGraph(String graphJson) {
        if (graphJson == null || graphJson.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readValue(graphJson, ProcessGraph.class);
        } catch (Exception e) {
            // 注：ServiceImpl 基类的 log 为 MyBatis Log 接口（org.apache.ibatis.logging.Log），
            // 不支持 {} 占位符，拼接消息（Step7 回执偏差 C 同款）
            log.warn("Failed to parse graph_json: " + e.getMessage());
            return null;
        }
    }

    /**
     * 异常摘要（对齐 F01 summarizeError）：沿 cause 链取最深层非空 message。
     * 只取 message 不含堆栈，杜绝明文 API Key 通过异常信息泄漏。
     */
    private String summarizeError(Throwable t) {
        Throwable cur = t;
        String best = null;
        while (cur != null) {
            if (cur.getMessage() != null && !cur.getMessage().isBlank()) {
                best = cur.getMessage();
            }
            cur = cur.getCause();
        }
        return best != null ? best : t.getClass().getSimpleName();
    }
}
```

### `AgentGraphExecuteReqDTO.java`

**文件路径**：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentGraphExecuteReqDTO.java`

全文（17 行）：

```java
package com.sw.ck.agent.dto;

import lombok.Data;

/**
 * 图执行请求 DTO（M07-F02 Step8）。
 * <p>
 * 极简执行上下文：单一 {@code input} 文本作为初始累积文本（本版无多变量上下文，
 * 方案 §2-B 简化边界）。
 * </p>
 */
@Data
public class AgentGraphExecuteReqDTO {

    /** 执行入参文本（初始累积文本，必填，空白拒绝） */
    private String input;
}
```

### `AgentGraphExecuteRespDTO.java`

**文件路径**：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentGraphExecuteRespDTO.java`

全文（28 行）：

```java
package com.sw.ck.agent.dto;

import lombok.Data;

/**
 * 图执行响应 DTO（M07-F02 Step8）。
 * <p>
 * 语义对齐 F01 {@code AgentOrchestrationRunRespDTO}：图执行运行时错误（条件无匹配且
 * 无默认边 / 步数超限 / 模型或工具调用异常）以 {@code success=false} + 非空
 * {@code errorMessage} 表达，不上抛（与 F01 run() success=false 语义一致）；
 * {@code errorMessage} 只含异常摘要，绝不包含明文 API Key。
 * </p>
 */
@Data
public class AgentGraphExecuteRespDTO {

    /** 是否执行成功 */
    private boolean success;

    /** 最终输出文本（END 节点处的累积文本，成功时非空） */
    private String output;

    /** 失败原因摘要（不含明文 API Key） */
    private String errorMessage;

    /** 执行耗时（毫秒） */
    private long latencyMs;
}
```

### 关键结论

- `execute(Long graphDefId, String input)`：**单文本入参**，构造 `AgentGraphInterpreter` 后直接 `.run(graph, input)`，无任何"变量映射"参与（第 123-125 行）。
- DTO 字段清单：Req 仅 `input`（String）；Resp 为 `success`/`output`/`errorMessage`/`latencyMs`。**均无变量相关字段**。
- 与 Step8 归档方案描述完全一致，无现场偏差。

---

## 问题 3：`GraphElement.java` / `ProcessGraph.java` 当前真实完整源码

**定位结果**：`sw-basic-agent` 内存在两处同名文件（另一处在 sw-bpm 的 `bpm/api/dto`，为 BPM 模块独立模型）。本任务对象（Agent 图设计器数据结构）为：

- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/graph/GraphElement.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/graph/ProcessGraph.java`

### `GraphElement.java` 全文（49 行）

```java
package com.sw.ck.agent.dto.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.Map;

/**
 * 图元素 —— 节点或边（M07-F02 Step7 图定义模型，对齐 sw-bpm {@code GraphElement} 先例）。
 * <p>
 * 节点：kind="node"，type ∈ {START, END, LLM, TOOL, CONDITION, ...}（可扩展），source/target 为 null。<br>
 * 边：kind="edge"，type 为 null，通过 source/target 引用两端节点 id。
 * </p>
 * <p>
 * <b>后端仅解释拓扑（id/kind/type/source/target），{@code config} 与 {@code style} 为不透明
 * Map 原样透传，严禁在后端解析其内部字段。</b>（config 中的条件分支配置等语义由
 * Step8 图解释执行引擎定义与消费。）
 * </p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GraphElement implements Serializable {

    /** 元素唯一标识（设计器分配）。 */
    private String id;

    /** 元素种类："node" | "edge"。 */
    private String kind;

    /** 节点类型（START/END/LLM/TOOL/CONDITION/…），边为 null。 */
    private String type;

    /** 边起点节点 id（仅边使用，节点为 null）。 */
    private String source;

    /** 边终点节点 id（仅边使用，节点为 null）。 */
    private String target;

    /** 不透明配置（后端不解释，原样透传）。 */
    private Map<String, Object> config;

    /** 不透明样式（画布样式，原样透传）。 */
    private Map<String, Object> style;
}
```

### `ProcessGraph.java` 全文（43 行）

```java
package com.sw.ck.agent.dto.graph;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * Agent 调度图定义模型 —— 图设计器核心数据结构（M07-F02 Step7）。
 * <p>
 * 对应 {@code sw_agent_graph_def.graph_json} 列的序列化格式（对齐 sw-bpm
 * {@code ProcessGraph} 先例，去掉 bpm 的 formKey——agent 图不绑定表单）。
 * </p>
 * <p>
 * <b>后端仅解释拓扑（id/kind/type/source/target），{@code config} 与 {@code style} 为不透明
 * Map 原样透传，严禁在后端解析其内部字段。</b>
 * </p>
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessGraph implements Serializable {

    /** 图业务 key（服务端生成，发布后冻结，与 sw_agent_graph_def.graph_key 一致）。 */
    private String graphKey;

    /** 图名称。 */
    private String name;

    /** 版本号（默认 1，与 def_version 对齐）。 */
    private Integer version;

    /** 图元素列表（节点 + 边）。 */
    private List<GraphElement> elements;

    /** 画布元数据（不透明，原样透传）。 */
    private Map<String, Object> canvas;
}
```

### config 类型与全部读取点（逐一列出）

`config` 字段类型：**`Map<String, Object>`**（`GraphElement.java:45`），非自定义 DTO、非 JSON 字符串。`style` 同为 `Map<String, Object>`（:47）。

全仓库 `sw-basic-agent` 内对 `getConfig()` 的全部调用点（grep 全模块，4 处，全部是读取已定义三个键）：

| 位置 | 读取键 | 用途 |
|---|---|---|
| `AgentGraphInterpreter.java:268`（`keywordOf`） | `CONFIG_KEY_KEYWORD`（"keyword"） | 条件边关键词子串匹配 |
| `AgentGraphInterpreter.java:329`（`requireConfigId`） | `CONFIG_KEY_AGENT_MODEL_CONFIG_ID`（"agentModelConfigId"） | LLM 节点模型配置 id |
| `AgentGraphInterpreter.java:338`（`requireConfigString`） | `CONFIG_KEY_TOOL_NAME`（"toolName"） | TOOL 节点工具名 |
| `AgentGraphExecutionServiceImpl.java:215`（`configValue`） | 调用方传入的键（上述三个） | 执行前校验 |

### "变量名"语义字段：**当前无此类字段**

全模块 grep `variable|varName|contextVar|变量池|上下文变量` 零命中（sw-basic 无任何命中）。`GraphElement`/`ProcessGraph` 中**不存在**任何 inputVar/outputVar/varName 语义字段；`config` 为不透明 Map，理论上可直接新增任意 key（不违背"不透明透传"禁令——Step8 解释器已经以"执行契约键"方式消费三个键，多变量键可走同一机制），但当前**无任何变量名键**。

---

## 问题 4：节点类型常量与执行前校验的当前真实实现

### 节点类型常量定义位置

全模块 grep `"LLM"|"TOOL"|"CONDITION"` 字符串字面量，**仅 `AgentGraphInterpreter.java` 一处定义**（String 常量，非 enum，D52 精神）：

- `AgentGraphInterpreter.java:64` `NODE_TYPE_START = "START"`
- `AgentGraphInterpreter.java:67` `NODE_TYPE_END = "END"`
- `AgentGraphInterpreter.java:70` `NODE_TYPE_LLM = "LLM"`
- `AgentGraphInterpreter.java:73` `NODE_TYPE_TOOL = "TOOL"`
- `AgentGraphInterpreter.java:76` `NODE_TYPE_CONDITION = "CONDITION"`

消费方（均通过常量引用，无字符串散落）：`AgentGraphExecutionServiceImpl.java:156/171/185/196/249`。

前端另有同一套类型常量的镜像定义：`graphAdapter.ts:32-36`（`NODE_TYPE_START/END/LLM/TOOL/CONDITION`）与 `GraphDesigner.vue:101-107`（`NODE_TYPES` 数组）。

### `validateForExecution` 当前完整实现

位置：`AgentGraphExecutionServiceImpl.java:148-211`（私有方法，签名 `private Map<Long, AgentModelConfig> validateForExecution(ProcessGraph graph)`）。完整源码见问题 2 贴出的文件第 148-211 行，此处不重复贴。

**结构要点**（供"新增变量名必填校验"插位判断）：

- 方法体按节点类型 `switch (node.getType())` 逐项校验（LLM → agentModelConfigId 可解析；TOOL → toolName 白名单命中；CONDITION → 默认边唯一），`default -> { }` 兜底。
- 新增"节点变量名必填/格式校验"的自然插位：LLM 分支（`:171-184`）与 TOOL 分支（`:185-195`）内追加 config key 读取与合法性判断，抛 `BaseException(CommonErrorCode.PARAM_ERROR, ...)` 与现有校验同款。
- config 读取统一走 `configValue(node, key)`（`:213-216`），新增键校验可复用。

---

## 问题 5：前端 `graphAdapter.ts` 当前真实完整源码

**文件路径**（现场确认）：`Smart-WorkFlow-Web/src/modules/agent/utils/graphAdapter.ts`

全文（138 行，磁盘现存完整内容）：

```typescript
/**
 * 图元素双向转换层：后端 ProcessGraph.elements（kind 区分的统一列表）
 * ↔ flow-graph adapter 的 FlowGraphData（节点/边分离模型）。
 *
 * ⚠️ 坐标存储位置是本 Step 前端裁定，不是后端契约：
 *    节点画布坐标存 GraphElement.style.x / style.y（后端 config/style 为不透明
 *    Map 原样透传，后端仅解释 id/kind/type/source/target）。后续 Step 不得把
 *    style.x/style.y 当作后端强制字段。
 *
 * 映射约定（与 Step8 执行契约严格对齐，见 AgentGraphInterpreter 常量）：
 *   · 节点：kind="node"，type ∈ {START, END, LLM, TOOL, CONDITION, …}（可扩展，
 *     未知类型原样透传不崩溃）
 *   · 节点业务配置：FlowGraphNode.data ↔ GraphElement.config
 *       - LLM 节点  config.agentModelConfigId（模型配置 id）
 *       - TOOL 节点 config.toolName（工具白名单 name 精确值）
 *   · 条件边关键词：GraphElement 的 config.keyword ↔ FlowGraphEdge.label
 *     （画布原生渲染边标签，直接可见；空/缺失 = 默认边，与后端 keywordOf 语义一致）
 *   · 节点/边 id 原样透传（设计器分配，往返不丢失）
 *
 * 本文件只准调用 adapters/flow-graph/index.ts 的导出契约，
 * 禁止绕过防腐层直接 import @vue-flow/core。
 */
import type { FlowGraphData, FlowGraphEdge, FlowGraphNode } from '@/adapters/flow-graph'
import type { GraphElement } from '@/contracts/agent'

/** 后端节点 config 键（与 AgentGraphInterpreter 常量对齐，非训练记忆） */
export const NODE_CONFIG_KEY_MODEL_ID = 'agentModelConfigId'
export const NODE_CONFIG_KEY_TOOL_NAME = 'toolName'
export const EDGE_CONFIG_KEY_KEYWORD = 'keyword'

/** 后端节点类型（与 AgentGraphInterpreter 常量对齐） */
export const NODE_TYPE_START = 'START'
export const NODE_TYPE_END = 'END'
export const NODE_TYPE_LLM = 'LLM'
export const NODE_TYPE_TOOL = 'TOOL'
export const NODE_TYPE_CONDITION = 'CONDITION'

/** 节点类型 → 画布默认显示名（仅展示用途，不落库，往返无字段） */
export const NODE_TYPE_LABELS: Record<string, string> = {
  [NODE_TYPE_START]: '开始',
  [NODE_TYPE_END]: '结束',
  [NODE_TYPE_LLM]: 'LLM 调用',
  [NODE_TYPE_TOOL]: '工具调用',
  [NODE_TYPE_CONDITION]: '条件分支',
}

function isNode(el: GraphElement): boolean {
  return el.kind === 'node'
}

function isEdge(el: GraphElement): boolean {
  return el.kind === 'edge'
}

/** elements → FlowGraphData（节点坐标自 style.x/style.y 读取，缺省归零） */
export function elementsToFlowGraphData(elements: GraphElement[]): FlowGraphData {
  const nodes: FlowGraphNode[] = []
  const edges: FlowGraphEdge[] = []

  for (const el of elements ?? []) {
    if (isNode(el)) {
      const style = el.style ?? {}
      const x = typeof style.x === 'number' ? style.x : 0
      const y = typeof style.y === 'number' ? style.y : 0
      nodes.push({
        id: el.id,
        type: el.type,
        position: { x, y },
        data: el.config ? { ...el.config } : undefined,
      })
    } else if (isEdge(el)) {
      const keyword = edgeKeyword(el)
      edges.push({
        id: el.id,
        source: el.source ?? '',
        target: el.target ?? '',
        // 条件边关键词由 FlowGraphEdge.label 承载（画布直接可见）
        label: keyword ?? undefined,
      })
    }
  }
  return { nodes, edges }
}

/** FlowGraphData → elements（节点坐标写回 style.x/style.y，业务配置写回 config） */
export function flowGraphDataToElements(data: FlowGraphData): GraphElement[] {
  const elements: GraphElement[] = []
  const nodes = data.nodes ?? []
  const edges = data.edges ?? []

  for (const node of nodes) {
    const style: Record<string, unknown> = {}
    if (typeof node.position.x === 'number') {
      style.x = node.position.x
    }
    if (typeof node.position.y === 'number') {
      style.y = node.position.y
    }
    elements.push({
      id: node.id,
      kind: 'node',
      type: node.type,
      source: undefined,
      target: undefined,
      config: node.data ? { ...node.data } : undefined,
      style: Object.keys(style).length > 0 ? style : undefined,
    })
  }

  for (const edge of edges) {
    const config: Record<string, unknown> = {}
    // 边关键词仅在有值时写入 config.keyword；空/缺失 = 默认边（后端 keywordOf 语义）
    if (edge.label && edge.label.trim() !== '') {
      config[EDGE_CONFIG_KEY_KEYWORD] = edge.label.trim()
    }
    elements.push({
      id: edge.id,
      kind: 'edge',
      type: undefined,
      source: edge.source,
      target: edge.target,
      config: Object.keys(config).length > 0 ? config : undefined,
      style: undefined,
    })
  }

  return elements
}

/** 读取边条件关键词（与后端 AgentGraphInterpreter.keywordOf 语义一致：空/缺失 = 默认边） */
export function edgeKeyword(edge: GraphElement): string | null {
  const config = edge.config
  if (!config) return null
  const keyword = config[EDGE_CONFIG_KEY_KEYWORD]
  if (typeof keyword !== 'string' || keyword.trim() === '') return null
  return keyword
}
```

### 字段映射关系（逐字段）

**节点**：`GraphElement.config` ↔ `FlowGraphNode.data`（双向**整体浅拷贝展开**：`data: el.config ? { ...el.config } : undefined` / `config: node.data ? { ...node.data } : undefined`）；`GraphElement.style.x/y` ↔ `FlowGraphNode.position`；`id`/`type` 原样透传；`source`/`target` 节点置 `undefined`。

**边**：`GraphElement.config.keyword` ↔ `FlowGraphEdge.label`（双向，仅非空时写）；`source`/`target` 直通；`style` 边恒 `undefined`。

**关键点（供规划层）**：新增"输入/输出变量名"字段若走 `node.data ↔ config` 泛化透传，**adapter 无需任何改动**——`data` 是 `Record<string, unknown>` 整包展开，新键自动往返。改动面仅剩：`graphAdapter.ts` 新增常量（对齐 `NODE_CONFIG_KEY_*` 模式）、`GraphDesigner.vue` 属性面板新增输入框。

---

## 问题 6：前端 `GraphDesigner.vue` 属性面板当前真实实现

**文件路径**（现场确认）：`Smart-WorkFlow-Web/src/modules/agent/views/GraphDesigner.vue`（634 行）

### `<script setup>` 中操作 config 的完整代码段（`<script>` 全部，1-294 行）

```typescript
<script setup lang="ts">
/* global HTMLElement */
/**
 * GraphDesigner — 图设计器画布页（参数化静态路由 agent/graph-designer/:id）。
 *
 * 生命周期：getGraph(id) → elementsToFlowGraphData → mountFlowGraph（flow-graph 防腐层）。
 * 编辑：onGraphChange 回调持有最新 FlowGraphData；节点点击打开属性面板——START/END
 * 无可编辑项；LLM 模型配置下拉写 data.agentModelConfigId；TOOL 工具下拉（internal/
 * external 合并、value=toolName 精确值）写 data.toolName；CONDITION 节点选中时列出
 * 其出边，逐边编辑关键词（写 edge.label，画布原生渲染边标签）。
 * 保存草稿：flowGraphDataToElements → saveDraftGraph（全量覆盖，不跑校验）。
 * 发布：publish(id) 生成新版本快照，**不锁编辑**（Step7 语义：发布后仍可继续编辑
 * 并再次发布）。
 * 执行测试：execute(id, input) → 展示 success/output/errorMessage/latencyMs，
 * **不落库**，刷新页面即丢失（对齐 Step8「执行不落库」限制）。
 *
 * 说明：flow-graph adapter 契约无 edge 点击事件，条件边关键词编辑放在 CONDITION
 * 节点属性面板内（列出其出边逐条编辑），不走边选中交互。
 */
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { mountFlowGraph } from '@/adapters/flow-graph'
import type {
  FlowGraphData,
  FlowGraphEdge,
  FlowGraphEvents,
  FlowGraphInstance,
  FlowGraphNode,
} from '@/adapters/flow-graph'
import {
  executeGraph,
  getGraphDef,
  listModelOptions,
  listToolOptions,
  publishGraphDef,
  saveDraftGraph,
} from '@/modules/agent/api'
import {
  NODE_CONFIG_KEY_MODEL_ID,
  NODE_CONFIG_KEY_TOOL_NAME,
  NODE_TYPE_CONDITION,
  NODE_TYPE_END,
  NODE_TYPE_LABELS,
  NODE_TYPE_LLM,
  NODE_TYPE_START,
  NODE_TYPE_TOOL,
  elementsToFlowGraphData,
  flowGraphDataToElements,
} from '@/modules/agent/utils/graphAdapter'
import type {
  AgentGraphExecuteResp,
  AgentModelConfigOption,
  AgentToolOption,
  ProcessGraph,
} from '@/contracts/agent'
import { ApiError } from '@/foundation/request'

const route = useRoute()
const router = useRouter()

const graphId = computed(() => Number(route.params.id as string))

// ─── 图状态 ───
const graphName = ref('')
const graphKey = ref('')
const version = ref<number | null>(null)
const graphData = ref<FlowGraphData>({ nodes: [], edges: [] })
const loading = ref(false)
const loadError = ref('')

// ─── 画布 ───
const canvasRef = ref<HTMLElement | null>(null)
const graphInstance = ref<FlowGraphInstance | null>(null)

// ─── 属性面板 ───
const selectedNodeId = ref<string | null>(null)
const modelOptions = ref<AgentModelConfigOption[]>([])
const toolOptions = ref<AgentToolOption[]>([])

// ─── 执行测试面板 ───
const executeInput = ref('')
const executeResult = ref<AgentGraphExecuteResp | null>(null)
const executing = ref(false)

const saving = ref(false)
const publishing = ref(false)

const selectedNode = computed<FlowGraphNode | null>(
  () => graphData.value.nodes.find((n) => n.id === selectedNodeId.value) ?? null,
)

const selectedNodeType = computed(() => selectedNode.value?.type ?? '')

/** CONDITION 节点出边（条件分支关键词编辑入口） */
const conditionOutEdges = computed<FlowGraphEdge[]>(() => {
  if (selectedNodeType.value !== NODE_TYPE_CONDITION || !selectedNode.value) return []
  return graphData.value.edges.filter((e) => e.source === selectedNode.value?.id)
})

const NODE_TYPES = [
  NODE_TYPE_START,
  NODE_TYPE_END,
  NODE_TYPE_LLM,
  NODE_TYPE_TOOL,
  NODE_TYPE_CONDITION,
]

// ─── 画布事件 ───

const graphEvents: FlowGraphEvents = {
  onNodeClick: (node: FlowGraphNode) => {
    selectedNodeId.value = node.id
  },
  onGraphChange: (data: FlowGraphData) => {
    graphData.value = data
  },
}

function remountCanvas() {
  if (graphInstance.value) {
    graphInstance.value.destroy()
    graphInstance.value = null
  }
  if (canvasRef.value) {
    graphInstance.value = mountFlowGraph(canvasRef.value, graphData.value, graphEvents)
  }
}

// ─── 节点操作 ───

/** 属性面板左侧色板：新增节点（画布外数据变更 → 重挂载画布） */
function addNode(type: string) {
  const count = graphData.value.nodes.length
  const node: FlowGraphNode = {
    id: `n-${Date.now()}-${count}`,
    type,
    label: NODE_TYPE_LABELS[type] ?? type,
    position: { x: 60 + (count % 5) * 100, y: 60 + Math.floor(count / 5) * 80 },
    data: {},
  }
  graphData.value = { nodes: [...graphData.value.nodes, node], edges: [...graphData.value.edges] }
  remountCanvas()
}

/** 删除节点（连带其入/出边）；START 不可删（执行契约要求唯一 START） */
function removeSelectedNode() {
  const node = selectedNode.value
  if (!node) return
  if (node.type === NODE_TYPE_START) return
  graphData.value = {
    nodes: graphData.value.nodes.filter((n) => n.id !== node.id),
    edges: graphData.value.edges.filter((e) => e.source !== node.id && e.target !== node.id),
  }
  selectedNodeId.value = null
  remountCanvas()
}

/** 删除条件分支出边 */
function removeEdge(edgeId: string) {
  graphData.value = {
    nodes: [...graphData.value.nodes],
    edges: graphData.value.edges.filter((e) => e.id !== edgeId),
  }
  remountCanvas()
}

/** 属性面板数据回写：LLM/TOOL 节点业务配置（画布不渲染 data，无需重挂载） */
function updateNodeData(key: string, value: unknown) {
  const node = graphData.value.nodes.find((n) => n.id === selectedNodeId.value)
  if (!node) return
  node.data = { ...(node.data ?? {}), [key]: value }
}

/** 条件边关键词写 edge.label（画布原生渲染边标签，改后重挂载使画布可见） */
function handleKeywordChange(edge: FlowGraphEdge, value: unknown) {
  const target = graphData.value.edges.find((e) => e.id === edge.id)
  if (!target) return
  const keyword = String(value ?? '').trim()
  target.label = keyword === '' ? undefined : keyword
  remountCanvas()
}

function edgeDisplayName(edge: FlowGraphEdge): string {
  const from = graphData.value.nodes.find((n) => n.id === edge.source)
  const to = graphData.value.nodes.find((n) => n.id === edge.target)
  return `${from?.label ?? edge.source} → ${to?.label ?? edge.target}`
}

// ─── 加载 ───

async function loadGraph() {
  loading.value = true
  loadError.value = ''
  try {
    const graph = await getGraphDef(graphId.value)
    graphName.value = graph.name
    graphKey.value = graph.graphKey
    version.value = graph.version ?? 1
    const data = elementsToFlowGraphData(graph.elements)
    // 节点显示名：按类型映射（仅展示用途，不落库）
    graphData.value = {
      nodes: data.nodes.map((n) => ({ ...n, label: NODE_TYPE_LABELS[n.type ?? ''] ?? n.type })),
      edges: data.edges,
    }
    await nextTick()
    if (canvasRef.value) {
      graphInstance.value = mountFlowGraph(canvasRef.value, graphData.value, graphEvents)
    }
  } catch (err) {
    loadError.value = err instanceof ApiError ? err.msg : '加载图定义失败'
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  try {
    const [models, tools] = await Promise.all([listModelOptions(), listToolOptions()])
    modelOptions.value = models
    toolOptions.value = tools
  } catch (err) {
    ElMessage.warning('下拉数据加载失败：' + ((err as ApiError).msg ?? '未知错误'))
  }
}

// ─── 保存草稿 / 发布 / 执行 ───

async function handleSaveDraft() {
  saving.value = true
  try {
    const graph: ProcessGraph = {
      graphKey: graphKey.value,
      name: graphName.value,
      version: version.value ?? 1,
      elements: flowGraphDataToElements(graphData.value),
      canvas: {},
    }
    await saveDraftGraph(graphId.value, graph)
    ElMessage.success('草稿已保存')
  } catch (err) {
    ElMessage.error(err instanceof ApiError ? err.msg : '保存草稿失败')
  } finally {
    saving.value = false
  }
}

async function handlePublish() {
  publishing.value = true
  try {
    const published = await publishGraphDef(graphId.value)
    graphKey.value = published.graphKey
    version.value = published.defVersion
    ElMessage.success(`发布成功，当前版本 v${published.defVersion}（发布后可继续编辑并再次发布）`)
  } catch (err) {
    ElMessage.error(err instanceof ApiError ? err.msg : '发布失败')
  } finally {
    publishing.value = false
  }
}

async function handleExecute() {
  const input = executeInput.value.trim()
  if (!input) {
    ElMessage.warning('请输入测试文本')
    return
  }
  executing.value = true
  executeResult.value = null
  try {
    executeResult.value = await executeGraph(graphId.value, input)
  } catch (err) {
    executeResult.value = {
      success: false,
      errorMessage: err instanceof ApiError ? err.msg : '执行失败',
      latencyMs: 0,
    }
  } finally {
    executing.value = false
  }
}

onMounted(() => {
  void loadGraph()
  void loadOptions()
})

onBeforeUnmount(() => {
  if (graphInstance.value) {
    graphInstance.value.destroy()
    graphInstance.value = null
  }
})
</script>
```

### 属性面板 template（按节点类型切换表单的完整代码段，346-439 行）

```html
      <!-- 属性面板 -->
      <div class="property-panel">
        <template v-if="selectedNode">
          <div class="panel-title">
            节点属性
            <span class="panel-sub">{{ selectedNode.type }}</span>
          </div>

          <!-- START/END：无可编辑项 -->
          <template
            v-if="selectedNodeType === NODE_TYPE_START || selectedNodeType === NODE_TYPE_END"
          >
            <el-empty
              :description="`${NODE_TYPE_LABELS[selectedNodeType] ?? selectedNodeType}节点无可编辑属性`"
              :image-size="60"
            />
          </template>

          <!-- LLM：模型配置下拉 -->
          <template v-else-if="selectedNodeType === NODE_TYPE_LLM">
            <div class="field-row">
              <div class="field-label">模型配置</div>
              <el-select
                :model-value="
                  (selectedNode.data?.[NODE_CONFIG_KEY_MODEL_ID] as number | undefined) ?? null
                "
                placeholder="选择模型配置"
                style="width: 100%"
                @change="(v) => updateNodeData(NODE_CONFIG_KEY_MODEL_ID, v)"
              >
                <el-option
                  v-for="m in modelOptions"
                  :key="m.id"
                  :label="`${m.name}（${m.modelName}）`"
                  :value="m.id"
                />
              </el-select>
            </div>
          </template>

          <!-- TOOL：工具下拉（internal/external 合并，value=toolName 精确值） -->
          <template v-else-if="selectedNodeType === NODE_TYPE_TOOL">
            <div class="field-row">
              <div class="field-label">工具</div>
              <el-select
                :model-value="
                  (selectedNode.data?.[NODE_CONFIG_KEY_TOOL_NAME] as string | undefined) ?? null
                "
                placeholder="选择工具"
                style="width: 100%"
                @change="(v) => updateNodeData(NODE_CONFIG_KEY_TOOL_NAME, v)"
              >
                <el-option
                  v-for="t in toolOptions"
                  :key="`${t.source}:${t.toolName}`"
                  :label="`${t.toolName}（${t.source === 'internal' ? '内部' : '外部'}）`"
                  :value="t.toolName"
                />
              </el-select>
            </div>
          </template>

          <!-- CONDITION：出边关键词编辑（写 edge.label，留空=默认边） -->
          <template v-else-if="selectedNodeType === NODE_TYPE_CONDITION">
            <div class="field-row">
              <div class="field-label">出边关键词</div>
              <el-alert
                title="输入关键词后文本命中即走该边；留空为默认边（仅一条）"
                type="info"
                :closable="false"
                show-icon
              />
              <div v-for="edge in conditionOutEdges" :key="edge.id" class="edge-row">
                <div class="edge-name">{{ edgeDisplayName(edge) }}</div>
                <el-input
                  :model-value="edge.label ?? ''"
                  placeholder="关键词（留空=默认边）"
                  size="small"
                  @change="(v) => handleKeywordChange(edge, v)"
                />
                <el-button size="small" link type="danger" @click="removeEdge(edge.id)">
                  删除边
                </el-button>
              </div>
            </div>
          </template>

          <!-- 删除节点（START 除外） -->
          <div v-if="selectedNodeType !== NODE_TYPE_START" class="panel-footer">
            <el-button size="small" type="danger" plain @click="removeSelectedNode">
              删除节点
            </el-button>
          </div>
        </template>
        <el-empty v-else description="点击画布节点编辑属性" :image-size="60" />
      </div>
```

（其余 template：头部/色板/画布/执行测试面板，及 `<style scoped>` 纯 CSS 无逻辑，与本问无关，不贴。）

### 现状归纳与新增字段改动位置

| 节点类型 | 属性面板现有输入项 | 写回函数 |
|---|---|---|
| START/END | 无可编辑项（`el-empty`） | — |
| **LLM** | 仅「模型配置」`el-select` 下拉（363-382 行） | `updateNodeData(NODE_CONFIG_KEY_MODEL_ID, v)` |
| **TOOL** | 仅「工具」`el-select` 下拉（385-404 行） | `updateNodeData(NODE_CONFIG_KEY_TOOL_NAME, v)` |
| **CONDITION** | 出边关键词 `el-input` 列表（407-429 行），写 `edge.label` | `handleKeywordChange` |

**新增"输入变量名/输出变量名"输入框的改动位置**（按现有模式）：
1. `graphAdapter.ts`：仿 `NODE_CONFIG_KEY_MODEL_ID`/`NODE_CONFIG_KEY_TOOL_NAME` 新增常量（27-29 行旁）；
2. `GraphDesigner.vue` template：在 LLM 分支（363-382）与 TOOL 分支（385-404）的 `.field-row` 内追加 `<el-input>` 行；
3. `GraphDesigner.vue` `<script setup>`：复用现有 `updateNodeData(key, value)`（169-173 行，泛化写入 `node.data[key]`，无需新函数）；文件头注释（5-19 行）需同步描述。

注意：`updateNodeData` 已泛化，新增字段零脚本逻辑改动，仅 template 加行 + 常量。

---

## 问题 7：仓库现有"多变量/上下文对象/变量池"设计先例

### 搜索执行情况

| 搜索 | 范围 | 结果 |
|---|---|---|
| `variable\|varName\|contextVar\|变量池\|上下文变量` | `Smart-WorkFlow/sw-basic/` | **零命中**（无先例） |
| 同上 | `Smart-WorkFlow/sw-biz/` | 仅命中 sw-bpm 模块（见下） |
| `variable\|varName\|contextVar` | `Smart-WorkFlow-Web/src/` | **零命中**（前端无先例） |
| `processVariable\|流程变量` | `Smart-WorkFlow/sw-biz/sw-bpm*` | 命中 sw-bpm 模块（Flowable 流程变量） |
| `变量`（中文宽搜兜底） | `sw-basic/` + `sw-biz/` | sw-basic 命中均为**注释措辞**（"局部变量""环境变量""多变量执行上下文是后续方向"——即本任务自身描述，`AgentGraphInterpreter.java:28-29`、`AgentGraphExecuteReqDTO.java:8`、`AgentOrchestrationServiceImpl.java:46`、`AgentModelAutoConfiguration.java:19`），**无任何变量存取设计** |

### 命中的命名先例：sw-bpm 模块 Flowable「流程变量」（process variable）

sw-bpm 全模块用 Flowable 原生 `Map<String, Object> variables` 承载流程变量，键名语义为"变量名 → 值"的存取式设计。具体设计与行号：

**写入端**（启动流程时装载变量）——`sw-bpm-process/.../service/ProcessStartService.java:114-126`：

```java
Map<String, Object> variables = new HashMap<>();
variables.put("approver", approver);
variables.put("formKey", cmd.getFormKey());
variables.put("recordId", cmd.getRecordId());
variables.put("submitter", String.valueOf(cmd.getSubmitter()));
variables.put("tenantId", cmd.getTenantId());
// ... runtimeFacade.startProcessInstanceByKey(processDefKey, businessKey, variables, tenantId)
```

**接口契约**（变量以 `Map<String, Object>` 形态出入）：
- `sw-bpm-api/.../facade/BpmRuntimeFacade.java:24-29`：`startProcessInstanceByKey(String processDefKey, String businessKey, Map<String, Object> variables, String tenantId)`，javadoc 注明 `@param variables 流程变量`
- `sw-bpm-api/.../facade/BpmTaskFacade.java`：`complete(String taskId, Map<String, Object> variables)` / `getVariables(String processInstanceId)` / `getVariable(String processInstanceId, String name)`（方法清单经 `BpmTaskFacadeImpl.java` 印证）
- `sw-bpm-engine/.../facade/BpmRuntimeFacadeImpl.java:36-38`：透传给 Flowable `runtimeService.startProcessInstanceByKey(...)`

**读取端**（按变量名取值）——`sw-bpm-engine/.../listener/ApprovalTaskListener.java:127-140`：

```java
Long tenantId = parseLong(delegateTask.getVariable("tenantId"));
...
.businessKey((String) delegateTask.getVariable("recordId"))
.formKey((String) delegateTask.getVariable("formKey"))
.initiatorUserId(parseLong(delegateTask.getVariable("submitter")))
```

- `sw-bpm-engine/.../facade/BpmTaskFacadeImpl.java:74-76`：`complete(taskId, variables)` 非空才 `taskService.complete`；`:105-106` `getVariables` → `runtimeService.getVariables(processInstanceId)`；`:154-155` `getVariable(processInstanceId, name)` → `runtimeService.getVariable(...)`
- `sw-bpm-process/.../dto/TaskDetailRespDTO.java:49`：`private Map<String, Object> processVariables;`（响应 DTO 原样携带）
- `sw-bpm-process/.../controller/BpmTodoController.java:229-231`：审批拒绝写 `variables.put("outcome", "REJECTED")`；`:279`/`:296-297` 按名取值 `bpmTaskFacade.getVariable(..., "formKey")`、整包 `getVariables` 灌入 DTO

**先例要点归纳**（供规划层参照命名，非设计建议）：
- 命名形态：**"流程变量 / process variable"**，变量存取方法为 `getVariable(name)` / `getVariables()` 按名读、`put(name, value)` / `Map<String, Object>` 装载写；
- 数据结构：全程 **`Map<String, Object>`**（key=变量名字符串，value=Object），无具名变量对象类；
- 用途边界：BPM 侧变量承载审批流转数据（approver/formKey/recordId/submitter/tenantId/outcome），由流程引擎托管生命周期。

### 结论

- **agent 模块（sw-basic-agent）与前端（Smart-WorkFlow-Web/src）：无任何"多变量/上下文对象/变量池"先例**（含字段、类、键三层面全无）。
- **sw-bpm 存在"流程变量"命名与存取先例**（上述），是仓库内唯一可参照的"变量名 → 值"语义，规划层可决定是否借用其命名风格或自定。
- 其余命中均为注释措辞，非设计。

---

## 完成声明

7 问全部完成，证据均可追溯到 `文件路径:行号`：

1. ✅ `AgentGraphInterpreter.java` 全文贴出（`sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphInterpreter.java`，361 行）；`run`/`callLlmNode`/`callToolNode`/`nextNodeId` 签名与 `text` 局部变量传递方式已确认（:136-156）。
2. ✅ `AgentGraphExecutionServiceImpl.java` 全文（323 行）+ 两个 DTO 全文；`execute` 构造解释器方式确认（:123-125）。
3. ✅ `GraphElement.java`（`dto/graph` 包，49 行）/`ProcessGraph.java`（43 行）全文；`config` 为 `Map<String, Object>`；全部 4 个 config 读取点逐一列出；**无任何变量名字段**。
4. ✅ 节点常量唯一定义于 `AgentGraphInterpreter.java:64-76`；`validateForExecution` 全文见问题 2（:148-211），新校验插位已定位。
5. ✅ `graphAdapter.ts` 全文（138 行）；`node.data ↔ config` 整包展开映射，新增 config 键零 adapter 改动。
6. ✅ `GraphDesigner.vue` script 全文 + 属性面板 template 全文；LLM/TOOL 现有输入项确认（各 1 个下拉）；新增字段改动位置给出。
7. ✅ sw-basic/sw-basic-agent 与前端**无先例**（零命中）；sw-bpm 命中 Flowable 流程变量先例（`Map<String, Object>` + `getVariable(name)` 存取，文件:行号见上）。

**与历史归档一致性**：Step8 归档描述（agentModelConfigId/toolName/keyword 三键契约、单 currentText、validateForExecution 五项校验）与磁盘现状**完全一致，无偏差**。本任务执行期间未修改任何文件、未运行任何编译命令。
