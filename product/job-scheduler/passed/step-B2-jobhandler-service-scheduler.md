# Step B2：JobHandler + Service + Quartz 调度

## 1. 当前状态

- **功能**：job-scheduler（定时任务调度模块），第 2/7 Step
- **前置 Step**：B1 PASSED ✅ — 模块拆分、Flyway V17 建表、Entity/Mapper/配置已就位
- **B1 产物**：`sw-basic-job-api`（POM + package-info）+ `sw-basic-job-biz`（POM + JobInfo/JobLog Entity + JobInfoMapper/JobLogMapper + JobProperties + JobAutoConfiguration）
- **当前可以注入的 Bean**：`JobInfoMapper`、`JobLogMapper`、`JobProperties`
- **Quartz 依赖**：`spring-boot-starter-quartz` 已在 `-biz/pom.xml` 中声明
- **Spring Boot Quartz 自动配置**：默认提供 `Scheduler` bean（RAMJobStore），无需手动创建 SchedulerFactoryBean
- **后端全量测试基线**：166 tests（B1 验收确认，零退化）

## 2. Step 目标

实现定时任务的核心调度引擎：JobHandler SPI 接口、枚举定义、JobInfo/JobLog Service 层、Quartz 调度集成（QuartzSchedulerService + SwJobBean）、FLOW 类型领域事件，使 BEAN 和 FLOW 两种任务类型具备完整执行路径。

## 3. 推荐模型

推荐模型：deepseek-v4-flash
选择理由：标准 Service 层实现 + Quartz 框架集成，模式参照 notify/storage ServiceImpl。涉及 Quartz API 调用但为框架标准用法，不涉及多约束收敛场景。
是否触发升级条件：否

## 4. 模型选择理由

本 Step 的核心工作是将架构设计中已明确的组件（枚举、Handler SPI、Service、Quartz 调度器）逐个落地。Quartz JobBean、CronTrigger 等 API 为框架标准模式，Service 层遵循 MyBatis-Plus lambdaQuery 链式 API 既有惯例。无复杂决策点。

## 5. 已知上下文

### 5.1 架构规范（来自后端 CLAUDE.md §10）

- **BEAN 类型**：`bean_name` + `params`，走 `JobHandler` SPI 入口
- **FLOW 类型**：`flow_def_key` + `form_data`(JSON)，到点发领域事件 `ScheduledFlowTriggerEvent`
- **单节点**：Quartz RAMJobStore，不依赖 `QRTZ_*` 表
- **job 不依赖 workflow 的 `-biz`**：FLOW 任务通过领域事件解耦，BPM 侧监听为后续

### 5.2 跨模块通信模式

- **领域事件发布**：经 `DomainEventPublisher`（`sw-common`），监听方用 `@TransactionalEventListener(phase = AFTER_COMMIT)` + `@Async`
- **事件定义于 `-api`**：其他模块（如 BPM）可依赖 `-api` 获取事件类型

### 5.3 Spring Boot Quartz 自动配置

`spring-boot-starter-quartz` 自动提供：
- `Scheduler` bean（可直接注入，默认 RAMJobStore）
- `SpringBeanJobFactory`（使 Quartz Job 可通过 `@Autowired` 获取 Spring Bean）
- 配置属性前缀 `spring.quartz.*`

我们在业务层封装 `QuartzSchedulerService`，不直接暴露 `Scheduler` API。

### 5.4 Service 层模式

- 接口定义：`XxxService extends BaseService<Entity>`
- 实现类：`XxxServiceImpl extends BaseServiceImpl<Mapper, Entity> implements XxxService`
- 使用 `lambdaQuery()` / `lambdaUpdate()` 链式 API，不手写 SQL

### 5.5 B1 产物关键回顾

- `JobAutoConfiguration` 当前 `@ComponentScan`：`com.sw.ck.job.controller`、`com.sw.ck.job.service`、`com.sw.ck.job.impl`
- B2 新增类分别落在 `com.sw.ck.job.service`（Service 接口+实现+QuartzSchedulerService）、`com.sw.ck.job.scheduler`（SwJobBean）、`com.sw.ck.job.enums`（-biz 内部枚举）
- AutoConfiguration 的 ComponentScan 需追加 `com.sw.ck.job.scheduler`

## 6. 执行前必须读取的文件

按优先级排列：

1. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/config/JobAutoConfiguration.java` — 当前扫描路径（需追加 scheduler 包）
2. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/entity/JobInfo.java` — Entity 字段（Service 查询条件用）
3. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/entity/JobLog.java` — Entity 字段
4. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/mapper/JobInfoMapper.java` — Mapper 接口
5. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/mapper/JobLogMapper.java` — Mapper 接口
6. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/service/BaseService.java` — Service 接口基类
7. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/service/BaseServiceImpl.java` — Service 实现基类
8. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/event/DomainEventPublisher.java` — 事件发布器
9. `Smart-WorkFlow/sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyMessageServiceImpl.java` — ServiceImpl 实现参照
10. `Smart-WorkFlow/.claude/CLAUDE.md` — 后端工程宪法 §10（定时任务规范）

## 7. 允许修改的文件范围

### 新建文件（11 个）

| # | 位置 | 文件 | 说明 |
|---|:----:|------|------|
| 1 | `-api` | `src/main/java/com/sw/ck/job/enums/JobType.java` | 任务类型枚举（BEAN / FLOW） |
| 2 | `-api` | `src/main/java/com/sw/ck/job/enums/JobStatus.java` | 任务状态枚举（NORMAL / PAUSED） |
| 3 | `-api` | `src/main/java/com/sw/ck/job/handler/JobHandler.java` | 任务处理器 SPI 接口 |
| 4 | `-api` | `src/main/java/com/sw/ck/job/event/ScheduledFlowTriggerEvent.java` | FLOW 类型领域事件 |
| 5 | `-biz` | `src/main/java/com/sw/ck/job/enums/TriggerType.java` | 触发方式枚举（AUTO / MANUAL） |
| 6 | `-biz` | `src/main/java/com/sw/ck/job/enums/ExecStatus.java` | 执行状态枚举（RUNNING / SUCCESS / FAILED） |
| 7 | `-biz` | `src/main/java/com/sw/ck/job/service/JobInfoService.java` | 任务定义 Service 接口 |
| 8 | `-biz` | `src/main/java/com/sw/ck/job/service/impl/JobInfoServiceImpl.java` | 任务定义 Service 实现 |
| 9 | `-biz` | `src/main/java/com/sw/ck/job/service/JobLogService.java` | 执行日志 Service 接口 |
| 10 | `-biz` | `src/main/java/com/sw/ck/job/service/impl/JobLogServiceImpl.java` | 执行日志 Service 实现 |
| 11 | `-biz` | `src/main/java/com/sw/ck/job/service/QuartzSchedulerService.java` | Quartz 调度封装 |
| 12 | `-biz` | `src/main/java/com/sw/ck/job/scheduler/SwJobBean.java` | Quartz Job Bean（执行体） |

### 修改文件（1 个）

| # | 文件 | 改动 |
|---|------|------|
| 1 | `sw-basic-job-biz/src/main/java/com/sw/ck/job/config/JobAutoConfiguration.java` | `@ComponentScan` 追加 `"com.sw.ck.job.scheduler"` |

### 不需要修改的文件

- POM 文件：B1 已就位，依赖无需变更
- Flyway 迁移：V17 已就位，无新增表
- Entity / Mapper：B1 已就位，无需修改

## 8. 禁止修改的范围

- ❌ `sw-biz-system/`、`sw-biz-form/`、`sw-bpm/` 中的任何文件
- ❌ `sw-basic-notify/`、`sw-basic-storage/` 中的任何文件
- ❌ `sw-framework/` 中的任何文件（BaseEntity、BaseMapperX、DomainEventPublisher 等基类不动）
- ❌ Entity 文件（JobInfo.java、JobLog.java）— B1 已定稿
- ❌ Mapper 文件（JobInfoMapper.java、JobLogMapper.java）— B1 已定稿
- ❌ POM 文件
- ❌ Flyway 迁移脚本
- ❌ `application.yml` / `application-dev.yml`（Quartz 使用 Spring Boot 默认配置）
- ❌ `Smart-WorkFlow-Web/` 中的任何文件

## 9. 详细执行方案

### 9.1 创建 -api 枚举：JobType

路径：`sw-basic-job-api/src/main/java/com/sw/ck/job/enums/JobType.java`

```java
package com.sw.ck.job.enums;

/**
 * 定时任务类型枚举。
 * <p>
 * 定义于 {@code -api}，供其他模块（如 BPM）引用以区分任务类型。
 * </p>
 */
public enum JobType {

    /** Spring Bean 处理器任务 */
    BEAN,

    /** 定时发起流程任务 */
    FLOW,
}
```

### 9.2 创建 -api 枚举：JobStatus

路径：`sw-basic-job-api/src/main/java/com/sw/ck/job/enums/JobStatus.java`

```java
package com.sw.ck.job.enums;

/**
 * 定时任务调度状态枚举。
 * <p>
 * 定义于 {@code -api}，供调用方通过 Facade 传递状态参数。
 * </p>
 */
public enum JobStatus {

    /** 正常调度中 */
    NORMAL,

    /** 已暂停 */
    PAUSED,
}
```

### 9.3 创建 -api SPI 接口：JobHandler

路径：`sw-basic-job-api/src/main/java/com/sw/ck/job/handler/JobHandler.java`

```java
package com.sw.ck.job.handler;

/**
 * 定时任务处理器 SPI。
 * <p>
 * 业务方实现此接口并注册为 Spring Bean，即可通过 {@code BEAN} 类型定时任务调用。
 * 实现类通过 {@link #getName()} 返回的 bean 名称与 {@code JobInfo.beanName} 匹配。
 * </p>
 *
 * <h3>实现约定</h3>
 * <ul>
 *   <li>实现类标注 {@code @Component("myHandler")}，bean name 即为 handler 名称</li>
 *   <li>{@link #execute(String)} 接收 {@code JobInfo.beanParams}（JSON 字符串），无参数时传 {@code null}</li>
 *   <li>抛出任何异常均视为执行失败，由调度框架捕获并记录到 {@code sw_job_log}</li>
 *   <li>实现类应保证线程安全（Quartz 线程池中并发调用）</li>
 * </ul>
 */
public interface JobHandler {

    /**
     * 执行任务。
     *
     * @param params 任务参数（JSON 字符串，可为 null）
     * @throws Exception 执行失败时抛出
     */
    void execute(String params) throws Exception;

    /**
     * 获取处理器名称。
     * <p>
     * 返回值应与实现类的 Spring Bean 名称一致，用于与 {@code JobInfo.beanName} 匹配。
     * </p>
     *
     * @return 处理器名称（即 Spring Bean 名称）
     */
    String getName();
}
```

### 9.4 创建 -api 领域事件：ScheduledFlowTriggerEvent

路径：`sw-basic-job-api/src/main/java/com/sw/ck/job/event/ScheduledFlowTriggerEvent.java`

```java
package com.sw.ck.job.event;

import lombok.Getter;
import lombok.ToString;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * FLOW 类型定时任务触发事件。
 * <p>
 * 当 {@code job_type=FLOW} 的定时任务到达执行时间时，调度器发布此事件。
 * BPM 模块或其他流程引擎监听此事件，复用与手动表单提交相同的校验+发起路径。
 * </p>
 *
 * <h3>幂等去重键</h3>
 * 使用 {@code jobId + fireTime} 作为幂等去重键。
 * BPM 侧监听方应在发起流程前基于此键去重。
 */
@Getter
@ToString
public class ScheduledFlowTriggerEvent implements Serializable {

    /** 定时任务 ID（sw_job_info.id） */
    private final Long jobId;

    /** 流程定义 Key */
    private final String flowDefKey;

    /** 表单数据（JSON 字符串） */
    private final String formData;

    /** 触发时间（用于幂等去重） */
    private final LocalDateTime fireTime;

    /** 租户 ID */
    private final Long tenantId;

    public ScheduledFlowTriggerEvent(Long jobId, String flowDefKey, String formData,
                                      LocalDateTime fireTime, Long tenantId) {
        this.jobId = jobId;
        this.flowDefKey = flowDefKey;
        this.formData = formData;
        this.fireTime = fireTime;
        this.tenantId = tenantId;
    }
}
```

### 9.5 创建 -biz 枚举：TriggerType

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/enums/TriggerType.java`

```java
package com.sw.ck.job.enums;

/**
 * 触发方式枚举（仅内部使用）。
 */
public enum TriggerType {

    /** 定时自动触发 */
    AUTO,

    /** 手动触发 */
    MANUAL,
}
```

### 9.6 创建 -biz 枚举：ExecStatus

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/enums/ExecStatus.java`

```java
package com.sw.ck.job.enums;

/**
 * 任务执行状态枚举（仅内部使用）。
 */
public enum ExecStatus {

    /** 执行中 */
    RUNNING,

    /** 执行成功 */
    SUCCESS,

    /** 执行失败 */
    FAILED,
}
```

### 9.7 创建 JobInfoService

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/service/JobInfoService.java`

```java
package com.sw.ck.job.service;

import com.sw.ck.common.service.BaseService;
import com.sw.ck.job.entity.JobInfo;

import java.util.List;

/**
 * 定时任务定义 Service。
 */
public interface JobInfoService extends BaseService<JobInfo> {

    /**
     * 按任务名称查询（同租户内名称唯一）。
     *
     * @param jobName 任务名称
     * @return 任务定义，不存在返回 null
     */
    JobInfo getByJobName(String jobName);

    /**
     * 查询所有启用中的任务（status=NORMAL 且 deleted=0）。
     *
     * @return 启用中的任务列表
     */
    List<JobInfo> listEnabled();
}
```

### 9.8 创建 JobInfoServiceImpl

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/service/impl/JobInfoServiceImpl.java`

```java
package com.sw.ck.job.service.impl;

import com.sw.ck.common.service.BaseServiceImpl;
import com.sw.ck.job.entity.JobInfo;
import com.sw.ck.job.mapper.JobInfoMapper;
import com.sw.ck.job.service.JobInfoService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 定时任务定义 Service 实现。
 */
@Service
public class JobInfoServiceImpl
        extends BaseServiceImpl<JobInfoMapper, JobInfo>
        implements JobInfoService {

    @Override
    public JobInfo getByJobName(String jobName) {
        return lambdaQuery()
                .eq(JobInfo::getJobName, jobName)
                .one();
    }

    @Override
    public List<JobInfo> listEnabled() {
        return lambdaQuery()
                .eq(JobInfo::getStatus, "NORMAL")
                .list();
    }
}
```

### 9.9 创建 JobLogService

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/service/JobLogService.java`

```java
package com.sw.ck.job.service;

import com.sw.ck.common.service.BaseService;
import com.sw.ck.job.entity.JobLog;

import java.util.List;

/**
 * 定时任务执行日志 Service。
 */
public interface JobLogService extends BaseService<JobLog> {

    /**
     * 按任务 ID 查询日志列表（按创建时间倒序）。
     *
     * @param jobId 任务 ID
     * @return 日志列表
     */
    List<JobLog> listByJobId(Long jobId);

    /**
     * 查询最近一条执行记录。
     *
     * @param jobId 任务 ID
     * @return 最近日志，无记录返回 null
     */
    JobLog getLatestByJobId(Long jobId);
}
```

### 9.10 创建 JobLogServiceImpl

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/service/impl/JobLogServiceImpl.java`

```java
package com.sw.ck.job.service.impl;

import com.sw.ck.common.service.BaseServiceImpl;
import com.sw.ck.job.entity.JobLog;
import com.sw.ck.job.mapper.JobLogMapper;
import com.sw.ck.job.service.JobLogService;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 定时任务执行日志 Service 实现。
 */
@Service
public class JobLogServiceImpl
        extends BaseServiceImpl<JobLogMapper, JobLog>
        implements JobLogService {

    @Override
    public List<JobLog> listByJobId(Long jobId) {
        return lambdaQuery()
                .eq(JobLog::getJobId, jobId)
                .orderByDesc(JobLog::getCreateTime)
                .list();
    }

    @Override
    public JobLog getLatestByJobId(Long jobId) {
        return lambdaQuery()
                .eq(JobLog::getJobId, jobId)
                .orderByDesc(JobLog::getCreateTime)
                .last("LIMIT 1")
                .one();
    }
}
```

### 9.11 创建 SwJobBean（Quartz Job Bean 执行体）

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/scheduler/SwJobBean.java`

这是 Quartz 调度触发时的实际执行体。每个 BEAN/FLOW 任务在 Quartz 中注册后，由 Quartz 线程池在 cron 表达式匹配时调用本类的 `executeInternal`。

```java
package com.sw.ck.job.scheduler;

import com.sw.ck.common.event.DomainEventPublisher;
import com.sw.ck.job.entity.JobInfo;
import com.sw.ck.job.entity.JobLog;
import com.sw.ck.job.enums.ExecStatus;
import com.sw.ck.job.enums.TriggerType;
import com.sw.ck.job.event.ScheduledFlowTriggerEvent;
import com.sw.ck.job.handler.JobHandler;
import com.sw.ck.job.service.JobInfoService;
import com.sw.ck.job.service.JobLogService;
import org.quartz.JobExecutionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.quartz.QuartzJobBean;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Quartz 任务执行 Bean。
 * <p>
 * 每当 Quartz 调度器触发时，由 {@link org.springframework.scheduling.quartz.SpringBeanJobFactory}
 * 实例化本类（通过 {@code @Component} 注册为原型 Bean），并从 {@link JobExecutionContext}
 * 获取 {@code jobId}，加载 {@link JobInfo} 后按类型分发执行。
 * </p>
 *
 * <h3>执行流程</h3>
 * <ol>
 *   <li>从 JobDataMap 获取 jobId</li>
 *   <li>查询 JobInfo（不存在/已删除则跳过）</li>
 *   <li>检查是否允许并发（不允许并发且有 RUNNING 日志时跳过）</li>
 *   <li>创建 RUNNING 状态的 JobLog</li>
 *   <li>按 job_type 分支执行（BEAN→调用 JobHandler，FLOW→发布事件）</li>
 *   <li>更新 JobLog 为 SUCCESS 或 FAILED</li>
 *   <li>更新 JobInfo.lastFireTime / nextFireTime</li>
 * </ol>
 */
@Component
public class SwJobBean extends QuartzJobBean {

    private static final Logger log = LoggerFactory.getLogger(SwJobBean.class);

    /** Quartz JobDataMap 中存储 jobId 的 key */
    public static final String JOB_ID_KEY = "jobId";

    /** Quartz JobDataMap 中存储触发方式的 key */
    public static final String TRIGGER_TYPE_KEY = "triggerType";

    @Autowired
    private JobInfoService jobInfoService;

    @Autowired
    private JobLogService jobLogService;

    @Autowired
    private DomainEventPublisher eventPublisher;

    @Autowired(required = false)
    private java.util.Map<String, JobHandler> handlerMap;

    @Override
    protected void executeInternal(JobExecutionContext context) throws Exception {
        Long jobId = context.getMergedJobDataMap().getLong(JOB_ID_KEY);
        String triggerType = context.getMergedJobDataMap().getString(TRIGGER_TYPE_KEY);
        if (jobId == null) {
            log.warn("Quartz 任务触发但 JobDataMap 中缺少 jobId，跳过执行");
            return;
        }

        // 1. 查询任务定义（响应删除即时生效：删后这里查不到，跳过）
        JobInfo jobInfo = jobInfoService.getById(jobId);
        if (jobInfo == null) {
            log.info("定时任务 {} 已被删除，跳过执行", jobId);
            return;
        }

        // 2. 并发检查（不允许并发时，检查是否有 RUNNING 日志）
        if (!Boolean.TRUE.equals(jobInfo.getConcurrent())) {
            JobLog running = jobLogService.lambdaQuery()
                    .eq(JobLog::getJobId, jobId)
                    .eq(JobLog::getExecStatus, ExecStatus.RUNNING.name())
                    .one();
            if (running != null) {
                log.warn("任务 {}（{}）上次执行尚未完成，跳过本次触发（concurrent=false）",
                        jobId, jobInfo.getJobName());
                return;
            }
        }

        // 3. 创建 RUNNING 日志
        JobLog jobLog = new JobLog();
        jobLog.setJobId(jobId);
        jobLog.setJobName(jobInfo.getJobName());
        jobLog.setJobGroup(jobInfo.getJobGroup());
        jobLog.setTriggerType(triggerType != null ? triggerType : TriggerType.AUTO.name());
        jobLog.setJobParams(jobInfo.getBeanParams());
        jobLog.setExecStatus(ExecStatus.RUNNING.name());
        jobLog.setStartTime(LocalDateTime.now());
        jobLogService.save(jobLog);

        // 4. 按类型分支执行
        try {
            if ("BEAN".equals(jobInfo.getJobType())) {
                executeBean(jobInfo);
            } else if ("FLOW".equals(jobInfo.getJobType())) {
                executeFlow(jobInfo);
            } else {
                throw new IllegalStateException("未知任务类型: " + jobInfo.getJobType());
            }

            // 成功
            jobLog.setExecStatus(ExecStatus.SUCCESS.name());
            jobLog.setResultMsg("执行成功");
        } catch (Exception e) {
            log.error("定时任务 {}（{}）执行失败", jobId, jobInfo.getJobName(), e);
            jobLog.setExecStatus(ExecStatus.FAILED.name());
            jobLog.setResultMsg(e.getMessage());
            jobLog.setExceptionStack(getStackTrace(e));
        } finally {
            // 5. 更新日志
            jobLog.setEndTime(LocalDateTime.now());
            jobLog.setDuration(
                    java.time.Duration.between(jobLog.getStartTime(), jobLog.getEndTime()).toMillis());
            jobLogService.updateById(jobLog);

            // 6. 更新 JobInfo 执行时间
            jobInfo.setLastFireTime(jobLog.getStartTime());
            jobInfo.setNextFireTime(context.getNextFireTime() != null
                    ? context.getNextFireTime().toInstant()
                            .atZone(java.time.ZoneId.systemDefault())
                            .toLocalDateTime()
                    : null);
            jobInfoService.updateById(jobInfo);
        }
    }

    private void executeBean(JobInfo jobInfo) throws Exception {
        if (jobInfo.getBeanName() == null || jobInfo.getBeanName().isBlank()) {
            throw new IllegalStateException("BEAN 类型任务缺少 beanName");
        }
        if (handlerMap == null || !handlerMap.containsKey(jobInfo.getBeanName())) {
            throw new IllegalStateException("未找到 JobHandler Bean: " + jobInfo.getBeanName());
        }
        JobHandler handler = handlerMap.get(jobInfo.getBeanName());
        handler.execute(jobInfo.getBeanParams());
    }

    private void executeFlow(JobInfo jobInfo) {
        if (jobInfo.getFlowDefKey() == null || jobInfo.getFlowDefKey().isBlank()) {
            throw new IllegalStateException("FLOW 类型任务缺少 flowDefKey");
        }
        ScheduledFlowTriggerEvent event = new ScheduledFlowTriggerEvent(
                jobInfo.getId(),
                jobInfo.getFlowDefKey(),
                jobInfo.getFormData(),
                LocalDateTime.now(),
                jobInfo.getTenantId()
        );
        eventPublisher.publish(event);
        log.info("FLOW 定时任务事件已发布: jobId={}, flowDefKey={}", jobInfo.getId(), jobInfo.getFlowDefKey());
    }

    private String getStackTrace(Exception e) {
        java.io.StringWriter sw = new java.io.StringWriter();
        java.io.PrintWriter pw = new java.io.PrintWriter(sw);
        e.printStackTrace(pw);
        return sw.toString();
    }
}
```

### 9.12 创建 QuartzSchedulerService

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/service/QuartzSchedulerService.java`

封装 Quartz Scheduler 的调度操作（添加/删除/暂停/恢复/立即触发），统一使用 `SwJobBean.class` 作为 Job 执行体。

```java
package com.sw.ck.job.service;

import com.sw.ck.job.entity.JobInfo;
import com.sw.ck.job.enums.JobStatus;
import com.sw.ck.job.enums.TriggerType;
import com.sw.ck.job.scheduler.SwJobBean;
import org.quartz.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.TimeZone;

/**
 * Quartz 调度器封装。
 * <p>
 * 不直接暴露 {@link Scheduler} API，统一经本 Service 管理任务调度生命周期。
 * 所有方法内部捕获 {@link SchedulerException} 并转为运行期异常。
 * </p>
 */
@Service
public class QuartzSchedulerService {

    private static final Logger log = LoggerFactory.getLogger(QuartzSchedulerService.class);

    private final Scheduler scheduler;

    public QuartzSchedulerService(Scheduler scheduler) {
        this.scheduler = scheduler;
    }

    /**
     * 将任务注册到 Quartz 调度器并启动。
     *
     * @param jobInfo 任务定义
     */
    public void addJob(JobInfo jobInfo) {
        JobDetail jobDetail = buildJobDetail(jobInfo);
        CronTrigger trigger = buildCronTrigger(jobInfo);
        try {
            scheduler.scheduleJob(jobDetail, trigger);
            log.info("定时任务已注册: jobId={}, jobName={}, cron={}",
                    jobInfo.getId(), jobInfo.getJobName(), jobInfo.getCronExpression());
        } catch (SchedulerException e) {
            throw new RuntimeException("注册定时任务失败: " + jobInfo.getJobName(), e);
        }
    }

    /**
     * 从 Quartz 调度器中移除任务。
     *
     * @param jobInfo 任务定义
     */
    public void removeJob(JobInfo jobInfo) {
        JobKey jobKey = toJobKey(jobInfo);
        try {
            scheduler.deleteJob(jobKey);
            log.info("定时任务已移除: jobId={}, jobName={}", jobInfo.getId(), jobInfo.getJobName());
        } catch (SchedulerException e) {
            throw new RuntimeException("移除定时任务失败: " + jobInfo.getJobName(), e);
        }
    }

    /**
     * 暂停任务（状态变为 PAUSED，不再触发）。
     *
     * @param jobInfo 任务定义
     */
    public void pauseJob(JobInfo jobInfo) {
        JobKey jobKey = toJobKey(jobInfo);
        try {
            scheduler.pauseJob(jobKey);
            log.info("定时任务已暂停: jobId={}, jobName={}", jobInfo.getId(), jobInfo.getJobName());
        } catch (SchedulerException e) {
            throw new RuntimeException("暂停定时任务失败: " + jobInfo.getJobName(), e);
        }
    }

    /**
     * 恢复已暂停的任务。
     *
     * @param jobInfo 任务定义
     */
    public void resumeJob(JobInfo jobInfo) {
        JobKey jobKey = toJobKey(jobInfo);
        try {
            scheduler.resumeJob(jobKey);
            log.info("定时任务已恢复: jobId={}, jobName={}", jobInfo.getId(), jobInfo.getJobName());
        } catch (SchedulerException e) {
            throw new RuntimeException("恢复定时任务失败: " + jobInfo.getJobName(), e);
        }
    }

    /**
     * 立即触发一次任务执行（手动触发）。
     *
     * @param jobInfo 任务定义
     */
    public void triggerOnce(JobInfo jobInfo) {
        JobDataMap dataMap = new JobDataMap();
        dataMap.put(SwJobBean.JOB_ID_KEY, jobInfo.getId());
        dataMap.put(SwJobBean.TRIGGER_TYPE_KEY, TriggerType.MANUAL.name());
        JobKey jobKey = toJobKey(jobInfo);
        try {
            // 检查任务是否已在 Quartz 中注册
            if (!scheduler.checkExists(jobKey)) {
                // 手动触发时如果任务未注册，先临时注册
                JobDetail jobDetail = buildJobDetail(jobInfo);
                scheduler.addJob(jobDetail, true);
            }
            scheduler.triggerJob(jobKey, dataMap);
            log.info("手动触发定时任务: jobId={}, jobName={}", jobInfo.getId(), jobInfo.getJobName());
        } catch (SchedulerException e) {
            throw new RuntimeException("手动触发定时任务失败: " + jobInfo.getJobName(), e);
        }
    }

    /**
     * 检查任务是否已在 Quartz 调度器中注册。
     *
     * @param jobInfo 任务定义
     * @return true=已注册
     */
    public boolean exists(JobInfo jobInfo) {
        try {
            return scheduler.checkExists(toJobKey(jobInfo));
        } catch (SchedulerException e) {
            return false;
        }
    }

    // ─── 内部方法 ───

    private JobDetail buildJobDetail(JobInfo jobInfo) {
        JobDataMap dataMap = new JobDataMap();
        dataMap.put(SwJobBean.JOB_ID_KEY, jobInfo.getId());
        dataMap.put(SwJobBean.TRIGGER_TYPE_KEY, TriggerType.AUTO.name());

        return JobBuilder.newJob(SwJobBean.class)
                .withIdentity(toJobKey(jobInfo))
                .withDescription(jobInfo.getDescription())
                .usingJobData(dataMap)
                .storeDurably()
                .build();
    }

    private CronTrigger buildCronTrigger(JobInfo jobInfo) {
        CronScheduleBuilder scheduleBuilder = CronScheduleBuilder
                .cronSchedule(jobInfo.getCronExpression())
                .inTimeZone(TimeZone.getDefault());

        // misfire 策略映射
        if (jobInfo.getMisfirePolicy() != null) {
            switch (jobInfo.getMisfirePolicy()) {
                case 0 -> scheduleBuilder.withMisfireHandlingInstructionIgnoreMisfires();
                case 1 -> scheduleBuilder.withMisfireHandlingInstructionFireAndProceed();
                case 2 -> scheduleBuilder.withMisfireHandlingInstructionDoNothing();
            }
        }

        return TriggerBuilder.newTrigger()
                .withIdentity(toTriggerKey(jobInfo))
                .withSchedule(scheduleBuilder)
                .build();
    }

    private JobKey toJobKey(JobInfo jobInfo) {
        return new JobKey(jobInfo.getJobName(), jobInfo.getJobGroup());
    }

    private TriggerKey toTriggerKey(JobInfo jobInfo) {
        return new TriggerKey(jobInfo.getJobName() + "_trigger", jobInfo.getJobGroup());
    }
}
```

### 9.13 更新 JobAutoConfiguration — 追加扫描路径

当前 `@ComponentScan`：
```java
@ComponentScan({"com.sw.ck.job.controller", "com.sw.ck.job.service", "com.sw.ck.job.impl"})
```

修改为（追加 `"com.sw.ck.job.scheduler"`）：
```java
@ComponentScan({"com.sw.ck.job.controller", "com.sw.ck.job.service", "com.sw.ck.job.impl", "com.sw.ck.job.scheduler"})
```

> 注：`com.sw.ck.job.scheduler` 中的 `SwJobBean` 标注了 `@Component` 但为 Quartz 内部实例化（prototype scope），`@ComponentScan` 保证 Spring 能扫描到它并注入 `@Autowired` 依赖。`QuartzSchedulerService` 在 `com.sw.ck.job.service` 包下，已覆盖。

### 9.14 编译验证

```bash
cd Smart-WorkFlow
mvn -q compile
```

## 10. 关键实现约束

1. **JobHandler 是 SPI 接口**：定义于 `-api`，实现类在 `-biz` 或任何依赖 `-api` 的业务模块中注册为 Spring Bean
2. **BEAN 类型通过 Map 注入**：使用 `@Autowired(required = false) Map<String, JobHandler> handlerMap` 收集所有 Handler 实现，按 beanName 匹配
3. **FLOW 事件经 DomainEventPublisher 发布**：不直接调 `ApplicationEventPublisher`，遵循 thin-wrapper 约定
4. **QuartzSchedulerService 封装所有调度操作**：Controller 不直接接触 `Scheduler` API
5. **Service 层实现遵循既有模式**：`extends BaseServiceImpl<Mapper, Entity> implements XxxService`
6. **枚举 name() 存入数据库**：`JobType.name()` / `JobStatus.name()` 存入 VARCHAR 列，读取时用 `JobType.valueOf(str)`
7. **SwJobBean 通过 Quartz 的 SpringBeanJobFactory 实例化**：`@Autowired` 字段由 Spring 注入，不走 `new`
8. **并发控制**：`concurrent=false` 时检查是否有 RUNNING 日志（状态机：RUNNING → SUCCESS/FAILED）
9. **删除即时生效**：SwJobBean 执行前查 JobInfo，已删除则跳过；调度器侧由 Controller 在删除时调用 `removeJob`
10. **不配置 QuartzProperties**：当前使用 Spring Boot 默认 Quartz 配置（RAMJobStore、默认线程池），无需额外配置类

## 11. 边界情况

| 场景 | 处理方式 |
|------|----------|
| BEAN 类型但 beanName 为空 | 执行时抛 `IllegalStateException("BEAN 类型任务缺少 beanName")`，记入 JobLog |
| FLOW 类型但 flowDefKey 为空 | 执行时抛 `IllegalStateException("FLOW 类型任务缺少 flowDefKey")`，记入 JobLog |
| beanName 对应的 Handler 不存在 | 执行时抛 `IllegalStateException("未找到 JobHandler Bean")`，记入 JobLog |
| 任务执行中 JobInfo 被删除 | SwJobBean 执行前检查，已删则跳过 |
| concurrent=false，上次未完成 | 检查 RUNNING 日志，有则跳过触发 |
| Handler.execute() 抛出异常 | 捕获后 JobLog 记 FAILED + 堆栈，不影响后续 Quartz 调度 |
| Cron 表达式非法 | Quartz 在 addJob 时抛 SchedulerException，由 Controller 层捕获返回错误 |
| Quartz Scheduler 未就绪 | Spring Boot 自动配置保证 Scheduler Bean 就绪，否则启动即失败 |
| 多个 Handler 实现同名 | Spring Bean 名称唯一性保证（重复 Bean 名启动报错） |
| handlerMap 为 null（无任何 Handler 注册） | `executeBean` 中判 null 并抛异常 |

## 12. 风险和回滚方案

### 风险
- **R1**：Quartz RAMJobStore 在应用重启后丢失所有 Job（需在启动时从 DB 重新注册所有 NORMAL 状态的 JobInfo）— 本 Step 暂不实现启动恢复（延后到 B3 Controller save 时主动注册）
- **R2**：SwJobBean 中 @Autowired handlerMap 注入原型 Bean 可能不工作（QuartzJobBean 实例化时机）— Quartz 的 SpringBeanJobFactory 支持 @Autowired 注入

### 回滚步骤
1. 删除 B2 所有新建文件（12 个）
2. 恢复 `JobAutoConfiguration.java` 的 `@ComponentScan` 为原值
3. `mvn -q compile` 验证

## 13. 测试方案

### 13.1 静态检查

```bash
# 1. 确认枚举文件存在
find sw-basic/sw-basic-job -name "*.java" -type f | grep -E "enums|handler|event|scheduler" | sort

# 2. 确认 JobHandler 接口声明了 execute 和 getName 两个方法
grep -A5 "public interface JobHandler" sw-basic/sw-basic-job/sw-basic-job-api/src/main/java/com/sw/ck/job/handler/JobHandler.java

# 3. 确认 SwJobBean extends QuartzJobBean
grep "extends QuartzJobBean" sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/scheduler/SwJobBean.java

# 4. 确认 QuartzSchedulerService 注入 Scheduler
grep "private final Scheduler" sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/service/QuartzSchedulerService.java

# 5. 确认 AutoConfiguration @ComponentScan 包含 scheduler 包
grep "ComponentScan" sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/config/JobAutoConfiguration.java
```

### 13.2 单元测试

本 Step 不创建独立单元测试文件（Service 层测试在 B4 集成测试中覆盖）。编译通过即为可验证状态。

### 13.3 集成测试

本 Step 不要求集成测试（Controller 不存在，无法端到端验证）。在 B4 结合 Controller 统一覆盖。

### 13.4 手工验证

无需手工验证。

### 13.5 回归检查

```bash
cd Smart-WorkFlow
mvn -q compile && mvn -q test
```

- 编译退出码 0
- 全量测试通过（测试数量不减少）
- 预期基线：≥166 tests

## 14. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| C1 | `JobType.java` 枚举存在于 `-api/enums/`，含 BEAN/FLOW 两个值 | 文件内容审查 |
| C2 | `JobStatus.java` 枚举存在于 `-api/enums/`，含 NORMAL/PAUSED 两个值 | 文件内容审查 |
| C3 | `JobHandler.java` 接口存在于 `-api/handler/`，声明 execute(String) 和 getName() | 文件内容审查 |
| C4 | `ScheduledFlowTriggerEvent.java` 存在于 `-api/event/`，含 jobId/flowDefKey/formData/fireTime/tenantId 五个字段 | 文件内容审查 |
| C5 | `TriggerType.java` 枚举存在于 `-biz/enums/`，含 AUTO/MANUAL | 文件内容审查 |
| C6 | `ExecStatus.java` 枚举存在于 `-biz/enums/`，含 RUNNING/SUCCESS/FAILED | 文件内容审查 |
| C7 | `JobInfoService.java` 接口 `extends BaseService<JobInfo>`，声明 getByJobName + listEnabled | 文件内容审查 |
| C8 | `JobInfoServiceImpl.java` 实现 `JobInfoService`，`extends BaseServiceImpl` | 文件内容审查 |
| C9 | `JobLogService.java` 接口 `extends BaseService<JobLog>`，声明 listByJobId + getLatestByJobId | 文件内容审查 |
| C10 | `JobLogServiceImpl.java` 实现 `JobLogService`，`extends BaseServiceImpl` | 文件内容审查 |
| C11 | `QuartzSchedulerService.java` 封装 Scheduler，提供 addJob/removeJob/pauseJob/resumeJob/triggerOnce 五个方法 | 文件内容审查 |
| C12 | `SwJobBean.java` `extends QuartzJobBean`，实现 executeInternal，包含 BEAN/FLOW 双分支 + 并发控制 + JobLog 记录 | 文件内容审查 |
| C13 | `JobAutoConfiguration.java` 的 `@ComponentScan` 包含 `"com.sw.ck.job.scheduler"` | grep 确认 |
| C14 | `mvn -q compile` 退出码 0 | 命令执行 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step B2

## 1. Step 编号和名称
B2 — JobHandler + Service + Quartz 调度

## 2. 使用模型
（实际使用的模型）

## 3. 实际读取的文件
（逐文件列出）

## 4. 实际修改的文件
（新建/修改区分标注）

## 5. 每个文件的修改摘要
（改动点、行数、原因）

## 6. 实际执行的命令
（逐条列出）

## 7. 命令输出摘要
（编译结果、测试结果、退出码）

## 8. 与原方案的偏差
（与方案的差异及原因）

## 9. 遇到的问题
（技术/环境/理解偏差及解决方式）

## 10. 未完成内容
（方案要求但未完成的内容及原因）

## 11. 风险和注意事项

## 12. Git diff 摘要
（改动文件数、新增/删除行数、关键变更点）

## 13. 建议执行的测试
```

## 16. 测试回执格式

本 Step 不要求独立测试回执（只编译验证，无新增测试文件）。编译 + 回归结果在 §15 执行回执 §7 中体现。

## 17. 明确禁止事项

- ❌ **不要** 创建 Controller、Facade 接口/实现（B3 范围）
- ❌ **不要** 创建 QuartzConfig / QuartzProperties 配置类（Spring Boot 自动配置已提供 Scheduler）
- ❌ **不要** 创建启动时自动恢复 Job 的逻辑（应用重启恢复在 B3 Controller 中实现）
- ❌ **不要** 修改 Entity / Mapper（B1 已定稿）
- ❌ **不要** 修改 POM 文件
- ❌ **不要** 修改 Flyway 迁移脚本
- ❌ **不要** 创建测试文件（B4 中统一创建）
- ❌ **不要** 在 `QuartzSchedulerService` 中使用 JobInfoMapper 直接操作数据库（应通过 JobInfoService）
- ❌ **不要** 在 `SwJobBean.executeInternal` 中吃掉异常（异常必须 catch 并记录到 JobLog FAILED）
- ❌ **不要** 触碰前端项目
- ❌ **不要** 直接调用 `ApplicationEventPublisher.publishEvent`（必须经 `DomainEventPublisher`）
