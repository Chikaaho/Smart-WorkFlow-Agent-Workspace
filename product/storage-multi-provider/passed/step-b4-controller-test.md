# Step B4：Controller 测试 + 全量回归

## 1. 当前状态

| 项目 | 状态 |
|------|:----:|
| 功能 | storage-multi-provider — 多向可配置文件存储 |
| 功能状态 | **IN_PROGRESS** |
| 前置 Step | B1 ✅ PASSED（18/18）→ B2 ✅ PASSED（14/14）→ B3 ✅ PASSED（15/15） |
| 当前 Step | B4 — Controller 测试 + 全量回归（READY） |
| 后端基线 | 154 tests, BUILD SUCCESS（B3 验收确认） |
| B3 交付物 | StorageFacade（4 方法）+ StorageFacadeImpl + StorageFileService/Impl + StorageController（5 端点） |

## 2. Step 目标

为 B3 交付的 `StorageController`（5 端点）和 `StorageFacadeImpl`（核心编排层）编写纯 Mockito 单元测试，覆盖 happy path + 边界/异常路径，验证全量测试基线不退化。本 Step 是 storage 模块后端最后一个 Step，通过后后端链路完整闭环。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：标准 Mockito + AssertJ 单元测试，完全参照 BpmTodoControllerTest/AuthMeControllerTest 既有模式，无架构决策，线性 mock/assert 逻辑
是否触发升级条件：否
```

## 4. 模型选择理由

B4 的工作是编写 18 个测试用例，覆盖 Controller 和 FacadeImpl 的 happy path + 边界/异常路径。BpmTodoControllerTest（460 行，18 个 @Test）提供了可直接复制的模板：`mock()` 构造依赖 → 手动组装被测对象 → `LoginUserHolder.set()` 模拟认证 → AssertJ 断言 + Mockito verify。纯体力活，无需 Pro 的架构分析能力。

## 5. 已知上下文

### 5.1 测试模式（项目既有惯例）

| 惯例 | 说明 |
|------|------|
| **纯 Mockito，不装载 Spring 上下文** | 用 `mock()` 创建所有依赖，手动 `new` 被测对象；参照 `BpmTodoControllerTest` / `AuthMeControllerTest` |
| **JUnit 5 + @DisplayName + @Nested** | 用 `@Nested` 按端点/方法分组，每用例含中文 `@DisplayName` |
| **AssertJ 断言** | `assertThat(...).isEqualTo(...)` / `.hasSize(...)` / `.isInstanceOf(...)`；不混用 JUnit 5 `assertEquals` |
| **LoginUserHolder.set()/clear()** | 在 `@BeforeEach`/`@AfterEach` 中管理 ThreadLocal 上下文，参照 `BpmTodoControllerTest` 的 `setLoginUser()` 工厂方法 |
| **测试数据工厂方法** | 每个测试类提供 `createXxx()` 私有方法，避免重复构造代码 |
| **verify() 验证副作用** | 对 mock 的关键调用使用 `verify(mock).method(args)`，对不应发生的调用使用 `verify(mock, never()).method(any())` |
| **`@ExtendWith(MockitoExtension.class)`** | 可选（纯 `mock()` 不需要，但若用 `@Mock` 注解则需） |

### 5.2 被测类依赖关系

```
StorageController
├── StorageFacade (mock)
└── StorageFileService (mock)

StorageFacadeImpl
├── StorageProviderRegistry (mock)
├── StorageFileService (mock)
└── StorageProperties (mock 或直接 new)
```

### 5.3 B3 就绪资产（测试目标）

| 类 | 位置 | 关键方法 |
|------|------|----------|
| `StorageController` | `-biz/controller/` | `upload(MultipartFile)`, `list(long,long)`, `info(String)`, `delete(String)`, `download(String)` |
| `StorageFacadeImpl` | `-biz/impl/` | `upload(InputStream,String,String)`, `download(String)`, `delete(String)`, `getUrl(String)` |
| `StorageFacade` | `-api/api/` | 接口（含 4 方法签名） |
| `StorageFileService` | `-biz/service/` | `findByStorageKey(String)`, `page(Page,Wrapper)`, `save(entity)`, `removeById(id)` |
| `StorageProviderRegistry` | `-biz/provider/` | `getActiveProvider()`, `getProvider(String)` |
| `StorageProvider` | `-biz/provider/` | `upload(InputStream,String,String)`, `download(String)`, `delete(String)`, `getUrl(String)`, `getType()` |
| `StorageUploadResult` | `-api/api/` | `@Builder` DTO |

## 6. 执行前必须读取的文件

| 优先级 | 文件 | 目的 |
|:------:|------|------|
| 1 | `sw-biz/sw-bpm/sw-bpm-process/src/test/java/.../controller/BpmTodoControllerTest.java` | 测试模板：mock 构造 + @Nested 分组 + AssertJ + verify |
| 2 | `sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/.../controller/AuthMeControllerTest.java` | 测试模板：LoginUserHolder.set()/clear() 模式 |
| 3 | `sw-basic-storage-biz/.../controller/StorageController.java` | 被测类：确认 5 端点签名和异常路径 |
| 4 | `sw-basic-storage-biz/.../impl/StorageFacadeImpl.java` | 被测类：确认 4 方法签名和 mock 调用链 |
| 5 | `sw-basic-storage-biz/.../provider/StorageProvider.java` | 确认 Provider 接口方法签名 |
| 6 | `sw-basic-storage-biz/.../provider/StorageProviderRegistry.java` | 确认 Registry.getActiveProvider()/getProvider() 签名 |
| 7 | `sw-basic-storage-biz/.../service/StorageFileService.java` | 确认 Service 方法签名 |
| 8 | `sw-basic-storage-biz/.../entity/StorageFile.java` | 确认实体字段和 setter |
| 9 | `sw-basic-storage-api/.../api/StorageUploadResult.java` | 确认 DTO 字段和 @Builder |
| 10 | `sw-basic-storage-biz/.../config/StorageProperties.java` | 确认 ProviderConfig 结构（用于 FacadeImplTest） |
| 11 | `sw-framework/sw-common/.../response/R.java` | 确认 `R.ok()` / `R.fail()` 签名 |
| 12 | `sw-framework/sw-common/.../exception/BaseException.java` | 确认构造签名（int code, String message） |
| 13 | `sw-framework/sw-common/.../exception/CommonErrorCode.java` | 确认 PARAM_ERROR / NOT_FOUND 错误码 |

## 7. 允许修改的文件范围

### 新建文件（2 个）

| # | 文件 | 模块 | 测试目标 |
|---|------|:----:|----------|
| 1 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/test/java/com/sw/ck/storage/controller/StorageControllerTest.java` | -biz | StorageController 5 端点（10 用例） |
| 2 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/test/java/com/sw/ck/storage/impl/StorageFacadeImplTest.java` | -biz | StorageFacadeImpl 4 方法（8 用例） |

### 修改文件（0 个）

本 Step 只新增测试文件，不修改任何已有文件。

## 8. 禁止修改的范围

- **禁止修改** `sw-basic-storage-biz/src/main/` 下的任何业务代码
- **禁止修改** Provider 层（StorageProvider.java、4 个实现、Registry）
- **禁止修改** Entity / Mapper / Properties / Facade / Service / Controller
- **禁止修改** 任何 pom.xml 或配置文件
- **禁止修改** `sw-bootstrap/` 下的任何文件
- **禁止修改** 已有测试文件
- **禁止触碰前端** `Smart-WorkFlow-Web/`
- **禁止新增** main 目录下的任何文件

## 9. 详细执行方案

### 9.1 创建 `StorageControllerTest.java`（~350 行，10 测试用例）

**文件**：`sw-basic-storage-biz/src/test/java/com/sw/ck/storage/controller/StorageControllerTest.java`

**包声明**：`package com.sw.ck.storage.controller;`

**依赖 mock**：`StorageFacade` + `StorageFileService`（各用 `mock()`）

**被测对象构造**：
```java
private final StorageFacade storageFacade = mock(StorageFacade.class);
private final StorageFileService storageFileService = mock(StorageFileService.class);
private final StorageController controller = new StorageController(storageFacade, storageFileService);
```

**测试用例清单**：

#### 9.1.1 @Nested("POST /upload")

| # | @DisplayName | Arrange | Act | Assert |
|:--|------|------|-----|------|
| T1 | 正常上传 → 返回 StorageUploadResult | Mock `MultipartFile`（`mock(MultipartFile.class)`，stub `getInputStream()` 返回 `ByteArrayInputStream("test".getBytes())`、`getOriginalFilename()` 返回 `"test.png"`、`getContentType()` 返回 `"image/png"`）；stub `storageFacade.upload(any(), eq("test.png"), eq("image/png"))` 返回 `StorageUploadResult.builder().storageKey("abc.png").storageName("abc.png").storageUrl("/files/abc.png").fileSize(4L).build()` | `controller.upload(file)` | `result.getCode() == 0`；`result.getData().getStorageKey()` 为 `"abc.png"`；`result.getData().getFileSize()` 为 `4L`；`verify(storageFacade).upload(any(), eq("test.png"), eq("image/png"))` |
| T2 | 空文件上传 → 抛 PARAM_ERROR | Mock `MultipartFile`，stub `isEmpty()` 返回 true | `controller.upload(file)` | `assertThatThrownBy(...)` → `isInstanceOf(BaseException.class)` → `hasMessageContaining("不能为空")`；`verify(storageFacade, never()).upload(any(), any(), any())` |

**注意**：`MockMultipartFile` 是 Spring Test 提供的类，需要 `spring-test` 依赖。但项目测试是纯 Mockito 不装载 Spring 上下文。建议直接用 `mock(MultipartFile.class)` + stub 三个方法（`getInputStream`/`getOriginalFilename`/`getContentType`/`isEmpty`），避免引入 spring-test 依赖。`InputStream` 可用 `new ByteArrayInputStream("test".getBytes())`。

#### 9.1.2 @Nested("GET / (list)")

| # | @DisplayName | Arrange | Act | Assert |
|:--|------|------|-----|------|
| T3 | 正常分页查询 → 返回 Page 含 2 条记录 | 创建 2 个 `StorageFile` 实体；`Page<StorageFile> mockPage = new Page<>(1, 20); mockPage.setRecords(List.of(file1, file2)); mockPage.setTotal(2);` → stub `storageFileService.page(any(Page.class), any())` 返回 mockPage | `controller.list(1, 20)` | `result.getCode() == 0`；`result.getData().getRecords().hasSize(2)`；`result.getData().getTotal() == 2`；`result.getData().getCurrent() == 1` |
| T4 | 空列表 → records=[], total=0 | `Page<StorageFile> emptyPage = new Page<>(1, 20);` → stub `storageFileService.page(...)` 返回 emptyPage | `controller.list(1, 20)` | `result.getCode() == 0`；`result.getData().getRecords().isEmpty()` |
| T5 | 默认分页参数 → page=1, size=20 | 同上，创建空 Page | `controller.list(1, 20)` | `result.getData().getSize() == 20` |

**注意**：Page 的构造用 MyBatis-Plus 的 `com.baomidou.mybatisplus.extension.plugins.pagination.Page`（StorageController 使用的类型）。MyBatis-Plus 已在 -biz 的 pom.xml 中（`mybatis-plus-boot-starter`），test scope 可直接引用。

#### 9.1.3 @Nested("GET /{storageKey} (info)")

| # | @DisplayName | Arrange | Act | Assert |
|:--|------|------|-----|------|
| T6 | 文件存在 → 返回 StorageFile | 创建 `StorageFile` 实体（setStorageKey/OriginalName/FileSize 等）；stub `storageFileService.findByStorageKey("abc.png")` 返回该实体 | `controller.info("abc.png")` | `result.getCode() == 0`；`result.getData().getStorageKey()` 为 `"abc.png"`；`result.getData().getOriginalName()` 正确 |
| T7 | 文件不存在 → 抛 NOT_FOUND | stub `storageFileService.findByStorageKey("nonexistent")` 返回 null | `controller.info("nonexistent")` | `assertThatThrownBy(...)` → `isInstanceOf(BaseException.class)` → `hasMessageContaining("文件不存在")` |

#### 9.1.4 @Nested("DELETE /{storageKey}")

| # | @DisplayName | Arrange | Act | Assert |
|:--|------|------|-----|------|
| T8 | 正常删除 → 返回 R.ok() | stub `storageFacade.delete("abc.png")` 正常返回（无异常） | `controller.delete("abc.png")` | `result.getCode() == 0`；`verify(storageFacade).delete("abc.png")` |

**注意**：StorageController.delete() 不自己查记录，直接委托给 facade.delete()。facade.delete() 内部做 getFileOrThrow。因此 Controller 测试只需验证委托正确。

#### 9.1.5 @Nested("GET /{storageKey}/download")

| # | @DisplayName | Arrange | Act | Assert |
|:--|------|------|-----|------|
| T9 | 文件存在 → 返回 ResponseEntity 含正确 Content-Type 和 Content-Disposition | 创建 `StorageFile`，stub `getOriginalName()` 返回 `"测试文件.pdf"`、`getContentType()` 返回 `"application/pdf"`；stub `storageFileService.findByStorageKey("doc.pdf")` 返回该实体；stub `storageFacade.download("doc.pdf")` 返回 `new ByteArrayInputStream("pdf-content".getBytes())` | `controller.download("doc.pdf")` | `response.getStatusCode() == HttpStatus.OK`；`response.getHeaders().getContentType().toString()` 含 `"application/pdf"`；`response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION)` 含 `"filename"`；`response.getBody()` 非 null |
| T10 | 文件不存在 → 抛 NOT_FOUND | stub `storageFileService.findByStorageKey("nonexistent")` 返回 null | `controller.download("nonexistent")` | `assertThatThrownBy(...)` → `isInstanceOf(BaseException.class)` → `hasMessageContaining("文件不存在")` |

**注意**：T9 的 `URLEncoder.encode` 会转义中文字符为 `%XX` 形式。断言用 `contains("filename")` 而非精确匹配即可。`MediaType.parseMediaType` 的 `toString()` 可能返回 `"application/pdf"` 或 `"application/pdf;charset=..."`，用 `contains` 断言。

### 9.2 创建 `StorageFacadeImplTest.java`（~280 行，8 测试用例）

**文件**：`sw-basic-storage-biz/src/test/java/com/sw/ck/storage/impl/StorageFacadeImplTest.java`

**包声明**：`package com.sw.ck.storage.impl;`

**依赖 mock**：
```java
private final StorageProviderRegistry registry = mock(StorageProviderRegistry.class);
private final StorageFileService storageFileService = mock(StorageFileService.class);
private final StorageProperties storageProperties = new StorageProperties();
private final StorageFacadeImpl facade = new StorageFacadeImpl(registry, storageFileService, storageProperties);
```

**注意**：`StorageProperties` 不用 mock（简单 POJO），直接 new 并设置字段即可。Provider 用 `mock(StorageProvider.class)`。

**测试用例清单**：

#### 9.2.1 @Nested("upload()")

| # | @DisplayName | Arrange | Act | Assert |
|:--|------|------|-----|------|
| T11 | 正常上传 → 生成 UUID 文件名，调用 Provider，落库，返回 StorageUploadResult | `StorageProperties` 设置 `providers` 含 `{"minio": {bucket: "test-bucket"}}`；Provider mock stub `getType()` 返回 `"minio"`，`upload(any(), any(), eq("image/png"))` 返回 `StorageUploadResult.builder().storageKey("abc.png").storageName("abc.png").storageUrl("http://minio/abc.png").fileSize(1024L).build()`；`registry.getActiveProvider()` 返回该 Provider | `facade.upload(new ByteArrayInputStream("data".getBytes()), "photo.png", "image/png")` | 返回的 `StorageUploadResult` 各字段正确；`storageKey` 非 null；`verify(storageFileService).save(any(StorageFile.class))` 被调用 1 次；传入的 `StorageFile` 实体：`originalName`=`"photo.png"`、`fileExt`=`"png"`、`providerType`=`"minio"`、`bucketName`=`"test-bucket"` |
| T12 | 无扩展名文件 → 生成纯 UUID（无点） | 同上，`originalName` 为 `"README"`；Provider stub 同 T11 | `facade.upload(..., "README", "text/plain")` | `result.getStorageKey()` 非 null；`verify(storageFileService).save(any())`；保存的 entity `fileExt` 为空串 |

**验证扩展名提取**：使用 `ArgumentCaptor<StorageFile>` 捕获 `save()` 参数，断言 `file.getFileExt()` 和 `file.getOriginalName()`。

#### 9.2.2 @Nested("download()")

| # | @DisplayName | Arrange | Act | Assert |
|:--|------|------|-----|------|
| T13 | 正常下载 → 按 file.providerType 选择 Provider | 创建 `StorageFile`，stub `getProviderType()` 返回 `"minio"`；stub `storageFileService.findByStorageKey("abc.png")` 返回该实体；Provider mock stub `download("abc.png")` 返回 `ByteArrayInputStream`；`registry.getProvider("minio")` 返回该 Provider | `facade.download("abc.png")` | 返回非 null 的 `InputStream`；`verify(registry).getProvider("minio")`（**不是** getActiveProvider） |
| T14 | 文件不存在 → 抛 NOT_FOUND | stub `storageFileService.findByStorageKey("ghost.png")` 返回 null | `facade.download("ghost.png")` | `assertThatThrownBy(...)` → `isInstanceOf(BaseException.class)` → `getCode() == 404`；`verify(registry, never()).getProvider(any())` |

#### 9.2.3 @Nested("delete()")

| # | @DisplayName | Arrange | Act | Assert |
|:--|------|------|-----|------|
| T15 | 正常删除 → 调 Provider delete + Service removeById | 创建 `StorageFile`，stub `getId()` 返回 `100L`，`getProviderType()` 返回 `"minio"`；stub `storageFileService.findByStorageKey("abc.png")` 返回该实体；Provider mock；`registry.getProvider("minio")` 返回 Provider | `facade.delete("abc.png")` | `verify(provider).delete("abc.png")`；`verify(storageFileService).removeById(100L)` |
| T16 | Provider 不存在时 → 跳过 Provider 删除，仍 removeById | 同上，但 `registry.getProvider("minio")` 返回 null | `facade.delete("abc.png")` | **不抛异常**；`verify(storageFileService).removeById(100L)` 被调用（Provider null 时仅 log.warn + 继续） |

#### 9.2.4 @Nested("getUrl()")

| # | @DisplayName | Arrange | Act | Assert |
|:--|------|------|-----|------|
| T17 | 正常获取 URL → 从 Provider 重新生成 | 创建 `StorageFile`，stub `getProviderType()` 返回 `"minio"`；stub `storageFileService.findByStorageKey("abc.png")` 返回该实体；Provider mock stub `getUrl("abc.png")` 返回 `"http://minio/bucket/abc.png?sign=xxx"`；`registry.getProvider("minio")` 返回 Provider | `facade.getUrl("abc.png")` | 返回 `"http://minio/bucket/abc.png?sign=xxx"`；`verify(provider).getUrl("abc.png")` |
| T18 | Provider 不存在时 → 降级返回缓存 URL | 同上，但 `registry.getProvider("minio")` 返回 null；`StorageFile.storageUrl` 存有缓存值 `"http://old-cache/abc.png"` | `facade.getUrl("abc.png")` | 返回 `"http://old-cache/abc.png"`（降级值） |

### 9.3 校验命令

```bash
# 1. 编译验证（包含测试编译）
cd /data/reasonix/files/Smart-WorkFlow && mvn -q test-compile; echo "EXIT: $?"

# 2. 全量测试（含新增测试用例）
cd /data/reasonix/files/Smart-WorkFlow && mvn -q test; echo "EXIT: $?"

# 3. 仅运行 storage 模块测试（快速迭代）
cd /data/reasonix/files/Smart-WorkFlow && mvn -q test -pl sw-basic/sw-basic-storage/sw-basic-storage-biz; echo "EXIT: $?"
```

## 10. 关键实现约束

- **纯 Mockito，零 Spring 上下文**：不添加 `@SpringBootTest` / `@ExtendWith(SpringExtension.class)` / `@WebMvcTest`。用 `mock()` 创建一切依赖，手动 `new` 被测对象
- **MultipartFile 用 `mock(MultipartFile.class)`**：不引入 `MockMultipartFile`（需要 spring-test 依赖）。stub `getInputStream()` / `getOriginalFilename()` / `getContentType()` / `isEmpty()` 四个方法即可
- **InputStream 用 `ByteArrayInputStream`**：`new ByteArrayInputStream("test-data".getBytes())`，简单可靠
- **LoginUserHolder 清理**：`@AfterEach void tearDown() { LoginUserHolder.clear(); }`（Controller 测试需要，FacadeImpl 测试不需要）
- **测试数据工厂方法**：每个测试类提供 `createStorageFile()` 私有方法（设置 `storageKey` / `originalName` / `providerType` / `storageUrl` / `id` 等最少必要字段）
- **AssertJ 断言**：不用 JUnit 5 `assertEquals`/`assertTrue`，统一 `assertThat(...).isEqualTo(...)`
- **每用例一个 `@Test`**：不把多个不相关的场景塞进一个用例
- **测试方法命名**：用 `@DisplayName` 中文描述，方法名可用简短英文（如 `upload_shouldReturnStorageUploadResult`）或省略（仅靠 @DisplayName 区分）
- **Mockito static import**：`mock()` / `when()` / `verify()` / `any()` / `eq()` / `argThat()` / `never()`
- **不要写无关测试**：不测试 StorageProvider 实现（那是 B4 范围外的集成测试），不测试 MyBatis-Plus 框架行为（如 @TableLogic 是否生效）

## 11. 边界情况

| 边界 | 测试覆盖 | 文件 |
|------|:--------:|:----:|
| 上传空文件 | T2: MultipartFile.isEmpty()=true → PARAM_ERROR | Controller |
| 无扩展名文件上传 | T12: originalName="README" → ext="" → 纯 UUID | FacadeImpl |
| 文件名 null | 未直接覆盖（FacadeImpl.extractExtension(null) 返回空串，由 T12 间接验证） | FacadeImpl |
| 查询不存在的文件 | T7 (Controller info) + T10 (Controller download) + T14 (FacadeImpl download) | Both |
| Provider 为 null（提供商不可用） | T16 (delete 跳过) + T18 (getUrl 降级) | FacadeImpl |
| 空列表分页 | T4: total=0, records=[] | Controller |
| Content-Disposition 含中文文件名 | T9: `URLEncoder.encode` → `%XX` 编码 | Controller |
| 返回类型验证（R<T> vs ResponseEntity） | T1 (R<StorageUploadResult>) + T3 (R<Page<StorageFile>>) + T8 (R<Void>) + T9 (ResponseEntity<InputStreamResource>) | Controller |
| 下载时 Provider.download() 返回 null | 未显式覆盖（B3 实现中 download 经 getFileOrThrow 先校验存在性，Provider 行为由 contract 约束） | — |

## 12. 风险和回滚方案

### 风险

| 风险 | 可能性 | 影响 | 缓解 |
|------|:------:|------|------|
| `mock(MultipartFile.class)` 的 `getOriginalFilename()` 返回 null（Mockito 默认） | 中 | T1 NPE | 显式 stub `when(file.getOriginalFilename()).thenReturn("test.png")` |
| MyBatis-Plus `Page` 类在 test scope 不可用 | 低 | 编译失败 | -biz 的 pom.xml 依赖 `mybatis-plus-boot-starter`（compile scope），test 可直接引用 |
| 测试编译失败因 `javax.annotation` / `jakarta.annotation` 冲突 | 低 | test-compile 失败 | 项目已是 Java 21 + Spring Boot 3.4（jakarta），但 Mockito 的 `@Mock` 不需要 Jakarta API |
| 新增测试与已有测试冲突（如 mock 了全局静态状态） | 极低 | 测试不稳定 | 纯 Mockito + ThreadLocal 管理，无全局状态污染 |

### 回滚

```bash
# 删除新增的 2 个测试文件即可
rm sw-basic-storage-biz/src/test/java/com/sw/ck/storage/controller/StorageControllerTest.java
rm sw-basic-storage-biz/src/test/java/com/sw/ck/storage/impl/StorageFacadeImplTest.java
mvn -q test  # 确认回到 154 tests
```

回滚成功标志：`mvn -q test` → 154 tests, BUILD SUCCESS。

## 13. 测试方案

### 13.1 静态检查

| 编号 | 检查项 | 命令 |
|:----:|--------|------|
| T1 | 测试文件数 = 2 | `find sw-basic-storage-biz/src/test -name "*Test*.java" \| wc -l` → 预期 2 |
| T2 | ControllerTest 存在 | `ls sw-basic-storage-biz/src/test/java/.../controller/StorageControllerTest.java` |
| T3 | FacadeImplTest 存在 | `ls sw-basic-storage-biz/src/test/java/.../impl/StorageFacadeImplTest.java` |
| T4 | 无 @SpringBootTest | `grep -r "SpringBootTest\|SpringExtension\|WebMvcTest" sw-basic-storage-biz/src/test/` → 零命中 |
| T5 | 测试文件编译通过 | `mvn -q test-compile` → EXIT 0 |

### 13.2 单元测试

| 编号 | 检查项 | 命令 |
|:----:|--------|------|
| T6 | storage 模块测试通过 | `mvn -q test -pl sw-basic/sw-basic-storage/sw-basic-storage-biz` → EXIT 0 |
| T7 | 测试计数 ≥ 18（storage 模块内） | `mvn test -pl ... \| grep "Tests run:"` → ≥ 18 |

### 13.3 集成测试

不适用（B4 为纯 Mockito 单元测试）。

### 13.4 手工验证

| 编号 | 验证项 | 步骤 |
|:----:|--------|------|
| V1 | ControllerTest 中 MultipartFile mock 无 NPE | 通读 ControllerTest upload 用例，确认 `getInputStream()`/`getOriginalFilename()`/`getContentType()`/`isEmpty()` 均已 stub |
| V2 | FacadeImplTest 中验证了 `registry.getProvider(type)`（非 getActiveProvider） | grep T13 代码，确认 `verify(registry).getProvider("minio")` |
| V3 | 所有测试方法的 @DisplayName 为中文描述 | 代码审查：`@DisplayName` 在每个 `@Test` 方法上 |

### 13.5 回归检查

| 编号 | 检查项 | 命令 | 预期 |
|:----:|--------|------|:----:|
| R1 | 全量测试计数 ≥ 154 + 18 = 172 | `mvn -q test` → `Tests run: >=172` | ≥ 172 |
| R2 | 全量测试零失败 | `mvn -q test` → `Failures: 0, Errors: 0` | 0 / 0 |
| R3 | BUILD SUCCESS | `mvn -q test` → `BUILD SUCCESS` | SUCCESS |
| R4 | 非 storage 模块测试计数不变 | `mvn test` 输出中 form/system/bpm/notify/security/common 测试数与基线一致 | 各模块无退化 |

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|:--------:|
| B4-1 | `StorageControllerTest.java` 存在，覆盖全部 5 端点（upload/list/info/delete/download） | T2 + 代码审查（每个端点至少 1 happy path + 边界/异常） |
| B4-2 | ControllerTest 用纯 Mockito（无 `@SpringBootTest` / `@WebMvcTest` / `SpringExtension`） | T4 |
| B4-3 | ControllerTest upload 覆盖正常上传 + 空文件拒绝 | T1 + 代码审查 |
| B4-4 | ControllerTest list 覆盖正常分页 + 空列表 | T1 + 代码审查 |
| B4-5 | ControllerTest info 覆盖存在 + 不存在 | T1 + 代码审查 |
| B4-6 | ControllerTest download 覆盖正常下载（含 Content-Type/Content-Disposition 断言）+ 不存在 | T1 + 代码审查 |
| B4-7 | `StorageFacadeImplTest.java` 存在，覆盖全部 4 方法（upload/download/delete/getUrl） | T3 |
| B4-8 | FacadeImplTest 用纯 Mockito（无 `@SpringBootTest`） | T4 |
| B4-9 | FacadeImplTest upload 覆盖正常 + 无扩展名 | T3 + 代码审查 |
| B4-10 | FacadeImplTest download 覆盖正常（verify getProvider 而非 getActiveProvider）+ 不存在 | T3 + 代码审查 |
| B4-11 | FacadeImplTest delete 覆盖正常 + Provider null 不抛异常 | T3 + 代码审查 |
| B4-12 | FacadeImplTest getUrl 覆盖正常（Provider 再生 URL）+ Provider null 降级返回缓存 URL | T3 + 代码审查 |
| B4-13 | `mvn -q test-compile` 退出码 0（含测试文件编译） | T5 |
| B4-14 | `mvn -q test -pl sw-basic/sw-basic-storage/sw-basic-storage-biz` 退出码 0 | T6 |
| B4-15 | `mvn -q test` 退出码 0，全量测试计数 ≥ 172（基线 154 + 新增 ≥ 18），BUILD SUCCESS | R1 + R2 + R3 |

## 15. 执行回执格式

按 §7.1 标准格式返回，特别需包含：

- 第 4 项"实际修改的文件"：列出 2 个新建测试文件
- 第 5 项"每个文件的修改摘要"：每个测试文件列出测试用例数、@Nested 分组数、覆盖场景
- 第 6 项"实际执行的命令"：含完整 `mvn -q test-compile` + `mvn -q test -pl ...` + `mvn -q test` 命令及退出码
- 第 7 项"命令输出摘要"：storage module test count、全量 test count、BUILD 结果
- 第 8 项"与原方案的偏差"：任何与 §9 测试用例的差异（含不同意的测试用例及原因）
- 第 12 项"Git diff 摘要"：新增行数

## 16. 测试回执格式

按 §7.2 标准格式返回，特别需包含：

- 第 4 项"实际执行的测试命令"：列出 T1-T7 + R1-R4 全部命令及完整输出
- 第 5 项"各测试项结果"：逐条 T1-T7 + R1-R4 列表（**含实际数字**，如 "Tests run: 176, Failures: 0"）
- 第 6 项"通过项"：每个测试项的完整输出粘贴
- 第 10 项"是否满足验收标准"：逐条对照 B4-1 ~ B4-15

**测试计数格式要求**：
```text
全量测试: Tests run: <N>, Failures: 0, Errors: 0, Skipped: 0
storage 模块测试: Tests run: <M>, Failures: 0, Errors: 0, Skipped: 0
新增测试数: <M - 0>（基线 154，storage 模块原 0 个测试）
```

## 17. 明确禁止事项

- ❌ **禁止使用 `@SpringBootTest` / `@WebMvcTest` / `@DataJpaTest` 等 Spring 上下文注解** — 纯 Mockito
- ❌ **禁止引入 `MockMultipartFile`（需要 spring-test 依赖）** — 用 `mock(MultipartFile.class)`
- ❌ **禁止修改 main/ 目录下的任何业务代码**
- ❌ **禁止修改 pom.xml 或任何配置文件**
- ❌ **禁止修改已有测试文件**（按文件名 grepping）
- ❌ **禁止新增 main 目录下的文件**
- ❌ **禁止新增超过 2 个测试文件**
- ❌ **禁止触碰前端项目**
- ❌ **禁止在测试中 mock 静态方法或 ThreadLocal**（除 LoginUserHolder.set()/clear() 标准模式外）
- ❌ **禁止使用 JUnit 4 注解**（`@RunWith`、`@Before`、`org.junit.Test`）— 统一 JUnit 5
- ❌ **禁止混用 AssertJ 和 JUnit 5 断言** — 统一 AssertJ `assertThat`
- ❌ **禁止测试 Provider 实现的内部逻辑** — 那是集成测试的范围（未来 Seam），B4 仅测 Controller + FacadeImpl
