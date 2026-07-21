# Step B3：Controller + Facade

## 1. 当前状态

- **功能**：job-scheduler（定时任务调度模块），第 3/7 Step
- **前置 Step**：B1 PASSED ✅（模块拆分 + Flyway + Entity/Mapper/配置）· B2 PASSED ✅（JobHandler + Service + Quartz 调度）
- **B2 产物**：12 新建文件（4 枚举 + JobHandler SPI + ScheduledFlowTriggerEvent + 4 Service 接口/实现 + QuartzSchedulerService + SwJobBean）+ 1 修改（JobAutoConfiguration）
- **当前可注入的 Bean**：`JobInfoService`、`JobLogService`、`QuartzSchedulerService`、`JobInfoMapper`、`JobLogMapper`、`JobProperties`
- **当前 ComponentScan 覆盖**：`com.sw.ck.job.controller`、`com.sw.ck.job.service`、`com.sw.ck.job.impl`、`com.sw.ck.job.scheduler`
- **后端全量测试基线**：166 tests（B1 验收基线，B2 无新增测试文件）

## 2. Step 目标

实现定时任务模块的 REST 控制器（JobInfoController + JobLogController）、Facade 接口与实现（JobFacade + JobFacadeImpl），以及应用启动时自动恢复 Quartz 调度（JobStartupRunner）。至此，后端所有业务代码就位，仅剩 B4 测试。

## 3. 推荐模型

推荐模型：deepseek-v4-flash
选择理由：标准 Controller CRUD + Facade 薄封装，模式参照 DictController/StorageController/NotifyFacade，不涉及多约束收敛场景。
是否触发升级条件：否

## 4. 模型选择理由

本 Step 将 B2 已就位的 Service/QuartzSchedulerService 暴露为 REST 端点，全部为已有项目模式的照搬：Controller 构造函数注入 → `R<T>` 包装返回 → `PageParam`/`PageResult` 分页 → `BaseException` 错误处理。Facade 模式参照 NotifyFacade/StorageFacade。无架构决策点，纯 CRUD 落地。

## 5. 已知上下文

### 5.1 现有模式（必须严格遵守）

| 模式 | 参照 | 说明 |
|------|------|------|
| 响应包装 | `R<T>` (`sw-common`) | `R.ok(data)` / `R.ok()` / `R.fail(msg)` |
| 分页 | `PageParam` + `PageResult<T>` | `PageResult.of(IPage<T>)` 转换 |
| 错误处理 | `BaseException(CommonErrorCode.xxx.getCode(), "msg")` | 参数校验、资源不存在 |
| 构造函数注入 | DictController 手动构造 / StorageController `@RequiredArgsConstructor` | 两种方式均可，本 Step 用手动构造 |
| 请求路径 | 统一 `/job/xxx` | 参照 `/notify/messages`、`/storage/files` |
| Facade 接口 | 定义于 `-api`，`@Service` 实现于 `-biz/impl/` | 参照 NotifyFacade/StorageFacade |
| 用户上下文 | `LoginUserHolder.get()` | 获取当前登录用户 ID |

### 5.2 关键架构决策

- **Controller 不直接接触 `Scheduler` API**：所有 Quartz 操作经 `QuartzSchedulerService` 封装
- **创建任务时自动注册**：JobInfoController 保存后若 status=NORMAL，调用 `QuartzSchedulerService.addJob()`
- **启动恢复**：通过 `ApplicationRunner` 实现，应用启动后从 DB 查询所有 NORMAL 状态任务并注册到 Quartz（RAMJobStore 重启丢失）
- **Facade 接口**：定义于 `-api`，供其他模块（如 BPM）查询任务信息，薄封装 `JobInfoService`

### 5.3 包路径规划

| 类 | 包 |
|------|------|
| `JobFacade` | `com.sw.ck.job.facade`（-api，新建） |
| `JobFacadeImpl` | `com.sw.ck.job.impl`（-biz，已扫描） |
| `JobInfoController` | `com.sw.ck.job.controller`（-biz，已扫描） |
| `JobLogController` | `com.sw.ck.job.controller`（-biz，已扫描） |
| `JobStartupRunner` | `com.sw.ck.job.scheduler`（-biz，已扫描） |

> 所有包均在已有 `@ComponentScan` 覆盖范围内，无需修改 `JobAutoConfiguration`。

## 6. 执行前必须读取的文件

按优先级排列：

1. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/response/R.java` — 响应包装
2. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/page/PageParam.java` — 分页参数
3. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/page/PageResult.java` — 分页结果
4. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/exception/BaseException.java` — 异常类
5. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/exception/CommonErrorCode.java` — 错误码枚举
6. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/DictController.java` — Controller 模式参照
7. `Smart-WorkFlow/sw-basic/sw-basic-notify/sw-basic-notify-api/src/main/java/com/sw/ck/notify/api/NotifyFacade.java` — Facade 接口参照
8. `Smart-WorkFlow/sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/impl/NotifyFacadeImpl.java` — Facade 实现参照
9. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/service/QuartzSchedulerService.java` — 调度器封装（Controller 依赖）
10. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/service/JobInfoService.java` — 任务 Service 接口
11. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/service/JobLogService.java` — 日志 Service 接口
12. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/entity/JobInfo.java` — Entity 字段
13. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/entity/JobLog.java` — Entity 字段
14. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-api/src/main/java/com/sw/ck/job/enums/JobStatus.java` — 状态枚举
15. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-api/src/main/java/com/sw/ck/job/enums/JobType.java` — 类型枚举

## 7. 允许修改的文件范围

### 新建文件（5 个）

| # | 位置 | 文件 | 说明 |
|---|:----:|------|------|
| 1 | `-api` | `src/main/java/com/sw/ck/job/facade/JobFacade.java` | Facade 接口 |
| 2 | `-biz` | `src/main/java/com/sw/ck/job/impl/JobFacadeImpl.java` | Facade 实现 |
| 3 | `-biz` | `src/main/java/com/sw/ck/job/controller/JobInfoController.java` | 任务定义 Controller |
| 4 | `-biz` | `src/main/java/com/sw/ck/job/controller/JobLogController.java` | 执行日志 Controller |
| 5 | `-biz` | `src/main/java/com/sw/ck/job/scheduler/JobStartupRunner.java` | 启动恢复 Runner |

### 修改文件（0 个）

> 所有新建类的包已在 `@ComponentScan` 覆盖范围内，无需修改 `JobAutoConfiguration`。

## 8. 禁止修改的范围

- ❌ `sw-biz-system/`、`sw-biz-form/`、`sw-bpm/` 中的任何文件
- ❌ `sw-basic-notify/`、`sw-basic-storage/` 中的任何文件
- ❌ `sw-framework/` 中的任何文件（R、PageParam、PageResult、BaseException 等基类不动）
- ❌ Entity 文件（JobInfo.java、JobLog.java）— B1 已定稿
- ❌ Service 接口/实现（JobInfoService、JobLogService、QuartzSchedulerService）— B2 已定稿
- ❌ Mapper 文件
- ❌ POM 文件
- ❌ Flyway 迁移脚本
- ❌ `application.yml` / `application-dev.yml`
- ❌ `JobAutoConfiguration.java`（ComponentScan 已覆盖，无需改动）
- ❌ `Smart-WorkFlow-Web/` 中的任何文件

## 9. 详细执行方案

### 9.1 创建 JobFacade 接口

路径：`sw-basic-job-api/src/main/java/com/sw/ck/job/facade/JobFacade.java`

```java
package com.sw.ck.job.facade;

import com.sw.ck.job.entity.JobInfo;

/**
 * 定时任务门面接口。
 * <p>
 * 定义于 {@code -api} 模块，实现于 {@code -biz} 模块。
 * 供其他模块（如 BPM）通过 Facade 模式查询任务信息。
 * </p>
 */
public interface JobFacade {

    /**
     * 按 ID 查询任务定义。
     *
     * @param jobId 任务 ID
     * @return 任务定义，不存在返回 null
     */
    JobInfo getById(Long jobId);

    /**
     * 按名称查询任务定义。
     *
     * @param jobName 任务名称
     * @return 任务定义，不存在返回 null
     */
    JobInfo getByJobName(String jobName);
}
```

### 9.2 创建 JobFacadeImpl

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/impl/JobFacadeImpl.java`

```java
package com.sw.ck.job.impl;

import com.sw.ck.job.entity.JobInfo;
import com.sw.ck.job.facade.JobFacade;
import com.sw.ck.job.service.JobInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * 定时任务门面实现。
 * <p>
 * 薄封装 {@link JobInfoService}，对外暴露为 Facade 接口。
 * </p>
 */
@Service
@RequiredArgsConstructor
public class JobFacadeImpl implements JobFacade {

    private final JobInfoService jobInfoService;

    @Override
    public JobInfo getById(Long jobId) {
        return jobInfoService.getById(jobId);
    }

    @Override
    public JobInfo getByJobName(String jobName) {
        return jobInfoService.getByJobName(jobName);
    }
}
```

### 9.3 创建 JobInfoController

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/controller/JobInfoController.java`

提供任务定义的完整 CRUD + 调度控制接口：

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/job/info/page` | 分页查询 |
| GET | `/job/info/{id}` | 按 ID 查询 |
| POST | `/job/info` | 创建任务 |
| PUT | `/job/info` | 更新任务 |
| DELETE | `/job/info/{id}` | 删除任务（软删除 + 移除 Quartz 调度） |
| POST | `/job/info/{id}/pause` | 暂停任务 |
| POST | `/job/info/{id}/resume` | 恢复任务 |
| POST | `/job/info/{id}/trigger` | 手动触发一次 |

```java
package com.sw.ck.job.controller;

import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.job.entity.JobInfo;
import com.sw.ck.job.enums.JobStatus;
import com.sw.ck.job.service.JobInfoService;
import com.sw.ck.job.service.QuartzSchedulerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

/**
 * 定时任务定义控制器。
 * <p>
 * 提供任务 CRUD 与调度控制（暂停/恢复/手动触发）接口。
 * 所有 Quartz 调度操作经 {@link QuartzSchedulerService} 封装，不直接接触 {@code Scheduler} API。
 * </p>
 */
@RestController
@RequestMapping("/job/info")
public class JobInfoController {

    private static final Logger log = LoggerFactory.getLogger(JobInfoController.class);

    private final JobInfoService jobInfoService;
    private final QuartzSchedulerService quartzSchedulerService;

    public JobInfoController(JobInfoService jobInfoService,
                             QuartzSchedulerService quartzSchedulerService) {
        this.jobInfoService = jobInfoService;
        this.quartzSchedulerService = quartzSchedulerService;
    }

    /**
     * 分页查询任务定义。
     */
    @PostMapping("/page")
    public R<PageResult<JobInfo>> page(@RequestParam(defaultValue = "1") long pageNum,
                                        @RequestParam(defaultValue = "10") long pageSize,
                                        @RequestBody(required = false) JobInfo query) {
        PageParam pageParam = new PageParam();
        pageParam.setPageNum(pageNum);
        pageParam.setPageSize(pageSize);
        return R.ok(jobInfoService.page(pageParam, query));
    }

    /**
     * 按 ID 查询任务定义。
     */
    @GetMapping("/{id}")
    public R<JobInfo> getById(@PathVariable Long id) {
        JobInfo jobInfo = jobInfoService.getById(id);
        if (jobInfo == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "任务不存在");
        }
        return R.ok(jobInfo);
    }

    /**
     * 创建任务。
     * <p>
     * 保存到数据库后，若状态为 NORMAL 则立即注册到 Quartz 调度器。
     * 保存失败时回滚数据库，不会残留 Quartz 注册。
     * </p>
     */
    @PostMapping
    public R<Long> create(@RequestBody JobInfo jobInfo) {
        // 参数校验
        if (jobInfo.getJobName() == null || jobInfo.getJobName().isBlank()) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR.getCode(), "任务名称不能为空");
        }
        if (jobInfo.getCronExpression() == null || jobInfo.getCronExpression().isBlank()) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR.getCode(), "Cron 表达式不能为空");
        }
        // 默认值
        if (jobInfo.getJobGroup() == null || jobInfo.getJobGroup().isBlank()) {
            jobInfo.setJobGroup("DEFAULT");
        }
        if (jobInfo.getStatus() == null) {
            jobInfo.setStatus(JobStatus.NORMAL.name());
        }
        if (jobInfo.getJobType() == null) {
            jobInfo.setJobType("BEAN");
        }
        if (jobInfo.getConcurrent() == null) {
            jobInfo.setConcurrent(false);
        }
        if (jobInfo.getMisfirePolicy() == null) {
            jobInfo.setMisfirePolicy(0);
        }

        jobInfoService.save(jobInfo);
        log.info("任务已创建: id={}, jobName={}", jobInfo.getId(), jobInfo.getJobName());

        // 若状态为 NORMAL，注册到 Quartz
        if (JobStatus.NORMAL.name().equals(jobInfo.getStatus())) {
            try {
                quartzSchedulerService.addJob(jobInfo);
            } catch (Exception e) {
                log.error("任务注册到 Quartz 失败: jobId={}, jobName={}", jobInfo.getId(), jobInfo.getJobName(), e);
                // 不回滚数据库保存（任务已落库，可后续手动恢复）
            }
        }

        return R.ok(jobInfo.getId());
    }

    /**
     * 更新任务。
     * <p>
     * 更新数据库后，若之前在 Quartz 中已注册则先移除再重新注册（以应用新的 Cron 等配置）。
     * 若状态改为 PAUSED，则从 Quartz 移除。
     * </p>
     */
    @PutMapping
    public R<Void> update(@RequestBody JobInfo jobInfo) {
        if (jobInfo.getId() == null) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR.getCode(), "任务 ID 不能为空");
        }
        JobInfo existing = jobInfoService.getById(jobInfo.getId());
        if (existing == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "任务不存在");
        }

        // 若之前已在 Quartz 中注册，先移除
        if (quartzSchedulerService.exists(existing)) {
            quartzSchedulerService.removeJob(existing);
        }

        // 更新数据库
        jobInfoService.updateById(jobInfo);

        // 若新状态为 NORMAL，重新注册
        JobInfo updated = jobInfoService.getById(jobInfo.getId());
        if (JobStatus.NORMAL.name().equals(updated.getStatus())) {
            try {
                quartzSchedulerService.addJob(updated);
            } catch (Exception e) {
                log.error("任务更新后重新注册到 Quartz 失败: jobId={}, jobName={}",
                        updated.getId(), updated.getJobName(), e);
            }
        }

        log.info("任务已更新: id={}, jobName={}", jobInfo.getId(), jobInfo.getJobName());
        return R.ok();
    }

    /**
     * 删除任务（软删除 + 从 Quartz 移除）。
     * <p>
     * 幂等：任务不存在时不报错，直接返回成功。
     * </p>
     */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        JobInfo jobInfo = jobInfoService.getById(id);
        if (jobInfo == null) {
            return R.ok();
        }

        // 从 Quartz 移除
        if (quartzSchedulerService.exists(jobInfo)) {
            quartzSchedulerService.removeJob(jobInfo);
        }

        // 软删除（BaseEntity 的 deleted 标记）
        jobInfoService.removeById(id);
        log.info("任务已删除: id={}, jobName={}", id, jobInfo.getJobName());
        return R.ok();
    }

    /**
     * 暂停任务。
     * <p>
     * 数据库状态改为 PAUSED，Quartz 调度器暂停该任务。
     * </p>
     */
    @PostMapping("/{id}/pause")
    public R<Void> pause(@PathVariable Long id) {
        JobInfo jobInfo = jobInfoService.getById(id);
        if (jobInfo == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "任务不存在");
        }
        if (JobStatus.PAUSED.name().equals(jobInfo.getStatus())) {
            return R.ok(); // 幂等
        }

        // 暂停 Quartz 调度
        if (quartzSchedulerService.exists(jobInfo)) {
            quartzSchedulerService.pauseJob(jobInfo);
        }

        // 更新数据库状态
        jobInfo.setStatus(JobStatus.PAUSED.name());
        jobInfoService.updateById(jobInfo);
        log.info("任务已暂停: id={}, jobName={}", id, jobInfo.getJobName());
        return R.ok();
    }

    /**
     * 恢复任务。
     * <p>
     * 数据库状态改为 NORMAL，Quartz 调度器恢复该任务。
     * 若任务未在 Quartz 中注册（如应用重启后），则重新注册。
     * </p>
     */
    @PostMapping("/{id}/resume")
    public R<Void> resume(@PathVariable Long id) {
        JobInfo jobInfo = jobInfoService.getById(id);
        if (jobInfo == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "任务不存在");
        }
        if (JobStatus.NORMAL.name().equals(jobInfo.getStatus())) {
            return R.ok(); // 幂等
        }

        // 更新数据库状态
        jobInfo.setStatus(JobStatus.NORMAL.name());
        jobInfoService.updateById(jobInfo);

        // 注册或恢复 Quartz 调度
        if (quartzSchedulerService.exists(jobInfo)) {
            quartzSchedulerService.resumeJob(jobInfo);
        } else {
            try {
                quartzSchedulerService.addJob(jobInfo);
            } catch (Exception e) {
                log.error("恢复任务时注册到 Quartz 失败: jobId={}, jobName={}",
                        id, jobInfo.getJobName(), e);
            }
        }

        log.info("任务已恢复: id={}, jobName={}", id, jobInfo.getJobName());
        return R.ok();
    }

    /**
     * 手动触发一次任务执行。
     * <p>
     * 不改变调度计划，仅触发一次立即执行。
     * 任务状态为 PAUSED 时也可手动触发。
     * </p>
     */
    @PostMapping("/{id}/trigger")
    public R<Void> trigger(@PathVariable Long id) {
        JobInfo jobInfo = jobInfoService.getById(id);
        if (jobInfo == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "任务不存在");
        }
        quartzSchedulerService.triggerOnce(jobInfo);
        log.info("手动触发任务: id={}, jobName={}", id, jobInfo.getJobName());
        return R.ok();
    }
}
```

### 9.4 创建 JobLogController

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/controller/JobLogController.java`

```java
package com.sw.ck.job.controller;

import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.job.entity.JobLog;
import com.sw.ck.job.service.JobLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.*;

/**
 * 定时任务执行日志控制器。
 * <p>
 * 提供按任务 ID 查询执行日志分页列表与单条详情。
 * </p>
 */
@RestController
@RequestMapping("/job/log")
public class JobLogController {

    private static final Logger log = LoggerFactory.getLogger(JobLogController.class);

    private final JobLogService jobLogService;

    public JobLogController(JobLogService jobLogService) {
        this.jobLogService = jobLogService;
    }

    /**
     * 分页查询执行日志（按任务 ID 筛选）。
     *
     * @param jobId  任务 ID（必填）
     * @param pageNum  页码
     * @param pageSize 每页大小
     * @return 分页日志列表
     */
    @PostMapping("/page")
    public R<PageResult<JobLog>> page(@RequestParam Long jobId,
                                       @RequestParam(defaultValue = "1") long pageNum,
                                       @RequestParam(defaultValue = "10") long pageSize) {
        if (jobId == null) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR.getCode(), "任务 ID 不能为空");
        }
        PageParam pageParam = new PageParam();
        pageParam.setPageNum(pageNum);
        pageParam.setPageSize(pageSize);
        // 按 jobId 查询，按创建时间倒序
        return R.ok(jobLogService.page(pageParam, jobId));
    }

    /**
     * 按 ID 查询单条日志详情。
     */
    @GetMapping("/{id}")
    public R<JobLog> getById(@PathVariable Long id) {
        JobLog jobLog = jobLogService.getById(id);
        if (jobLog == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "日志不存在");
        }
        return R.ok(jobLog);
    }
}
```

> **注意**：`JobLogController.page` 方法需要 `JobLogService` 支持 `page(PageParam, Long jobId)` 方法。当前 `JobLogService` 接口仅声明了 `listByJobId` 和 `getLatestByJobId`。需在 B2 产物基础上追加一个分页查询方法。

**对 `JobLogService` 接口的追加方法**（在已有接口中新增）：

```java
/**
 * 按任务 ID 分页查询执行日志。
 *
 * @param pageParam 分页参数
 * @param jobId     任务 ID
 * @return 分页结果
 */
PageResult<JobLog> page(PageParam pageParam, Long jobId);
```

**对 `JobLogServiceImpl` 的追加方法**（在已有实现类中新增）：

```java
@Override
public PageResult<JobLog> page(PageParam pageParam, Long jobId) {
    com.baomidou.mybatisplus.extension.plugins.pagination.Page<JobLog> mpPage =
            new com.baomidou.mybatisplus.extension.plugins.pagination.Page<>(
                    pageParam.getPageNum(), pageParam.getPageSize());
    com.baomidou.mybatisplus.extension.plugins.pagination.Page<JobLog> result =
            lambdaQuery()
                    .eq(JobLog::getJobId, jobId)
                    .orderByDesc(JobLog::getCreateTime)
                    .page(mpPage);
    return PageResult.of(result);
}
```

### 9.5 创建 JobStartupRunner

路径：`sw-basic-job-biz/src/main/java/com/sw/ck/job/scheduler/JobStartupRunner.java`

```java
package com.sw.ck.job.scheduler;

import com.sw.ck.job.entity.JobInfo;
import com.sw.ck.job.service.JobInfoService;
import com.sw.ck.job.service.QuartzSchedulerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * 应用启动时自动恢复 Quartz 定时任务调度。
 * <p>
 * Quartz 默认使用 RAMJobStore，应用重启后所有已注册的 Job 丢失。
 * 本 Runner 在应用启动完成后从数据库查询所有 NORMAL 状态的任务定义，
 * 并逐一重新注册到 Quartz 调度器。
 * </p>
 *
 * <h3>执行时机</h3>
 * {@link ApplicationRunner} 在所有 Bean 初始化完成、应用完全就绪后执行，
 * 确保 {@link QuartzSchedulerService} 和 {@link JobInfoService} 均可用。
 */
@Component
public class JobStartupRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(JobStartupRunner.class);

    private final JobInfoService jobInfoService;
    private final QuartzSchedulerService quartzSchedulerService;

    public JobStartupRunner(JobInfoService jobInfoService,
                            QuartzSchedulerService quartzSchedulerService) {
        this.jobInfoService = jobInfoService;
        this.quartzSchedulerService = quartzSchedulerService;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<JobInfo> enabledJobs = jobInfoService.listEnabled();
        if (enabledJobs.isEmpty()) {
            log.info("无待恢复的定时任务");
            return;
        }

        int successCount = 0;
        int failCount = 0;
        for (JobInfo jobInfo : enabledJobs) {
            try {
                // 跳过已在 Quartz 中注册的任务（防御性检查）
                if (quartzSchedulerService.exists(jobInfo)) {
                    log.info("任务已在 Quartz 中注册，跳过: jobId={}, jobName={}",
                            jobInfo.getId(), jobInfo.getJobName());
                    continue;
                }
                quartzSchedulerService.addJob(jobInfo);
                successCount++;
                log.info("定时任务已恢复: jobId={}, jobName={}, cron={}",
                        jobInfo.getId(), jobInfo.getJobName(), jobInfo.getCronExpression());
            } catch (Exception e) {
                failCount++;
                log.error("定时任务恢复失败: jobId={}, jobName={}, cron={}",
                        jobInfo.getId(), jobInfo.getJobName(), jobInfo.getCronExpression(), e);
            }
        }
        log.info("定时任务启动恢复完成: 总数={}, 成功={}, 失败={}",
                enabledJobs.size(), successCount, failCount);
    }
}
```

### 9.6 编译验证

```bash
cd Smart-WorkFlow
mvn -q compile
```

## 10. 关键实现约束

1. **Controller 不直接接触 `Scheduler` API**：所有 Quartz 操作经 `QuartzSchedulerService` 封装
2. **响应统一使用 `R<T>` 包装**：不使用裸返回类型
3. **分页使用 `PageParam` + `PageResult<T>`**：不使用 MyBatis-Plus `IPage` 直接暴露
4. **错误使用 `BaseException`**：不抛裸 `RuntimeException`，使用 `CommonErrorCode` 枚举
5. **Facade 接口定义于 `-api`**：实现于 `-biz/impl/`，遵循跨模块通信约定
6. **构造函数注入**：不使用 `@Autowired` 字段注入
7. **幂等操作**：删除不存在任务返回成功（目标态语义）；暂停已暂停任务返回成功
8. **创建/更新时 Quartz 注册失败不回滚数据库**：任务已落库，后续可通过手动恢复或重启恢复
9. **JobStartupRunner 实现 `ApplicationRunner`**：不自定义 `@PostConstruct`（确保所有 Bean 就绪）
10. **不修改 `JobAutoConfiguration`**：所有新建类包已在 `@ComponentScan` 覆盖范围内

## 11. 边界情况

| 场景 | 处理方式 |
|------|----------|
| 创建任务时 Cron 表达式非法 | Quartz 在 `addJob` 时抛 `SchedulerException`，Controller 捕获后 `log.error`，任务已落库但 Quartz 未注册 |
| 创建任务时 jobName 为空 | 抛 `BaseException(PARAM_ERROR, "任务名称不能为空")` |
| 创建任务时 cronExpression 为空 | 抛 `BaseException(PARAM_ERROR, "Cron 表达式不能为空")` |
| 更新不存在的任务 | 抛 `BaseException(NOT_FOUND, "任务不存在")` |
| 删除不存在的任务 | 幂等，返回成功 |
| 暂停已暂停的任务 | 幂等，返回成功 |
| 恢复已恢复的任务 | 幂等，返回成功 |
| 暂停未在 Quartz 中注册的任务 | 跳过 Quartz 操作，仅更新 DB 状态 |
| 恢复未在 Quartz 中注册的任务 | 重新注册到 Quartz |
| 手动触发未在 Quartz 中注册的任务 | `triggerOnce` 内部先 `addJob(..., true)` 注册 |
| 查询不存在的日志 | 抛 `BaseException(NOT_FOUND, "日志不存在")` |
| 启动恢复时 Cron 表达式非法 | 单条失败，`log.error` 后继续处理下一条 |
| 启动恢复时无 NORMAL 状态任务 | 静默跳过，日志输出 "无待恢复的定时任务" |

## 12. 风险和回滚方案

### 风险

- **R1**：Controller 更新任务时使用 `jobInfoService.updateById(jobInfo)`，MyBatis-Plus 默认 `updateById` 只更新非 null 字段（`FieldStrategy.NOT_NULL`）。若前端只传部分字段，未传字段不会被覆盖为 null。这是预期行为，但需在后续前端对接时注意。
- **R2**：`JobStartupRunner` 在 Quartz Scheduler 初始化之前运行——Spring Boot 自动配置保证 `Scheduler` bean 在 `ApplicationRunner` 之前就绪，但若 Quartz 自动配置被排除则启动失败。
- **R3**：Controller 未使用 `@Valid` 校验——Entity 字段未加 `@NotNull`/`@NotBlank` 等注解，基本参数校验在 Controller 方法体内手动完成。

### 回滚步骤

1. 删除 B3 所有新建文件（5 个）
2. 恢复 `JobLogService.java` 和 `JobLogServiceImpl.java` 中追加的 `page` 方法（删除新增代码）
3. `mvn -q compile` 验证

## 13. 测试方案

### 13.1 静态检查

```bash
# 1. 确认新建文件存在
find sw-basic/sw-basic-job -name "*.java" -type f | grep -E "JobFacade|JobInfoController|JobLogController|JobStartupRunner" | sort

# 2. 确认 Controller 使用 R<T> 包装
grep "R<" sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/controller/JobInfoController.java

# 3. 确认 Controller 不直接引用 Scheduler
grep "import org.quartz.Scheduler" sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/controller/JobInfoController.java || echo "PASS: 无直接 Scheduler 引用"

# 4. 确认 JobFacadeImpl 标注 @Service
grep "@Service" sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/impl/JobFacadeImpl.java

# 5. 确认 JobStartupRunner 实现 ApplicationRunner
grep "implements ApplicationRunner" sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/scheduler/JobStartupRunner.java
```

### 13.2 单元测试

本 Step 不创建独立单元测试文件。Controller 和 Facade 的测试在 B4 中统一覆盖。

### 13.3 集成测试

本 Step 不要求集成测试。在 B4 结合 Controller 测试统一覆盖。

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
| C1 | `JobFacade.java` 存在于 `-api/facade/`，声明 `getById(Long)` 和 `getByJobName(String)` | 文件内容审查 |
| C2 | `JobFacadeImpl.java` 存在于 `-biz/impl/`，标注 `@Service`，实现 `JobFacade` | 文件内容审查 |
| C3 | `JobInfoController.java` 存在于 `-biz/controller/`，提供 8 个端点（page/getById/create/update/delete/pause/resume/trigger） | 文件内容审查 |
| C4 | `JobInfoController` 所有方法返回 `R<T>` 类型 | 文件内容审查 |
| C5 | `JobInfoController` 不直接引用 `org.quartz.Scheduler`，所有 Quartz 操作经 `QuartzSchedulerService` | grep 确认 |
| C6 | `JobLogController.java` 存在于 `-biz/controller/`，提供 page（按 jobId 分页）和 getById | 文件内容审查 |
| C7 | `JobLogService` 接口新增 `page(PageParam, Long jobId)` 方法 | 文件内容审查 |
| C8 | `JobLogServiceImpl` 实现新增的 `page` 方法，使用 `PageResult.of(IPage)` | 文件内容审查 |
| C9 | `JobStartupRunner.java` 存在于 `-biz/scheduler/`，实现 `ApplicationRunner`，标注 `@Component` | 文件内容审查 |
| C10 | `JobStartupRunner.run()` 查询 NORMAL 状态任务并逐一注册到 Quartz | 文件内容审查 |
| C11 | `JobAutoConfiguration.java` 未被修改（ComponentScan 已覆盖所有新包） | git diff 确认 |
| C12 | `mvn -q compile` 退出码 0 | 命令执行 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step B3

## 1. Step 编号和名称
B3 — Controller + Facade

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

- ❌ **不要** 创建测试文件（B4 中统一创建）
- ❌ **不要** 修改 `JobAutoConfiguration.java`（所有新包已在 ComponentScan 覆盖范围内）
- ❌ **不要** 修改 Entity / Mapper / QuartzSchedulerService / SwJobBean（B1/B2 已定稿）
- ❌ **不要** 修改 POM 文件
- ❌ **不要** 修改 Flyway 迁移脚本
- ❌ **不要** 修改 `application.yml` / `application-dev.yml`
- ❌ **不要** 在 Controller 中直接使用 `org.quartz.Scheduler`（必须经 `QuartzSchedulerService`）
- ❌ **不要** 使用 `@Autowired` 字段注入（使用构造函数注入）
- ❌ **不要** 使用 `IPage` 直接作为 Controller 返回类型（必须用 `PageResult<T>` 包装）
- ❌ **不要** 触碰前端项目
- ❌ **不要** 在 Facade 实现中新增业务逻辑（薄封装，只委托给 Service）
- ❌ **不要** 在 `JobStartupRunner` 中使用 `@PostConstruct`（使用 `ApplicationRunner`）