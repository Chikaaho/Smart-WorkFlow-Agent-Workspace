# Step 2：后端新增 BPMN XML 只读端点

## 1. 当前状态

功能 `bpmn-adapter` 当前状态：Step 0（探索）已 PASSED，Step 1（前端查看器 adapter `mountBpmnViewer` 等）已 PASSED 并归档。本 Step 是该功能的第 2 个 Step，属于**纯后端**工作，为 Step 3（前端 ProcessDefList 新增"查看流程图"入口）提供数据来源。Step 1 的前端 adapter 目前是零消费方（`mountBpmnViewer` 尚无调用者），本 Step 完成后仍暂无消费方——消费方要等 Step 3 落地后才会调用本 Step 新增的端点。

## 2. Step 目标

在 `sw-bpm` 模块新增一个只读 REST 端点 `GET /workflow/defs/{id}/bpmn-xml`，根据 `BpmProcessDef.id` 返回该流程定义已部署到 Flowable 引擎的原始 BPMN XML 字符串。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-pro
选择理由：本 Step 定义了一个新的前后端接口契约（Step 3 前端将消费此端点），且新增能力跨越 sw-bpm-api / sw-bpm-engine / sw-bpm-process 三个子模块的 Facade 边界，需要正确处理 open-core 模块依赖方向（sw-bpm-process 不能直接依赖 Flowable 类型）
是否触发升级条件：是 — 触发 system.md §2.3「涉及跨项目联动（前后端协议变更、接口契约修改）」
```

## 4. 模型选择理由

新端点的响应结构（`R<String>`，语义为原始 BPMN XML 字符串）是前端 Step 3 将直接消费的契约，一旦下发生效后不应频繁变更；同时涉及三个子模块间的 Facade 接口新增，需要准确理解现有 `BpmDeployFacade`/`BpmDeployFacadeImpl` 的依赖注入结构和模块边界，属于中等复杂度的架构决策，超出简单 CRUD 范畴。

## 5. 已知上下文

- 按 [[decisions]] D40：本功能整体范围是**只读查看器**，后端只需暴露"读"能力，不涉及流程编辑写回。
- `sw-bpm` 采用 open-core 三层结构：`sw-bpm-api`（开源契约）定义 Facade 接口，`sw-bpm-engine`（闭源）实现 Facade 并持有所有 Flowable 依赖，`sw-bpm-process`（开源）只依赖 `sw-bpm-api`，通过 Spring 注入使用 Facade，**不能**直接 import 任何 `org.flowable.*` 类型。这是探索确认的既有边界（`sw-bpm-process` 的 `pom.xml` 未依赖 `sw-bpm-engine`）。
- `BpmProcessDef` 实体（`sw-bpm-process` 的 `entity` 包）已有字段 `processDefinitionId`（Flowable 内部流程定义 ID，发布时回填）和 `status`（`DRAFT`/`PUBLISHED`）。发布流程已经调用 `BpmDeployFacade` 完成部署并回填这两个字段（`BpmProcessDefServiceImpl` 中已有对该 Facade 的注入和调用，具体注入字段名和调用位置需执行前读取确认）。
- `RepositoryService` 已在 `BpmDeployFacadeImpl` 中以构造器注入方式持有（`private final RepositoryService repositoryService;`），本 Step 复用同一个已注入字段，不新增注入。
- 现有代码中**未使用**过 `repositoryService.getResourceAsStream(deploymentId, resourceName)`。本 Step 是该 API 在本项目中的首次使用，用于取回 Flowable 部署时存档的原始 BPMN XML 资源（不是通过 `BpmnXMLConverter` 从 `BpmnModel` 重新序列化——直接取原始部署资源字节，保真度更高，避免重新序列化可能引入的差异）。
- `BpmProcessDefController` 已有同族只读端点 `GET /workflow/defs/{id}`（返回 `R<ProcessGraph>`），本 Step 新端点应作为该 Controller 的同级方法新增，路径为其子路径 `/{id}/bpmn-xml`，不新建 Controller 类。
- 统一响应包装类型为 `com.sw.ck.common.response.R<T>`（成功 `code=0`，字段 `code`/`msg`/`data`）。
- 该模块现有的两个 Controller（`BpmProcessDefController`、`BpmTodoController`）均**未使用** `@PreAuthorize` 权限注解（仅 `sw-bpm-engine` 的 `ExternalDatasourceController` 使用）。本 Step 新端点与 `getDef`/`listDefs` 处于同一权限暴露水平，遵循既有模式，**不新增**权限注解（见 §17 明确禁止事项，这是有意的一致性选择，不是遗漏）。
- 租户隔离：`BpmProcessDef` 继承 `BaseEntity`，走 MyBatis-Plus `TenantLineHandler` 自动拦截（非动态宽表裸 SQL 场景），本 Step 通过 id 查询 `BpmProcessDef` 时自动带租户过滤，无需手写 `tenant_id` 条件。

## 6. 执行前必须读取的文件

1. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmDeployFacade.java`（现有接口定义与方法列表）
2. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmDeployFacadeImpl.java`（现有实现，`repositoryService` 注入方式、已有方法如何使用 `RepositoryService`/`BpmnXMLConverter`）
3. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmProcessDefController.java`（现有 `getDef`/`listDefs` 端点写法，`R<T>` 用法、依赖注入字段名）
4. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessDefService.java`（服务接口现有方法列表）
5. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmProcessDefServiceImpl.java`（现有 `getDef` 实现、by-id 查询方式、not-found 处理方式、是否已注入 `BpmDeployFacade`、发布逻辑中如何回填 `processDefinitionId`/`status`）
6. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/entity/BpmProcessDef.java`（确认 `status`/`processDefinitionId` 字段名、类型、状态枚举值的确切写法，如 `"PUBLISHED"` 字符串或枚举类型）
7. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/exception/BpmErrorCode.java`（现有错误码编号规律，用于新增"流程未发布"错误码）
8. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmTodoControllerTest.java`（Controller 单元测试写法参照：纯 Mockito、`@Nested` 分组、`AssertJ` 断言、`LoginUserHolder` 模拟方式）
9. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-engine/src/test/java/com/sw/ck/bpm/engine/integration/ApprovalProcessIntegrationTest.java`（Flowable 内存引擎集成测试写法参照）
10. 若存在以下文件，先读取现状再决定扩展方式（新增方法测试用例）而非新建同名文件：
    - `sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmProcessDefControllerTest.java`
    - `sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/impl/BpmProcessDefServiceImplTest.java`
    - `sw-bpm-engine/src/test/java/com/sw/ck/bpm/engine/facade/BpmDeployFacadeImplTest.java`
    若上述任一文件不存在，按 §13.2 要求新建，文件命名和测试风格与 `BpmTodoControllerTest.java` 一致。

## 7. 允许修改的文件范围

- `sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmDeployFacade.java`（新增方法签名）
- `sw-bpm-api/src/main/java/com/sw/ck/bpm/api/exception/BpmErrorCode.java`（新增一个错误码常量）
- `sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmDeployFacadeImpl.java`（新增方法实现）
- `sw-bpm-engine/src/test/java/com/sw/ck/bpm/engine/facade/BpmDeployFacadeImplTest.java`（新建或扩展）
- `sw-bpm-engine/src/test/java/com/sw/ck/bpm/engine/integration/`（新建一个集成测试文件，或在现有集成测试文件基础上新增测试方法——以 §6 第 9 项读取结果为准决定）
- `sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessDefService.java`（新增方法签名）
- `sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmProcessDefServiceImpl.java`（新增方法实现）
- `sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmProcessDefController.java`（新增端点方法）
- `sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmProcessDefControllerTest.java`（新建或扩展）
- `sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/impl/BpmProcessDefServiceImplTest.java`（新建或扩展）

不允许新建任何本列表之外的生产代码文件（测试文件命名需与被测类一一对应，不得新建额外的辅助类/工具类）。

## 8. 禁止修改的范围

- `Smart-WorkFlow-Web/` 整个目录下任何文件（本 Step 为纯后端 Step，前端消费留给 Step 3）
- `sw-bpm-process/.../controller/BpmTodoController.java`（不相关）
- `sw-bpm-engine/.../controller/ExternalDatasourceController.java`（不相关）
- `sw-bpm-engine/.../translator/GraphToBpmnTranslator.java`、`sw-bpm-process/.../validator/GraphValidator.java`（图转换/校验逻辑不相关，禁止顺手修改）
- 任何 Flyway 迁移脚本（本 Step 零数据库结构变更，`sw_bpm_process_def` 表结构不变）
- `BpmProcessDef.java` 实体本身（只读取，不新增/修改字段——现有 `processDefinitionId`/`status` 字段已足够）
- `getDef`/`listDefs` 两个现有端点方法体（不得顺手加权限注解或改动返回结构，见 §17）
- `sw-basic-*`、`sw-biz-system`、`sw-biz-form` 等其他模块的任何文件

## 9. 详细执行方案

1. 运行 `mvn -q compile` 确认当前基线编译通过（执行前基线校验）。
2. 打开 `BpmDeployFacade.java`，在接口中新增方法签名：
   ```java
   String getBpmnXml(String processDefinitionId);
   ```
   置于现有方法列表末尾，方法级注释一句话说明"返回 Flowable 已部署流程定义对应的原始 BPMN XML 字符串"。
3. 打开 `BpmDeployFacadeImpl.java`，实现该方法，复用已注入的 `repositoryService` 字段：
   ```java
   @Override
   public String getBpmnXml(String processDefinitionId) {
       ProcessDefinition processDefinition = repositoryService.createProcessDefinitionQuery()
               .processDefinitionId(processDefinitionId)
               .singleResult();
       if (processDefinition == null) {
           throw new IllegalStateException(
                   "Flowable 流程定义不存在，processDefinitionId=" + processDefinitionId);
       }
       try (InputStream is = repositoryService.getResourceAsStream(
               processDefinition.getDeploymentId(), processDefinition.getResourceName())) {
           return new String(is.readAllBytes(), StandardCharsets.UTF_8);
       } catch (IOException e) {
           throw new UncheckedIOException(e);
       }
   }
   ```
   需要新增 import：`org.flowable.engine.repository.ProcessDefinition`、`java.io.InputStream`、`java.io.IOException`、`java.io.UncheckedIOException`、`java.nio.charset.StandardCharsets`（按文件现有 import 顺序风格插入，若已存在则不重复）。
4. 打开 `BpmErrorCode.java`，参照文件现有错误码的编号规律，新增一个常量，语义为"流程未发布，无法获取 BPMN XML"，常量命名沿用文件既有大写下划线风格（如现有命名规律是 `XXX_YYY` 则本条命名为语义一致的新常量，编号取现有序列的下一个可用值，不得跳号也不得复用已占用编号）。
5. 打开 `BpmProcessDefService.java`（接口），新增方法签名：
   ```java
   String getBpmnXml(Long id);
   ```
6. 打开 `BpmProcessDefServiceImpl.java`，实现该方法：
   - 复用 `getDef()` 内部已有的"按 id 查询 `BpmProcessDef`，查不到则走既有 not-found 处理逻辑"的写法（不得重新发明另一套查询/异常处理方式，两个方法应共用同一段查询逻辑，若 `getDef()` 内联了查询代码则抽出一个私有方法 `getByIdOrThrow(Long id)` 供两处共用；若已存在这样的私有方法则直接复用，不重复抽取）。
   - 判断 `def.getStatus()` 是否等于 `"PUBLISHED"`（或对应枚举值，以 §6 第 6 项实际读取到的类型为准）且 `def.getProcessDefinitionId()` 非空；若不满足，抛出第 4 步新增的 `BpmErrorCode` 对应异常（沿用该模块现有的业务异常抛出方式，如 `BaseException`/`BpmException`，以实际读取到的既有抛异常写法为准，不新造异常类型）。
   - 满足条件时，调用已注入的 `BpmDeployFacade` 实例（若 `BpmProcessDefServiceImpl` 尚未注入该 Facade，需按其构造器现有的字段注入风格补充注入；若已注入则直接复用同一字段，不新增第二个字段）的 `getBpmnXml(def.getProcessDefinitionId())`，将结果原样返回。
7. 打开 `BpmProcessDefController.java`，在 `getDef` 方法附近新增端点方法：
   ```java
   @GetMapping("/{id}/bpmn-xml")
   public R<String> getBpmnXml(@PathVariable Long id) {
       return R.ok(bpmProcessDefService.getBpmnXml(id));
   }
   ```
   方法命名、参数写法、`R.ok(...)` 调用方式须与 `getDef` 方法保持完全一致的代码风格（如 `R.ok` 的实际静态方法名以文件中 `getDef`/`listDefs` 的实际写法为准，若实际方法名不同需据实调整，不得凭空假设）。
8. 运行 `mvn -q compile`，确认三个子模块（api/engine/process）均编译通过，尤其确认 `sw-bpm-process` 编译产物中没有出现任何 `org.flowable.*` 的直接 import（该模块不依赖 `sw-bpm-engine`，理应无法编译出这样的 import，此步骤是验证模块边界未被打破的间接手段）。
9. 按 §13.2 编写/扩展单元测试（`BpmDeployFacadeImplTest`、`BpmProcessDefServiceImplTest`、`BpmProcessDefControllerTest`）。
10. 按 §13.3 编写集成测试（在 `sw-bpm-engine` 的 integration 测试目录下，验证 deploy→getBpmnXml 往返）。
11. 运行 `mvn -q test`，确认全量通过，测试总数相比基线（203）只增不减。
12. 运行 `git diff --stat` 和 `git status`，确认改动范围与 §7 允许列表完全一致，未触及 §8 禁止范围（尤其确认 `Smart-WorkFlow-Web/` 零改动）。

## 10. 关键实现约束

- **模块边界不可打破**：`sw-bpm-process` 下任何新增代码禁止直接 `import org.flowable.*`。所有 Flowable API 调用必须封装在 `sw-bpm-engine` 的 `BpmDeployFacadeImpl` 内，`sw-bpm-process` 只能通过 `BpmDeployFacade` 接口方法间接调用。
- **禁止用 `BpmnXMLConverter` 重新序列化**：本 Step 明确要求使用 `repositoryService.getResourceAsStream(deploymentId, resourceName)` 取回 Flowable 部署时存档的原始 XML 字节，不得改用 `getBpmnModel()` + `BpmnXMLConverter.convertToXML()` 的重新序列化路径（后者是 `BpmDeployFacadeImpl` 现有代码在"部署时"的用法，语义是"生成待部署的 XML"，与本 Step"读取已部署的原始 XML"语义不同，混用会导致返回内容可能与实际部署内容存在细微差异）。
- **禁止新增权限注解**：与 `getDef`/`listDefs` 保持一致的权限暴露水平（现状均无 `@PreAuthorize`），本 Step 不得给新端点或现有端点新增权限校验（见 §17）。
- **禁止新建 DTO 包装类**：响应直接用 `R<String>`，不新建如 `BpmnXmlRespDTO` 之类的包装对象（返回体只有一个字符串字段，无需额外包装层）。
- **异常语义区分**：Flowable 数据缺失（`processDefinition == null`，理论上不应发生的数据不一致）用 `IllegalStateException`（表示系统内部不一致，非用户可控的业务错误）；流程未发布（用户可能操作触发的正常业务场景）用业务错误码（`BpmErrorCode`），两者不得混用同一种异常类型。

## 11. 边界情况

- **`id` 不存在于 `sw_bpm_process_def` 表**：复用 `getDef()` 现有的 not-found 处理方式，不新造处理逻辑。
- **流程处于 `DRAFT` 状态（未发布）**：`processDefinitionId` 字段为空，必须在调用 Facade 之前拦截判断，返回业务错误码，不得让请求穿透到 Facade 层后因 `processDefinitionId` 为 `null` 触发 Flowable 查询异常。
- **`sw_bpm_process_def` 记录显示已发布（`status=PUBLISHED`），但 Flowable 引擎查询不到对应流程定义**（数据不一致的异常场景，理论不应发生但需防御）：`BpmDeployFacadeImpl.getBpmnXml()` 内 `processDefinition == null` 时抛 `IllegalStateException`，不静默返回空字符串或 null。
- **多租户**：`BpmProcessDef` 按 `tenant_id` 走 MyBatis-Plus 自动拦截，跨租户访问他人流程定义的 `id` 时，查询结果本身已被拦截器排除，天然走"not-found"路径，无需额外租户校验代码。
- **XML 编码**：返回字符串按 UTF-8 解码 `repositoryService.getResourceAsStream` 返回的字节流，与项目其余文本文件编码约定一致。

## 12. 风险和回滚方案

| 风险 | 说明 | 应对 |
|------|------|------|
| `getResourceAsStream` 在本项目零使用先例 | 首次使用该 Flowable API，行为需通过集成测试验证而非假设 | §13.3 要求的 deploy→getBpmnXml 往返集成测试是核心验证手段，不可省略 |
| `BpmProcessDefServiceImpl` 可能尚未注入 `BpmDeployFacade` | 若确未注入，需新增构造器参数，属于对现有构造器签名的改动 | 若 `BpmProcessDefServiceImpl` 由 Spring 通过唯一构造器自动注入（Lombok `@RequiredArgsConstructor` 或显式构造器），新增 `final` 字段是安全的顺增改动，不影响现有调用方（Spring 自动重新装配），执行回执中需如实报告是否发生了此类构造器改动 |
| 新增错误码编号冲突 | 若并发场景下编号规律判断有误 | 执行前通读 `BpmErrorCode.java` 全部现有条目确认下一个可用编号，不得凭猜测编号 |

**回滚方案**：本 Step 全部改动均为新增方法/新增端点/新增错误码/新增测试，无对现有方法签名或行为的修改（`BpmProcessDefServiceImpl` 构造器新增字段除外，但该改动向后兼容）。回滚 = 撤销本 Step 对应的 Git 改动（`git revert` 或按文件清单手动移除新增代码），不涉及数据库回滚（零 DB 变更）。回滚验证标准：`mvn -q compile && mvn -q test` 恢复到本 Step 执行前的基线状态（203 tests 全绿）。

## 13. 测试方案

### 13.1 静态检查

- `mvn -q compile` 三个子模块（api/engine/process）零错误。
- `grep -rn "org.flowable" sw-biz/sw-bpm/sw-bpm-process/src/main/` 结果为空（确认模块边界未被打破）。
- `grep -rn "getBpmnXml" sw-biz/sw-bpm/` 确认新方法在 api（接口）、engine（实现）、process（service 接口+实现+controller）各恰好出现一次定义。

### 13.2 单元测试

- **`BpmDeployFacadeImplTest`**（新建或扩展，Mockito 风格，参照 `BpmTodoControllerTest` 的无 Spring 上下文纯单测写法）：
  1. mock `RepositoryService`/`ProcessDefinitionQuery`/`ProcessDefinition` 链式调用，验证 `getBpmnXml(processDefinitionId)` 在查询到有效 `ProcessDefinition` 时，正确调用 `repositoryService.getResourceAsStream(deploymentId, resourceName)` 并返回解码后的字符串。
  2. mock `singleResult()` 返回 `null`，验证抛出 `IllegalStateException`。
- **`BpmProcessDefServiceImplTest`**（新建或扩展）：
  1. mock 查到的 `BpmProcessDef` 状态为 `PUBLISHED` 且 `processDefinitionId` 非空，验证正确委托给 `bpmDeployFacade.getBpmnXml(...)` 并原样返回其结果。
  2. mock 状态为 `DRAFT`，验证抛出第 4 步新增的 `BpmErrorCode` 对应异常。
  3. mock 按 id 查不到记录，验证复用 `getDef()` 现有的 not-found 异常路径（断言异常类型/错误码与 `getDef()` 查不到时完全一致）。
- **`BpmProcessDefControllerTest`**（新建或扩展，`@Nested` 新增一组如 `BpmnXmlTests`）：
  1. mock service 返回一段 XML 字符串，验证 controller 方法返回 `R<String>` 且 `getCode()==0`、`getData()` 等于该字符串。
  2. mock service 抛出异常，验证异常原样向上传播（不在 controller 层吞掉或转换异常——与 `getDef`/`listDefs` 现有的异常处理风格一致）。

### 13.3 集成测试

- 在 `sw-bpm-engine` 的 integration 测试目录下新增（或在 `ApprovalProcessIntegrationTest` 基础上新增一个测试方法，以 §6 第 9 项读取结果决定）：使用与该文件相同的 Flowable 内存引擎搭建方式，部署一个含已知节点 ID（如 `StartEvent_1`）的简单 BPMN 流程，调用 `BpmDeployFacadeImpl.getBpmnXml(processDefinitionId)`，断言返回字符串非空、包含 `StartEvent_1` 字符串、可被解析为合法 XML（如用 `javax.xml.parsers.DocumentBuilder` 解析不抛异常）。

### 13.4 手工验证

不适用。本 Step 无 UI，新端点暂无前端消费方（留给 Step 3），无肉眼验收场景。

### 13.5 回归检查

- `mvn -q test` 全量测试数量相比基线（CONFIRMED 203，见 `current-status.md` §1）只增不减。
- 已有 `BpmTodoControllerTest`、`ApprovalProcessIntegrationTest` 等既有测试文件全部保持通过，不因本 Step 改动而失败。

## 14. 验收标准

1. `BpmDeployFacade` 接口新增 `getBpmnXml(String processDefinitionId)` 方法签名，`BpmDeployFacadeImpl` 提供对应实现。
2. `BpmProcessDefService`/`BpmProcessDefServiceImpl` 新增 `getBpmnXml(Long id)` 方法，正确处理未发布场景（返回业务错误码而非空值或异常穿透）。
3. `BpmProcessDefController` 新增 `GET /workflow/defs/{id}/bpmn-xml` 端点，返回类型为 `R<String>`。
4. `BpmErrorCode` 新增一个"流程未发布"语义的错误码常量，编号不与现有条目冲突。
5. `grep -rn "org.flowable" sw-biz/sw-bpm/sw-bpm-process/src/main/` 结果为空（模块边界未被打破）。
6. 未发布状态请求该端点时，返回明确的业务错误码（非 HTTP 500、非空字符串）。
7. 新增/扩展的单元测试（Facade/Service/Controller 三层）全部通过，覆盖：正常返回 XML、未发布错误、Flowable 数据缺失异常、按 id 查不到记录四类场景。
8. 至少一个集成测试验证 deploy→getBpmnXml 往返，返回的 XML 字符串包含部署时的原始节点 ID。
9. `mvn -q compile && mvn -q test` 全量通过，测试总数相比基线（203）只增不减。
10. `git diff`/`git status` 确认 `Smart-WorkFlow-Web/` 零改动，`getDef`/`listDefs` 两个现有端点方法体未被修改，无 Flyway 迁移文件新增。

## 15. 执行回执格式

按 `system.md` §7.1 标准 13 项格式，写入 `product/bpmn-adapter/receipts/step-2-execution.md`。

## 16. 测试回执格式

按 `system.md` §7.2 标准 12 项格式，写入 `product/bpmn-adapter/receipts/step-2-test.md`。

## 17. 明确禁止事项

- 不要给 `getDef`/`listDefs` 现有端点顺手添加 `@PreAuthorize` 权限注解（即使认为这是"顺便修复"的机会，也超出本 Step 范围；若确认需要，应在回执中报告，交由规划层另开独立 Step）。
- 不要改用 `getBpmnModel()` + `BpmnXMLConverter.convertToXML()` 重新序列化的方式实现本 Step（必须用 `getResourceAsStream`，见 §10）。
- 不要新建独立的 Controller 类（必须复用 `BpmProcessDefController`）。
- 不要新建 DTO/VO 包装类包裹 XML 字符串（直接用 `R<String>`）。
- 不要修改 `sw_bpm_process_def` 表结构或新增 Flyway 迁移脚本（本 Step 零 DB 变更）。
- 不要触碰 `Smart-WorkFlow-Web/` 任何文件（本 Step 为纯后端 Step，前端消费是 Step 3 的范围）。
- 不要在回执中预告、评论或征询 Step 3 的范围与内容（按 system.md §0.3 硬约束，完成本 Step 并写完回执后必须停止）。
