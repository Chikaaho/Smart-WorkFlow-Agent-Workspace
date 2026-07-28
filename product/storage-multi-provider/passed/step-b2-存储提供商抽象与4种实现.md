# Step B2：存储提供商抽象与 4 种实现

## 1. 当前状态

- 功能状态：**IN_PROGRESS** — B1 已通过验收（18/18）
- `sw-basic-storage` 已完成 -api/-biz 拆分
- `StorageFile` Entity + `StorageFileMapper` + `StorageFacade`（骨架）已就位
- `StorageProperties` 已支持 4 种提供商配置绑定（local/minio/cos/qiniu）
- `StorageAutoConfiguration` 已点亮（`@MapperScan` 已配置，`@ComponentScan` 待补充）
- BOM 中仅 MinIO 版本就位，COS 和 Qiniu SDK 版本待添加
- 前置 Step：B1（PASSED ✅）

## 2. Step 目标

定义 `StorageProvider` 统一接口，完成 4 种存储提供商（本地文件系统 / MinIO / 腾讯云 COS / 七牛云 Kodo）的完整实现。每个 Provider 是真实的、可工作的实现（非 Mock/Stub）。同步补全 COS 和 Qiniu SDK 依赖到 BOM 和 biz pom。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：4 种 Provider 实现均为标准 SDK 调用模式，逻辑线性（构建客户端 → 调用 SDK 方法 → 返回结果），无复杂分支、无并发协调、无安全敏感边界
是否触发升级条件：否
```

## 4. 模型选择理由

本 Step 的核心工作是将 4 种存储后端的 SDK 调用封装为统一接口，每个 Provider 内部均为标准 CRUD 操作（upload/download/delete/getUrl），不涉及跨模块协议变更、不涉及数据库 schema 设计、不涉及权限或认证逻辑。所有 SDK 的 API 签名和使用模式均来自官方文档，无歧义。

## 5. 已知上下文

### 5.1 B1 已建基础设施

| 文件 | 位置 | 用途 |
|------|------|------|
| `StorageProperties.java` | `-biz/config/` | `@ConfigurationProperties(prefix="sw.storage")`，含 `activeProvider` + `providers` Map |
| `StorageAutoConfiguration.java` | `-biz/config/` | `@AutoConfiguration` + `@MapperScan("com.sw.ck.storage.mapper")` |
| `StorageFile.java` | `-biz/entity/` | 文件元数据实体，`@TableName("sw_storage_file")`，10 个业务字段 |
| `StorageFacade.java` | `-api/api/` | 空接口骨架，B3 中补充方法签名 |

### 5.2 提供商配置结构（已绑定）

```yaml
sw.storage:
  enabled: true
  active-provider: minio  # or local / cos / qiniu
  providers:
    local:   { base-path, url-prefix }
    minio:   { url, access-key, secret-key, bucket }
    cos:     { secret-id, secret-key, region, bucket }
    qiniu:   { access-key, secret-key, bucket, domain }
```

### 5.3 关键约束

- **StorageProvider 为内部 SPI**：放在 `-biz` 模块（非跨模块契约，不放在 -api）
- **StorageUploadResult 作为 DTO**：放在 `-api` 模块（B3 Facade 方法返回值将使用它）
- **MinIO SDK**：版本 8.5.17，已在 BOM 和 -biz pom 中
- **COS/Qiniu SDK**：需新增到 BOM 和 -biz pom，版本见 §9
- **依赖方向**：-biz → -api → sw-common，不可反向
- **AutoConfiguration**：需新增 `@ComponentScan("com.sw.ck.storage.provider")` 来扫描 Provider 组件
- **无 Spring Context 依赖**：各个 Provider 是纯 SDK 调用，不依赖 Spring Data/JPA/事务

## 6. 执行前必须读取的文件

按优先级排序：

1. **`sw-dependencies/pom.xml`** — 确认现有版本管理结构，在 `<properties>` 和 `<dependencyManagement>` 中新增 COS/Qiniu
2. **`sw-basic/sw-basic-storage/sw-basic-storage-biz/pom.xml`** — 已含 minio，需新增 cos_api + qiniu-sdk
3. **`sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/config/StorageProperties.java`** — ProviderConfig 内部类字段确认
4. **`sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java`** — 需新增 @ComponentScan
5. **`sw-basic/sw-basic-storage/sw-basic-storage-api/src/main/java/com/sw/ck/storage/api/StorageFacade.java`** — 确认包结构
6. **`sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/entity/StorageFile.java`** — 确认字段名（providerType、storageKey 等）
7. **`sw-bootstrap/src/main/resources/application.yml`** — 确认各提供商配置段

## 7. 允许修改的文件范围

### 新建文件

| # | 文件 | 说明 |
|---|------|------|
| 1 | `sw-basic-storage-api/src/main/java/com/sw/ck/storage/api/StorageUploadResult.java` | 上传结果 DTO |
| 2 | `sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/StorageProvider.java` | 存储提供商接口 |
| 3 | `sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/LocalStorageProvider.java` | 本地文件系统实现 |
| 4 | `sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/MinioStorageProvider.java` | MinIO 实现 |
| 5 | `sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/CosStorageProvider.java` | 腾讯云 COS 实现 |
| 6 | `sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/QiniuStorageProvider.java` | 七牛云 Kodo 实现 |
| 7 | `sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/StorageProviderRegistry.java` | Provider 注册与查找 |

### 修改文件

| # | 文件 | 变更内容 |
|---|------|------|
| 1 | `sw-dependencies/pom.xml` | 新增 `cos_api` 和 `qiniu-java-sdk` 版本属性和依赖管理 |
| 2 | `sw-basic-storage-biz/pom.xml` | 新增 `cos_api` 和 `qiniu-java-sdk` 依赖 |
| 3 | `sw-basic-storage-biz/.../config/StorageAutoConfiguration.java` | 新增 `@ComponentScan("com.sw.ck.storage.provider")` |

## 8. 禁止修改的范围

- ❌ 不修改 `StorageFile.java`、`StorageFileMapper.java`（B1 已就位）
- ❌ 不修改 `StorageProperties.java`（配置结构已完整，不需要动）
- ❌ 不修改 `StorageFacade.java`（B3 再补充方法签名）
- ❌ 不修改 `sw-basic/pom.xml`、`sw-bootstrap/pom.xml`、`sw-basic-storage/pom.xml`
- ❌ 不修改 Flyway 脚本（V1-V16）
- ❌ 不修改已有 YAML 配置文件
- ❌ 不触碰前端项目
- ❌ 不在本 Step 中创建 Service 或 Controller（留给 B3）
- ❌ 不在本 Step 中写单元测试（留给 B4）
- ❌ 不在 -api 模块中引用任何第三方库（StorageUploadResult 仅用 JDK 类型）

## 9. 详细执行方案

### 9.1 新增 COS 和 Qiniu SDK 到 BOM

#### 9.1.1 sw-dependencies/pom.xml — `<properties>`

在 `<!-- ===================== 文件存储 ===================== -->` 块中，`minio.version` 下方新增：

```xml
<cos-api.version>5.6.231</cos-api.version>
<qiniu-sdk.version>7.15.0</qiniu-sdk.version>
```

#### 9.1.2 sw-dependencies/pom.xml — `<dependencyManagement>`

在 `<!-- =================== 文件存储 =================== -->` 块中，MinIO 依赖项下方新增：

```xml
<!-- 腾讯云 COS -->
<dependency>
    <groupId>com.qcloud</groupId>
    <artifactId>cos_api</artifactId>
    <version>${cos-api.version}</version>
</dependency>

<!-- 七牛云 Kodo -->
<dependency>
    <groupId>com.qiniu</groupId>
    <artifactId>qiniu-java-sdk</artifactId>
    <version>${qiniu-sdk.version}</version>
</dependency>
```

### 9.2 新增 COS 和 Qiniu SDK 到 -biz pom.xml

在 `sw-basic-storage-biz/pom.xml` 的 `<dependencies>` 块中，MinIO 依赖下方新增：

```xml
<!-- 腾讯云 COS SDK -->
<dependency>
    <groupId>com.qcloud</groupId>
    <artifactId>cos_api</artifactId>
</dependency>

<!-- 七牛云 Kodo SDK -->
<dependency>
    <groupId>com.qiniu</groupId>
    <artifactId>qiniu-java-sdk</artifactId>
</dependency>
```

注意：版本由 `sw-dependencies` BOM 统一管理，此处不写 `<version>`。

### 9.3 创建 StorageUploadResult（-api 模块）

包路径：`com.sw.ck.storage.api`

文件：`sw-basic-storage-api/src/main/java/com/sw/ck/storage/api/StorageUploadResult.java`

```java
package com.sw.ck.storage.api;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 文件上传结果。
 * <p>
 * 由 StorageProvider 返回，供 Facade/Service/Controller 使用。
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StorageUploadResult {

    /** 存储唯一标识（provider 内部定位文件，如 objectName / 相对路径） */
    private String storageKey;

    /** 存储后文件名（系统生成的唯一文件名，含扩展名） */
    private String storageName;

    /** 文件访问 URL（可能为 null，如私有 bucket 需通过 API 下载） */
    private String storageUrl;

    /** 文件大小（字节） */
    private Long fileSize;
}
```

### 9.4 创建 StorageProvider 接口（-biz 模块）

包路径：`com.sw.ck.storage.provider`

文件：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/StorageProvider.java`

```java
package com.sw.ck.storage.provider;

import com.sw.ck.storage.api.StorageUploadResult;

import java.io.InputStream;

/**
 * 存储提供商抽象接口。
 * <p>
 * 每个实现对应一种存储后端（本地/MinIO/COS/七牛云），由
 * {@link StorageProviderRegistry} 根据 {@code sw.storage.active-provider}
 * 配置选择当前活跃的提供商。
 * <p>
 * 所有方法均为同步阻塞调用，上传/下载大文件时调用方负责异步包装。
 */
public interface StorageProvider {

    /**
     * 上传文件。
     *
     * @param inputStream 文件输入流（调用方负责关闭）
     * @param fileName    原始文件名（用于提取扩展名）
     * @param contentType MIME 类型
     * @return 上传结果，含 storageKey / storageName / storageUrl / fileSize
     */
    StorageUploadResult upload(InputStream inputStream, String fileName, String contentType);

    /**
     * 下载文件。
     *
     * @param storageKey 上传时返回的 storageKey
     * @return 文件输入流（调用方负责关闭）
     */
    InputStream download(String storageKey);

    /**
     * 删除文件。
     *
     * @param storageKey 上传时返回的 storageKey
     */
    void delete(String storageKey);

    /**
     * 获取文件访问 URL。
     *
     * @param storageKey 上传时返回的 storageKey
     * @return 公开可访问的 URL，或 null（如文件为私有）
     */
    String getUrl(String storageKey);

    /**
     * 提供商标识，与 YAML 配置中的 key 对应。
     *
     * @return "local" / "minio" / "cos" / "qiniu"
     */
    String getType();
}
```

### 9.5 创建 LocalStorageProvider（-biz 模块）

包路径：`com.sw.ck.storage.provider`

文件：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/LocalStorageProvider.java`

```java
package com.sw.ck.storage.provider;

import com.sw.ck.storage.api.StorageUploadResult;
import com.sw.ck.storage.config.StorageProperties;
import com.sw.ck.storage.config.StorageProperties.ProviderConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/**
 * 本地文件系统存储提供商。
 * <p>
 * 文件按日期分目录存储：{basePath}/yyyy/MM/dd/{uuid}.{ext}
 * 通过 urlPrefix 拼接为外部访问地址（需配合 Controller 或静态资源配置）。
 */
@Slf4j
@Component
public class LocalStorageProvider implements StorageProvider {

    static final String TYPE = "local";

    private final StorageProperties properties;

    public LocalStorageProvider(StorageProperties properties) {
        this.properties = properties;
    }

    @Override
    public StorageUploadResult upload(InputStream inputStream, String fileName, String contentType) {
        ProviderConfig config = requireConfig();
        String basePath = config.getBasePath();
        if (!StringUtils.hasText(basePath)) {
            throw new IllegalStateException("本地存储未配置 base-path");
        }

        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String ext = extractExt(fileName);
        String storageName = UUID.randomUUID().toString().replace("-", "") + (ext.isEmpty() ? "" : "." + ext);
        String relativePath = datePath + "/" + storageName;
        String storageKey = Paths.get(datePath, storageName).toString().replace("\\", "/");

        try {
            Path targetDir = Paths.get(basePath, datePath);
            Files.createDirectories(targetDir);
            Path targetFile = targetDir.resolve(storageName);
            long fileSize = Files.copy(inputStream, targetFile, StandardCopyOption.REPLACE_EXISTING);

            String urlPrefix = config.getUrlPrefix();
            String storageUrl = StringUtils.hasText(urlPrefix)
                    ? urlPrefix.replaceAll("/+$", "") + "/" + relativePath
                    : null;

            log.debug("本地文件已保存: {}", targetFile);
            return StorageUploadResult.builder()
                    .storageKey(storageKey)
                    .storageName(storageName)
                    .storageUrl(storageUrl)
                    .fileSize(fileSize)
                    .build();
        } catch (IOException e) {
            throw new RuntimeException("本地文件写入失败: " + storageKey, e);
        }
    }

    @Override
    public InputStream download(String storageKey) {
        ProviderConfig config = requireConfig();
        Path filePath = Paths.get(config.getBasePath(), storageKey);
        if (!Files.exists(filePath)) {
            throw new RuntimeException("文件不存在: " + storageKey);
        }
        try {
            return Files.newInputStream(filePath);
        } catch (IOException e) {
            throw new RuntimeException("本地文件读取失败: " + storageKey, e);
        }
    }

    @Override
    public void delete(String storageKey) {
        ProviderConfig config = requireConfig();
        try {
            Path filePath = Paths.get(config.getBasePath(), storageKey);
            Files.deleteIfExists(filePath);
            log.debug("本地文件已删除: {}", filePath);
        } catch (IOException e) {
            throw new RuntimeException("本地文件删除失败: " + storageKey, e);
        }
    }

    @Override
    public String getUrl(String storageKey) {
        ProviderConfig config = requireConfig();
        String urlPrefix = config.getUrlPrefix();
        if (!StringUtils.hasText(urlPrefix)) {
            return null;
        }
        return urlPrefix.replaceAll("/+$", "") + "/" + storageKey.replace("\\", "/");
    }

    @Override
    public String getType() {
        return TYPE;
    }

    private ProviderConfig requireConfig() {
        ProviderConfig config = properties.getProviders().get(TYPE);
        if (config == null) {
            throw new IllegalStateException("本地存储未配置（sw.storage.providers.local）");
        }
        return config;
    }

    private String extractExt(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
```

### 9.6 创建 MinioStorageProvider（-biz 模块）

包路径：`com.sw.ck.storage.provider`

文件：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/MinioStorageProvider.java`

```java
package com.sw.ck.storage.provider;

import com.sw.ck.storage.api.StorageUploadResult;
import com.sw.ck.storage.config.StorageProperties;
import com.sw.ck.storage.config.StorageProperties.ProviderConfig;
import io.minio.*;
import io.minio.http.Method;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.InputStream;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * MinIO 对象存储提供商。
 * <p>
 * 使用 MinIO Java SDK 8.x，通过预签名 URL 提供文件访问。
 */
@Slf4j
@Component
public class MinioStorageProvider implements StorageProvider {

    static final String TYPE = "minio";

    private final StorageProperties properties;
    private volatile MinioClient client;
    private volatile String clientBucket;

    public MinioStorageProvider(StorageProperties properties) {
        this.properties = properties;
    }

    @Override
    public StorageUploadResult upload(InputStream inputStream, String fileName, String contentType) {
        MinioClient mc = getClient();
        String bucket = getBucket();
        String ext = extractExt(fileName);
        String storageName = UUID.randomUUID().toString().replace("-", "") + (ext.isEmpty() ? "" : "." + ext);
        String objectName = storageName; // MinIO 中直接使用 storageName 作为 objectName

        try {
            ensureBucket(mc, bucket);

            PutObjectArgs args = PutObjectArgs.builder()
                    .bucket(bucket)
                    .object(objectName)
                    .stream(inputStream, -1, PutObjectArgs.MIN_MULTIPART_SIZE)
                    .contentType(contentType)
                    .build();

            mc.putObject(args);
            long fileSize = mc.statObject(StatObjectArgs.builder()
                    .bucket(bucket).object(objectName).build()).size();

            log.debug("MinIO 文件已上传: bucket={}, object={}", bucket, objectName);
            return StorageUploadResult.builder()
                    .storageKey(objectName)
                    .storageName(storageName)
                    .storageUrl(null) // MinIO 默认私有，URL 通过 getUrl() 按需生成
                    .fileSize(fileSize)
                    .build();
        } catch (Exception e) {
            throw new RuntimeException("MinIO 上传失败: bucket=" + bucket + ", object=" + objectName, e);
        }
    }

    @Override
    public InputStream download(String storageKey) {
        MinioClient mc = getClient();
        String bucket = getBucket();
        try {
            return mc.getObject(GetObjectArgs.builder()
                    .bucket(bucket)
                    .object(storageKey)
                    .build());
        } catch (Exception e) {
            throw new RuntimeException("MinIO 下载失败: bucket=" + bucket + ", object=" + storageKey, e);
        }
    }

    @Override
    public void delete(String storageKey) {
        MinioClient mc = getClient();
        String bucket = getBucket();
        try {
            mc.removeObject(RemoveObjectArgs.builder()
                    .bucket(bucket)
                    .object(storageKey)
                    .build());
            log.debug("MinIO 文件已删除: bucket={}, object={}", bucket, storageKey);
        } catch (Exception e) {
            throw new RuntimeException("MinIO 删除失败: bucket=" + bucket + ", object=" + storageKey, e);
        }
    }

    @Override
    public String getUrl(String storageKey) {
        MinioClient mc = getClient();
        String bucket = getBucket();
        try {
            return mc.getPresignedObjectUrl(GetPresignedObjectUrlArgs.builder()
                    .bucket(bucket)
                    .object(storageKey)
                    .method(Method.GET)
                    .expiry(1, TimeUnit.HOURS)
                    .build());
        } catch (Exception e) {
            throw new RuntimeException("MinIO 获取 URL 失败: bucket=" + bucket + ", object=" + storageKey, e);
        }
    }

    @Override
    public String getType() {
        return TYPE;
    }

    private MinioClient getClient() {
        ProviderConfig config = requireConfig();
        String bucket = config.getBucket();
        // 懒加载 + bucket 变更时重建
        if (client == null || !bucket.equals(clientBucket)) {
            synchronized (this) {
                if (client == null || !bucket.equals(clientBucket)) {
                    client = MinioClient.builder()
                            .endpoint(config.getUrl())
                            .credentials(config.getAccessKey(), config.getSecretKey())
                            .build();
                    clientBucket = bucket;
                }
            }
        }
        return client;
    }

    private String getBucket() {
        return requireConfig().getBucket();
    }

    private void ensureBucket(MinioClient mc, String bucket) throws Exception {
        boolean exists = mc.bucketExists(BucketExistsArgs.builder().bucket(bucket).build());
        if (!exists) {
            mc.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            log.info("MinIO bucket 已创建: {}", bucket);
        }
    }

    private ProviderConfig requireConfig() {
        ProviderConfig config = properties.getProviders().get(TYPE);
        if (config == null || !StringUtils.hasText(config.getUrl())) {
            throw new IllegalStateException("MinIO 未配置（sw.storage.providers.minio）");
        }
        return config;
    }

    private String extractExt(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
```

### 9.7 创建 CosStorageProvider（-biz 模块）

包路径：`com.sw.ck.storage.provider`

文件：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/CosStorageProvider.java`

```java
package com.sw.ck.storage.provider;

import com.qcloud.cos.COSClient;
import com.qcloud.cos.ClientConfig;
import com.qcloud.cos.auth.BasicCOSCredentials;
import com.qcloud.cos.auth.COSCredentials;
import com.qcloud.cos.exception.CosClientException;
import com.qcloud.cos.http.HttpProtocol;
import com.qcloud.cos.model.COSObject;
import com.qcloud.cos.model.COSObjectInputStream;
import com.qcloud.cos.model.ObjectMetadata;
import com.qcloud.cos.model.PutObjectRequest;
import com.qcloud.cos.region.Region;
import com.sw.ck.storage.api.StorageUploadResult;
import com.sw.ck.storage.config.StorageProperties;
import com.sw.ck.storage.config.StorageProperties.ProviderConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.InputStream;
import java.net.URL;
import java.util.Date;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * 腾讯云 COS（对象存储）提供商。
 * <p>
 * 使用 COS Java SDK 5.x，通过预签名 URL 提供文件访问。
 */
@Slf4j
@Component
public class CosStorageProvider implements StorageProvider {

    static final String TYPE = "cos";

    private final StorageProperties properties;
    private volatile COSClient client;

    public CosStorageProvider(StorageProperties properties) {
        this.properties = properties;
    }

    @Override
    public StorageUploadResult upload(InputStream inputStream, String fileName, String contentType) {
        COSClient cosClient = getClient();
        ProviderConfig config = requireConfig();
        String bucket = config.getBucket();
        String ext = extractExt(fileName);
        String storageName = UUID.randomUUID().toString().replace("-", "") + (ext.isEmpty() ? "" : "." + ext);
        String key = storageName;

        try {
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(contentType);
            // 不设 Content-Length，SDK 自动计算

            PutObjectRequest request = new PutObjectRequest(bucket, key, inputStream, metadata);
            cosClient.putObject(request);

            ObjectMetadata resultMeta = cosClient.getObjectMetadata(bucket, key);
            long fileSize = resultMeta.getContentLength();

            log.debug("COS 文件已上传: bucket={}, key={}", bucket, key);
            return StorageUploadResult.builder()
                    .storageKey(key)
                    .storageName(storageName)
                    .storageUrl(null) // COS 默认私有，URL 通过 getUrl() 按需生成
                    .fileSize(fileSize)
                    .build();
        } catch (CosClientException e) {
            throw new RuntimeException("COS 上传失败: bucket=" + bucket + ", key=" + key, e);
        }
    }

    @Override
    public InputStream download(String storageKey) {
        COSClient cosClient = getClient();
        ProviderConfig config = requireConfig();
        String bucket = config.getBucket();
        try {
            COSObject cosObject = cosClient.getObject(bucket, storageKey);
            return cosObject.getObjectContent();
        } catch (CosClientException e) {
            throw new RuntimeException("COS 下载失败: bucket=" + bucket + ", key=" + storageKey, e);
        }
    }

    @Override
    public void delete(String storageKey) {
        COSClient cosClient = getClient();
        ProviderConfig config = requireConfig();
        String bucket = config.getBucket();
        try {
            cosClient.deleteObject(bucket, storageKey);
            log.debug("COS 文件已删除: bucket={}, key={}", bucket, storageKey);
        } catch (CosClientException e) {
            throw new RuntimeException("COS 删除失败: bucket=" + bucket + ", key=" + storageKey, e);
        }
    }

    @Override
    public String getUrl(String storageKey) {
        COSClient cosClient = getClient();
        ProviderConfig config = requireConfig();
        String bucket = config.getBucket();
        try {
            Date expiration = new Date(System.currentTimeMillis() + TimeUnit.HOURS.toMillis(1));
            URL url = cosClient.generatePresignedUrl(bucket, storageKey, expiration,
                    com.qcloud.cos.http.Method.GET);
            return url.toString();
        } catch (CosClientException e) {
            throw new RuntimeException("COS 获取 URL 失败: bucket=" + bucket + ", key=" + storageKey, e);
        }
    }

    @Override
    public String getType() {
        return TYPE;
    }

    private COSClient getClient() {
        if (client == null) {
            synchronized (this) {
                if (client == null) {
                    ProviderConfig config = requireConfig();
                    COSCredentials cred = new BasicCOSCredentials(config.getSecretId(), config.getSecretKey());
                    Region region = new Region(config.getRegion());
                    ClientConfig clientConfig = new ClientConfig(region);
                    clientConfig.setHttpProtocol(HttpProtocol.https);
                    client = new COSClient(cred, clientConfig);
                }
            }
        }
        return client;
    }

    private ProviderConfig requireConfig() {
        ProviderConfig config = properties.getProviders().get(TYPE);
        if (config == null || !StringUtils.hasText(config.getSecretId())) {
            throw new IllegalStateException("COS 未配置（sw.storage.providers.cos）");
        }
        return config;
    }

    private String extractExt(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }
}
```

### 9.8 创建 QiniuStorageProvider（-biz 模块）

包路径：`com.sw.ck.storage.provider`

文件：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/QiniuStorageProvider.java`

```java
package com.sw.ck.storage.provider;

import com.google.gson.Gson;
import com.qiniu.common.QiniuException;
import com.qiniu.http.Response;
import com.qiniu.storage.BucketManager;
import com.qiniu.storage.Configuration;
import com.qiniu.storage.Region;
import com.qiniu.storage.UploadManager;
import com.qiniu.storage.model.DefaultPutRet;
import com.qiniu.util.Auth;
import com.sw.ck.storage.api.StorageUploadResult;
import com.sw.ck.storage.config.StorageProperties;
import com.sw.ck.storage.config.StorageProperties.ProviderConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.UUID;

/**
 * 七牛云 Kodo 对象存储提供商。
 * <p>
 * 使用七牛云 Java SDK 7.x，通过公开域名或私有域名提供文件访问。
 */
@Slf4j
@Component
public class QiniuStorageProvider implements StorageProvider {

    static final String TYPE = "qiniu";

    private final StorageProperties properties;
    private volatile Auth auth;
    private volatile UploadManager uploadManager;
    private volatile BucketManager bucketManager;

    public QiniuStorageProvider(StorageProperties properties) {
        this.properties = properties;
    }

    @Override
    public StorageUploadResult upload(InputStream inputStream, String fileName, String contentType) {
        ProviderConfig config = requireConfig();
        Auth qiniuAuth = getAuth();
        UploadManager um = getUploadManager();
        String bucket = config.getBucket();
        String ext = extractExt(fileName);
        String storageName = UUID.randomUUID().toString().replace("-", "") + (ext.isEmpty() ? "" : "." + ext);
        String key = storageName;

        try {
            // 七牛云 Java SDK 的 uploadManager.put 需要 InputStream，我们先读入字节数组
            // 以支持 SDK 内部可能的多次读取
            byte[] data = readAllBytes(inputStream);
            String uploadToken = qiniuAuth.uploadToken(bucket, key, 3600, null);

            Response response = um.put(data, key, uploadToken, null, contentType, false);
            DefaultPutRet putRet = new Gson().fromJson(response.bodyString(), DefaultPutRet.class);

            long fileSize = data.length;

            log.debug("七牛云文件已上传: bucket={}, key={}", bucket, key);
            return StorageUploadResult.builder()
                    .storageKey(key)
                    .storageName(storageName)
                    .storageUrl(getUrl(key)) // 七牛云默认公开空间可直接构造 URL
                    .fileSize(fileSize)
                    .build();
        } catch (QiniuException e) {
            throw new RuntimeException("七牛云上传失败: bucket=" + bucket + ", key=" + key, e);
        } catch (IOException e) {
            throw new RuntimeException("七牛云上传读取流失败: " + key, e);
        }
    }

    @Override
    public InputStream download(String storageKey) {
        String downloadUrl = getUrl(storageKey);
        if (downloadUrl == null) {
            throw new RuntimeException("七牛云未配置 domain，无法构造下载地址: " + storageKey);
        }
        try {
            HttpURLConnection conn = (HttpURLConnection) new URL(downloadUrl).openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(30000);
            return conn.getInputStream();
        } catch (IOException e) {
            throw new RuntimeException("七牛云下载失败: key=" + storageKey, e);
        }
    }

    @Override
    public void delete(String storageKey) {
        ProviderConfig config = requireConfig();
        BucketManager bm = getBucketManager();
        String bucket = config.getBucket();
        try {
            bm.delete(bucket, storageKey);
            log.debug("七牛云文件已删除: bucket={}, key={}", bucket, storageKey);
        } catch (QiniuException e) {
            throw new RuntimeException("七牛云删除失败: bucket=" + bucket + ", key=" + storageKey, e);
        }
    }

    @Override
    public String getUrl(String storageKey) {
        ProviderConfig config = requireConfig();
        String domain = config.getDomain();
        if (!StringUtils.hasText(domain)) {
            return null;
        }
        String base = domain.replaceAll("/+$", "");
        return base + "/" + storageKey;
    }

    @Override
    public String getType() {
        return TYPE;
    }

    private Auth getAuth() {
        if (auth == null) {
            synchronized (this) {
                if (auth == null) {
                    ProviderConfig config = requireConfig();
                    auth = Auth.create(config.getAccessKey(), config.getSecretKey());
                }
            }
        }
        return auth;
    }

    private UploadManager getUploadManager() {
        if (uploadManager == null) {
            synchronized (this) {
                if (uploadManager == null) {
                    // 使用自动检测区域
                    Configuration cfg = new Configuration(Region.autoRegion());
                    uploadManager = new UploadManager(cfg);
                }
            }
        }
        return uploadManager;
    }

    private BucketManager getBucketManager() {
        if (bucketManager == null) {
            synchronized (this) {
                if (bucketManager == null) {
                    Configuration cfg = new Configuration(Region.autoRegion());
                    bucketManager = new BucketManager(getAuth(), cfg);
                }
            }
        }
        return bucketManager;
    }

    private ProviderConfig requireConfig() {
        ProviderConfig config = properties.getProviders().get(TYPE);
        if (config == null || !StringUtils.hasText(config.getAccessKey())) {
            throw new IllegalStateException("七牛云未配置（sw.storage.providers.qiniu）");
        }
        return config;
    }

    private String extractExt(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
    }

    private byte[] readAllBytes(InputStream inputStream) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        byte[] data = new byte[8192];
        int n;
        while ((n = inputStream.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, n);
        }
        return buffer.toByteArray();
    }
}
```

### 9.9 创建 StorageProviderRegistry（-biz 模块）

包路径：`com.sw.ck.storage.provider`

文件：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/StorageProviderRegistry.java`

```java
package com.sw.ck.storage.provider;

import com.sw.ck.storage.config.StorageProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * 存储提供商注册表。
 * <p>
 * 收集所有 {@link StorageProvider} 实现，根据配置
 * {@code sw.storage.active-provider} 选择当前活跃的提供商。
 * <p>
 * 如果配置的 activeProvider 不存在或对应配置不完整，调用时抛出明确异常。
 */
@Component
public class StorageProviderRegistry {

    private final Map<String, StorageProvider> providers;
    private final StorageProperties properties;

    public StorageProviderRegistry(List<StorageProvider> providerList, StorageProperties properties) {
        this.providers = providerList.stream()
                .collect(Collectors.toMap(StorageProvider::getType, Function.identity()));
        this.properties = properties;
    }

    /**
     * 获取当前活跃的存储提供商。
     *
     * @return 活跃的 StorageProvider
     * @throws IllegalStateException 如果 activeProvider 未配置、不存在或对应 provider 配置不完整
     */
    public StorageProvider getActiveProvider() {
        String activeType = properties.getActiveProvider();
        if (!StringUtils.hasText(activeType)) {
            throw new IllegalStateException("未指定 sw.storage.active-provider");
        }
        StorageProvider provider = providers.get(activeType);
        if (provider == null) {
            throw new IllegalStateException("未知的存储提供商类型: " + activeType
                    + "（可用的提供商: " + providers.keySet() + "）");
        }
        return provider;
    }

    /**
     * 按类型获取存储提供商（用于多提供商同时使用的场景，当前 v1 不需要）。
     *
     * @param type 提供商标识
     * @return StorageProvider，或 null 如果不存在
     */
    public StorageProvider getProvider(String type) {
        return providers.get(type);
    }

    /**
     * 返回所有已注册的提供商标识。
     */
    public java.util.Set<String> getAvailableTypes() {
        return providers.keySet();
    }
}
```

### 9.10 更新 StorageAutoConfiguration（添加 @ComponentScan）

文件：`sw-basic-storage-biz/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java`

当前内容：

```java
@AutoConfiguration
@ConditionalOnProperty(prefix = "sw.storage", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(StorageProperties.class)
@MapperScan("com.sw.ck.storage.mapper")
public class StorageAutoConfiguration {
}
```

在 `@MapperScan` 注解下方新增一行：

```java
@ComponentScan("com.sw.ck.storage.provider")
```

最终效果：

```java
package com.sw.ck.storage.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;

/**
 * 文件存储自动配置。
 * <p>
 * 默认关闭，通过 {@code sw.storage.enabled=true} 开启。
 * </p>
 */
@AutoConfiguration
@ConditionalOnProperty(prefix = "sw.storage", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(StorageProperties.class)
@MapperScan("com.sw.ck.storage.mapper")
@ComponentScan("com.sw.ck.storage.provider")
public class StorageAutoConfiguration {
}
```

### 9.11 验证

```bash
cd Smart-WorkFlow
mvn -q compile
```

预期结果：BUILD SUCCESS，COS 和 Qiniu SDK 依赖正确解析，所有 7 个新建 Java 文件编译通过。

## 10. 关键实现约束

1. **接口放 -biz，DTO 放 -api**：StorageProvider 是内部 SPI，不得放 -api。StorageUploadResult 是跨模块 DTO，放 -api（B3 Facade 将使用它）
2. **所有 Provider 必须是真实实现**：不接受 `throw new UnsupportedOperationException("not implemented")`。每个 upload/download/delete/getUrl 必须是对应 SDK 的有效调用代码
3. **activeProvider 未配置或不存在时必须抛明确异常**：不在启动时静默退化，不在调用时返回 null 伪装成功
4. **MinIO SDK 8.x API 签名**：使用 Builder 模式（`PutObjectArgs.builder()...build()`），非旧版重载方法
5. **COS SDK 5.x**：使用 `com.qcloud.cos.COSClient`，非旧版 `com.qcloud.cos.COSClient`（注意包名一致性）
6. **七牛云 SDK 7.x**：使用 `com.qiniu.storage.UploadManager` + `com.qiniu.util.Auth`，区域自动检测 `Region.autoRegion()`
7. **文件扩展名统一小写**：所有 Provider 的 `extractExt()` 返回小写扩展名，不含点
8. **UUID 文件名**：所有 Provider 使用 `UUID.randomUUID().toString().replace("-", "")` 生成唯一存储名，避免碰撞
9. **每个 Provider 自包含**：不共享客户端实例，不互相依赖。每个 Provider 独立管理自身 SDK 客户端生命周期（懒加载 + DCL）
10. **日志使用 @Slf4j**：与现有代码风格一致，关键操作（上传/删除）使用 `log.debug`
11. **不要给 LocalStorageProvider 创建空目录**：仅在首次上传时 `Files.createDirectories()`

## 11. 边界情况

| 边界 | Provider | 处理方式 |
|------|----------|----------|
| 上传空文件（0 字节） | 全部 | 正常处理，fileSize=0，SDK 按正常流程走 |
| 文件名为 null | 全部 | `extractExt()` 返回空字符串，生成 `uuid` 无扩展名的 key |
| 文件名无扩展名 | 全部 | 同上，storageName = uuid（无后缀） |
| 同名文件上传 | 全部 | UUID 保证唯一性，旧文件不会被覆盖 |
| 下载不存在的文件 | Local | `Files.exists()` 检查，抛 `RuntimeException("文件不存在")` |
| 下载不存在的文件 | MinIO/COS/Qiniu | SDK 本身抛异常，由 `catch(Exception)` 包装为 RuntimeException |
| basePath 路径不存在 | Local | `Files.createDirectories()` 自动创建 |
| bucket 不存在 | MinIO | `ensureBucket()` 自动创建 |
| bucket 不存在 | COS/Qiniu | SDK 报错（需手动在控制台创建 bucket），包装为 RuntimeException |
| 配置缺失 | 全部 | `requireConfig()` 检查，抛 `IllegalStateException` |
| activeProvider 指向未注册类型 | Registry | `getActiveProvider()` 抛 `IllegalStateException` |
| 并发上传 | MinIO/COS | DCL 保证单例客户端，SDK 线程安全 |
| 大文件上传（>100MB） | 全部 | SDK 默认处理，调用方负责超时和异步包装（B3 Service 层处理） |
| 流关闭 | 全部 | 调用方负责关闭 InputStream（文档注释已标注） |

## 12. 风险和回滚方案

| 风险 | 概率 | 影响 | 缓解 |
|------|:--:|------|------|
| COS SDK 引入的传递依赖与已有依赖冲突 | 低 | 编译错误或运行时 NoClassDefFoundError | `mvn dependency:tree -pl sw-basic-storage-biz` 检查冲突，如有冲突在 pom 中 exclude |
| 七牛云 SDK 依赖 Gson（已在 SDK 中打包） | 低 | 版本冲突（Hutool 也用 Gson 内部逻辑） | 七牛云 SDK 自带 Gson 依赖，通常兼容。如有冲突，在 pom 中 exclude 七牛云的 Gson 并统一用 SDK 版本 |
| Qiniu SDK 的 `Response.bodyString()` 可能返回空 | 低 | NPE 在 `new Gson().fromJson()` | 上传后检查 `response.isOK()` 先确认 HTTP 200 |
| COS SDK 在无外网环境下 `mvn compile` 仍可通过 | 无风险 | 编译不依赖网络 | 仅运行时需要网络连接 COS 服务，编译不受影响 |

**回滚方案**：
- `git checkout` 恢复 `sw-dependencies/pom.xml`、`sw-basic-storage-biz/pom.xml`、`StorageAutoConfiguration.java`
- 删除 7 个新建文件
- `mvn -q compile` 确认回退成功

## 13. 测试方案

### 13.1 静态检查

```bash
# 1. 确认所有新建文件存在
ls sw-basic/sw-basic-storage/sw-basic-storage-api/src/main/java/com/sw/ck/storage/api/StorageUploadResult.java
ls sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/StorageProvider.java
ls sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/LocalStorageProvider.java
ls sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/MinioStorageProvider.java
ls sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/CosStorageProvider.java
ls sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/QiniuStorageProvider.java
ls sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/provider/StorageProviderRegistry.java

# 2. 确认 COS/Qiniu 版本属性已加入 BOM
grep "cos-api.version\|qiniu-sdk.version" sw-dependencies/pom.xml

# 3. 确认 COS/Qiniu 依赖管理已加入 BOM
grep "cos_api\|qiniu-java-sdk" sw-dependencies/pom.xml

# 4. 确认 -biz pom.xml 含 COS/Qiniu 依赖
grep "cos_api\|qiniu-java-sdk" sw-basic/sw-basic-storage/sw-basic-storage-biz/pom.xml

# 5. 确认 AutoConfiguration 含 @ComponentScan
grep "ComponentScan" sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java

# 6. 确认 StorageProvider 接口在 -biz（非 -api）
ls sw-basic/sw-basic-storage/sw-basic-storage-api/src/main/java/com/sw/ck/storage/api/StorageProvider.java 2>/dev/null && echo "错误：接口不应在 -api" || echo "正确：接口在 -biz"

# 7. 确认 StorageUploadResult 在 -api
grep "StorageUploadResult" sw-basic/sw-basic-storage/sw-basic-storage-api/src/main/java/com/sw/ck/storage/api/StorageUploadResult.java

# 8. 确认未修改禁止的文件
# （通过 git diff 确认仅有 3 个修改文件 + 7 个新建文件）
```

### 13.2 单元测试

本 Step 不强制要求单元测试（Provider 涉及外部 SDK/文件系统，单元测试需 Mock 外部依赖，留给 B4 统一写 Controller + Provider 集成测试）。

如果条件允许，可写 `LocalStorageProvider` 的纯 Java 单元测试（不依赖 Spring）：

```java
// 可选：测试 LocalStorageProvider
// - 上传文件 → 验证文件存在 + 内容一致
// - 下载文件 → 验证流可读 + 内容一致
// - 删除文件 → 验证文件不存在
// - getUrl → 验证 URL 格式正确
// - getType → 验证返回 "local"
```

本 Step 不做强制要求。

### 13.3 集成测试

不需集成测试。Provider 的端到端验证（启动 Spring 上下文 + 真实 SDK 调用）留给 B4。

### 13.4 手工验证

不需手工验证。

### 13.5 回归检查

```bash
cd Smart-WorkFlow && mvn -q test
# 预期：全量测试计数 ≥ 基线（B1 验收时确认的计数），无 FAILED/ERROR
# 注意：本 Step 无新增测试，全量测试计数不变
```

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|------|
| B2-1 | `sw-dependencies/pom.xml` 的 `<properties>` 含 `cos-api.version` 和 `qiniu-sdk.version` | grep |
| B2-2 | `sw-dependencies/pom.xml` 的 `<dependencyManagement>` 含 `com.qcloud:cos_api` 和 `com.qiniu:qiniu-java-sdk` | grep |
| B2-3 | `sw-basic-storage-biz/pom.xml` 含 `cos_api` 和 `qiniu-java-sdk` 依赖（无 `<version>`，由 BOM 管理） | 读文件 |
| B2-4 | `StorageUploadResult.java` 存在于 `-api` 模块，含 4 个字段（storageKey/storageName/storageUrl/fileSize），使用 Lombok `@Data @Builder` | ls + 读文件 |
| B2-5 | `StorageProvider.java` 存在于 `-biz/provider/`，含 5 个方法签名（upload/download/delete/getUrl/getType） | ls + 读文件 |
| B2-6 | `LocalStorageProvider.java` 存在于 `-biz/provider/`，`@Component`，`getType()` 返回 `"local"`，upload/download/delete/getUrl 为真实 `java.nio.file.Files` 实现 | 读文件 |
| B2-7 | `MinioStorageProvider.java` 存在于 `-biz/provider/`，`@Component`，`getType()` 返回 `"minio"`，upload/download/delete/getUrl 为真实 MinIO SDK 调用 | 读文件 |
| B2-8 | `CosStorageProvider.java` 存在于 `-biz/provider/`，`@Component`，`getType()` 返回 `"cos"`，upload/download/delete/getUrl 为真实 COS SDK 调用 | 读文件 |
| B2-9 | `QiniuStorageProvider.java` 存在于 `-biz/provider/`，`@Component`，`getType()` 返回 `"qiniu"`，upload/download/delete/getUrl 为真实七牛云 SDK 调用 | 读文件 |
| B2-10 | `StorageProviderRegistry.java` 存在于 `-biz/provider/`，`@Component`，构造注入 `List<StorageProvider>` + `StorageProperties`，含 `getActiveProvider()` / `getProvider(type)` / `getAvailableTypes()` | 读文件 |
| B2-11 | `StorageAutoConfiguration.java` 含 `@ComponentScan("com.sw.ck.storage.provider")`（与已有 `@MapperScan` 并存） | 读文件 |
| B2-12 | `mvn -q compile` 退出码 0（全工程） | 执行编译 |
| B2-13 | 无 `throw new UnsupportedOperationException("not implemented")` 出现在任何 Provider 的业务方法中 | grep |
| B2-14 | `mvn -q test` 全量测试通过，BUILD SUCCESS，无回归 | 执行测试 |

## 15. 执行回执格式

按 system.md §7.1 格式返回。特别注意附上以下关键证据：

- `mvn -q compile` 完整输出（退出码）
- `mvn -q test` 全量测试计数和 BUILD 结果
- 各新建文件和修改文件的存在性确认
- COS/Qiniu SDK 依赖是否成功解析的证据（dependency:tree 片段或编译无报错）
- Git diff 摘要

## 16. 测试回执格式

按 system.md §7.2 格式返回。本 Step 的测试回执必须逐条对照 §14 的 14 项验收标准，每项标注 PASS/FAIL + 证据。

## 17. 明确禁止事项

- ❌ **禁止将 StorageProvider 接口放在 -api 模块**（内部 SPI，非跨模块契约）
- ❌ **禁止用 `throw new UnsupportedOperationException` 占位**（每个 Provider 必须是真实实现）
- ❌ **禁止在 Provider 中操作数据库**（不注入 Mapper，不写 `StorageFile` 记录。元数据持久化留给 B3 Service 层）
- ❌ **禁止修改 StorageProperties.java**（配置结构已完整，B1 已验收）
- ❌ **禁止修改 StorageFacade.java**（B3 再补充方法签名）
- ❌ **禁止在 -biz pom 中为 COS/Qiniu 写 `<version>`**（版本由 sw-dependencies BOM 统一管理）
- ❌ **禁止在 Provider 中捕获异常后吞掉不抛出**（所有异常必须包装为 RuntimeException 向上传播）
- ❌ **禁止在 Provider 中写 `System.out.println`**（统一使用 `@Slf4j` + `log.debug/info/error`）
- ❌ **禁止修改 sw-basic-storage/pom.xml、sw-basic/pom.xml、sw-bootstrap/pom.xml**
- ❌ **禁止引入除 COS SDK 和 Qiniu SDK 之外的任何新第三方依赖**
- ❌ **禁止在 -api 模块引用第三方库**（StorageUploadResult 仅用 Lombok + JDK）
- ❌ **禁止创建 Controller、Service、FacadeImpl**（留给 B3）
- ❌ **禁止触碰前端项目**
