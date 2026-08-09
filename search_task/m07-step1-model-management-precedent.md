# 探索任务：M07-Step1"大模型注册管理"后端实现前置调研

**任务目标**：M07 Agent 模块首个 Step 是后端"大模型注册管理"（模型接入信息 CRUD + API Key 加密存储 + 连通性测试），需要复用仓库已有的实现模式（凭证加密、审计字段、模块分层、迁移脚本规范），而不是凑造新模式。为规划层生成 Step 1 的完整 17 项执行方案提供事实依据。

**背景**：`storage-multi-provider`（M10，已 COMPLETED）实现了 4 个存储提供商（Local/MinIO/COS/Qiniu），大概率已经处理过"多提供商配置 + 密钥/凭证加密存储 + 连通性测试"这一模式，是本次最直接可复用的先例。

**需要回答的问题**：

1. `storage-multi-provider` 中，MinIO/COS/Qiniu 的 AccessKey/SecretKey（或等价凭证）是如何加密存储的？具体加密工具类的完整类名、包路径、关键方法签名（如 `encrypt(String)`/`decrypt(String)`）是什么？该工具类在哪个模块（`sw-common` 还是别处）？
2. 该凭证存储对应的数据库表结构是什么（表名、关键字段列表，尤其是密钥字段的列名和类型）？对应 Flyway 迁移脚本路径是什么？
3. 存储提供商类型（Local/MinIO/COS/Qiniu）在表结构和 Java 代码中是如何表示"多提供商类型"字段的（enum 列 + CHECK 约束？还是 varchar？Java 侧是否有对应 enum 类，完整类名是什么）？—— 这是 Agent 模块"协议类型"（OpenAI兼容/Ollama/其他）字段最直接的参照。
4. `storage-multi-provider` 是否有"连通性测试"端点（测试存储提供商是否可达）？如果有，其 Controller 方法签名、请求/响应 DTO 结构是什么？
5. `sw-basic-storage`（或 storage-multi-provider 实际所在模块）的目录分层是怎样的：是否有 `-api`/`-biz` 子模块拆分，还是单一扁平模块？请与 `sw-basic-agent`（已确认是扁平单模块，无 -api/-biz 拆分）做结构对比，确认新增 Service/Controller/Entity/Mapper 应放在什么包路径下。
6. 该模块新增表的标准审计字段集合是什么（如 `id`/`tenant_id`/`deleted`/`create_by`/`create_time`/`update_by`/`update_time`）？ORM 框架是 MyBatis-Plus 还是 JPA？是否有基类（如 `BaseEntity`）可继承，完整类名是什么？
7. Flyway 迁移脚本在 `sw-basic-*` 模块下的文件命名规范和版本号分配规则是什么（例如以模块隔离的 `V{N}__xxx.sql` 还是全局共享版本号）？PG 与 H2 双方言脚本的存放路径和差异点是什么？
8. `sw-basic-agent` 模块现有的 `AgentGraphAutoConfiguration` 里 `sw.agent.enabled` 开关，是否有其他 `sw-basic-*` 模块采用相同"功能开关"模式可参照（例如默认关闭到默认开启的迁移方式、`application.yml` 中的配置位置）？
9. 权限码（`permission`）在系统中的命名规范是什么？菜单 seed 已见 `agent:view`，那 CRUD 类操作的权限码惯例是什么（如 `agent:model:add`/`agent:model:edit` 或其他格式）？请给出 1-2 个已有模块的实际例子（完整权限码字符串）。

**搜索范围**：
- `Smart-WorkFlow/sw-basic/sw-basic-storage/`（或实际存放 storage-multi-provider 代码的模块，先确认真实模块名）
- `knowledge/features/storage-multi-provider.md`
- `product/storage-multi-provider/passed/`、`product/storage-multi-provider/receipts/`
- `Smart-WorkFlow/sw-common/`（查找通用加密工具类）
- `Smart-WorkFlow/sw-basic/sw-basic-agent/`（确认现有骨架结构，与 storage 模块对比）
- 任一已有模块的权限码定义处（如 `sys_menu` seed 数据或权限常量类）

**禁止范围**：
- 不得修改任何文件
- 不得运行 `mvn`/`pnpm` 等命令
- 不得对 Agent 模块的实现方式做设计建议，只需汇报"已有先例是什么"，设计决策留给规划层
- 不需要展开分析 storage-multi-provider 的完整业务逻辑，只需聚焦上述 9 个问题涉及的结构性事实

**预期证据**：
- 每个问题对应的具体文件路径 + 关键代码片段（类名/方法签名/字段名/SQL 列定义，简要摘录，不粘贴整段实现）
- 若某问题在仓库中确实找不到先例，明确标注"未找到"，不得编造

**完成标准**：以上 9 个问题均有明确答案或明确标注"未找到"，且证据可追溯到具体文件路径。

**执行模型**：`deepseek/deepseek-v4-pro`

**失败处理**：若发现 storage-multi-provider 的加密/凭证模式与预期严重不符（例如根本没有加密，明文存储），如实标注在"未确认事项"并给出实际情况，不得为了满足预期而误报。

**回执位置**：`search_fallback/m07-step1-model-management-precedent.md`
