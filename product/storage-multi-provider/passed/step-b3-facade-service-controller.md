# Step B3：Facade + Service + Controller

## 1. 当前状态

| 项目 | 状态 |
|------|:----:|
| 功能 | storage-multi-provider — 多向可配置文件存储 |
| 功能状态 | **IN_PROGRESS** |
| 前置 Step | B1 ✅ PASSED（18/18）→ B2 ✅ PASSED（14/14） |
| 当前 Step | B3 — Facade + Service + Controller（READY） |
| 后端基线 | 154 tests, BUILD SUCCESS, Java 21 + Spring Boot 3.4 |

## 2. Step 目标

在 B2 构建的 4 个 `StorageProvider` + `StorageProviderRegistry` 基础设施之上，补齐跨模块 Facade 接口、业务 Service 层和前端 REST Controller，打通文件上传/下载/删除/列表/详情的完整 HTTP API 链路。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：标准 CRUD + Facade 委托 + REST 端点，有 NotifyController/NotifyFacadeImpl 先行模式可参照，无架构决策
是否触发升级条件：否
```

## 4. 模型选择理由

B3 是经典的三层委托（Controller → Facade → Provider + Mapper），所有模式均有 Notify 模块先行实例。逻辑线性：文件名校验 → Provider 上传 → Entity 落库 → 返回结果。完全在 deepseek-v4-flash 舒适区内。

## 5. 已知上下文

### 5.1 架构约定

- **Facade 在 -api，实现在 -biz**：与 NotifyFacade / NotifyFacadeImpl 完全一致
- **Service 层**：扩展 `BaseService<T>` / `BaseServiceImpl<M, T>`（MyBatis-Plus IService），与 NotifyMessageService 一致
- **Controller 返回 `R<T>` 包装**：统一响应格式 `R.ok(data)` / `R.fail(msg)`
- **包结构**：`com.sw.ck.storage.controller` / `com.sw.ck.storage.service` / `com.sw.ck.storage.impl`
- **组件扫描**：`StorageAutoConfiguration` 需扩展 `@ComponentScan` 以覆盖新增包

### 5.2 B2 就绪资产

| 资产 | 位置 | 关键 API |
|------|------|----------|
| `StorageProvider` | `-biz/provider/` | `upload(InputStream, String, String)→StorageUploadResult`, `download(String)→InputStream`, `delete(String)→void`, `getUrl(String)→String`, `getType()→String` |
| `StorageProviderRegistry` | `-biz/provider/` | `getActiveProvider()→StorageProvider`, `getProvider(String type)→StorageProvider` |
| `StorageFile` | `-biz/entity/` | `extends BaseEntity`，11 个业务字段（含 `providerType`、`storageKey`、`storageUrl`、`bucketName`） |
| `StorageFileMapper` | `-biz/mapper/` | `extends BaseMapper<StorageFile>` |
| `StorageUploadResult` | `-api/api/` | `storageKey`, `storageName`, `storageUrl`, `fileSize` |
| `StorageProperties` | `-biz/config/` | `providers` Map + `activeProvider` |
| `StorageFacade` | `-api/api/` | 当前为空骨架接口 |

### 5.3 关键设计决策

- **文件名生成集中化**：在 `StorageFacadeImpl` 中生成 `UUID.randomUUID().toString().replace("-", "")` + 小写扩展名，各 Provider 直接使用
- **提供商标识记录**：上传时将 `provider.getType()` 写入 `StorageFile.providerType`
- **跨提供商兼容**：下载/删除时按 `StorageFile.providerType` 选择对应 Provider，而非当前活跃 Provider（防止切换提供商后历史文件不可达）
- **Facade 使用 InputStream**（非 MultipartFile）：保持 -api 模块零 Spring Web 依赖；Controller 负责 MultipartFile → InputStream 转换
- **URL 再生**：`getUrl()` 方法按文件所属 Provider 重新生成 URL（不依赖实体缓存的 `storageUrl`），确保预签名 URL 在有效期内

## 6. 执行前必须读取的文件

| 优先级 | 文件 | 目的 |
|:------:|------|------|
| 1 | `sw-basic-storage-biz/.../config/StorageAutoConfiguration.java` | 确认当前 @ComponentScan 和 @MapperScan 配置 |
| 2 | `sw-basic-storage-api/.../api/StorageFacade.java` | 确认当前空接口骨架 |
| 3 | `sw-basic-storage-biz/.../provider/StorageProvider.java` | 确认接口 5 个方法签名 |
| 4 | `sw-basic-storage-biz/.../provider/StorageProviderRegistry.java` | 确认 `getActiveProvider()` / `getProvider(type)` 签名 |
| 5 | `sw-basic-storage-biz/.../entity/StorageFile.java` | 确认实体完整字段列表 |
| 6 | `sw-basic-storage-biz/.../mapper/StorageFileMapper.java` | 确认 Mapper 接口 |
| 7 | `sw-basic-storage-biz/.../config/StorageProperties.java` | 确认 ProviderConfig 字段（basePath/bucket 取值路径） |
| 8 | `sw-basic-notify-biz/.../controller/NotifyController.java` | 参照 Controller 模式 |
| 9 | `sw-basic-notify-biz/.../impl/NotifyFacadeImpl.java` | 参照 Facade 实现模式 |
| 10 | `sw-basic-notify-biz/.../service/NotifyMessageService.java` | 参照 Service 接口模式 |
| 11 | `sw-basic-notify-biz/.../service/impl/NotifyMessageServiceImpl.java` | 参照 Service 实现模式 |
| 12 | `sw-framework/sw-common/.../response/R.java` | 确认 `R.ok()` / `R.fail()` 签名 |
| 13 | `sw-framework/sw-common/.../exception/CommonErrorCode.java` | 确认 FORBIDDEN / NOT_FOUND 错误码 |
| 14 | `sw-framework/sw-common/.../service/BaseService.java` 和 `BaseServiceImpl.java` | 确认基类 API |

## 7. 允许修改的文件范围

### 新建文件（5 个）

| # | 文件 | 包 | 模块 |
|---|------|------|:----:|
| 1 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/service/StorageFileService.java` | `com.sw.ck.storage.service` | -biz |
| 2 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/service/impl/StorageFileServiceImpl.java` | `com.sw.ck.storage.service.impl` | -biz |
| 3 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/impl/StorageFacadeImpl.java` | `com.sw.ck.storage.impl` | -biz |
| 4 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/controller/StorageController.java` | `com.sw.ck.storage.controller` | -biz |
| 5 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/controller/package-info.java` | `com.sw.ck.storage.controller` | -biz |

### 修改文件（2 个）

| # | 文件 | 改动 |
|---|------|------|
| 1 | `sw-basic/sw-basic-storage/sw-basic-storage-api/src/main/java/com/sw/ck/storage/api/StorageFacade.java` | 添加 4 个方法签名（upload/download/delete/getUrl） |
| 2 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java` | `@ComponentScan` 从仅 provider 扩展为 provider/controller/service/impl |

## 8. 禁止修改的范围

- **禁止修改** `sw-basic-storage-biz/.../provider/` 下的任何文件（StorageProvider.java、4 个实现、StorageProviderRegistry.java）
- **禁止修改** `sw-basic-storage-biz/.../entity/StorageFile.java` — 实体字段已在 B1 定稿
- **禁止修改** `sw-basic-storage-biz/.../mapper/StorageFileMapper.java`
- **禁止修改** `sw-basic-storage-biz/.../config/StorageProperties.java`
- **禁止修改** `sw-dependencies/pom.xml` 或任何 `pom.xml` — 依赖已在 B1/B2 就位
- **禁止修改** `sw-bootstrap/` 下的任何文件（application.yml、Flyway 脚本等）
- **禁止触碰前端** `Smart-WorkFlow-Web/` 中的任何文件
- **禁止修改** `sw-basic-storage-api/pom.xml` — api 模块依赖不变
- **禁止修改** Flyway 脚本（V16 已就位，不新增迁移）

## 9. 详细执行方案

### 9.1 修改 `StorageFacade.java`（-api 模块）

**文件**：`sw-basic-storage-api/src/main/java/com/sw/ck/storage/api/StorageFacade.java`

**操作**：将空骨架接口替换为含 4 个方法签名的完整接口。

```java
package com.sw.ck.storage.api;

import java.io.InputStream;

/**
 * 文件存储 Facade 接口。
 * <p>
 * 供其他模块（form/bpm/notify/knowledge）通过 Facade 模式调用文件存储能力。
 * 定义于 {@code -api} 模块，实现于 {@code -biz} 模块。
 * </p>
 */
public interface StorageFacade {

    /**
     * 上传文件。
     *
     * @param inputStream  文件输入流
     * @param originalName 原始文件名
     * @param contentType  文件 MIME 类型
     * @return 上传结果
     */
    StorageUploadResult upload(InputStream inputStream, String originalName, String contentType);

    /**
     * 下载文件。
     * <p>
     * 按照文件上传时记录的 {@code providerType} 选择对应提供商进行下载，
     * 而非当前活跃提供商，确保提供商切换后历史文件仍可访问。
     * </p>
     *
     * @param storageKey 存储唯一标识
     * @return 文件输入流
     */
    InputStream download(String storageKey);

    /**
     * 删除文件（软删除文件记录 + 提供商侧文件删除）。
     *
     * @param storageKey 存储唯一标识
     */
    void delete(String storageKey);

    /**
     * 获取文件访问 URL（由提供商重新生成，确保预签名 URL 在有效期内）。
     *
     * @param storageKey 存储唯一标识
     * @return 文件访问 URL
     */
    String getUrl(String storageKey);
}
```

### 9.2 创建 `StorageFileService.java`

**文件**：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/service/StorageFileService.java`

```java
package com.sw.ck.storage.service;

import com.sw.ck.common.service.BaseService;
import com.sw.ck.storage.entity.StorageFile;

/**
 * 文件存储 Service 接口。
 */
public interface StorageFileService extends BaseService<StorageFile> {

    /**
     * 按存储 key 查询文件记录。
     * <p>
     * 租户条件由 {@code TenantLineHandler} 自动注入，不手写 tenant 条件。
     * </p>
     *
     * @param storageKey 存储唯一标识
     * @return 文件记录，不存在时返回 null
     */
    StorageFile findByStorageKey(String storageKey);
}
```

### 9.3 创建 `StorageFileServiceImpl.java`

**文件**：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/service/impl/StorageFileServiceImpl.java`

```java
package com.sw.ck.storage.service.impl;

import com.sw.ck.common.service.BaseServiceImpl;
import com.sw.ck.storage.entity.StorageFile;
import com.sw.ck.storage.mapper.StorageFileMapper;
import com.sw.ck.storage.service.StorageFileService;
import org.springframework.stereotype.Service;

/**
 * 文件存储 Service 实现。
 */
@Service
public class StorageFileServiceImpl
        extends BaseServiceImpl<StorageFileMapper, StorageFile>
        implements StorageFileService {

    @Override
    public StorageFile findByStorageKey(String storageKey) {
        return lambdaQuery()
                .eq(StorageFile::getStorageKey, storageKey)
                .one();
    }
}
```

### 9.4 创建 `StorageFacadeImpl.java`

**文件**：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/impl/StorageFacadeImpl.java`

这是 B3 最复杂的文件，核心编排逻辑。

```java
package com.sw.ck.storage.impl;

import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import com.sw.ck.storage.api.StorageFacade;
import com.sw.ck.storage.api.StorageUploadResult;
import com.sw.ck.storage.config.StorageProperties;
import com.sw.ck.storage.entity.StorageFile;
import com.sw.ck.storage.provider.StorageProvider;
import com.sw.ck.storage.provider.StorageProviderRegistry;
import com.sw.ck.storage.service.StorageFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class StorageFacadeImpl implements StorageFacade {

    private final StorageProviderRegistry registry;
    private final StorageFileService storageFileService;
    private final StorageProperties storageProperties;

    @Override
    public StorageUploadResult upload(InputStream inputStream, String originalName, String contentType) {
        // 1. 生成存储文件名：UUID（无连字符）+ 小写扩展名
        String storageName = generateStorageName(originalName);

        // 2. 获取活跃提供商并上传
        StorageProvider provider = registry.getActiveProvider();
        StorageUploadResult result = provider.upload(inputStream, storageName, contentType);

        // 3. 构建实体并落库
        StorageFile entity = new StorageFile();
        entity.setOriginalName(originalName);
        entity.setStorageKey(result.getStorageKey());
        entity.setStorageName(result.getStorageName());
        entity.setFileSize(result.getFileSize());
        entity.setContentType(contentType);
        entity.setFileExt(extractExtension(originalName));
        entity.setProviderType(provider.getType());
        entity.setBucketName(resolveBucketName(provider.getType()));
        entity.setStorageUrl(result.getStorageUrl());

        storageFileService.save(entity);

        log.info("文件上传成功: originalName={}, storageKey={}, provider={}, size={}",
                originalName, result.getStorageKey(), provider.getType(), result.getFileSize());

        return result;
    }

    @Override
    public InputStream download(String storageKey) {
        StorageFile file = getFileOrThrow(storageKey);
        StorageProvider provider = registry.getProvider(file.getProviderType());
        if (provider == null) {
            throw new BaseException(CommonErrorCode.SYSTEM_ERROR.getCode(),
                    "存储提供商不可用: " + file.getProviderType());
        }
        return provider.download(storageKey);
    }

    @Override
    public void delete(String storageKey) {
        StorageFile file = getFileOrThrow(storageKey);
        StorageProvider provider = registry.getProvider(file.getProviderType());
        if (provider != null) {
            provider.delete(storageKey);
        } else {
            log.warn("删除时提供商不可用，跳过提供商侧删除: storageKey={}, providerType={}",
                    storageKey, file.getProviderType());
        }
        storageFileService.removeById(file.getId());
        log.info("文件删除成功: storageKey={}, providerType={}", storageKey, file.getProviderType());
    }

    @Override
    public String getUrl(String storageKey) {
        StorageFile file = getFileOrThrow(storageKey);
        StorageProvider provider = registry.getProvider(file.getProviderType());
        if (provider != null) {
            return provider.getUrl(storageKey);
        }
        // 提供商不可用时返回缓存的 URL（降级）
        log.warn("URL 生成时提供商不可用，返回缓存 URL: storageKey={}", storageKey);
        return file.getStorageUrl();
    }

    // ---------- 私有方法 ----------

    /**
     * 生成存储文件名：UUID 去连字符 + 小写扩展名。
     */
    private String generateStorageName(String originalName) {
        String uuid = UUID.randomUUID().toString().replace("-", "");
        String ext = extractExtension(originalName);
        return ext.isEmpty() ? uuid : uuid + "." + ext;
    }

    /**
     * 提取小写扩展名（不含点），无扩展名返回空串。
     */
    private String extractExtension(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return "";
        }
        int dotIndex = fileName.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == fileName.length() - 1) {
            return "";
        }
        return fileName.substring(dotIndex + 1).toLowerCase();
    }

    /**
     * 按提供商类型解析存储桶名称。
     */
    private String resolveBucketName(String providerType) {
        StorageProperties.ProviderConfig config = storageProperties.getProviders().get(providerType);
        if (config == null) {
            return null;
        }
        if ("local".equals(providerType)) {
            return config.getBasePath() != null ? config.getBasePath() : "./uploads";
        }
        return config.getBucket();
    }

    /**
     * 按 storageKey 查询文件记录，不存在时抛 NOT_FOUND。
     */
    private StorageFile getFileOrThrow(String storageKey) {
        StorageFile file = storageFileService.findByStorageKey(storageKey);
        if (file == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "文件不存在: " + storageKey);
        }
        return file;
    }
}
```

### 9.5 创建 `StorageController.java`

**文件**：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/controller/StorageController.java`

```java
package com.sw.ck.storage.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import com.sw.ck.common.response.R;
import com.sw.ck.storage.api.StorageFacade;
import com.sw.ck.storage.api.StorageUploadResult;
import com.sw.ck.storage.entity.StorageFile;
import com.sw.ck.storage.service.StorageFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 文件存储 REST 控制器。
 * <p>
 * 提供文件上传/下载/删除/列表/详情接口。
 * </p>
 */
@Slf4j
@RestController
@RequestMapping("/storage/files")
@RequiredArgsConstructor
public class StorageController {

    private final StorageFacade storageFacade;
    private final StorageFileService storageFileService;

    /**
     * 上传文件。
     */
    @PostMapping("/upload")
    public R<StorageUploadResult> upload(@RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR.getCode(), "上传文件不能为空");
        }
        StorageUploadResult result = storageFacade.upload(
                file.getInputStream(),
                file.getOriginalFilename(),
                file.getContentType());
        return R.ok(result);
    }

    /**
     * 文件列表（分页）。
     */
    @GetMapping
    public R<Page<StorageFile>> list(
            @RequestParam(defaultValue = "1") long page,
            @RequestParam(defaultValue = "20") long size) {
        Page<StorageFile> pageResult = storageFileService.page(
                new Page<>(page, size),
                storageFileService.lambdaQuery()
                        .orderByDesc(StorageFile::getCreateTime)
                        .getWrapper());
        return R.ok(pageResult);
    }

    /**
     * 文件详情。
     */
    @GetMapping("/{storageKey}")
    public R<StorageFile> info(@PathVariable String storageKey) {
        StorageFile file = storageFileService.findByStorageKey(storageKey);
        if (file == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "文件不存在");
        }
        return R.ok(file);
    }

    /**
     * 删除文件。
     */
    @DeleteMapping("/{storageKey}")
    public R<Void> delete(@PathVariable String storageKey) {
        storageFacade.delete(storageKey);
        return R.ok();
    }

    /**
     * 下载文件。
     */
    @GetMapping("/{storageKey}/download")
    public ResponseEntity<InputStreamResource> download(@PathVariable String storageKey) {
        StorageFile file = storageFileService.findByStorageKey(storageKey);
        if (file == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "文件不存在");
        }
        InputStreamResource resource = new InputStreamResource(storageFacade.download(storageKey));
        String encodedFileName = URLEncoder.encode(
                file.getOriginalName() != null ? file.getOriginalName() : "file",
                StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(
                        file.getContentType() != null ? file.getContentType() : "application/octet-stream"))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + encodedFileName)
                .body(resource);
    }
}
```

### 9.6 创建 `package-info.java`

**文件**：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/controller/package-info.java`

```java
/**
 * 文件存储 REST 控制器包。
 */
package com.sw.ck.storage.controller;
```

### 9.7 修改 `StorageAutoConfiguration.java`

**文件**：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java`

**改动**：将第 19 行 `@ComponentScan("com.sw.ck.storage.provider")` 替换为数组形式，扩展至 4 个包：

```java
@ComponentScan({"com.sw.ck.storage.provider", "com.sw.ck.storage.controller", "com.sw.ck.storage.service", "com.sw.ck.storage.impl"})
```

**完整文件**：

```java
package com.sw.ck.storage.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;

@AutoConfiguration
@ConditionalOnProperty(prefix = "sw.storage", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(StorageProperties.class)
@MapperScan("com.sw.ck.storage.mapper")
@ComponentScan({"com.sw.ck.storage.provider", "com.sw.ck.storage.controller", "com.sw.ck.storage.service", "com.sw.ck.storage.impl"})
public class StorageAutoConfiguration {
}
```

### 9.8 校验命令

```bash
# 编译验证
cd /data/reasonix/files/Smart-WorkFlow && mvn -q compile; echo "EXIT: $?"

# 全量测试回归
cd /data/reasonix/files/Smart-WorkFlow && mvn -q test; echo "EXIT: $?"
```

## 10. 关键实现约束

- **Facade 方法签名只用 JDK 类型 + StorageUploadResult**：InputStream / String / void，零 Spring Web 依赖。`-api` 模块的 pom.xml 不引入 spring-web
- **下载/删除按 StorageFile.providerType 选择 Provider**：不依赖当前 `active-provider` 配置。`registry.getProvider(file.getProviderType())` 而非 `registry.getActiveProvider()`
- **BaseEntity 字段不手填**：`tenant_id` / `deleted` / `version` / 审计列由 MyBatis-Plus 拦截器自动注入，FacadeImpl 和 Service 均不手写
- **StorageFile 实体不修改**：Entity 字段在 B1 定稿，B3 只读写不修改
- **R<T> 统一响应**：所有 Controller 返回值用 `R.ok()` / `R.fail()` 包装，不裸返实体
- **@Service 注解**：`StorageFacadeImpl` 和 `StorageFileServiceImpl` 均使用 `@Service`（与 NotifyFacadeImpl 一致），不用 `@Component`
- **分页使用 MyBatis-Plus Page**：list 接口走 `storageFileService.page(new Page<>(page, size), wrapper)`，不走裸 SQL
- **URLEncoder 处理中文文件名**：下载接口使用 `URLEncoder.encode(..., UTF_8).replace("+", "%20")` + `filename*=UTF-8''` 编码
- **delete 方法幂等**：文件不存在时 `getFileOrThrow` 抛 `NOT_FOUND`，不静默返回成功

## 11. 边界情况

| 边界 | 处理方式 |
|------|----------|
| 上传空文件 | Controller 检查 `file.isEmpty()` → 抛 `PARAM_ERROR` |
| `originalName` 为 null | `extractExtension(null)` → 返回空串，`generateStorageName` 生成纯 UUID 无扩展名 |
| `originalName` 无扩展名（如 "README"） | `extractExtension` → 返回空串，storageName 为纯 UUID |
| `originalName` 含多个点（如 "archive.tar.gz"） | `extractExtension` 取最后一个点之后 → "gz" |
| `contentType` 为 null | Provider 的 `upload` 收到 null，由各 Provider 自行处理（通常不影响存储） |
| `contentType` 含非标准字符 | Controller 传给 Facade 原样传递，下载时 `MediaType.parseMediaType` 可能抛异常 → Spring 内置 500 |
| 文件记录已软删（deleted=1） | MyBatis-Plus `@TableLogic` 自动过滤 `deleted=0`，`findByStorageKey` 查不到已删记录 |
| 文件记录不存在 | `getFileOrThrow` → `BaseException(NOT_FOUND, "文件不存在: ...")` |
| 提供商不可用（已配置但 Provider Bean 不存在） | `registry.getProvider(type)` 返回 null → download 抛 SYSTEM_ERROR；delete 跳过提供商侧删除仅软删数据库；getUrl 降级返回缓存 URL |
| 切换 active-provider 后历史文件下载 | 按 `StorageFile.providerType` 选择 Provider，不受当前 active-provider 影响 |
| 分页参数异常（page=0 或 size=10000） | MyBatis-Plus Page 默认限制单页最大 500 条，超出不报错但只返回上限 |
| 跨租户访问 | `TenantLineHandler` 自动注入 WHERE tenant_id，无额外处理 |
| 并发上传同名文件 | UUID 文件名天然去重，无冲突 |
| 七牛云下载 | QiniuStorageProvider.download() 抛 UnsupportedOperationException（设计约束），FacadeImpl 透传 |
| 大文件上传 | InputStream 流式传递，FacadeImpl 不缓存（Provider 内部处理，如 Qiniu 读为 byte[]） |

## 12. 风险和回滚方案

### 风险

| 风险 | 可能性 | 影响 |
|------|:------:|------|
| `@ComponentScan` 数组形式导致 Spring 扫描冲突 | 低 | 编译通过但启动时 Bean 定义冲突（duplicate bean） |
| `StorageFacade` 接口变更破坏已有依赖 | 低 | B2 中仅有 knowledge 模块依赖 `-api`，且仅用 Maven 依赖（未注入 StorageFacade） |
| Controller 与已有 Controller 路由冲突 | 极低 | `/storage/files` 路径前缀未占用 |

### 回滚

1. Git revert 本次变更的 7 个文件（5 新建 + 2 修改）
2. `mvn -q compile` + `mvn -q test` 确认基线恢复（154 tests）
3. 回滚成功标志：compile exit 0 + test 154

## 13. 测试方案

### 13.1 静态检查

| 编号 | 检查项 | 命令 |
|:----:|--------|------|
| T1 | `@ComponentScan` 含 4 包 | `grep "ComponentScan" sw-basic/.../StorageAutoConfiguration.java` |
| T2 | StorageFacade 含 4 方法签名 | `grep "upload\|download\|delete\|getUrl" sw-basic-storage-api/.../StorageFacade.java` |
| T3 | StorageFacadeImpl 使用 `registry.getProvider(file.getProviderType())` | `grep "registry.getProvider" sw-basic-storage-biz/.../StorageFacadeImpl.java` |
| T4 | Controller 5 个端点 | `grep "@PostMapping\|@GetMapping\|@DeleteMapping" sw-basic-storage-biz/.../StorageController.java \| wc -l` → 预期 5 |
| T5 | Controller 使用 `R<...>` 返回 | `grep "R<" sw-basic-storage-biz/.../StorageController.java \| wc -l` → 预期 ≥ 4 |
| T6 | `-api/pom.xml` 不引入 spring-web | `grep "spring-web\|spring-boot-starter-web" sw-basic-storage-api/pom.xml` → 零命中 |
| T7 | 全量编译 | `mvn -q compile` → EXIT 0 |
| T8 | 全量测试 | `mvn -q test` → EXIT 0，test count ≥ 154 |

### 13.2 单元测试

B3 不新增单元测试（Controller/Service 单元测试延后至 B4）。本 Step 仅验证编译和回归。

### 13.3 集成测试

B3 不新增集成测试（延后至 B4）。

### 13.4 手工验证

| 编号 | 验证项 | 步骤 |
|:----:|--------|------|
| V1 | 确认 4 个方法签名在 Facade 中可见 | IDE 打开 `StorageFacade.java`，确认 upload/download/delete/getUrl 方法存在 |
| V2 | 确认 FacadeImpl 注入链完整 | IDE 检查 `StorageFacadeImpl` 的构造注入：Registry + Service + Properties |
| V3 | 确认 Controller 端点映射 | IDE 检查 `StorageController` 的 `@RequestMapping("/storage/files")` + 5 个子映射 |

### 13.5 回归检查

| 编号 | 检查项 | 命令 | 预期 |
|:----:|--------|------|:----:|
| R1 | 全量编译零错误 | `mvn -q compile` | EXIT 0 |
| R2 | 全量测试零失败 | `mvn -q test` | EXIT 0, tests ≥ 154 |
| R3 | Provider 文件未被修改 | `git diff --name-only` 不包含 provider/ 目录下任何文件 | 零命中 |
| R4 | Entity/Mapper 未修改 | `git diff --name-only` 不包含 entity/ 或 mapper/ | 零命中 |

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|:--------:|
| B3-1 | `StorageFacade` 在 -api 模块，含 4 个方法签名（upload/download/delete/getUrl），参数只使用 JDK 类型 + StorageUploadResult | 静态检查 T2 + Visual |
| B3-2 | `StorageFacadeImpl` 在 -biz 模块，正确实现 `StorageFacade`，构造注入 Registry + Service + Properties | 静态检查 / Visual |
| B3-3 | `StorageFacadeImpl.upload()`：生成 UUID 文件名 → registry.getActiveProvider() → provider.upload() → StorageFile 落库 → 返回 StorageUploadResult | 代码审查 |
| B3-4 | `StorageFacadeImpl.download()`：`getFileOrThrow` → `registry.getProvider(file.getProviderType())` → `provider.download(storageKey)`（非 activeProvider） | 静态检查 T3 |
| B3-5 | `StorageFacadeImpl.delete()`：`getFileOrThrow` → `provider.delete()` → `storageFileService.removeById()` 软删 | 代码审查 |
| B3-6 | `StorageFileService` extends `BaseService<StorageFile>`，含 `findByStorageKey(String)` 方法 | 静态检查 / Visual |
| B3-7 | `StorageFileServiceImpl` extends `BaseServiceImpl<StorageFileMapper, StorageFile>`，`findByStorageKey` 使用 `lambdaQuery().eq(StorageFile::getStorageKey, ...)` | 代码审查 |
| B3-8 | `StorageController`：5 个端点在 `/storage/files` 下（upload/list/info/delete/download），返回 `R<T>` 或 `ResponseEntity<InputStreamResource>` | 静态检查 T4 + T5 |
| B3-9 | Controller upload 接收 `@RequestParam("file") MultipartFile`，校验 `file.isEmpty()` | 代码审查 |
| B3-10 | Controller download 使用 `InputStreamResource` + `filename*=UTF-8''` 编码 + `MediaType` 正确 | 代码审查 |
| B3-11 | Controller list 使用 MyBatis-Plus `Page` 分页，默认 page=1 size=20，按 createTime 倒序 | 代码审查 |
| B3-12 | `StorageAutoConfiguration` 的 `@ComponentScan` 覆盖 provider/controller/service/impl 四个包 | 静态检查 T1 |
| B3-13 | `-api/pom.xml` 不新增 spring-web 依赖（StorageFacade 零 Spring Web 类型依赖） | 静态检查 T6 |
| B3-14 | `mvn -q compile` 退出码 0（含所有新文件的编译） | 静态检查 T7 |
| B3-15 | `mvn -q test` 退出码 0，测试数量不减少（≥ 154），BUILD SUCCESS | 静态检查 T8 |

## 15. 执行回执格式

按 §7.1 标准格式返回，特别需包含：

- 第 5 项"每个文件的修改摘要"：逐文件列出改动点
- 第 6 项"实际执行的命令"：含完整 `mvn -q compile` + `mvn -q test` 命令及退出码
- 第 7 项"命令输出摘要"：编译结果 + 全量测试计数
- 第 8 项"与原方案的偏差"：任何与 §9 详细执行方案的差异
- 第 12 项"Git diff 摘要"：改动文件数/新增行数/删除行数

## 16. 测试回执格式

按 §7.2 标准格式返回，特别需包含：

- 第 4 项"实际执行的测试命令"：列出 T1-T8 全部静态检查命令及输出
- 第 5 项"各测试项结果"：逐条 T1-T8 + R1-R4 列表
- 第 10 项"是否满足验收标准"：逐条对照 B3-1 ~ B3-15

## 17. 明确禁止事项

- ❌ **禁止修改 Provider 层任何文件**（StorageProvider.java、4 个实现、Registry）
- ❌ **禁止修改 Entity / Mapper / Properties 类**
- ❌ **禁止修改任何 pom.xml**（包括 -api、-biz、sw-dependencies）
- ❌ **禁止新增 Spring Web 依赖到 -api 模块**
- ❌ **禁止在 Facade 接口中使用 MultipartFile 或任何 Spring Web 类型**
- ❌ **禁止新增 Flyway 迁移脚本**（V16 已就位，B3 不涉及 schema）
- ❌ **禁止修改 application.yml 或任何配置文件**
- ❌ **禁止新增测试文件**（测试延后至 B4）
- ❌ **禁止下载/删除时使用 `registry.getActiveProvider()`** 代替 `registry.getProvider(file.getProviderType())`
- ❌ **禁止在 FacadeImpl 中手填 `tenant_id` / `deleted` / `version` / 审计列** — 全由 BaseEntity 拦截器处理
- ❌ **禁止创建额外的 DTO/VO 文件**（如 StorageFileVO）— 当前 Step 仅复用已有实体和 DTO
- ❌ **禁止触碰前端项目**（Smart-WorkFlow-Web/）
- ❌ **禁止创建 sw-basic-storage-biz 之外的 controller/service/impl 目录**
