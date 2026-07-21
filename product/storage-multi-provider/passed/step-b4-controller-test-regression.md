# Step B4：Controller 测试 + 全量回归

## 1. 当前状态

| 项目 | 状态 |
|------|:----:|
| 功能 | storage-multi-provider — 多向可配置文件存储 |
| 功能状态 | **IN_PROGRESS** |
| 前置 Step | B1 ✅ → B2 ✅ → B3 ✅ PASSED（15/15） |
| 当前 Step | B4 — Controller 测试 + 全量回归（PENDING） |
| 后端基线 | 154 tests, BUILD SUCCESS, Java 21 + Spring Boot 3.4 |

## 2. Step 目标

为 B3 创建的 `StorageController` 编写纯 Mockito 单元测试，覆盖全部 5 个端点的 happy path + 异常路径，并执行全量回归验证基线无漂移。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：标准 CRUD Controller 纯 Mockito 测试，有 DeptControllerTest/BpmTodoControllerTest 先行模式可严格参照，零架构决策
是否触发升级条件：否
```

## 4. 模型选择理由

B4 是纯 Mockito 单元测试编写任务。测试模式在项目中已有 8+ 个 Controller 测试用例（DeptControllerTest / UserControllerTest / RoleControllerTest / PostControllerTest / AuthMeControllerTest / BpmTodoControllerTest 等）完全一致。StorageController 只有 5 个端点，逻辑线性，无复杂状态判断。完全在 deepseek-v4-flash 舒适区内。

## 5. 已知上下文

### 5.1 测试模式（钉死）

本项目中所有 Controller 单元测试遵循以下模式：

| 特性 | 规范 |
|------|------|
| Class 修饰符 | `package-private`（无 `public`） |
| Spring 上下文 | **不装载**（无 `@SpringBootTest`、`@ExtendWith`） |
| Mock 方式 | 字段级 `mock()` 手创 |
| 注入方式 | 手动 `new Controller(mock1, mock2)` 构造注入 |
| 模拟认证 | `LoginUserHolder.set()` / `clear()`（仅需要认证的 Controller） |
| 断言库 | AssertJ（`assertThat(...).isZero()` / `hasSize()` 等） |
| 交互验证 | Mockito `verify()` / `verify(..., never())` |
| 异常验证 | `assertThatThrownBy(() -> ...).isInstanceOf(BaseException.class)` |
| 命名 | `@DisplayName` 类 + 方法级别 |
| 分组 | `@Nested`（可选，端点 ≤ 3 可扁平化） |

### 5.2 StorageController 签名

```java
@RestController
@RequestMapping("/storage/files")
@RequiredArgsConstructor
public class StorageController {
    private final StorageFacade storageFacade;
    private final StorageFileService storageFileService;

    // POST /upload   → R<StorageUploadResult>
    // GET /           → R<Page<StorageFile>>
    // GET /{key}      → R<StorageFile>
    // DELETE /{key}   → R<Void>
    // GET /{key}/download → ResponseEntity<InputStreamResource>
}
```

- **不需要 `LoginUserHolder`** — StorageController 不使用认证上下文
- 2 个构造依赖：`StorageFacade` + `StorageFileService`

### 5.3 上游依赖签名

```java
// StorageFacade
StorageUploadResult upload(InputStream inputStream, String originalName, String contentType);
InputStream download(String storageKey);
void delete(String storageKey);
String getUrl(String storageKey);

// StorageFileService extends BaseService<StorageFile>
StorageFile findByStorageKey(String storageKey);
Page<StorageFile> page(Page<StorageFile> page, QueryWrapper<StorageFile> wrapper);

// R<T>
static <T> R<T> ok(T data);    // code=0
static <T> R<T> ok();           // code=0
static <T> R<T> fail(String msg); // code=1

// BaseException
BaseException(int code, String message);

// CommonErrorCode
NOT_FOUND(404, "资源不存在"), PARAM_ERROR(400, "参数错误")
```

### 5.4 断言模式

| 断言目标 | 写法 |
|----------|------|
| 成功码检查 | `assertThat(result.getCode()).isZero()` |
| 数据内容 | `assertThat(result.getData()).isNotNull()` |
| 集合大小 | `assertThat(result.getData().getRecords()).hasSize(N)` |
| 异常码检查 | `assertThatThrownBy(...).isInstanceOf(BaseException.class).hasMessageContaining("...")` |
| Mock 调用验证 | `verify(mock).method(eq(arg), any())` |
| Mock 零调用 | `verify(mock, never()).method(any())` |

## 6. 执行前必须读取的文件

| 优先级 | 文件 | 目的 |
|:------:|------|------|
| 1 | `StorageController.java` | 确认 5 个端点签名、参数名、异常行为 |
| 2 | `StorageFacade.java`（-api） | 确认 4 个方法签名和返回类型 |
| 3 | `StorageFileService.java` | 确认 `findByStorageKey` 和 `page` 签名 |
| 4 | `StorageFile.java` | 确认实体字段（构造测试数据） |
| 5 | `StorageUploadResult.java` | 确认 DTO 字段（构造测试数据） |
| 6 | `R.java` | 确认 `ok()` / `fail()` 返回码 |
| 7 | `BaseException.java` / `CommonErrorCode.java` | 确认异常构造和错误码 |
| 8 | `BpmTodoControllerTest.java` | 参照模式：Mockito 手创、构造注入、@DisplayName、AssertJ |
| 9 | `DeptControllerTest.java` | 参照模式：扁平结构（无 @Nested）简单 Controller 测试 |
| 10 | `sw-basic-storage-biz/pom.xml` | 确认 test scope 已有 spring-boot-starter-test |

## 7. 允许修改的文件范围

### 新建文件（1 个 + 目录结构）

```
sw-basic/sw-basic-storage/sw-basic-storage-biz/src/test/java/com/sw/ck/storage/controller/StorageControllerTest.java
```

需要同时创建目录：
```
sw-basic/sw-basic-storage/sw-basic-storage-biz/src/test/java/com/sw/ck/storage/controller/
```

### 修改文件

**无**。B4 不修改任何已有文件。

## 8. 禁止修改的范围

- ❌ **禁止修改任何业务代码文件**（Controller / Facade / Service / Provider / Entity / Mapper / Config）
- ❌ **禁止修改任何 pom.xml**（包括 NOT adding new test dependencies — spring-boot-starter-test 已就位）
- ❌ **禁止修改 Flyway 脚本**（V16 已就位）
- ❌ **禁止修改 application.yml 或任何配置文件**
- ❌ **禁止修改 MyBatis-Plus 相关配置**
- ❌ **禁止触碰前端项目**（Smart-WorkFlow-Web/）
- ❌ **禁止修改 `product/` 目录之外的任何知识库文件**
- ❌ **禁止给 `StorageControllerTest` 加 `public` 修饰符** — 保持包级私有

## 9. 详细执行方案

### 9.1 创建目录结构

```bash
mkdir -p sw-basic/sw-basic-storage/sw-basic-storage-biz/src/test/java/com/sw/ck/storage/controller
```

### 9.2 创建 `StorageControllerTest.java`

**文件**：`sw-basic-storage-biz/src/test/java/com/sw/ck/storage/controller/StorageControllerTest.java`

完整代码：

```java
package com.sw.ck.storage.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import com.sw.ck.common.response.R;
import com.sw.ck.storage.api.StorageFacade;
import com.sw.ck.storage.api.StorageUploadResult;
import com.sw.ck.storage.entity.StorageFile;
import com.sw.ck.storage.service.StorageFileService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * {@link StorageController} 单元测试。
 * <p>
 * 覆盖全部 5 个端点的 happy path + 异常路径。
 * 纯 Mockito，不装载 Spring 上下文。
 * </p>
 */
@DisplayName("文件存储控制器测试")
class StorageControllerTest {

    private final StorageFacade storageFacade = mock(StorageFacade.class);
    private final StorageFileService storageFileService = mock(StorageFileService.class);

    private final StorageController controller = new StorageController(storageFacade, storageFileService);

    // ==================== 测试数据工厂 ====================

    private StorageFile createFile(String storageKey) {
        StorageFile file = new StorageFile();
        file.setId("id-" + storageKey);
        file.setStorageKey(storageKey);
        file.setOriginalName("test.pdf");
        file.setStorageName(storageKey + ".pdf");
        file.setFileSize(1024L);
        file.setContentType("application/pdf");
        file.setFileExt("pdf");
        file.setProviderType("local");
        file.setBucketName("./uploads");
        file.setStorageUrl("http://localhost:8080/storage/files/" + storageKey + "/download");
        return file;
    }

    private StorageUploadResult createResult(String storageKey) {
        return StorageUploadResult.builder()
                .storageKey(storageKey)
                .storageName(storageKey + ".pdf")
                .storageUrl("http://localhost:8080/storage/files/" + storageKey + "/download")
                .fileSize(1024L)
                .build();
    }

    private MockMultipartFile createMultipartFile() {
        return new MockMultipartFile(
                "file",
                "test.pdf",
                "application/pdf",
                "dummy file content".getBytes(StandardCharsets.UTF_8));
    }

    // ==================== POST /storage/files/upload ====================

    @Test
    @DisplayName("上传文件成功 → 返回 StorageUploadResult")
    void upload_shouldReturnResult() throws Exception {
        String storageKey = "key-001";
        MockMultipartFile multipartFile = createMultipartFile();
        StorageUploadResult expectedResult = createResult(storageKey);

        when(storageFacade.upload(any(InputStream.class), eq("test.pdf"), eq("application/pdf")))
                .thenReturn(expectedResult);

        R<StorageUploadResult> result = controller.upload(multipartFile);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData()).isNotNull();
        assertThat(result.getData().getStorageKey()).isEqualTo(storageKey);
        assertThat(result.getData().getStorageName()).isEqualTo(storageKey + ".pdf");
        assertThat(result.getData().getFileSize()).isEqualTo(1024L);
        verify(storageFacade).upload(any(InputStream.class), eq("test.pdf"), eq("application/pdf"));
    }

    @Test
    @DisplayName("上传空文件 → 抛 BaseException(PARAM_ERROR)")
    void upload_emptyFile_shouldThrow() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.txt", "text/plain", new byte[0]);

        assertThatThrownBy(() -> controller.upload(emptyFile))
                .isInstanceOf(BaseException.class)
                .hasMessageContaining("文件不能为空");
        verify(storageFacade, never()).upload(any(), any(), any());
    }

    // ==================== GET /storage/files ====================

    @Test
    @DisplayName("分页列表 → 返回 Page 含 records + total")
    void list_shouldReturnPage() {
        StorageFile f1 = createFile("key-001");
        StorageFile f2 = createFile("key-002");
        Page<StorageFile> expectedPage = new Page<>(1, 20);
        expectedPage.setRecords(List.of(f1, f2));
        expectedPage.setTotal(2L);

        when(storageFileService.page(any(Page.class), any(QueryWrapper.class)))
                .thenReturn(expectedPage);

        R<Page<StorageFile>> result = controller.list(1L, 20L);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData()).isNotNull();
        assertThat(result.getData().getRecords()).hasSize(2);
        assertThat(result.getData().getTotal()).isEqualTo(2L);
        verify(storageFileService).page(any(Page.class), any(QueryWrapper.class));
    }

    @Test
    @DisplayName("分页列表无数据 → 返回空 records, total=0")
    void list_empty_shouldReturnEmptyPage() {
        Page<StorageFile> emptyPage = new Page<>(1, 20);
        emptyPage.setRecords(List.of());
        emptyPage.setTotal(0L);

        when(storageFileService.page(any(Page.class), any(QueryWrapper.class)))
                .thenReturn(emptyPage);

        R<Page<StorageFile>> result = controller.list(1L, 20L);

        assertThat(result.getCode()).isZero();
        assertThat(result.getData().getRecords()).isEmpty();
        assertThat(result.getData().getTotal()).isZero();
    }

    @Test
    @DisplayName("分页参数使用默认值 1/20")
    void list_shouldUseDefaultPageAndSize() {
        Page<StorageFile> emptyPage = new Page<>(1, 20);
        emptyPage.setRecords(List.of());
        emptyPage.setTotal(0L);

        when(storageFileService.page(any(Page.class), any(QueryWrapper.class)))
                .thenReturn(emptyPage);

        R<Page<StorageFile>> result = controller.list(null, null);

        assertThat(result.getCode()).isZero();
        // 验证默认 page=1, size=20 传给 service
        verify(storageFileService).page(argThat(p ->
                p.getCurrent() == 1 && p.getSize() == 20), any());
    }

    // ==================== GET /storage/files/{storageKey} ====================

    @Test
    @DisplayName("文件详情 → 返回 StorageFile")
    void info_shouldReturnFile() {
        StorageFile file = createFile("key-001");
        when(storageFileService.findByStorageKey("key-001")).thenReturn(file);

        R<StorageFile> result = controller.info("key-001");

        assertThat(result.getCode()).isZero();
        assertThat(result.getData()).isNotNull();
        assertThat(result.getData().getStorageKey()).isEqualTo("key-001");
        assertThat(result.getData().getOriginalName()).isEqualTo("test.pdf");
        assertThat(result.getData().getContentType()).isEqualTo("application/pdf");
        assertThat(result.getData().getFileSize()).isEqualTo(1024L);
        verify(storageFileService).findByStorageKey("key-001");
    }

    @Test
    @DisplayName("文件不存在 → 抛 BaseException(NOT_FOUND)")
    void info_notFound_shouldThrow() {
        when(storageFileService.findByStorageKey("key-999")).thenReturn(null);

        assertThatThrownBy(() -> controller.info("key-999"))
                .isInstanceOf(BaseException.class)
                .hasMessageContaining("不存在");
        verify(storageFileService).findByStorageKey("key-999");
    }

    // ==================== DELETE /storage/files/{storageKey} ====================

    @Test
    @DisplayName("删除文件成功 → 返回 R.ok()")
    void delete_shouldReturnOk() {
        doNothing().when(storageFacade).delete("key-001");

        R<Void> result = controller.delete("key-001");

        assertThat(result.getCode()).isZero();
        verify(storageFacade).delete("key-001");
    }

    // ==================== GET /storage/files/{storageKey}/download ====================

    @Test
    @DisplayName("下载文件 → 返回 InputStreamResource + 正确 Content-Type + Content-Disposition")
    void download_shouldReturnResource() {
        StorageFile file = createFile("key-001");
        InputStream inputStream = new ByteArrayInputStream("file content".getBytes(StandardCharsets.UTF_8));
        when(storageFileService.findByStorageKey("key-001")).thenReturn(file);
        when(storageFacade.download("key-001")).thenReturn(inputStream);

        ResponseEntity<InputStreamResource> result = controller.download("key-001");

        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
        assertThat(result.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
                .startsWith("attachment; filename*=UTF-8''");
        assertThat(result.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
                .contains("test.pdf");
        assertThat(result.getBody()).isNotNull();
        verify(storageFileService).findByStorageKey("key-001");
        verify(storageFacade).download("key-001");
    }

    @Test
    @DisplayName("下载文件不存在 → 抛 BaseException(NOT_FOUND)")
    void download_notFound_shouldThrow() {
        when(storageFileService.findByStorageKey("key-999")).thenReturn(null);

        assertThatThrownBy(() -> controller.download("key-999"))
                .isInstanceOf(BaseException.class)
                .hasMessageContaining("不存在");
        verify(storageFileService).findByStorageKey("key-999");
        verify(storageFacade, never()).download(anyString());
    }

    @Test
    @DisplayName("下载文件 content-type 为 null → 降级为 application/octet-stream")
    void download_nullContentType_shouldDefaultToOctetStream() {
        StorageFile file = createFile("key-001");
        file.setContentType(null);
        InputStream inputStream = new ByteArrayInputStream("data".getBytes(StandardCharsets.UTF_8));
        when(storageFileService.findByStorageKey("key-001")).thenReturn(file);
        when(storageFacade.download("key-001")).thenReturn(inputStream);

        ResponseEntity<InputStreamResource> result = controller.download("key-001");

        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getHeaders().getContentType())
                .isEqualTo(MediaType.APPLICATION_OCTET_STREAM);
    }

    @Test
    @DisplayName("下载文件 originalName 为 null → 文件名降级为「file」，不抛 NPE")
    void download_nullOriginalName_shouldDefaultToFile() {
        StorageFile file = createFile("key-001");
        file.setOriginalName(null);
        InputStream inputStream = new ByteArrayInputStream("data".getBytes(StandardCharsets.UTF_8));
        when(storageFileService.findByStorageKey("key-001")).thenReturn(file);
        when(storageFacade.download("key-001")).thenReturn(inputStream);

        ResponseEntity<InputStreamResource> result = controller.download("key-001");

        assertThat(result.getStatusCodeValue()).isEqualTo(200);
        assertThat(result.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION))
                .contains("filename*=UTF-8''file");
    }
}
```

### 9.3 校验命令

```bash
# 编译验证
cd /data/reasonix/files/Smart-WorkFlow && mvn -q compile; echo "EXIT: $?"

# 全量测试回归
cd /data/reasonix/files/Smart-WorkFlow && mvn -q test; echo "EXIT: $?"
```

## 10. 关键实现约束

- **纯 Mockito，不装载 Spring 上下文** — Student test 类不加 `@ExtendWith`、`@SpringBootTest`、`@WebMvcTest` 等任何注解
- **包级私有 class** — `class StorageControllerTest` 前面不加 `public`（与项目全部现有测试一致）
- **字段级 mock + 构造注入** — 使用 `mock(StorageFacade.class)` 创建 mock，`new StorageController(mock, mock)` 注入
- **AssertJ 断言** — 使用 `assertThat(result.getCode()).isZero()` 而非 JUnit 的 `assertEquals(0, result.getCode())`
- **Mockito verify** — 每个 happy path 测试至少一个 `verify()` 检查 Mock 交互
- **异常路径覆盖** — `info` 和 `download` 的 not found 路径 + `upload` 的 empty file 路径
- **MockMultipartFile** — 使用 Spring 的 `org.springframework.mock.web.MockMultipartFile`（已包含在 `spring-boot-starter-test` 中）
- **无 `LoginUserHolder`** — StorageController 不使用认证上下文，不需要 `setLoginUser()` / `tearDown()`
- **测试数据方法** — 抽取 `createFile()` / `createResult()` / `createMultipartFile()` 工厂方法，减少重复

## 11. 边界情况

| 边界 | 处理方式 | 测试覆盖 |
|------|----------|:--------:|
| 上传空文件 | Controller 检查 `file.isEmpty()` → 抛 PARAM_ERROR | `upload_emptyFile_shouldThrow` ✅ |
| 文件记录不存在 | `findByStorageKey` 返回 null → 抛 NOT_FOUND | `info_notFound_shouldThrow` ✅ |
| Key 不存在下载 | `findByStorageKey` 返回 null → 抛 NOT_FOUND | `download_notFound_shouldThrow` ✅ |
| contentType 为 null | 降级为 `application/octet-stream` | `download_nullContentType_shouldDefaultToOctetStream` ✅ |
| originalName 为 null | 文件名降级为 `"file"`，不抛 NPE | `download_nullOriginalName_shouldDefaultToFile` ✅ |
| 分页参数为 null | 使用默认值 1/20 | `list_shouldUseDefaultPageAndSize` ✅ |
| 空列表 | page 含空 records，total=0 | `list_empty_shouldReturnEmptyPage` ✅ |
| Mock 交互验证 | 确认正确调用/service/不调用禁止方法 | 各测试 verify ✅ |

## 12. 风险和回滚方案

### 风险

| 风险 | 可能性 | 影响 |
|------|:------:|------|
| 测试文件包路径不正确 | 中 | 编译时找不到 Controller 类（StorageController 包是 `com.sw.ck.storage.controller`） |
| `MockMultipartFile` 构造错 | 低 | 参数数量/顺序与 Spring 版本不一致（当前 Spring Boot 3.4.4） |
| `BaseException` 构造签名不匹配 | 低 | `BaseException(int code, String message)` — 如果构造器变更会编译失败 |
| 测试导致基线计数下降 | 低 | 如果测试类不在默认扫描路径，`mvn test` 不增量 |

### 回滚

1. 删除新建文件：`rm -rf sw-basic-storage-biz/src/test/java/com/sw/ck/storage/`
2. `mvn -q compile` + `mvn -q test` 确认基线恢复（154 tests）
3. 回滚成功标志：compile exit 0 + test 154+

## 13. 测试方案

### 13.1 静态检查

| 编号 | 检查项 | 命令 |
|:----:|--------|------|
| S1 | 测试文件存在 | `ls sw-basic/.../controller/StorageControllerTest.java` |
| S2 | 无 `@SpringBootTest` / `@ExtendWith` / `@WebMvcTest` | `grep -c "@SpringBootTest\|@ExtendWith\|@WebMvcTest" .../StorageControllerTest.java` → 0 |
| S3 | 包级私有 class | `grep "public class StorageControllerTest" .../StorageControllerTest.java` → 0 hits |
| S4 | AssertJ 断言 | `grep "assertThat" .../StorageControllerTest.java` → > 0 |
| S5 | Mockito verify | `grep "verify(" .../StorageControllerTest.java` → > 0 |
| S6 | 测试方法计数 ≥ 10 | `grep -c "@Test" .../StorageControllerTest.java` → 预期 11 |

### 13.2 单元测试

本 Step 本身就是 Controller 单元测试。StorageControllerTest 覆盖：

| 端点 | 测试 | 场景 |
|:----:|------|------|
| POST /upload | `upload_shouldReturnResult` | Happy path: MultipartFile → StorageUploadResult |
| POST /upload | `upload_emptyFile_shouldThrow` | 异常: 空文件抛 PARAM_ERROR |
| GET / | `list_shouldReturnPage` | Happy path: 2 条记录分页 |
| GET / | `list_empty_shouldReturnEmptyPage` | 边界: 空列表 |
| GET / | `list_shouldUseDefaultPageAndSize` | 边界: null 参数走默认值 |
| GET /{key} | `info_shouldReturnFile` | Happy path: 返回文件详情 |
| GET /{key} | `info_notFound_shouldThrow` | 异常: 不存在文件抛 NOT_FOUND |
| DELETE /{key} | `delete_shouldReturnOk` | Happy path: 删除成功 |
| GET /{key}/download | `download_shouldReturnResource` | Happy path: 下载返回正确响应头 |
| GET /{key}/download | `download_notFound_shouldThrow` | 异常: 不存在抛 NOT_FOUND |
| GET /{key}/download | `download_nullContentType_shouldDefaultToOctetStream` | 边界: contentType null 降级 |
| GET /{key}/download | `download_nullOriginalName_shouldDefaultToFile` | 边界: originalName null 降级 |

### 13.3 集成测试

本 Step 不涉及集成测试。

### 13.4 手工验证

| 编号 | 验证项 | 步骤 |
|:----:|--------|------|
| V1 | 测试文件包路径正确 | 确认 `StorageControllerTest` 在 `com/sw/ck/storage/controller/` 下，与 StorageController 同包 |
| V2 | mock 与构造匹配 | 确认 `mock()` 创建了 StorageFacade + StorageFileService 两个 mock，构造注入顺序正确 |
| V3 | no `public` class | IDE 确认 `class StorageControllerTest` 前无 `public` 关键字 |

### 13.5 回归检查

| 编号 | 检查项 | 命令 | 预期 |
|:----:|--------|------|:----:|
| R1 | 全量编译零错误 | `mvn -q compile` | EXIT 0 |
| R2 | 全量测试 ≥ 154（含新增） | `mvn -q test` | EXIT 0，tests ≥ 154 |
| R3 | Provider 文件未被修改 | `git diff --name-only` 不包含 provider/ | 零命中 |
| R4 | Entity/Mapper 未被修改 | `git diff --name-only` 不包含 entity/ 或 mapper/ | 零命中 |
| R5 | Controller/Service/Facade 未被修改 | `git diff --name-only` 不包含 controller/ service/ impl/ | 仅新增测试文件 |

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|:--------:|
| B4-1 | `StorageControllerTest.java` 存在于 `sw-basic-storage-biz/src/test/java/com/sw/ck/storage/controller/` | 文件存在 |
| B4-2 | 纯 Mockito 测试：无 `@SpringBootTest`、`@ExtendWith`、`@WebMvcTest` | 静态检查 S2 |
| B4-3 | 包级私有 class（非 public） | 静态检查 S3 |
| B4-4 | 使用 AssertJ 断言（`assertThat`） | 静态检查 S4 |
| B4-5 | 使用 Mockito `verify()` 验证交互 | 静态检查 S5 |
| B4-6 | 测试方法 ≥ 10 个 | 静态检查 S6 |
| B4-7 | POST /upload happy path：验证返回 R 的 code=0 + StorageUploadResult 数据正确 + verify 调用 | 单元测试覆盖 |
| B4-8 | POST /upload 异常：空文件抛 BaseException(PARAM_ERROR)，不调 Facade | 单元测试覆盖 |
| B4-9 | GET / list happy path：验证返回 R 含 records + total | 单元测试覆盖 |
| B4-10 | GET / list 边界：空列表、默认分页参数 | 单元测试覆盖 |
| B4-11 | GET /{key} info happy path：验证返回 R 含文件完整字段 | 单元测试覆盖 |
| B4-12 | GET /{key} info 异常：不存在的 key 抛 BaseException(NOT_FOUND) | 单元测试覆盖 |
| B4-13 | DELETE /{key} delete：验证返回 R.ok() + verify 调用了 Facade.delete | 单元测试覆盖 |
| B4-14 | GET /{key}/download happy path：验证 200 + Content-Type + Content-Disposition(filename*=UTF-8'') + body 不为空 | 单元测试覆盖 |
| B4-15 | GET /{key}/download 异常：不存在的 key 抛 BaseException(NOT_FOUND) | 单元测试覆盖 |
| B4-16 | GET /{key}/download 边界：contentType=null 降级 octet-stream、originalName=null 不抛 NPE | 单元测试覆盖 |
| B4-17 | `mvn -q compile` 退出码 0 | 静态检查 R1 |
| B4-18 | `mvn -q test` 退出码 0，测试计数 ≥ 154（含新增），BUILD SUCCESS | 静态检查 R2 |
| B4-19 | Provider 层文件未修改 | 回归检查 R3 |
| B4-20 | Entity/Mapper 文件未修改 | 回归检查 R4 |
| B4-21 | Controller/Service/Facade 业务代码未修改（仅新增测试文件） | 回归检查 R5 |

## 15. 执行回执格式

按 §7.1 标准格式返回，特别需包含：

- 第 4 项"实际修改的文件"：1 个新建文件，0 个修改文件
- 第 5 项"每个文件的修改摘要"：列出 StorageControllerTest.java 的测试结构（12 个测试方法，5 个端点覆盖）
- 第 6 项"实际执行的命令"：含完整 `mvn -q compile` + `mvn -q test` 命令及退出码
- 第 7 项"命令输出摘要"：编译结果 + 全量测试计数（应 ≥ 154）
- 第 8 项"与原方案的偏差"：任何与 §9 详细执行方案的差异
- 第 12 项"Git diff 摘要"：改动文件数/新增行数

## 16. 测试回执格式

按 §7.2 标准格式返回，特别需包含：

- 第 4 项"实际执行的测试命令"：列出 S1-S6 全部静态检查命令及输出
- 第 5 项"各测试项结果"：逐条 S1-S6 + R1-R5 + 各端点测试通过情况
- 第 10 项"是否满足验收标准"：逐条对照 B4-1 ~ B4-21
- 第 12 项"最终结论"：PASSED / FAILED / BLOCKED

## 17. 明确禁止事项

- ❌ **禁止修改任何业务代码**（Controller / Facade / Service / Provider / Entity / Mapper / Config / Properties）
- ❌ **禁止修改任何 pom.xml**
- ❌ **禁止修改 Flyway 脚本**
- ❌ **禁止修改 application.yml 或任何配置文件**
- ❌ **禁止新增测试依赖**（spring-boot-starter-test 已包含 JUnit 5 + Mockito + AssertJ + MockMultipartFile）
- ❌ **禁止给测试类加 `public` 修饰符**
- ❌ **禁止使用 `@SpringBootTest` / `@ExtendWith(MockitoExtension.class)` / `@WebMvcTest`**
- ❌ **禁止修改 MyBatis-Plus 或数据源相关配置**
- ❌ **禁止触碰前端项目**（Smart-WorkFlow-Web/）
- ❌ **禁止在测试中使用真实的文件 IO 操作**
