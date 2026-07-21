# Step B1：模块拆分 + Flyway + Entity + Mapper + Quartz 配置就位

## 1. 当前状态

- **功能**：job-scheduler（定时任务调度模块），第 1/7 Step
- **前置 Step**：无（本功能第一个 Step）
- **后端现状**：`sw-basic-job` 为单模块骨架，仅有 `JobAutoConfiguration`（`@ConditionalOnProperty` 占位）和 `package-info.java`
- **前端现状**：`modules/job/` 目录不存在，零代码
- **Quartz 依赖**：未纳入 BOM 管理，未在任何模块引入
- **Flyway**：最新迁移版本为 V16（storage），V17 为下一可用版本号

## 2. Step 目标

将 `sw-basic-job` 拆分为 `-api`/`-biz` 两模块，创建 `sw_job_info` 和 `sw_job_log` 两张业务表（Flyway V17），定义 Entity + Mapper，引入 Quartz 依赖，完成基础配置就位和编译验证。

## 3. 推荐模型

推荐模型：deepseek-v4-flash
选择理由：标准 CRUD 基础设施 + 参照已有模式机械实现，无复杂架构决策。
是否触发升级条件：否

## 4. 模型选择理由

本 Step 为标准的模块拆分、Flyway 建表、Entity/Mapper 编写，所有模式均有明确参照（storage B1 的拆分流、notify 的 Entity/Mapper 结构），属于 Flash 标准工作范围。

## 5. 已知上下文

### 5.1 模块拆分模式（参照 storage-multi-provider B1）

- 父 POM（`sw-basic-job/`）从单 jar 改为聚合 POM（`<packaging>pom</packaging>`），含两个子模块
- `-api`：放 Facade 接口、DTO/Command 对象。依赖 `sw-common`
- `-biz`：放 Entity、Mapper、Service、Controller、AutoConfiguration、Flyway 脚本。依赖 `-api` + `sw-common` + `sw-security`

### 5.2 架构约束（来自后端 CLAUDE.md §10）

- **表前缀**：`sw_job_`（属于枚举表前缀，合法）
- **任务类型**：`BEAN`（bean_name + params）和 `FLOW`（flow_def_key + form_data），共用同一套调度基础设施
- **单节点**：Quartz RAMJobStore，集群升级路径预留
- **FLOW 任务**：到点发领域事件 `ScheduledFlowTriggerEvent`，不硬编码流程逻辑
- **job 不依赖 workflow 的 `-biz`**

### 5.3 表结构定义（来自后端 CLAUDE.md §10）

**sw_job_info**：
- `job_type`：BEAN / FLOW
- `cron`：Cron 表达式
- `status`：任务状态（启用/停用）
- `concurrent` / `misfire` 策略
- BEAN 类型存 `bean_name` + `params`
- FLOW 类型存 `flow_def_key` + `form_data`(JSON)

**sw_job_log**：
- `job_id`：关联 sw_job_info.id
- 起止时间、状态、耗时、结果/异常、触发方式

### 5.4 Flyway 约定

- 双方言：H2 + PostgreSQL 各一份，内容逐字节等价（H2 无 COMMENT ON）
- 放 `sw-bootstrap/src/main/resources/db/migration/job/{vendor}/`
- `application.yml` flyway.locations 需要追加 `classpath:db/migration/job/{vendor}`
- 迁移版本号：V17

### 5.5 配置约定

- AutoConfiguration 使用 `@ConditionalOnProperty(prefix = "sw.job", name = "enabled", havingValue = "true")`
- `sw.job.enabled=true` 需加入 `application.yml` 和 `application-dev.yml`

### 5.6 包名约定

- `com.sw.ck.job` 为模块根包名

## 6. 执行前必须读取的文件

按优先级排列：

1. `Smart-WorkFlow/sw-basic/sw-basic-job/pom.xml` — 当前单模块 POM，需改造为聚合 POM
2. `Smart-WorkFlow/sw-basic/sw-basic-job/src/main/java/com/sw/ck/job/config/JobAutoConfiguration.java` — 当前骨架配置，需增强
3. `Smart-WorkFlow/sw-basic/sw-basic-storage/pom.xml` — 聚合 POM 参照
4. `Smart-WorkFlow/sw-basic/sw-basic-storage/sw-basic-storage-api/pom.xml` — -api POM 参照
5. `Smart-WorkFlow/sw-basic/sw-basic-storage/sw-basic-storage-biz/pom.xml` — -biz POM 参照
6. `Smart-WorkFlow/sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/entity/StorageFile.java` — Entity 参照
7. `Smart-WorkFlow/sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/config/StorageAutoConfiguration.java` — AutoConfiguration 参照
8. `Smart-WorkFlow/sw-basic/pom.xml` — sw-basic 父 POM（modules 列表需更新）
9. `Smart-WorkFlow/sw-bootstrap/pom.xml` — 启动模块依赖（需从 `sw-basic-job` 改为 `sw-basic-job-biz`）
10. `Smart-WorkFlow/sw-bootstrap/src/main/resources/application.yml` — 主配置（Flyway locations + sw.job.enabled）
11. `Smart-WorkFlow/sw-bootstrap/src/main/resources/application-dev.yml` — dev 配置
12. `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/storage/postgresql/V16__init_storage_file.sql` — 最新 Flyway PG 参照
13. `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/storage/h2/V16__init_storage_file.sql` — 最新 Flyway H2 参照
14. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntity.java` — 基类（含 tenantId）
15. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/mapper/BaseMapperX.java` — Mapper 基类

## 7. 允许修改的文件范围

### 新建文件（13 个）

| # | 文件 | 说明 |
|---|------|------|
| 1 | `sw-basic/sw-basic-job/sw-basic-job-api/pom.xml` | -api 模块 POM |
| 2 | `sw-basic/sw-basic-job/sw-basic-job-api/src/main/java/com/sw/ck/job/package-info.java` | -api 包描述 |
| 3 | `sw-basic/sw-basic-job/sw-basic-job-biz/pom.xml` | -biz 模块 POM |
| 4 | `sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/package-info.java` | -biz 包描述 |
| 5 | `sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/entity/JobInfo.java` | 任务定义实体 |
| 6 | `sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/entity/JobLog.java` | 任务执行日志实体 |
| 7 | `sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/mapper/JobInfoMapper.java` | JobInfo Mapper |
| 8 | `sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/mapper/JobLogMapper.java` | JobLog Mapper |
| 9 | `sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/config/JobProperties.java` | Quartz 配置属性类 |
| 10 | `sw-bootstrap/src/main/resources/db/migration/job/postgresql/V17__init_job_tables.sql` | Flyway PG 迁移 |
| 11 | `sw-bootstrap/src/main/resources/db/migration/job/h2/V17__init_job_tables.sql` | Flyway H2 迁移 |
| 12 | `sw-basic/sw-basic-job/sw-basic-job-biz/src/main/resources/db/migration/job/h2/V17__init_job_tables.sql` | （备选位置） |
| 13 | （不需要） | — |

> **注意**：Flyway 迁移脚本必须放在 `sw-bootstrap/src/main/resources/db/migration/job/{vendor}/` 目录下，因为 Flyway 主迁移只扫描 `sw-bootstrap` 的 classpath，不扫描子模块的 classpath。

### 修改文件（6 个）

| # | 文件 | 改动 |
|---|------|------|
| 1 | `sw-basic/sw-basic-job/pom.xml` | 单 jar → 聚合 POM（`<packaging>pom</packaging>`，含两个 `<module>`） |
| 2 | `sw-basic/pom.xml` | `<modules>` 中 `sw-basic-job` 拆为 `sw-basic-job-api` + `sw-basic-job-biz` |
| 3 | `sw-basic/sw-basic-job/src/main/java/com/sw/ck/job/config/JobAutoConfiguration.java` | 移动到 `-biz` 模块，增强 `@MapperScan` + `@ComponentScan` |
| 4 | `sw-bootstrap/pom.xml` | 依赖从 `sw-basic-job` 改为 `sw-basic-job-biz` |
| 5 | `sw-bootstrap/src/main/resources/application.yml` | 添加 `classpath:db/migration/job/{vendor}` 到 flyway.locations；添加 `sw.job.enabled: true` |
| 6 | `sw-bootstrap/src/main/resources/application-dev.yml` | 添加 `sw.job.enabled: true`（如果 dev 覆盖了 sw 段） |

### 删除/移动文件

| # | 文件 | 操作 |
|---|------|------|
| 1 | `sw-basic/sw-basic-job/src/main/java/com/sw/ck/job/config/JobAutoConfiguration.java` | 移动到 `-biz/src/main/java/com/sw/ck/job/config/JobAutoConfiguration.java`（同时增强） |
| 2 | `sw-basic/sw-basic-job/src/main/java/com/sw/ck/job/package-info.java` | 复制到 -api（内容改为"契约层"），原文件删除 |

## 8. 禁止修改的范围

- ❌ `sw-biz-system/`、`sw-biz-form/`、`sw-bpm/` 中的任何文件
- ❌ `sw-basic-notify/`、`sw-basic-storage/` 中的任何文件
- ❌ `sw-framework/` 中的任何文件（BaseEntity、BaseMapperX 等基类不动）
- ❌ `sw-dependencies/pom.xml` 中已有的依赖管理条目（不删除、不修改已有条目）
- ❌ 任何已有 Flyway 迁移脚本（V1-V16 全部不改）
- ❌ `Smart-WorkFlow-Web/` 中的任何文件（纯后端 Step）
- ❌ `application-local.yml`（local profile 暂不处理）

## 9. 详细执行方案

### 9.1 改造 sw-basic/sw-basic-job/pom.xml → 聚合 POM

将当前的单 jar POM 改为聚合 POM（参照 `sw-basic-storage/pom.xml`）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.sw.ck</groupId>
        <artifactId>smart-workflow</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../pom.xml</relativePath>
    </parent>

    <artifactId>sw-basic-job</artifactId>
    <packaging>pom</packaging>

    <name>Smart-WorkFlow :: Basic :: Job</name>
    <description>定时任务调度模块父 POM（Quartz 单节点 / BEAN / FLOW 两种任务类型）</description>

    <modules>
        <module>sw-basic-job-api</module>
        <module>sw-basic-job-biz</module>
    </modules>
</project>
```

### 9.2 创建 sw-basic-job-api/pom.xml

参照 `sw-basic-notify-api/pom.xml`（`relativePath` 指向 `../../../pom.xml`）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.sw.ck</groupId>
        <artifactId>smart-workflow</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../../pom.xml</relativePath>
    </parent>

    <artifactId>sw-basic-job-api</artifactId>
    <packaging>jar</packaging>

    <name>Smart-WorkFlow :: Basic :: Job :: API</name>
    <description>定时任务模块 - SPI/契约接口</description>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.sw.ck</groupId>
                <artifactId>sw-dependencies</artifactId>
                <version>${project.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>com.sw.ck</groupId>
            <artifactId>sw-common</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>
    </dependencies>
</project>
```

### 9.3 创建 sw-basic-job-biz/pom.xml

参照 `sw-basic-notify-biz/pom.xml`，额外添加 `spring-boot-starter-quartz`：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <parent>
        <groupId>com.sw.ck</groupId>
        <artifactId>smart-workflow</artifactId>
        <version>1.0.0-SNAPSHOT</version>
        <relativePath>../../../pom.xml</relativePath>
    </parent>

    <artifactId>sw-basic-job-biz</artifactId>
    <packaging>jar</packaging>

    <name>Smart-WorkFlow :: Basic :: Job :: Biz</name>
    <description>定时任务模块 - 实现/调度</description>

    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>com.sw.ck</groupId>
                <artifactId>sw-dependencies</artifactId>
                <version>${project.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <dependencies>
        <dependency>
            <groupId>com.sw.ck</groupId>
            <artifactId>sw-basic-job-api</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>com.sw.ck</groupId>
            <artifactId>sw-common</artifactId>
            <version>${project.version}</version>
        </dependency>
        <dependency>
            <groupId>com.sw.ck</groupId>
            <artifactId>sw-security</artifactId>
            <version>${project.version}</version>
        </dependency>
        <!-- Quartz 调度器 -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-quartz</artifactId>
        </dependency>
        <dependency>
            <groupId>org.projectlombok</groupId>
            <artifactId>lombok</artifactId>
            <optional>true</optional>
        </dependency>

        <!-- ========== 测试依赖 ========== -->
        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-test</artifactId>
            <scope>test</scope>
        </dependency>
        <dependency>
            <groupId>com.h2database</groupId>
            <artifactId>h2</artifactId>
            <scope>test</scope>
        </dependency>
    </dependencies>
</project>
```

> `spring-boot-starter-quartz` 的版本由 `spring-boot-dependencies` BOM 管理（3.4.4），无需在 sw-dependencies 中额外声明版本号。

### 9.4 更新 sw-basic/pom.xml 的 modules

```xml
<modules>
    <module>sw-basic-storage/sw-basic-storage-api</module>
    <module>sw-basic-storage/sw-basic-storage-biz</module>
    <module>sw-basic-notify</module>
    <module>sw-basic-job/sw-basic-job-api</module>
    <module>sw-basic-job/sw-basic-job-biz</module>
    <module>sw-basic-iot</module>
    <module>sw-basic-knowledge</module>
    <module>sw-basic-agent</module>
</modules>
```

### 9.5 创建 -api 的 package-info.java

```java
/**
 * 定时任务模块契约层。
 * Facade 接口、DTO、领域事件定义于此。
 */
package com.sw.ck.job;
```

文件路径：`sw-basic/sw-basic-job/sw-basic-job-api/src/main/java/com/sw/ck/job/package-info.java`

### 9.6 创建 -biz 的 package-info.java

```java
/**
 * 定时任务模块实现层。
 * Entity、Mapper、Service、Controller、AutoConfiguration、Flyway 迁移脚本。
 */
package com.sw.ck.job;
```

文件路径：`sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/package-info.java`

### 9.7 创建 JobInfo Entity

参照 `StorageFile.java` 的模式，`extends BaseEntity`（继承 id/tenant_id/deleted/version/审计列）：

```java
package com.sw.ck.job.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.sw.ck.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 定时任务定义实体。
 * <p>
 * 每条记录 = 一个可调度的定时任务。{@code tenant_id / 审计列 / deleted / version}
 * 由 MyBatis-Plus 拦截器自动注入。
 * </p>
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sw_job_info")
public class JobInfo extends BaseEntity {

    /** 任务名称 */
    private String jobName;

    /** 任务组（用于 Quartz 分组管理） */
    private String jobGroup;

    /** 任务类型枚举（BEAN / FLOW） */
    private String jobType;

    /** Cron 表达式 */
    private String cronExpression;

    /** 任务状态（NORMAL=启用 / PAUSED=停用） */
    private String status;

    /** 是否允许并发执行（true=允许 / false=不允许） */
    private Boolean concurrent;

    /** Misfire 策略（0=忽略 / 1=立即触发一次 / 2=放弃） */
    private Integer misfirePolicy;

    /** 任务描述 */
    private String description;

    // ─── BEAN 类型参数 ───

    /** Bean 名称（job_type=BEAN 时必填） */
    private String beanName;

    /** 方法参数（JSON 字符串，可选） */
    private String beanParams;

    // ─── FLOW 类型参数 ───

    /** 流程定义 Key（job_type=FLOW 时必填） */
    private String flowDefKey;

    /** 表单数据（JSON 字符串，可选） */
    private String formData;

    // ─── 调度参数 ───

    /** 上次执行时间 */
    private java.time.LocalDateTime lastFireTime;

    /** 下次执行时间 */
    private java.time.LocalDateTime nextFireTime;
}
```

字段说明：
- `jobName` + `jobGroup`：Quartz JobKey 的组成部分，组合唯一标识一个任务
- `jobType`：枚举字符串 `BEAN` / `FLOW`
- `cronExpression`：Quartz Cron 表达式（7 段或 6 段格式）
- `status`：`NORMAL`（启用调度）/ `PAUSED`（暂停调度）
- `concurrent`：是否允许前一次未完成时触发下一次
- `misfirePolicy`：0=忽略（MISFIRE_INSTRUCTION_IGNORE_MISFIRE_POLICY）/ 1=立即触发一次（MISFIRE_INSTRUCTION_FIRE_ONCE_NOW）/ 2=放弃（MISFIRE_INSTRUCTION_DO_NOTHING）
- `beanName`：`job_type=BEAN` 时必填，值为 Spring 容器中的 bean 名
- `flowDefKey`：`job_type=FLOW` 时必填，值为 BPM 流程定义 Key
- `lastFireTime` / `nextFireTime`：由调度器维护

### 9.8 创建 JobLog Entity

```java
package com.sw.ck.job.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.sw.ck.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 定时任务执行日志实体。
 * <p>
 * 记录每次任务触发的执行详情。{@code tenant_id / 审计列 / deleted / version}
 * 由 MyBatis-Plus 拦截器自动注入。
 * </p>
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sw_job_log")
public class JobLog extends BaseEntity {

    /** 关联任务 ID（sw_job_info.id） */
    private Long jobId;

    /** 任务名称（冗余字段，便于查询） */
    private String jobName;

    /** 任务组（冗余字段） */
    private String jobGroup;

    /** 触发方式（AUTO=定时触发 / MANUAL=手动触发） */
    private String triggerType;

    /** 任务参数（执行时传入的参数快照） */
    private String jobParams;

    /** 执行状态（RUNNING=执行中 / SUCCESS=成功 / FAILED=失败） */
    private String execStatus;

    /** 执行开始时间 */
    private LocalDateTime startTime;

    /** 执行结束时间 */
    private LocalDateTime endTime;

    /** 执行耗时（毫秒） */
    private Long duration;

    /** 执行结果/异常信息 */
    private String resultMsg;

    /** 异常堆栈（仅失败时记录） */
    private String exceptionStack;
}
```

### 9.9 创建 Mapper

**JobInfoMapper**：
```java
package com.sw.ck.job.mapper;

import com.sw.ck.common.mapper.BaseMapperX;
import com.sw.ck.job.entity.JobInfo;
import org.apache.ibatis.annotations.Mapper;

/**
 * 定时任务定义 Mapper。
 */
@Mapper
public interface JobInfoMapper extends BaseMapperX<JobInfo> {
}
```

**JobLogMapper**：
```java
package com.sw.ck.job.mapper;

import com.sw.ck.common.mapper.BaseMapperX;
import com.sw.ck.job.entity.JobLog;
import org.apache.ibatis.annotations.Mapper;

/**
 * 定时任务执行日志 Mapper。
 */
@Mapper
public interface JobLogMapper extends BaseMapperX<JobLog> {
}
```

### 9.10 创建 JobProperties 配置类

```java
package com.sw.ck.job.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * 定时任务配置属性。
 * <p>
 * 绑定 {@code sw.job} 前缀的配置项。
 * </p>
 */
@Data
@ConfigurationProperties(prefix = "sw.job")
public class JobProperties {

    /** 是否启用定时任务模块（默认 false） */
    private boolean enabled = false;

    /** Quartz 线程池大小（默认 10） */
    private int poolSize = 10;

    /** 任务日志保留天数（默认 30，0 表示永不过期） */
    private int logRetentionDays = 30;
}
```

### 9.11 增强 JobAutoConfiguration

将原骨架文件移动到 `-biz/src/main/java/com/sw/ck/job/config/JobAutoConfiguration.java`，增强为：

```java
package com.sw.ck.job.config;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.ComponentScan;

/**
 * 定时任务自动配置。
 * <p>
 * 默认关闭，通过 {@code sw.job.enabled=true} 开启。
 * </p>
 */
@AutoConfiguration
@ConditionalOnProperty(prefix = "sw.job", name = "enabled", havingValue = "true")
@EnableConfigurationProperties(JobProperties.class)
@MapperScan("com.sw.ck.job.mapper")
@ComponentScan({"com.sw.ck.job.controller", "com.sw.ck.job.service", "com.sw.ck.job.impl"})
public class JobAutoConfiguration {
}
```

### 9.12 创建 Flyway V17 迁移脚本

**PostgreSQL 版本**（路径：`sw-bootstrap/src/main/resources/db/migration/job/postgresql/V17__init_job_tables.sql`）：

```sql
-- ===================================================================
-- Smart-WorkFlow :: V17: 初始化定时任务调度表 (PostgreSQL)
-- ===================================================================
CREATE TABLE sw_job_info (
    id              BIGINT      NOT NULL,
    job_name        VARCHAR(128) NOT NULL,
    job_group       VARCHAR(128) NOT NULL DEFAULT 'DEFAULT',
    job_type        VARCHAR(16)  NOT NULL DEFAULT 'BEAN',
    cron_expression VARCHAR(128) NOT NULL,
    status          VARCHAR(16)  NOT NULL DEFAULT 'NORMAL',
    concurrent      SMALLINT     NOT NULL DEFAULT 0,
    misfire_policy  SMALLINT     NOT NULL DEFAULT 0,
    description     VARCHAR(512) DEFAULT NULL,
    bean_name       VARCHAR(256) DEFAULT NULL,
    bean_params     TEXT         DEFAULT NULL,
    flow_def_key    VARCHAR(128) DEFAULT NULL,
    form_data       TEXT         DEFAULT NULL,
    last_fire_time  TIMESTAMP    DEFAULT NULL,
    next_fire_time  TIMESTAMP    DEFAULT NULL,
    create_time     TIMESTAMP    DEFAULT NULL,
    create_by       BIGINT       DEFAULT NULL,
    update_time     TIMESTAMP    DEFAULT NULL,
    update_by       BIGINT       DEFAULT NULL,
    deleted         SMALLINT     NOT NULL DEFAULT 0,
    tenant_id       BIGINT       NOT NULL DEFAULT 0,
    version         BIGINT       DEFAULT NULL,
    PRIMARY KEY (id)
);

COMMENT ON TABLE  sw_job_info               IS '定时任务定义';
COMMENT ON COLUMN sw_job_info.id            IS '主键';
COMMENT ON COLUMN sw_job_info.job_name      IS '任务名称';
COMMENT ON COLUMN sw_job_info.job_group     IS '任务组（Quartz JobKey 分组）';
COMMENT ON COLUMN sw_job_info.job_type      IS '任务类型（BEAN=处理器 / FLOW=发起流程）';
COMMENT ON COLUMN sw_job_info.cron_expression IS 'Cron 表达式';
COMMENT ON COLUMN sw_job_info.status        IS '任务状态（NORMAL=启用 / PAUSED=停用）';
COMMENT ON COLUMN sw_job_info.concurrent    IS '是否允许并发（0=否 / 1=是）';
COMMENT ON COLUMN sw_job_info.misfire_policy IS 'Misfire 策略（0=忽略 / 1=立即触发 / 2=放弃）';
COMMENT ON COLUMN sw_job_info.description   IS '任务描述';
COMMENT ON COLUMN sw_job_info.bean_name     IS 'Spring Bean 名称（BEAN 类型必填）';
COMMENT ON COLUMN sw_job_info.bean_params   IS 'Bean 方法参数（JSON）';
COMMENT ON COLUMN sw_job_info.flow_def_key  IS '流程定义 Key（FLOW 类型必填）';
COMMENT ON COLUMN sw_job_info.form_data     IS '表单数据（JSON）';
COMMENT ON COLUMN sw_job_info.last_fire_time IS '上次执行时间';
COMMENT ON COLUMN sw_job_info.next_fire_time IS '下次计划执行时间';
COMMENT ON COLUMN sw_job_info.create_time   IS '创建时间';
COMMENT ON COLUMN sw_job_info.create_by     IS '创建人';
COMMENT ON COLUMN sw_job_info.update_time   IS '更新时间';
COMMENT ON COLUMN sw_job_info.update_by     IS '更新人';
COMMENT ON COLUMN sw_job_info.deleted       IS '逻辑删除标记（0=未删, 1=已删）';
COMMENT ON COLUMN sw_job_info.tenant_id     IS '租户 ID';
COMMENT ON COLUMN sw_job_info.version       IS '乐观锁版本号';

CREATE INDEX idx_sw_job_info_tenant_deleted ON sw_job_info (tenant_id, deleted);

CREATE TABLE sw_job_log (
    id              BIGINT      NOT NULL,
    job_id          BIGINT      NOT NULL,
    job_name        VARCHAR(128) NOT NULL,
    job_group       VARCHAR(128) NOT NULL DEFAULT 'DEFAULT',
    trigger_type    VARCHAR(16)  NOT NULL DEFAULT 'AUTO',
    job_params      TEXT         DEFAULT NULL,
    exec_status     VARCHAR(16)  NOT NULL DEFAULT 'RUNNING',
    start_time      TIMESTAMP    DEFAULT NULL,
    end_time        TIMESTAMP    DEFAULT NULL,
    duration        BIGINT       DEFAULT NULL,
    result_msg      TEXT         DEFAULT NULL,
    exception_stack TEXT         DEFAULT NULL,
    create_time     TIMESTAMP    DEFAULT NULL,
    create_by       BIGINT       DEFAULT NULL,
    update_time     TIMESTAMP    DEFAULT NULL,
    update_by       BIGINT       DEFAULT NULL,
    deleted         SMALLINT     NOT NULL DEFAULT 0,
    tenant_id       BIGINT       NOT NULL DEFAULT 0,
    version         BIGINT       DEFAULT NULL,
    PRIMARY KEY (id)
);

COMMENT ON TABLE  sw_job_log                IS '定时任务执行日志';
COMMENT ON COLUMN sw_job_log.id             IS '主键';
COMMENT ON COLUMN sw_job_log.job_id         IS '关联任务 ID（sw_job_info.id）';
COMMENT ON COLUMN sw_job_log.job_name       IS '任务名称（冗余）';
COMMENT ON COLUMN sw_job_log.job_group      IS '任务组（冗余）';
COMMENT ON COLUMN sw_job_log.trigger_type   IS '触发方式（AUTO=定时 / MANUAL=手动）';
COMMENT ON COLUMN sw_job_log.job_params     IS '任务参数快照';
COMMENT ON COLUMN sw_job_log.exec_status    IS '执行状态（RUNNING / SUCCESS / FAILED）';
COMMENT ON COLUMN sw_job_log.start_time     IS '执行开始时间';
COMMENT ON COLUMN sw_job_log.end_time       IS '执行结束时间';
COMMENT ON COLUMN sw_job_log.duration       IS '执行耗时（毫秒）';
COMMENT ON COLUMN sw_job_log.result_msg     IS '执行结果/异常信息';
COMMENT ON COLUMN sw_job_log.exception_stack IS '异常堆栈（仅失败时记录）';
COMMENT ON COLUMN sw_job_log.create_time    IS '创建时间';
COMMENT ON COLUMN sw_job_log.create_by      IS '创建人';
COMMENT ON COLUMN sw_job_log.update_time    IS '更新时间';
COMMENT ON COLUMN sw_job_log.update_by      IS '更新人';
COMMENT ON COLUMN sw_job_log.deleted        IS '逻辑删除标记（0=未删, 1=已删）';
COMMENT ON COLUMN sw_job_log.tenant_id      IS '租户 ID';
COMMENT ON COLUMN sw_job_log.version        IS '乐观锁版本号';

CREATE INDEX idx_sw_job_log_job_id ON sw_job_log (job_id);
CREATE INDEX idx_sw_job_log_tenant_deleted ON sw_job_log (tenant_id, deleted);
```

**H2 版本**（路径：`sw-bootstrap/src/main/resources/db/migration/job/h2/V17__init_job_tables.sql`）：

```sql
-- ===================================================================
-- Smart-WorkFlow :: V17: 初始化定时任务调度表 (H2)
-- ===================================================================
CREATE TABLE sw_job_info (
    id              BIGINT      NOT NULL,
    job_name        VARCHAR(128) NOT NULL,
    job_group       VARCHAR(128) NOT NULL DEFAULT 'DEFAULT',
    job_type        VARCHAR(16)  NOT NULL DEFAULT 'BEAN',
    cron_expression VARCHAR(128) NOT NULL,
    status          VARCHAR(16)  NOT NULL DEFAULT 'NORMAL',
    concurrent      SMALLINT     NOT NULL DEFAULT 0,
    misfire_policy  SMALLINT     NOT NULL DEFAULT 0,
    description     VARCHAR(512) DEFAULT NULL,
    bean_name       VARCHAR(256) DEFAULT NULL,
    bean_params     TEXT         DEFAULT NULL,
    flow_def_key    VARCHAR(128) DEFAULT NULL,
    form_data       TEXT         DEFAULT NULL,
    last_fire_time  TIMESTAMP    DEFAULT NULL,
    next_fire_time  TIMESTAMP    DEFAULT NULL,
    create_time     TIMESTAMP    DEFAULT NULL,
    create_by       BIGINT       DEFAULT NULL,
    update_time     TIMESTAMP    DEFAULT NULL,
    update_by       BIGINT       DEFAULT NULL,
    deleted         SMALLINT     NOT NULL DEFAULT 0,
    tenant_id       BIGINT       NOT NULL DEFAULT 0,
    version         BIGINT       DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_sw_job_info_tenant_deleted ON sw_job_info (tenant_id, deleted);

CREATE TABLE sw_job_log (
    id              BIGINT      NOT NULL,
    job_id          BIGINT      NOT NULL,
    job_name        VARCHAR(128) NOT NULL,
    job_group       VARCHAR(128) NOT NULL DEFAULT 'DEFAULT',
    trigger_type    VARCHAR(16)  NOT NULL DEFAULT 'AUTO',
    job_params      TEXT         DEFAULT NULL,
    exec_status     VARCHAR(16)  NOT NULL DEFAULT 'RUNNING',
    start_time      TIMESTAMP    DEFAULT NULL,
    end_time        TIMESTAMP    DEFAULT NULL,
    duration        BIGINT       DEFAULT NULL,
    result_msg      TEXT         DEFAULT NULL,
    exception_stack TEXT         DEFAULT NULL,
    create_time     TIMESTAMP    DEFAULT NULL,
    create_by       BIGINT       DEFAULT NULL,
    update_time     TIMESTAMP    DEFAULT NULL,
    update_by       BIGINT       DEFAULT NULL,
    deleted         SMALLINT     NOT NULL DEFAULT 0,
    tenant_id       BIGINT       NOT NULL DEFAULT 0,
    version         BIGINT       DEFAULT NULL,
    PRIMARY KEY (id)
);

CREATE INDEX idx_sw_job_log_job_id ON sw_job_log (job_id);
CREATE INDEX idx_sw_job_log_tenant_deleted ON sw_job_log (tenant_id, deleted);
```

### 9.13 更新 sw-bootstrap/pom.xml 依赖

将第 57-59 行的：
```xml
<dependency>
    <groupId>com.sw.ck</groupId>
    <artifactId>sw-basic-job</artifactId>
    <version>${project.version}</version>
</dependency>
```

改为：
```xml
<dependency>
    <groupId>com.sw.ck</groupId>
    <artifactId>sw-basic-job-biz</artifactId>
    <version>${project.version}</version>
</dependency>
```

### 9.14 更新 application.yml

在 `flyway.locations` 中添加 `classpath:db/migration/job/{vendor}`：

```yaml
  flyway:
    enabled: true
    locations:
      - classpath:db/migration/{vendor}
      - classpath:db/migration/bpm/{vendor}
      - classpath:db/migration/notify/{vendor}
      - classpath:db/migration/form/{vendor}
      - classpath:db/migration/storage/{vendor}
      - classpath:db/migration/job/{vendor}
```

在 `sw:` 段下添加：
```yaml
sw:
  # ---------- 定时任务 ----------
  job:
    enabled: true
    pool-size: 10
    log-retention-days: 30
```

### 9.15 更新 application-dev.yml

确认 `sw:` 段下无需新增（job 配置在 `application.yml` 中已有默认值）。如果 dev 需要覆盖，添加：
```yaml
sw:
  job:
    enabled: true
```

### 9.16 清理旧文件

删除原单模块骨架中已移动的文件：
- `sw-basic/sw-basic-job/src/main/java/com/sw/ck/job/config/JobAutoConfiguration.java`（已移动到 -biz）
- `sw-basic/sw-basic-job/src/main/java/com/sw/ck/job/package-info.java`（已拆分到 -api 和 -biz）

删除后 `sw-basic/sw-basic-job/src/` 目录应变为空（仅保留 `sw-basic/sw-basic-job/pom.xml` 聚合 POM）。

### 9.17 编译验证

```bash
cd Smart-WorkFlow
mvn -q compile
```

预期：退出码 0，所有模块编译通过。

## 10. 关键实现约束

1. **表前缀**：`sw_job_`（属于 `knowledge/architecture.md` 表前缀枚举中的合法前缀，不可自创）
2. **Entity 继承**：必须 `extends BaseEntity`（继承 id/tenant_id/deleted/version/审计列），不手写这些字段
3. **Mapper**：必须 `extends BaseMapperX<T>`（不是 MyBatis-Plus 原生 `BaseMapper<T>`）
4. **Flyway 双方言**：PG 和 H2 版本 SQL 必须逐字节等价（H2 版无 COMMENT ON，其余 DDL 完全一致）
5. **Flyway 目录位置**：必须放在 `sw-bootstrap/src/main/resources/db/migration/job/{vendor}/`（不是子模块的 resources）
6. **POM relativePath**：`-api` 和 `-biz` 的 `parent.relativePath` 必须指向 `../../../pom.xml`（根目录 POM），不是聚合 POM
7. **BOM 依赖管理**：`-api` 和 `-biz` 的 POM 中需通过 `dependencyManagement` → `sw-dependencies` import BOM
8. **@ConditionalOnProperty**：默认 `havingValue = "true"`，不传时模块不加载
9. **`concurrent` 字段**：数据库用 `SMALLINT`（0=否/1=是），Entity 用 `Boolean` 类型，MyBatis-Plus 自动映射
10. **不要在本 Step 实现任何 Service、Controller、JobHandler 业务逻辑** — 这些在 Step B2/B3 中完成

## 11. 边界情况

- **H2 不支持 COMMENT ON**：H2 版本的 SQL 不包含任何 `COMMENT ON` 语句
- **模块扫描路径**：`@ComponentScan` 中 `com.sw.ck.job.controller`、`com.sw.ck.job.service`、`com.sw.ck.job.impl` 三个包当前可能为空，Spring 启动时不会报错（`@ComponentScan` 不要求包必须存在）
- **Flyway 多 location 顺序**：job 迁移在最后一条 location，对版本号排序无影响（Flyway 按版本号全局排序，与 location 顺序无关）
- **H2 的 TEXT 类型**：与 PostgreSQL 的 TEXT 类型兼容，H2 自动映射为 CLOB
- **相对路径**：聚合 POM 的 `<relativePath>../../pom.xml</relativePath>` 必须正确，否则 Maven 找不到 parent

## 12. 风险和回滚方案

### 风险
- **R1**：POM 相对路径错误导致 Maven 构建失败
- **R2**：Flyway location 路径不存在导致启动报错（但编译不受影响）
- **R3**：Entity 字段类型与数据库列类型不匹配

### 回滚步骤
1. `git checkout` 恢复所有被修改的文件
2. 删除新建的 `-api`/`-biz` 目录
3. 如果 Flyway 迁移已执行（在开发环境），需要手动删除 `sw_job_info` 和 `sw_job_log` 表，并在 `flyway_schema_history` 中删除 V17 记录

### 验证回滚成功
- `mvn -q compile` 仍然通过
- 目录结构恢复为单模块骨架
- 无残留的 `sw-basic-job-api` 或 `sw-basic-job-biz` 目录或 Maven artifact

## 13. 测试方案

### 13.1 静态检查

```bash
# 1. 确认旧单模块路径已清理
ls sw-basic/sw-basic-job/src/main/java/  # 应为空目录或不存在

# 2. 确认新模块目录结构正确
find sw-basic/sw-basic-job/sw-basic-job-api -type f | sort
find sw-basic/sw-basic-job/sw-basic-job-biz -type f | sort

# 3. grep 确认 V17 迁移文件存在
find sw-bootstrap/src/main/resources/db/migration/job -name "*.sql" -type f

# 4. 确认 pom.xml 中依赖引用正确
grep "sw-basic-job-biz" sw-bootstrap/pom.xml
grep "sw-basic-job-api" sw-basic/pom.xml
grep "sw-basic-job-biz" sw-basic/pom.xml

# 5. 确认 flyway locations 包含 job
grep "db/migration/job" sw-bootstrap/src/main/resources/application.yml

# 6. 确认 sw.job.enabled 配置存在
grep -A2 "job:" sw-bootstrap/src/main/resources/application.yml
```

### 13.2 单元测试

本 Step 不涉及可测试的业务逻辑（仅 Entity + Mapper + 配置），无单元测试要求。Entity 的正确性由后续 Service 测试和全量编译间接验证。

### 13.3 集成测试

本 Step 无集成测试要求。Flyway 迁移的正确性将在 Step B4 的 Controller 集成测试中间接验证（表结构必须正确才能通过集成测试）。

### 13.4 手工验证

无需手工验证。后端 Step 不涉及 UI。

### 13.5 回归检查

```bash
cd Smart-WorkFlow
mvn -q compile && mvn -q test
```

- 编译退出码 0
- 全量测试通过（预期无测试数量减少）
- Build SUCCESS

## 14. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| C1 | `sw-basic-job` POM 从单 jar 改为聚合 POM（`<packaging>pom</packaging>`），包含 `sw-basic-job-api` 和 `sw-basic-job-biz` 两个 module | 查看 `sw-basic/sw-basic-job/pom.xml` |
| C2 | `sw-basic-job-api/pom.xml` 存在，依赖 `sw-common` | 文件存在 + 内容正确 |
| C3 | `sw-basic-job-biz/pom.xml` 存在，依赖 `-api` + `sw-common` + `sw-security` + `spring-boot-starter-quartz` | 文件存在 + 内容正确 |
| C4 | `sw-basic/pom.xml` 的 `<modules>` 包含 `sw-basic-job/sw-basic-job-api` 和 `sw-basic-job/sw-basic-job-biz` | grep 确认 |
| C5 | `sw-bootstrap/pom.xml` 依赖 `sw-basic-job-biz`（非 `sw-basic-job`） | grep 确认 |
| C6 | `JobInfo.java` Entity 继承 `BaseEntity`，`@TableName("sw_job_info")`，包含所有 17 个业务字段 | 文件内容审查 |
| C7 | `JobLog.java` Entity 继承 `BaseEntity`，`@TableName("sw_job_log")`，包含所有 12 个业务字段 | 文件内容审查 |
| C8 | `JobInfoMapper.java` `extends BaseMapperX<JobInfo>` | 文件内容审查 |
| C9 | `JobLogMapper.java` `extends BaseMapperX<JobLog>` | 文件内容审查 |
| C10 | `JobProperties.java` 绑定 `sw.job` 前缀，包含 enabled/poolSize/logRetentionDays | 文件内容审查 |
| C11 | `JobAutoConfiguration.java` 含 `@MapperScan("com.sw.ck.job.mapper")` 和 `@ComponentScan({"com.sw.ck.job.controller", "com.sw.ck.job.service", "com.sw.ck.job.impl"})` | 文件内容审查 |
| C12 | Flyway V17 PG 迁移脚本存在，包含 `sw_job_info` 和 `sw_job_log` 两张表 | 文件存在 + SQL 正确 |
| C13 | Flyway V17 H2 迁移脚本存在，DDL 与 PG 版本一致（无 COMMENT ON） | 文件存在 + SQL 正确 |
| C14 | `application.yml` 的 `flyway.locations` 包含 `classpath:db/migration/job/{vendor}` | grep 确认 |
| C15 | `application.yml` 包含 `sw.job.enabled: true` 配置 | grep 确认 |
| C16 | 旧 `sw-basic-job/src/main/java/com/sw/ck/job/config/JobAutoConfiguration.java` 已删除 | 文件不存在 |
| C17 | `mvn -q compile` 退出码 0 | 命令执行 |

## 15. 执行回执格式

要求执行代理按以下格式返回（标准 13 项）：

```markdown
# 执行回执 — Step B1

## 1. Step 编号和名称
B1 — 模块拆分 + Flyway + Entity + Mapper + Quartz 配置就位

## 2. 使用模型
（实际使用了哪个模型）

## 3. 实际读取的文件
（逐文件列出，未读取的标注原因）

## 4. 实际修改的文件
（逐文件列出，新建和修改区分标注）

## 5. 每个文件的修改摘要
（每个文件的改动点、改动行数、改动原因）

## 6. 实际执行的命令
（逐条列出命令及参数）

## 7. 命令输出摘要
（编译结果、测试结果、退出码等）

## 8. 与原方案的偏差
（哪些地方和方案不同，为什么）

## 9. 遇到的问题
（技术问题、环境问题、理解偏差等，以及如何解决的）

## 10. 未完成内容
（方案中要求但实际未完成的内容，及原因）

## 11. 风险和注意事项
（执行过程中发现的潜在问题）

## 12. Git diff 摘要
（改动文件数、新增行数、删除行数、关键变更点）

## 13. 建议执行的测试
（执行者认为需要重点验证的测试场景）
```

## 16. 测试回执格式

本 Step 不要求独立测试回执（无业务逻辑变更）。编译验证结果在 §15 执行回执 §7 中体现。全量回归测试在 Step B4 执行。

## 17. 明确禁止事项

- ❌ **不要** 在本 Step 中创建 Service、Controller、JobHandler、Facade 接口 — 这些在 B2/B3
- ❌ **不要** 在 `sw-dependencies/pom.xml` 中添加 Quartz 版本管理（由 Spring Boot BOM 管理）
- ❌ **不要** 修改已有 Flyway 迁移脚本（V1-V16）
- ❌ **不要** 修改 `BaseEntity`、`BaseMapperX`、`BaseService` 等框架基类
- ❌ **不要** 创建 Quartz 配置类（`QuartzConfig` 等）— 在 Step B2 中实现
- ❌ **不要** 创建枚举类（`JobType`、`JobStatus` 等）— 在 Step B2 中实现
- ❌ **不要** 在 Entity 中手写 `id`、`tenantId`、`deleted`、`createTime`、`updateTime`、`version` 字段 — 由 `BaseEntity` 继承
- ❌ **不要** 使用 `@TableField` 注解在 Entity 中映射系统列字段 — BaseEntity 已处理
- ❌ **不要** 创建额外的表（如 `sw_job_config` 等）— 仅 `sw_job_info` + `sw_job_log`
- ❌ **不要** 触碰前端项目（`Smart-WorkFlow-Web/`）的任何文件
