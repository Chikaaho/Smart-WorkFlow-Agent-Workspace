# Step B1：模块拆分与基础设施

## 1. 当前状态

- 功能状态：**PLANNING** → B1 为第一个 Step
- `sw-basic-storage` 当前是单模块，仅有 `MinioProperties.java` + 空 `StorageAutoConfiguration.java`
- 无实体、无 Mapper、无 Flyway 迁移、无 -api/-biz 拆分
- 前端零实现
- 前置 Step：无（此为首个 Step）

## 2. Step 目标

完成 `sw-basic-storage` 的 -api/-biz 模块拆分，建立数据模型（`sw_storage_file` 表 + Entity + Mapper），绑定多提供商 YAML 配置，点亮 StorageAutoConfiguration。

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：模块拆分、Flyway 建表、Entity/Mapper、配置绑定均为标准 CRUD 基础设施，无复杂业务逻辑
是否触发升级条件：否
```

## 4. 模型选择理由

本 Step 涉及的是工程结构变更（模块拆分）和标准数据层搭建（Flyway + Entity + Mapper），所有操作均有明确的现有模式可参照（sw-basic-notify 的 -api/-biz 拆分、已有 Entity 的 BaseEntity 继承、已有 Flyway 脚本的双方言写法），不涉及架构决策、安全边界或复杂并发处理。

## 5. 已知上下文

### 5.1 参照模块

- **sw-basic-notify** — 已完成 -api/-biz 拆分，Facade 接口在 -api，实现在 -biz。Storage 模块遵循相同模式。
- **sw-basic-notify 的 pom.xml** — 参照其 parent 指向、依赖声明方式。
- **sw-basic-notify 的 Flyway** — V9__init_notify_message.sql，位于 `db/migration/notify/{vendor}/`。

### 5.2 现有文件（需要变更）

| 文件 | 路径 | 当前状态 |
|------|------|------|
| MinioProperties.java | `sw-basic-storage/src/main/java/com/sw/ck/storage/config/MinioProperties.java` | 仅 MinIO 四个字段 |
| StorageAutoConfiguration.java | `sw-basic-storage/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java` | 空类，仅有 `@AutoConfiguration` 注解 |
| AutoConfiguration.imports | `sw-basic-storage/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` | 已注册 StorageAutoConfiguration |
| sw-basic/pom.xml | `sw-basic/pom.xml` | 含 module `sw-basic-storage`，需改为含两个子模块 |
| sw-basic-storage/pom.xml | `sw-basic/sw-basic-storage/pom.xml` | 当前为叶子模块 pom，需改为父 pom |
| sw-bootstrap/pom.xml | `sw-bootstrap/pom.xml` | 依赖 `sw-basic-storage`，需更新依赖坐标 |
| FlywayConfiguration.java | `sw-bootstrap/src/main/java/com/sw/ck/bootstrap/config/FlywayConfiguration.java` | 未注册 storage 迁移目录 |
| application.yml | `sw-bootstrap/src/main/resources/application.yml` | 仅有 minio.* 配置，需改为 sw.storage.* 多提供商结构 |
| application-dev.yml | `sw-bootstrap/src/main/resources/application-dev.yml` | 同上 |
| application-local.yml | `sw-bootstrap/src/main/resources/application-local.yml` | 同上 |

### 5.3 关键约束

- 表前缀：`sw_storage_`（`shared-constraints.md` §3.3 已分配）
- Flyway 双方言：H2 + PostgreSQL 两份脚本
- 动态宽表裸 SQL 红线：本模块不涉及动态宽表，但 `sw_storage_file` 走 MyBatis-Plus，拦截器正常生效
- Entity 继承 BaseEntity（tenant_id + deleted + version + 审计字段），非 BaseEntityNoTenant
- 文件元数据属于租户隔离数据
- 依赖方向：sw-basic-storage-biz → sw-basic-storage-api → sw-common，不可反向

## 6. 执行前必须读取的文件

按优先级排序：

1. **`Smart-WorkFlow/.claude/system.md`** — 后端工程宪法，特别是 §1（模块层次）、§3（表命名）、§6（Flyway）和 §5（BaseEntity 约束）
2. **`Smart-WorkFlow/sw-basic/sw-basic-notify/pom.xml`** — 参照 -api/-biz 拆分时 pom 配置
3. **`Smart-WorkFlow/sw-basic/sw-basic-notify/sw-basic-notify-api/pom.xml`** — 参照 -api 模块 pom
4. **`Smart-WorkFlow/sw-basic/sw-basic-notify/sw-basic-notify-biz/pom.xml`** — 参照 -biz 模块 pom
5. **`Smart-WorkFlow/sw-basic/pom.xml`** — 需要修改 module 列表
6. **`Smart-WorkFlow/sw-basic/sw-basic-storage/pom.xml`** — 当前 pom，需改造为父 pom
7. **`Smart-WorkFlow/sw-basic/sw-basic-storage/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java`** — 需改造
8. **`Smart-WorkFlow/sw-basic/sw-basic-storage/src/main/java/com/sw/ck/storage/config/MinioProperties.java`** — 需替换为 StorageProperties
9. **`Smart-WorkFlow/sw-bootstrap/src/main/java/com/sw/ck/bootstrap/config/FlywayConfiguration.java`** — 需新增 storage 迁移目录
10. **`Smart-WorkFlow/sw-bootstrap/src/main/resources/application.yml`** — 需改造 storage 配置段
11. **`Smart-WorkFlow/sw-bootstrap/src/main/resources/application-dev.yml`** — 需改造 storage 配置段
12. **`Smart-WorkFlow/sw-bootstrap/src/main/resources/application-local.yml`** — 需改造 storage 配置段
13. **`Smart-WorkFlow/sw-bootstrap/pom.xml`** — 需更新依赖坐标
14. **`Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntity.java`** — 确认字段签名
15. **`Smart-WorkFlow/sw-dependencies/pom.xml`** — 确认 MinIO 版本号（8.5.17）
16. **`Smart-WorkFlow/sw-basic/sw-basic-storage/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`** — AutoConfiguration 注册文件
17. **参考 Flyway 脚本**：`V9__init_notify_message.sql`（H2 和 PG 都读）作为双方言写法参照

## 7. 允许修改的文件范围

### 新建文件

| # | 文件 | 说明 |
|---|------|------|
| 1 | `sw-basic/sw-basic-storage/sw-basic-storage-api/pom.xml` | -api 模块 pom |
| 2 | `sw-basic/sw-basic-storage/sw-basic-storage-api/src/main/java/com/sw/ck/storage/api/StorageFacade.java` | Facade 接口（先定义空接口或仅含方法签名占位，B3 完善） |
| 3 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/pom.xml` | -biz 模块 pom |
| 4 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/entity/StorageFile.java` | 文件元数据实体 |
| 5 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/mapper/StorageFileMapper.java` | MyBatis-Plus Mapper 接口 |
| 6 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/config/StorageProperties.java` | 多提供商配置属性类 |
| 7 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java` | 新的 AutoConfiguration（从旧位置迁移） |
| 8 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` | 新位置注册文件 |
| 9 | `sw-bootstrap/src/main/resources/db/migration/storage/h2/V16__init_storage_file.sql` | H2 建表脚本 |
| 10 | `sw-bootstrap/src/main/resources/db/migration/storage/postgresql/V16__init_storage_file.sql` | PostgreSQL 建表脚本 |

### 修改文件

| # | 文件 | 变更内容 |
|---|------|------|
| 1 | `sw-basic/sw-basic-storage/pom.xml` | 从叶子 pom 改为父 pom（packaging=pom，module 列表含 -api 和 -biz） |
| 2 | `sw-basic/pom.xml` | module 从 `sw-basic-storage` 改为 `sw-basic-storage/sw-basic-storage-api` 和 `sw-basic-storage/sw-basic-storage-biz` |
| 3 | `sw-bootstrap/pom.xml` | 更新 storage 依赖坐标：`sw-basic-storage` → `sw-basic-storage-biz` |
| 4 | `sw-bootstrap/src/main/java/com/sw/ck/bootstrap/config/FlywayConfiguration.java` | 新增 `db/migration/storage/{vendor}` 到 locations 列表 |
| 5 | `sw-bootstrap/src/main/resources/application.yml` | 将 `minio.*` 配置改为 `sw.storage.*` 多提供商结构，设置 `sw.storage.enabled: true` |
| 6 | `sw-bootstrap/src/main/resources/application-dev.yml` | 同上 |
| 7 | `sw-bootstrap/src/main/resources/application-local.yml` | 同上 |

### 删除文件

| # | 文件 | 原因 |
|---|------|------|
| 1 | `sw-basic/sw-basic-storage/src/main/java/com/sw/ck/storage/config/MinioProperties.java` | 替换为 StorageProperties（在 -biz 中） |
| 2 | `sw-basic/sw-basic-storage/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java` | 迁移到 -biz 模块中 |
| 3 | `sw-basic/sw-basic-storage/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` | 迁移到 -biz 模块中 |
| 4 | `sw-basic/sw-basic-storage/src/main/resources/db/migration/storage/.gitkeep` | 迁移目录挪到 sw-bootstrap 下，此文件不再需要 |

## 8. 禁止修改的范围

- ❌ 不修改 `sw-common`、`sw-security`、`sw-framework` 下任何文件
- ❌ 不修改 `sw-biz-system`、`sw-biz-form`、`sw-bpm`、`sw-basic-notify`、`sw-basic-job`、`sw-basic-iot`、`sw-basic-knowledge`、`sw-basic-agent`、`sw-biz-openapi` 下任何文件
- ❌ 不修改 `sw-dependencies/pom.xml`（MinIO 版本 8.5.17 已就位，无需变更）
- ❌ 不修改已有 Flyway 迁移脚本（V1-V15）
- ❌ 不触碰前端项目
- ❌ 不在本 Step 中实现任何业务逻辑（Provider/Service/Controller 留给 B2/B3）

## 9. 详细执行方案

### 9.1 读取参照文件

先读取以下参照文件确认模式：

- `sw-basic/sw-basic-notify/pom.xml`
- `sw-basic/sw-basic-notify/sw-basic-notify-api/pom.xml`
- `sw-basic/sw-basic-notify/sw-basic-notify-biz/pom.xml`
- `sw-basic/pom.xml`
- `sw-bootstrap/pom.xml`
- `sw-bootstrap/src/main/java/com/sw/ck/bootstrap/config/FlywayConfiguration.java`
- `sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntity.java`
- `application.yml`
- `application-dev.yml`
- `application-local.yml`
- V9 Flyway 脚本（H2 + PG）作为双方言写法参照

### 9.2 改造 pom 链

#### 9.2.1 改造 `sw-basic/sw-basic-storage/pom.xml`（叶子 → 父 pom）

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.sw.ck</groupId>
        <artifactId>sw-basic</artifactId>
        <version>${revision}</version>
        <relativePath>../../pom.xml</relativePath>
    </parent>

    <artifactId>sw-basic-storage</artifactId>
    <packaging>pom</packaging>
    <name>sw-basic-storage</name>
    <description>文件存储模块父 POM（多向可配置：本地 / MinIO / COS / 七牛云）</description>

    <modules>
        <module>sw-basic-storage-api</module>
        <module>sw-basic-storage-biz</module>
    </modules>
</project>
```

- 将 `<packaging>` 改为 `pom`
- 删除原有 `<dependencies>` 块
- 添加 `<modules>` 列表

#### 9.2.2 新建 `sw-basic-storage-api/pom.xml`

参照 `sw-basic-notify-api/pom.xml` 的模式：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.sw.ck</groupId>
        <artifactId>sw-basic-storage</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>sw-basic-storage-api</artifactId>
    <name>sw-basic-storage-api</name>
    <description>文件存储模块 API（Facade 接口 + DTO）</description>

    <dependencies>
        <dependency>
            <groupId>com.sw.ck</groupId>
            <artifactId>sw-common</artifactId>
        </dependency>
    </dependencies>
</project>
```

#### 9.2.3 新建 `sw-basic-storage-biz/pom.xml`

参照 `sw-basic-notify-biz/pom.xml` 的模式：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.sw.ck</groupId>
        <artifactId>sw-basic-storage</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>sw-basic-storage-biz</artifactId>
    <name>sw-basic-storage-biz</name>
    <description>文件存储模块实现（Entity/Mapper/Service/Controller/Provider）</description>

    <dependencies>
        <dependency>
            <groupId>com.sw.ck</groupId>
            <artifactId>sw-basic-storage-api</artifactId>
        </dependency>
        <dependency>
            <groupId>com.sw.ck</groupId>
            <artifactId>sw-common</artifactId>
        </dependency>
        <dependency>
            <groupId>io.minio</groupId>
            <artifactId>minio</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```

#### 9.2.4 修改 `sw-basic/pom.xml`

找到 `<modules>` 块，将：
```xml
<module>sw-basic-storage</module>
```
改为：
```xml
<module>sw-basic-storage/sw-basic-storage-api</module>
<module>sw-basic-storage/sw-basic-storage-biz</module>
```

如果已有 `<module>sw-basic-storage</module>` 则替换为上述两行。

#### 9.2.5 修改 `sw-bootstrap/pom.xml`

找到 `sw-basic-storage` 依赖声明，将 artifactId 从 `sw-basic-storage` 改为 `sw-basic-storage-biz`：

```xml
<dependency>
    <groupId>com.sw.ck</groupId>
    <artifactId>sw-basic-storage-biz</artifactId>
</dependency>
```

### 9.3 新建 Entity、Mapper 和 StorageFacade 占位

#### 9.3.1 StorageFacade 接口（-api 模块）

包路径：`com.sw.ck.storage.api`

```java
package com.sw.ck.storage.api;

/**
 * 文件存储 Facade 接口。
 * <p>
 * 供其他模块（form/bpm/notify/knowledge）通过 Facade 模式调用文件存储能力。
 * 方法签名在 B3 中完善，当前仅定义接口骨架。
 */
public interface StorageFacade {
    // B3 中补充方法签名
}
```

#### 9.3.2 StorageFile Entity（-biz 模块）

包路径：`com.sw.ck.storage.entity`

```java
package com.sw.ck.storage.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.sw.ck.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 文件元数据实体。
 * <p>
 * 记录每次上传操作的文件元数据，与物理存储层解耦。
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sw_storage_file")
public class StorageFile extends BaseEntity {

    /** 原始文件名（上传时的文件名） */
    private String originalName;

    /** 存储 key/路径（provider 内部定位文件的唯一标识） */
    private String storageKey;

    /** 存储后文件名（可能与原始名不同，如 UUID 重命名） */
    private String storageName;

    /** 文件大小（字节） */
    private Long fileSize;

    /** MIME 类型（如 image/png、application/pdf） */
    private String contentType;

    /** 文件扩展名（不含点，如 "png"、"pdf"） */
    private String fileExt;

    /** 存储提供商类型：LOCAL / MINIO / COS / QINIU */
    private String providerType;

    /** bucket 名称或本地目录名 */
    private String bucketName;

    /** 完整访问 URL（如可公开访问）或 null（需通过 API 下载） */
    private String storageUrl;
}
```

注意：`BaseEntity` 已提供 `id`（Long，雪花算法）、`tenantId`、`deleted`、`version`、`createTime`、`createBy`、`updateTime`、`updateBy`，不需要在 StorageFile 中重复定义。

#### 9.3.3 StorageFileMapper（-biz 模块）

包路径：`com.sw.ck.storage.mapper`

```java
package com.sw.ck.storage.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sw.ck.storage.entity.StorageFile;
import org.apache.ibatis.annotations.Mapper;

/**
 * 文件元数据 Mapper。
 */
@Mapper
public interface StorageFileMapper extends BaseMapper<StorageFile> {
}
```

### 9.4 新建 StorageProperties（替换 MinioProperties）

包路径：`com.sw.ck.storage.config`（在 -biz 模块中）

使用 Spring Boot `@ConfigurationProperties` 绑定多提供商配置：

```java
package com.sw.ck.storage.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.Map;

/**
 * 文件存储多提供商配置属性。
 *
 * <p>YAML 结构示例：
 * <pre>{@code
 * sw:
 *   storage:
 *     enabled: true
 *     active-provider: minio
 *     providers:
 *       local:
 *         base-path: ./uploads
 *         url-prefix: /files
 *       minio:
 *         url: http://localhost:9000
 *         access-key: minioadmin
 *         secret-key: minioadmin
 *         bucket: smart-workflow
 *       cos:
 *         secret-id: xxx
 *         secret-key: xxx
 *         region: ap-guangzhou
 *         bucket: smart-workflow-1234567890
 *       qiniu:
 *         access-key: xxx
 *         secret-key: xxx
 *         bucket: smart-workflow
 *         domain: http://xxx.clouddn.com
 * }</pre>
 */
@Data
@ConfigurationProperties(prefix = "sw.storage")
public class StorageProperties {

    /** 是否启用存储模块（默认 false） */
    private boolean enabled = false;

    /** 当前激活的存储提供商：local / minio / cos / qiniu */
    private String activeProvider = "local";

    /** 各提供商配置 */
    private Map<String, ProviderConfig> providers = new HashMap<>();

    @Data
    public static class ProviderConfig {
        // --- 本地存储 ---
        private String basePath;
        private String urlPrefix;

        // --- MinIO ---
        private String url;
        private String accessKey;
        private String secretKey;
        private String bucket;

        // --- 腾讯云 COS ---
        private String secretId;
        // secretKey 复用上面的
        private String region;

        // --- 七牛云 ---
        // accessKey / secretKey 复用上面的
        private String domain;
    }
}
```

### 9.5 改造 StorageAutoConfiguration（迁移到 -biz）

删除旧位置文件（`sw-basic-storage/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java`）。

在 -biz 模块中新建：

```java
package com.sw.ck.storage.config;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;

/**
 * 文件存储自动配置。
 * <p>
 * 通过 sw.storage.enabled=true 激活（默认关闭）。
 * 组件扫描覆盖 storage 模块的 Service/Controller/Mapper。
 */
@AutoConfiguration
@ConditionalOnProperty(prefix = "sw.storage", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(StorageProperties.class)
@ComponentScan(basePackages = "com.sw.ck.storage")
public class StorageAutoConfiguration {
}
```

同步迁移 `AutoConfiguration.imports` 文件到 `sw-basic-storage-biz/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports`，内容不变：
```
com.sw.ck.storage.config.StorageAutoConfiguration
```

### 9.6 修改 FlywayConfiguration（注册 storage 迁移目录）

文件：`sw-bootstrap/src/main/java/com/sw/ck/bootstrap/config/FlywayConfiguration.java`

找到 `locations` 配置处，在现有列表中追加 `classpath:db/migration/storage/{vendor}`。

例如，如果当前代码为：
```java
locations.add("classpath:db/migration/{vendor}");
locations.add("classpath:db/migration/bpm/{vendor}");
locations.add("classpath:db/migration/notify/{vendor}");
locations.add("classpath:db/migration/form/{vendor}");
```

追加一行：
```java
locations.add("classpath:db/migration/storage/{vendor}");
```

### 9.7 编写 Flyway V16 建表脚本

#### 9.7.1 PostgreSQL 版本

文件：`sw-bootstrap/src/main/resources/db/migration/storage/postgresql/V16__init_storage_file.sql`

```sql
-- ============================================================
-- V16: 文件存储模块 — 文件元数据表
-- 表前缀: sw_storage_（sw-basic-storage 模块）
-- ============================================================

CREATE TABLE sw_storage_file
(
    id            BIGINT       NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    storage_key   VARCHAR(512) NOT NULL,
    storage_name  VARCHAR(255),
    file_size     BIGINT       DEFAULT 0,
    content_type  VARCHAR(128),
    file_ext      VARCHAR(32),
    provider_type VARCHAR(32)  NOT NULL,
    bucket_name   VARCHAR(128),
    storage_url   VARCHAR(1024),
    create_time   TIMESTAMP    NOT NULL,
    create_by     BIGINT,
    update_time   TIMESTAMP,
    update_by     BIGINT,
    deleted       INT          DEFAULT 0,
    tenant_id     BIGINT       NOT NULL,
    version       BIGINT       DEFAULT 0,
    CONSTRAINT pk_sw_storage_file PRIMARY KEY (id)
);

COMMENT ON TABLE sw_storage_file IS '文件元数据';
COMMENT ON COLUMN sw_storage_file.id IS '主键';
COMMENT ON COLUMN sw_storage_file.original_name IS '原始文件名';
COMMENT ON COLUMN sw_storage_file.storage_key IS '存储 key/路径';
COMMENT ON COLUMN sw_storage_file.storage_name IS '存储后文件名';
COMMENT ON COLUMN sw_storage_file.file_size IS '文件大小（字节）';
COMMENT ON COLUMN sw_storage_file.content_type IS 'MIME 类型';
COMMENT ON COLUMN sw_storage_file.file_ext IS '文件扩展名';
COMMENT ON COLUMN sw_storage_file.provider_type IS '存储提供商：LOCAL/MINIO/COS/QINIU';
COMMENT ON COLUMN sw_storage_file.bucket_name IS 'bucket 或目录名';
COMMENT ON COLUMN sw_storage_file.storage_url IS '访问 URL';
COMMENT ON COLUMN sw_storage_file.deleted IS '逻辑删除标记';
COMMENT ON COLUMN sw_storage_file.tenant_id IS '租户 ID';
COMMENT ON COLUMN sw_storage_file.version IS '乐观锁版本';

-- 租户隔离 + 逻辑删除常用查询索引
CREATE INDEX idx_sw_storage_file_tenant_deleted ON sw_storage_file (tenant_id, deleted);
```

#### 9.7.2 H2 版本

文件：`sw-bootstrap/src/main/resources/db/migration/storage/h2/V16__init_storage_file.sql`

```sql
-- ============================================================
-- V16: 文件存储模块 — 文件元数据表 (H2)
-- ============================================================

CREATE TABLE sw_storage_file
(
    id            BIGINT       NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    storage_key   VARCHAR(512) NOT NULL,
    storage_name  VARCHAR(255),
    file_size     BIGINT       DEFAULT 0,
    content_type  VARCHAR(128),
    file_ext      VARCHAR(32),
    provider_type VARCHAR(32)  NOT NULL,
    bucket_name   VARCHAR(128),
    storage_url   VARCHAR(1024),
    create_time   TIMESTAMP    NOT NULL,
    create_by     BIGINT,
    update_time   TIMESTAMP,
    update_by     BIGINT,
    deleted       INT          DEFAULT 0,
    tenant_id     BIGINT       NOT NULL,
    version       BIGINT       DEFAULT 0,
    CONSTRAINT pk_sw_storage_file PRIMARY KEY (id)
);

CREATE INDEX idx_sw_storage_file_tenant_deleted ON sw_storage_file (tenant_id, deleted);
```

### 9.8 改造 application.yml 配置

#### 9.8.1 application.yml

找到 `minio:` 配置块（约第 97-102 行），**替换**为：

```yaml
  # ======================== 文件存储（多提供商可配置） ========================
  sw:
    storage:
      enabled: true
      active-provider: minio
      providers:
        local:
          base-path: ./uploads
          url-prefix: /files
        minio:
          url: http://localhost:9000
          access-key: ${MINIO_ACCESS_KEY:}
          secret-key: ${MINIO_SECRET_KEY:}
          bucket: smart-workflow
        cos:
          secret-id: ${COS_SECRET_ID:}
          secret-key: ${COS_SECRET_KEY:}
          region: ap-guangzhou
          bucket: ${COS_BUCKET:}
        qiniu:
          access-key: ${QINIU_ACCESS_KEY:}
          secret-key: ${QINIU_SECRET_KEY:}
          bucket: ${QINIU_BUCKET:}
          domain: ${QINIU_DOMAIN:}
```

#### 9.8.2 application-dev.yml

找到 `minio:` 配置块，**替换**为：

```yaml
  sw:
    storage:
      active-provider: local
      providers:
        local:
          base-path: ./uploads
          url-prefix: /files
        minio:
          access-key: ${MINIO_ACCESS_KEY:minioadmin}
          secret-key: ${MINIO_SECRET_KEY:minioadmin}
```

注意：dev 环境默认使用 `local` 提供商，不依赖外部 MinIO 服务。

#### 9.8.3 application-local.yml

找到 `minio:` 配置块，**替换**为：

```yaml
  sw:
    storage:
      active-provider: minio
      providers:
        local:
          base-path: ./uploads
          url-prefix: /files
        minio:
          access-key: ${MINIO_ACCESS_KEY:minioadmin}
          secret-key: ${MINIO_SECRET_KEY:minioadmin}
```

### 9.9 验证

执行以下命令验证模块拆分和编译：

```bash
cd Smart-WorkFlow
mvn -q compile
```

预期结果：BUILD SUCCESS，所有模块编译通过，新模块被正确解析。

## 10. 关键实现约束

1. **继承 BaseEntity，非 BaseEntityNoTenant**：文件属于租户数据，需要 `tenant_id` 列
2. **Flyway 双方言**：H2 和 PostgreSQL 两份 V16 脚本，逻辑等价。H2 版不写 `COMMENT ON` 语句
3. **Flyway 版本号**：使用 V16，不与已有 V1-V15 冲突
4. **pom packaging**：`sw-basic-storage` 父 pom 必须是 `<packaging>pom</packaging>`，不能是 `jar`
5. **AutoConfiguration.imports 迁移**：旧文件删除，新文件内容不变但路径移到 -biz 模块
6. **ComponentScan 范围**：`@ComponentScan(basePackages = "com.sw.ck.storage")` 确保扫描到 -biz 下的所有组件
7. **旧 MinioProperties.java 必须删除**：不保留两份 properties 类，避免 `@ConfigurationProperties` 前缀冲突
8. **配置中 `enabled: true` 只在 application.yml 中设置**：dev/local 的 profile 只覆盖 `active-provider` 和密钥，不重复设置 enabled
9. **模块间依赖**：-biz → -api → sw-common，不反向。Controller 放在 -biz（Spring 扫描），Facade 接口放在 -api

## 11. 边界情况

- **空 provider 配置**：`StorageProperties.providers` 默认为空 Map，`getProviderConfig(type)` 返回 null 时 Service 层应给出明确错误提示（B3 处理）
- **activeProvider 指向不存在的 provider**：B3 中校验 activeProvider 是否在 providers Map 中存在
- **tenant_id 为 null**：`BaseEntity` 通过 MetaObjectHandler 自动填充，INSERT 时从 `LoginUserHolder` 获取。无登录态时（如定时任务调用）需手动 set
- **V16 与已有迁移冲突**：验证 V16 未在任何 Flyway 历史表中存在。如果 `flyway_schema_history` 已含 V16，跳过此迁移（幂等）
- **H2 不支持 COMMENT ON**：H2 脚本省略 COMMENT ON 语句，只保留建表和索引

## 12. 风险和回滚方案

| 风险 | 概率 | 影响 | 缓解 |
|------|:--:|------|------|
| pom 重构导致依赖传递断裂 | 中 | sw-bootstrap 编译失败 | 先在分支执行，`mvn -q compile` 验证 |
| Flyway 迁移目录未注册导致表不创建 | 低 | 启动后查不到 `sw_storage_file` 表 | FlywayConfiguration 修改后可启动验证 |
| 旧 MinioProperties 被其他模块引用 | 低 | 编译错误 | 搜索 `MinioProperties` 全仓库引用，确认只有 storage 模块使用（勘察已确认无双击） |
| application.yml 缩进错误 | 低 | 配置解析失败 | 严格使用 2 空格缩进（与现有 YAML 一致） |

**回滚方案**：
- `git checkout` 恢复所有修改文件
- 如果 Flyway 迁移已执行（V16 在 `flyway_schema_history` 中），需手动 `DELETE FROM flyway_schema_history WHERE version='16'` + `DROP TABLE sw_storage_file`

## 13. 测试方案

### 13.1 静态检查

```bash
# 1. 确认 MinioProperties 旧类已删除
grep -r "MinioProperties" Smart-WorkFlow/sw-basic/ --include="*.java"
# 预期：零命中（只在 -biz 的 StorageProperties.java 中无此名）

# 2. 确认旧 AutoConfiguration.imports 已删除
ls Smart-WorkFlow/sw-basic/sw-basic-storage/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports 2>/dev/null
# 预期：文件不存在

# 3. 确认新 AutoConfiguration.imports 存在
ls Smart-WorkFlow/sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
# 预期：文件存在

# 4. 确认 sw_storage_file 表 SQL 脚本存在
ls Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/storage/h2/V16__init_storage_file.sql
ls Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/storage/postgresql/V16__init_storage_file.sql
# 预期：两个文件均存在

# 5. 确认 FlywayConfiguration 含 storage 目录
grep "storage" Smart-WorkFlow/sw-bootstrap/src/main/java/com/sw/ck/bootstrap/config/FlywayConfiguration.java
# 预期：命中 "db/migration/storage/{vendor}"

# 6. 编译验证
cd Smart-WorkFlow && mvn -q compile
# 预期：退出码 0，BUILD SUCCESS
```

### 13.2 单元测试

本 Step 为基础设施搭建，Entity/Mapper 不单独写单元测试（无业务逻辑）。MyBatis-Plus BaseMapper 的 CRUD 在 B4 Controller 测试中通过 Mock 间接覆盖。

如果 `StorageProperties` 的配置绑定逻辑较复杂，可写简单测试用例验证属性绑定：

```java
// 可选：验证 @ConfigurationProperties 绑定正确
@Test
void testStoragePropertiesBinding() {
    StorageProperties props = new StorageProperties();
    // ... 验证 getter/setter
}
```

本 Step 不做强制要求。

### 13.3 集成测试

不需集成测试。Flyway 迁移的集成验证在 B3/B4 中通过启动应用验证。

### 13.4 手工验证

不需手工验证。

### 13.5 回归检查

```bash
cd Smart-WorkFlow && mvn -q test
# 预期：全量测试计数 ≥ 308（基线），无 FAILED/ERROR
# 注意：新增模块无测试，全量测试计数不变
```

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|------|
| B1-1 | `sw-basic-storage` pom 的 `<packaging>` 为 `pom`，含 `<modules>` 含 `sw-basic-storage-api` 和 `sw-basic-storage-biz` | 读 pom.xml |
| B1-2 | `sw-basic-storage-api/pom.xml` 存在，依赖 `sw-common` | ls + 读文件 |
| B1-3 | `sw-basic-storage-biz/pom.xml` 存在，依赖 `sw-basic-storage-api`、`sw-common`、`io.minio:minio` | ls + 读文件 |
| B1-4 | `sw-basic/pom.xml` 的 `<modules>` 含 `sw-basic-storage/sw-basic-storage-api` 和 `sw-basic-storage/sw-basic-storage-biz`（不是旧的 `sw-basic-storage`） | 读 pom.xml |
| B1-5 | `sw-bootstrap/pom.xml` 中 storage 依赖 artifactId 为 `sw-basic-storage-biz` | 读 pom.xml |
| B1-6 | `StorageProperties.java` 存在于 `-biz` 模块 `config` 包，`@ConfigurationProperties(prefix = "sw.storage")` | ls + 读文件 |
| B1-7 | `MinioProperties.java` 已删除（旧路径不存在） | `ls` 确认文件不存在 |
| B1-8 | `StorageAutoConfiguration.java` 存在于 `-biz` 模块，含 `@ConditionalOnProperty(prefix = "sw.storage", name = "enabled", havingValue = "true")` + `@EnableConfigurationProperties(StorageProperties.class)` + `@ComponentScan(basePackages = "com.sw.ck.storage")` | 读文件 |
| B1-9 | `AutoConfiguration.imports` 新位置存在（`-biz/src/main/resources/META-INF/spring/`），旧位置已删除 | ls 确认 |
| B1-10 | `StorageFile.java` 存在于 `-biz` 模块 `entity` 包，`extends BaseEntity`，`@TableName("sw_storage_file")`，含 10 个字段（originalName/storageKey/storageName/fileSize/contentType/fileExt/providerType/bucketName/storageUrl + BaseEntity 继承的 8 个） | 读文件 |
| B1-11 | `StorageFileMapper.java` 存在于 `-biz` 模块 `mapper` 包，`extends BaseMapper<StorageFile>`，`@Mapper` | 读文件 |
| B1-12 | `StorageFacade.java` 存在于 `-api` 模块 `com.sw.ck.storage.api` 包 | ls |
| B1-13 | V16 Flyway 迁移存在：`db/migration/storage/h2/V16__init_storage_file.sql` 和 `postgresql/V16__init_storage_file.sql`，均含 `CREATE TABLE sw_storage_file` + `tenant_id` + `deleted` + `idx_sw_storage_file_tenant_deleted` | 读文件 |
| B1-14 | `FlywayConfiguration.java` 含 `db/migration/storage/{vendor}` | grep 确认 |
| B1-15 | `application.yml` 中 `sw.storage.enabled: true`，含 `active-provider` + `providers.local/minio/cos/qiniu` 配置段，旧的独立 `minio:` 块已删除 | grep + 读文件 |
| B1-16 | `application-dev.yml` 中 `sw.storage.active-provider: local`，`application-local.yml` 中 `sw.storage.active-provider: minio` | grep + 读文件 |
| B1-17 | `mvn -q compile` 退出码 0（全工程） | 执行编译 |
| B1-18 | `mvn -q test` 全量测试计数 ≥ 308（基线不变），BUILD SUCCESS | 执行测试 |

## 15. 执行回执格式

按 system.md §7.1 格式返回。特别注意附上以下关键证据：

- `mvn -q compile` 完整输出（退出码 + 最后 20 行）
- `mvn -q test` 全量测试计数和 BUILD 结果
- 各新建文件的存在性确认
- 各删除文件的消失确认
- Git diff 摘要

## 16. 测试回执格式

按 system.md §7.2 格式返回。本 Step 的测试回执可以与执行回执合并（基础设施 Step 无独立测试文件），但验收标准中 B1-17 和 B1-18 必须在回执中有命令输出证据。

## 17. 明确禁止事项

- ❌ **禁止在本 Step 中实现任何存储业务逻辑**（上传/下载/删除/列表代码留给 B2+B3）
- ❌ **禁止在本 Step 中引入 COS/Qiniu SDK 依赖**（B2 再加）
- ❌ **禁止修改已有 Flyway 脚本**（V1-V15 不动）
- ❌ **禁止删除旧文件后不验证编译**（必须先 `mvn -q compile` 确认）
- ❌ **禁止在 -api 模块中引用任何第三方库**（仅依赖 sw-common）
- ❌ **禁止直接复制 notify 的 pom 而不调整 artifactId 和依赖**
- ❌ **禁止在 H2 脚本中写 `COMMENT ON` 语句**
- ❌ **禁止将 Controller 或 Service 放在 -api 模块**（api 只放 Facade 接口 + DTO）
- ❌ **禁止跳过 FlywayConfiguration 修改**（否则迁移目录不生效）
- ❌ **禁止保留旧 `minio:` 独立配置段**（必须全部替换为 `sw.storage.*` 结构）
