# Step B4：Controller 测试 + 全量回归

## 1. 当前状态

- **功能**：job-scheduler（定时任务调度模块），第 4/7 Step
- **前置 Step**：B1 ✅（模块拆分 + Flyway + Entity/Mapper/配置）· B2 ✅（JobHandler + Service + Quartz 调度）· B3 ✅（Controller + Facade）
- **B3 产物**：6 新建文件（JobInfoDTO + JobFacade + JobFacadeImpl + JobInfoController + JobLogController + JobStartupRunner）+ 4 修改文件（JobInfoService/Impl + JobLogService/Impl 追加 page 方法）
- **B3 回执偏差**：2 处 — ① JobFacade 返回 JobInfoDTO 替代 JobInfo（-api 不依赖 -biz 的模块边界约束）；② JobInfoService/Impl 追加 page 方法（方案遗漏），均已在回执中说明且验收通过
- **当前可注入的 Bean**：`JobInfoService`、`JobLogService`、`QuartzSchedulerService`、`JobFacade`
- **后端全量测试基线**：23 个测试文件（`sw-basic-job` 模块目前 **0 个测试文件**）
- **测试目录不存在**：`sw-basic-job-biz/src/test/java/` 路径尚未创建

## 2. Step 目标

为 B3 产出的 Controller 和 Facade 编写纯 Mockito 单元测试（3 个测试文件，约 34 个测试用例），覆盖全部 10 个端点的正常路径 + 边界/异常路径，运行全量回归确认无退化。

## 3. 推荐模型

推荐模型：deepseek-v4-flash
选择理由：纯单元测试编写 — 模式参照 StorageControllerTest / DeptControllerTest，Mockito mock 驱动，无架构决策、无多约束收敛、无安全红线。
是否触发升级条件：否

## 4. 模型选择理由

本 Step 是将已有 Controller 和 Facade 的方法逐条翻译为测试用例，所有测试模式（mock(Service.class) → 构造 Controller → assertThat + verify）已有成熟参照（StorageControllerTest / DeptControllerTest）。无需推断新逻辑，无需处理多模块依赖或 SQL 红线。Flash 完全胜任。

## 5. 已知上下文

### 5.1 测试模式（必须严格遵守）

| 模式 | 参照 | 说明 |
|------|------|------|
| 纯 Mockito 单元测试 | `StorageControllerTest.java` | 不装载 Spring 上下文，手动构造 Controller，所有依赖 mock |
| 构造 Controller | `new StorageController(storageFacade, storageFileService)` | 构造函数注入，手动传入 mock 对象 |
| R<T> 断言 | `assertThat(result.getCode()).isZero()` + `assertThat(result.getData())...` | 验证返回码 + 数据内容 |
| 异常断言 | `assertThatThrownBy(() -> controller.xxx(...)).isInstanceOf(BaseException.class)` | AssertJ + BaseException |
| verify 调用 | `verify(service).method(args)` / `verify(service, never()).method(any())` | 验证 Service 调用的参数和次数 |
| @DisplayName | `@DisplayName("CURD 操作成功 → 返回 R.ok()")` | 每个测试方法有中文 DisplayName |
| 测试数据工厂 | `private Xxx createXxx() { ... }` | 提取重复造数据逻辑到私有方法 |

### 5.2 被测类依赖关系

```
JobInfoController → JobInfoService（mock）+ QuartzSchedulerService（mock）
JobLogController  → JobLogService（mock）
JobFacadeImpl     → JobInfoService（mock）
```

> `QuartzSchedulerService` 内部依赖 `org.quartz.Scheduler`，测试中**整体 mock QuartzSchedulerService**（不 mock Scheduler 接口），因为 Controller 只调用 QuartzSchedulerService 的方法。

### 5.3 关键常量

| 常量 | 位置 | 值 |
|------|------|------|
| `SwJobBean.JOB_ID_KEY` | `SwJobBean` L47 | `"jobId"` |
| `SwJobBean.TRIGGER_TYPE_KEY` | `SwJobBean` L50 | `"triggerType"` |
| `R.SUCCESS_CODE` | `R` | `0` |
| `R.FAIL_CODE` | `R` | `1` |
| `CommonErrorCode.NOT_FOUND.getCode()` | `CommonErrorCode` | `404` |
| `CommonErrorCode.PARAM_ERROR.getCode()` | `CommonErrorCode` | `400` |

### 5.4 测试目录结构

```
sw-basic-job-biz/src/test/java/com/sw/ck/job/
├── controller/
│   ├── JobInfoControllerTest.java    — 24 测试用例
│   └── JobLogControllerTest.java     — 5 测试用例
└── impl/
    └── JobFacadeImplTest.java        — 5 测试用例
```

> 需新建 `controller/` 和 `impl/` 两个测试子包。总约 34 个测试用例。

## 6. 执行前必须读取的文件

按优先级排列：

1. `Smart-WorkFlow/sw-basic/sw-basic-storage/sw-basic-storage-biz/src/test/java/com/sw/ck/storage/controller/StorageControllerTest.java` — **测试模式权威参照**（纯 Mockito 模式、断言风格、DisplayName 格式）
2. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/controller/JobInfoController.java` — 被测类 1（8 端点）
3. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/controller/JobLogController.java` — 被测类 2（2 端点）
4. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/impl/JobFacadeImpl.java` — 被测类 3（2 方法 + Entity→DTO）
5. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/service/JobInfoService.java` — mock 接口
6. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/service/JobLogService.java` — mock 接口
7. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/service/QuartzSchedulerService.java` — mock 接口
8. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/entity/JobInfo.java` — Entity 字段（测试数据构造）
9. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/entity/JobLog.java` — Entity 字段（测试数据构造）
10. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-api/src/main/java/com/sw/ck/job/dto/JobInfoDTO.java` — DTO 字段（Facade 测试断言用）
11. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-api/src/main/java/com/sw/ck/job/enums/JobStatus.java` — NORMAL / PAUSED
12. `Smart-WorkFlow/sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/enums/TriggerType.java` — AUTO / MANUAL
13. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/response/R.java` — R.ok() / R.fail()
14. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/page/PageParam.java` — 分页参数
15. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/page/PageResult.java` — 分页结果

## 7. 允许修改的文件范围

### 新建文件（3 个）

| # | 位置 | 文件 | 说明 |
|---|:----:|------|------|
| 1 | `-biz` | `src/test/java/com/sw/ck/job/controller/JobInfoControllerTest.java` | 任务定义 Controller 单元测试（24 用例） |
| 2 | `-biz` | `src/test/java/com/sw/ck/job/controller/JobLogControllerTest.java` | 执行日志 Controller 单元测试（5 用例） |
| 3 | `-biz` | `src/test/java/com/sw/ck/job/impl/JobFacadeImplTest.java` | Facade 实现单元测试（5 用例） |

### 修改文件（0 个）

> 所有测试文件为纯新增，不修改任何已有文件。

## 8. 禁止修改的范围

- ❌ **不要修改任何 `src/main/java/` 下的源代码文件**（B1/B2/B3 产物）
- ❌ `sw-framework/`、`sw-biz-system/`、`sw-biz-form/`、`sw-bpm/` 中的任何文件
- ❌ `sw-basic-notify/`、`sw-basic-storage/` 中的任何文件
- ❌ Entity、Service、Controller、Facade、Mapper、Config 等所有业务文件
- ❌ POM 文件（测试依赖已就位，无需新增）
- ❌ Flyway 迁移脚本
- ❌ `application.yml` / `application-dev.yml`
- ❌ `JobAutoConfiguration.java`
- ❌ 其他模块的测试文件
- ❌ `Smart-WorkFlow-Web/` 中的任何文件

## 9. 详细执行方案

### 9.1 创建测试目录结构

```bash
mkdir -p sw-basic/sw-basic-job/sw-basic-job-biz/src/test/java/com/sw/ck/job/controller
mkdir -p sw-basic/sw-basic-job/sw-basic-job-biz/src/test/java/com/sw/ck/job/impl
```

### 9.2 创建 JobInfoControllerTest

路径：`sw-basic-job-biz/src/test/java/com/sw/ck/job/controller/JobInfoControllerTest.java`

覆盖 8 个端点，共 24 个测试用例。

```java
package com.sw.ck.job.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.job.entity.JobInfo;
import com.sw.ck.job.service.JobInfoService;
import com.sw.ck.job.service.QuartzSchedulerService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * {@link JobInfoController} 单元测试。
 * <p>
 * 纯 Mockito，不装载 Spring 上下文。覆盖 8 个端点的 happy path + 边界/异常路径。
 * </p>
 */
@DisplayName("定时任务定义控制器测试")
class JobInfoControllerTest {

    private final JobInfoService jobInfoService = mock(JobInfoService.class);
    private final QuartzSchedulerService quartzSchedulerService = mock(QuartzSchedulerService.class);
    private final JobInfoController controller = new JobInfoController(jobInfoService, quartzSchedulerService);

    // ==================== 测试数据工厂 ====================

    private JobInfo createJobInfo(Long id, String jobName, String status) {
        JobInfo jobInfo = new JobInfo();
        jobInfo.setId(id);
        jobInfo.setJobName(jobName);
        jobInfo.setJobGroup("DEFAULT");
        jobInfo.setJobType("BEAN");
        jobInfo.setCronExpression("0/30 * * * * ?");
        jobInfo.setStatus(status);
        jobInfo.setBeanName("testHandler");
        jobInfo.setConcurrent(false);
        jobInfo.setMisfirePolicy(0);
        jobInfo.setCreateTime(LocalDateTime.now());
        return jobInfo;
    }

    private JobInfo createCreateRequest() {
        JobInfo jobInfo = new JobInfo();
        jobInfo.setJobName("test-job");
        jobInfo.setCronExpression("0/30 * * * * ?");
        jobInfo.setJobGroup("DEFAULT");
        jobInfo.setJobType("BEAN");
        jobInfo.setBeanName("testHandler");
        return jobInfo;
    }

    // ==================== POST /job/info/page ====================

    @Nested
    @DisplayName("分页查询")
    class PageTests {

        @Test
        @DisplayName("分页查询 → 返回 PageResult 含 records + total")
        void page_shouldReturnPageResult() {
            PageResult<JobInfo> pageResult = PageResult.of(
                    new Page<JobInfo>(1, 10).setRecords(List.of(
                            createJobInfo(1L, "job-a", "NORMAL"),
                            createJobInfo(2L, "job-b", "PAUSED"))).setTotal(2L));
            when(jobInfoService.page(any(PageParam.class), any())).thenReturn(pageResult);

            R<PageResult<JobInfo>> result = controller.page(1L, 10L, null);

            assertThat(result.getCode()).isZero();
            assertThat(result.getData().getRecords()).hasSize(2);
            assertThat(result.getData().getTotal()).isEqualTo(2L);
            verify(jobInfoService).page(any(PageParam.class), any());
        }

        @Test
        @DisplayName("分页查询无数据 → 返回空 records, total=0")
        void page_empty_shouldReturnEmptyPage() {
            PageResult<JobInfo> empty = PageResult.of(
                    new Page<JobInfo>(1, 10).setRecords(List.of()).setTotal(0L));
            when(jobInfoService.page(any(PageParam.class), any())).thenReturn(empty);

            R<PageResult<JobInfo>> result = controller.page(1L, 10L, null);

            assertThat(result.getCode()).isZero();
            assertThat(result.getData().getRecords()).isEmpty();
            assertThat(result.getData().getTotal()).isZero();
        }

        @Test
        @DisplayName("分页查询传参 pageNum=2, pageSize=5 → service 收到正确参数")
        void page_shouldPassCorrectPageParams() {
            PageResult<JobInfo> empty = PageResult.of(
                    new Page<JobInfo>(2, 5).setRecords(List.of()).setTotal(0L));
            when(jobInfoService.page(any(PageParam.class), any())).thenReturn(empty);

            controller.page(2L, 5L, null);

            verify(jobInfoService).page(argThat(p ->
                    p.getPageNum() == 2 && p.getPageSize() == 5), any());
        }
    }

    // ==================== GET /job/info/{id} ====================

    @Nested
    @DisplayName("按 ID 查询")
    class GetByIdTests {

        @Test
        @DisplayName("任务存在 → 返回 JobInfo")
        void getById_shouldReturnJobInfo() {
            JobInfo jobInfo = createJobInfo(1L, "test-job", "NORMAL");
            when(jobInfoService.getById(1L)).thenReturn(jobInfo);

            R<JobInfo> result = controller.getById(1L);

            assertThat(result.getCode()).isZero();
            assertThat(result.getData().getJobName()).isEqualTo("test-job");
            assertThat(result.getData().getStatus()).isEqualTo("NORMAL");
            verify(jobInfoService).getById(1L);
        }

        @Test
        @DisplayName("任务不存在 → 抛 BaseException(NOT_FOUND)")
        void getById_notFound_shouldThrow() {
            when(jobInfoService.getById(999L)).thenReturn(null);

            assertThatThrownBy(() -> controller.getById(999L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("不存在");
            verify(jobInfoService).getById(999L);
        }
    }

    // ==================== POST /job/info ====================

    @Nested
    @DisplayName("创建任务")
    class CreateTests {

        @Test
        @DisplayName("创建成功 → 返回新 ID，已注册到 Quartz")
        void create_shouldReturnIdAndRegisterToQuartz() {
            JobInfo request = createCreateRequest();
            request.setStatus("NORMAL");
            when(jobInfoService.save(any(JobInfo.class))).thenAnswer(inv -> {
                JobInfo saved = inv.getArgument(0);
                saved.setId(100L);
                return true;
            });

            R<Long> result = controller.create(request);

            assertThat(result.getCode()).isZero();
            assertThat(result.getData()).isEqualTo(100L);
            verify(jobInfoService).save(any(JobInfo.class));
            verify(quartzSchedulerService).addJob(any(JobInfo.class));
        }

        @Test
        @DisplayName("创建 PAUSED 状态任务 → 不注册到 Quartz")
        void create_paused_shouldNotRegisterToQuartz() {
            JobInfo request = createCreateRequest();
            request.setStatus("PAUSED");
            when(jobInfoService.save(any(JobInfo.class))).thenAnswer(inv -> {
                JobInfo saved = inv.getArgument(0);
                saved.setId(101L);
                return true;
            });

            R<Long> result = controller.create(request);

            assertThat(result.getCode()).isZero();
            verify(jobInfoService).save(any(JobInfo.class));
            verify(quartzSchedulerService, never()).addJob(any());
        }

        @Test
        @DisplayName("jobName 为空 → 抛 BaseException(PARAM_ERROR)")
        void create_blankJobName_shouldThrow() {
            JobInfo request = createCreateRequest();
            request.setJobName("  ");

            assertThatThrownBy(() -> controller.create(request))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("任务名称不能为空");
            verify(jobInfoService, never()).save(any());
        }

        @Test
        @DisplayName("cronExpression 为空 → 抛 BaseException(PARAM_ERROR)")
        void create_blankCron_shouldThrow() {
            JobInfo request = createCreateRequest();
            request.setCronExpression(null);

            assertThatThrownBy(() -> controller.create(request))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("Cron 表达式不能为空");
            verify(jobInfoService, never()).save(any());
        }

        @Test
        @DisplayName("Quartz 注册失败 → 不抛异常，任务已落库")
        void create_quartzFailed_shouldNotThrow() {
            JobInfo request = createCreateRequest();
            request.setStatus("NORMAL");
            when(jobInfoService.save(any(JobInfo.class))).thenAnswer(inv -> {
                JobInfo saved = inv.getArgument(0);
                saved.setId(102L);
                return true;
            });
            doThrow(new RuntimeException("Quartz error"))
                    .when(quartzSchedulerService).addJob(any(JobInfo.class));

            R<Long> result = controller.create(request);

            // 不抛异常，创建成功
            assertThat(result.getCode()).isZero();
            assertThat(result.getData()).isEqualTo(102L);
            verify(jobInfoService).save(any(JobInfo.class));
            verify(quartzSchedulerService).addJob(any(JobInfo.class));
        }

        @Test
        @DisplayName("创建时未指定 jobGroup/status/jobType → 使用默认值")
        void create_shouldApplyDefaults() {
            JobInfo request = new JobInfo();
            request.setJobName("minimal-job");
            request.setCronExpression("0 0 * * * ?");
            when(jobInfoService.save(any(JobInfo.class))).thenAnswer(inv -> {
                JobInfo saved = inv.getArgument(0);
                saved.setId(103L);
                return true;
            });

            R<Long> result = controller.create(request);

            assertThat(result.getCode()).isZero();
            verify(jobInfoService).save(argThat(j ->
                    "DEFAULT".equals(j.getJobGroup())
                            && "NORMAL".equals(j.getStatus())
                            && "BEAN".equals(j.getJobType())
                            && Boolean.FALSE.equals(j.getConcurrent())
                            && Integer.valueOf(0).equals(j.getMisfirePolicy())));
        }
    }

    // ==================== PUT /job/info ====================

    @Nested
    @DisplayName("更新任务")
    class UpdateTests {

        @Test
        @DisplayName("更新成功（NORMAL → NORMAL）→ 先移除再重新注册")
        void update_shouldReregisterInQuartz() {
            JobInfo existing = createJobInfo(1L, "old-name", "NORMAL");
            JobInfo request = new JobInfo();
            request.setId(1L);
            request.setJobName("new-name");
            request.setCronExpression("0 0/5 * * * ?");
            request.setStatus("NORMAL");

            when(jobInfoService.getById(1L))
                    .thenReturn(existing) // 第一次：查 existing
                    .thenReturn(request); // 第二次：查 updated
            when(quartzSchedulerService.exists(existing)).thenReturn(true);

            R<Void> result = controller.update(request);

            assertThat(result.getCode()).isZero();
            verify(quartzSchedulerService).exists(existing);
            verify(quartzSchedulerService).removeJob(existing);
            verify(jobInfoService).updateById(request);
            verify(quartzSchedulerService).addJob(request);
        }

        @Test
        @DisplayName("更新为 PAUSED → 移除 Quartz 注册，不重新注册")
        void update_toPaused_shouldRemoveAndNotReRegister() {
            JobInfo existing = createJobInfo(1L, "old-name", "NORMAL");
            JobInfo request = new JobInfo();
            request.setId(1L);
            request.setJobName("old-name");
            request.setStatus("PAUSED");

            when(jobInfoService.getById(1L))
                    .thenReturn(existing)
                    .thenReturn(request);
            when(quartzSchedulerService.exists(existing)).thenReturn(true);

            R<Void> result = controller.update(request);

            assertThat(result.getCode()).isZero();
            verify(quartzSchedulerService).removeJob(existing);
            verify(jobInfoService).updateById(request);
            verify(quartzSchedulerService, never()).addJob(any());
        }

        @Test
        @DisplayName("id 为 null → 抛 BaseException(PARAM_ERROR)")
        void update_nullId_shouldThrow() {
            JobInfo request = new JobInfo();
            request.setJobName("no-id");

            assertThatThrownBy(() -> controller.update(request))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("任务 ID 不能为空");
        }

        @Test
        @DisplayName("任务不存在 → 抛 BaseException(NOT_FOUND)")
        void update_notFound_shouldThrow() {
            JobInfo request = new JobInfo();
            request.setId(999L);
            when(jobInfoService.getById(999L)).thenReturn(null);

            assertThatThrownBy(() -> controller.update(request))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("不存在");
        }
    }

    // ==================== DELETE /job/info/{id} ====================

    @Nested
    @DisplayName("删除任务")
    class DeleteTests {

        @Test
        @DisplayName("删除成功 → 从 Quartz 移除 + 软删除")
        void delete_shouldRemoveFromQuartzAndSoftDelete() {
            JobInfo jobInfo = createJobInfo(1L, "test-job", "NORMAL");
            when(jobInfoService.getById(1L)).thenReturn(jobInfo);
            when(quartzSchedulerService.exists(jobInfo)).thenReturn(true);

            R<Void> result = controller.delete(1L);

            assertThat(result.getCode()).isZero();
            verify(quartzSchedulerService).exists(jobInfo);
            verify(quartzSchedulerService).removeJob(jobInfo);
            verify(jobInfoService).removeById(1L);
        }

        @Test
        @DisplayName("删除不存在的任务 → 幂等，返回成功")
        void delete_notFound_shouldReturnOk() {
            when(jobInfoService.getById(999L)).thenReturn(null);

            R<Void> result = controller.delete(999L);

            assertThat(result.getCode()).isZero();
            verify(quartzSchedulerService, never()).removeJob(any());
            verify(jobInfoService, never()).removeById(anyLong());
        }
    }

    // ==================== POST /job/info/{id}/pause ====================

    @Nested
    @DisplayName("暂停任务")
    class PauseTests {

        @Test
        @DisplayName("暂停成功 → Quartz pause + DB 状态改为 PAUSED")
        void pause_shouldPauseQuartzAndUpdateDb() {
            JobInfo jobInfo = createJobInfo(1L, "test-job", "NORMAL");
            when(jobInfoService.getById(1L)).thenReturn(jobInfo);
            when(quartzSchedulerService.exists(jobInfo)).thenReturn(true);

            R<Void> result = controller.pause(1L);

            assertThat(result.getCode()).isZero();
            verify(quartzSchedulerService).pauseJob(jobInfo);
            verify(jobInfoService).updateById(argThat(j ->
                    "PAUSED".equals(j.getStatus())));
        }

        @Test
        @DisplayName("暂停未注册的任务 → 跳过 Quartz pause，仅更新 DB")
        void pause_notRegistered_shouldOnlyUpdateDb() {
            JobInfo jobInfo = createJobInfo(1L, "test-job", "NORMAL");
            when(jobInfoService.getById(1L)).thenReturn(jobInfo);
            when(quartzSchedulerService.exists(jobInfo)).thenReturn(false);

            R<Void> result = controller.pause(1L);

            assertThat(result.getCode()).isZero();
            verify(quartzSchedulerService, never()).pauseJob(any());
            verify(jobInfoService).updateById(argThat(j ->
                    "PAUSED".equals(j.getStatus())));
        }

        @Test
        @DisplayName("暂停已暂停的任务 → 幂等，返回成功")
        void pause_alreadyPaused_shouldReturnOk() {
            JobInfo jobInfo = createJobInfo(1L, "test-job", "PAUSED");
            when(jobInfoService.getById(1L)).thenReturn(jobInfo);

            R<Void> result = controller.pause(1L);

            assertThat(result.getCode()).isZero();
            verify(quartzSchedulerService, never()).pauseJob(any());
            verify(jobInfoService, never()).updateById(any());
        }

        @Test
        @DisplayName("暂停不存在的任务 → 抛 BaseException(NOT_FOUND)")
        void pause_notFound_shouldThrow() {
            when(jobInfoService.getById(999L)).thenReturn(null);

            assertThatThrownBy(() -> controller.pause(999L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("不存在");
        }
    }

    // ==================== POST /job/info/{id}/resume ====================

    @Nested
    @DisplayName("恢复任务")
    class ResumeTests {

        @Test
        @DisplayName("恢复已注册的任务 → Quartz resume + DB 状态改为 NORMAL")
        void resume_registered_shouldResumeQuartzAndUpdateDb() {
            JobInfo jobInfo = createJobInfo(1L, "test-job", "PAUSED");
            when(jobInfoService.getById(1L)).thenReturn(jobInfo);
            when(quartzSchedulerService.exists(jobInfo)).thenReturn(true);

            R<Void> result = controller.resume(1L);

            assertThat(result.getCode()).isZero();
            verify(quartzSchedulerService).resumeJob(jobInfo);
            verify(jobInfoService).updateById(argThat(j ->
                    "NORMAL".equals(j.getStatus())));
        }

        @Test
        @DisplayName("恢复未注册的任务 → 重新注册到 Quartz")
        void resume_notRegistered_shouldReRegister() {
            JobInfo jobInfo = createJobInfo(1L, "test-job", "PAUSED");
            when(jobInfoService.getById(1L)).thenReturn(jobInfo);
            when(quartzSchedulerService.exists(jobInfo)).thenReturn(false);

            R<Void> result = controller.resume(1L);

            assertThat(result.getCode()).isZero();
            verify(quartzSchedulerService, never()).resumeJob(any());
            verify(quartzSchedulerService).addJob(jobInfo);
        }

        @Test
        @DisplayName("恢复已恢复的任务 → 幂等，返回成功")
        void resume_alreadyNormal_shouldReturnOk() {
            JobInfo jobInfo = createJobInfo(1L, "test-job", "NORMAL");
            when(jobInfoService.getById(1L)).thenReturn(jobInfo);

            R<Void> result = controller.resume(1L);

            assertThat(result.getCode()).isZero();
            verify(quartzSchedulerService, never()).resumeJob(any());
            verify(jobInfoService, never()).updateById(any());
        }

        @Test
        @DisplayName("恢复不存在的任务 → 抛 BaseException(NOT_FOUND)")
        void resume_notFound_shouldThrow() {
            when(jobInfoService.getById(999L)).thenReturn(null);

            assertThatThrownBy(() -> controller.resume(999L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("不存在");
        }
    }

    // ==================== POST /job/info/{id}/trigger ====================

    @Nested
    @DisplayName("手动触发")
    class TriggerTests {

        @Test
        @DisplayName("手动触发成功 → 调用 quartzSchedulerService.triggerOnce")
        void trigger_shouldCallService() {
            JobInfo jobInfo = createJobInfo(1L, "test-job", "NORMAL");
            when(jobInfoService.getById(1L)).thenReturn(jobInfo);

            R<Void> result = controller.trigger(1L);

            assertThat(result.getCode()).isZero();
            verify(quartzSchedulerService).triggerOnce(jobInfo);
        }

        @Test
        @DisplayName("手动触发不存在的任务 → 抛 BaseException(NOT_FOUND)")
        void trigger_notFound_shouldThrow() {
            when(jobInfoService.getById(999L)).thenReturn(null);

            assertThatThrownBy(() -> controller.trigger(999L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("不存在");
        }
    }
}
```

**测试用例清单（24 个）**：

| # | 端点 | 场景 | 验证点 |
|---|------|------|--------|
| 1 | page | 有数据 → 返回 records + total | code=0, records.size=2, total=2 |
| 2 | page | 无数据 → 空 records | records.isEmpty(), total=0 |
| 3 | page | 自定义分页参数 → service 收到正确参数 | pageNum=2, pageSize=5 |
| 4 | getById | 存在 → 返回 JobInfo | code=0, jobName 相等 |
| 5 | getById | 不存在 → 抛异常 | BaseException, 含"不存在" |
| 6 | create | NORMAL 状态 → 保存 + Quartz 注册 | verify save + addJob |
| 7 | create | PAUSED 状态 → 保存但不注册 Quartz | verify save, never addJob |
| 8 | create | jobName 为空 → 抛异常 | BaseException, 含"任务名称不能为空" |
| 9 | create | cronExpression 为空 → 抛异常 | BaseException, 含"Cron 表达式不能为空" |
| 10 | create | Quartz 注册失败 → 不抛异常，任务已落库 | code=0, data=id, verify save |
| 11 | create | 默认值 → jobGroup/status/jobType/concurrent/misfire 均有默认值 | argThat 断言默认值 |
| 12 | update | NORMAL→NORMAL → 移除旧 + 更新 + 注册新 | verify removeJob + updateById + addJob |
| 13 | update | NORMAL→PAUSED → 移除 + 更新，不注册 | verify removeJob + updateById, never addJob |
| 14 | update | id=null → 抛异常 | BaseException, 含"任务 ID 不能为空" |
| 15 | update | 不存在 → 抛异常 | BaseException, 含"不存在" |
| 16 | delete | 存在 → 移除 Quartz + 软删除 | verify removeJob + removeById |
| 17 | delete | 不存在 → 幂等返回成功 | code=0, never removeJob/removeById |
| 18 | pause | NORMAL → Quartz pause + DB→PAUSED | verify pauseJob + updateById(PAUSED) |
| 19 | pause | 未注册 → 跳过 Quartz，仅更新 DB | never pauseJob, verify updateById |
| 20 | pause | 已 PAUSED → 幂等，不操作 | never pauseJob/updateById |
| 21 | pause | 不存在 → 抛异常 | BaseException, 含"不存在" |
| 22 | resume | PAUSED + 已注册 → Quartz resume + DB→NORMAL | verify resumeJob + updateById(NORMAL) |
| 23 | resume | PAUSED + 未注册 → 重新注册 Quartz | verify addJob |
| 24 | resume | 已 NORMAL → 幂等 | never resumeJob/updateById |
| 25 | resume | 不存在 → 抛异常 | BaseException, 含"不存在" |
| 26 | trigger | NORMAL → 调用 triggerOnce | verify triggerOnce |
| 27 | trigger | 不存在 → 抛异常 | BaseException, 含"不存在" |

> 注：上表为 27 个用例（包含 2 个额外的 resume/trigger 异常路径），与代码中 `@Nested` 分组一一对应。

### 9.3 创建 JobLogControllerTest

路径：`sw-basic-job-biz/src/test/java/com/sw/ck/job/controller/JobLogControllerTest.java`

覆盖 2 个端点，共 5 个测试用例。

```java
package com.sw.ck.job.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.job.entity.JobLog;
import com.sw.ck.job.enums.ExecStatus;
import com.sw.ck.job.service.JobLogService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * {@link JobLogController} 单元测试。
 * <p>
 * 纯 Mockito，不装载 Spring 上下文。覆盖 2 个端点的 happy path + 边界/异常路径。
 * </p>
 */
@DisplayName("定时任务执行日志控制器测试")
class JobLogControllerTest {

    private final JobLogService jobLogService = mock(JobLogService.class);
    private final JobLogController controller = new JobLogController(jobLogService);

    // ==================== 测试数据工厂 ====================

    private JobLog createJobLog(Long id, Long jobId, ExecStatus status) {
        JobLog jobLog = new JobLog();
        jobLog.setId(id);
        jobLog.setJobId(jobId);
        jobLog.setStatus(status.name());
        jobLog.setStartTime(LocalDateTime.now().minusMinutes(5));
        jobLog.setEndTime(LocalDateTime.now());
        jobLog.setDuration(5000L);
        jobLog.setTriggerType("AUTO");
        return jobLog;
    }

    // ==================== POST /job/log/page ====================

    @Nested
    @DisplayName("分页查询")
    class PageTests {

        @Test
        @DisplayName("按 jobId 分页 → 返回 PageResult")
        void page_shouldReturnPageResult() {
            PageResult<JobLog> pageResult = PageResult.of(
                    new Page<JobLog>(1, 10).setRecords(List.of(
                            createJobLog(1L, 100L, ExecStatus.SUCCESS),
                            createJobLog(2L, 100L, ExecStatus.FAILED))).setTotal(2L));
            when(jobLogService.page(any(PageParam.class), eq(100L))).thenReturn(pageResult);

            R<PageResult<JobLog>> result = controller.page(100L, 1L, 10L);

            assertThat(result.getCode()).isZero();
            assertThat(result.getData().getRecords()).hasSize(2);
            assertThat(result.getData().getTotal()).isEqualTo(2L);
            verify(jobLogService).page(any(PageParam.class), eq(100L));
        }

        @Test
        @DisplayName("无日志 → 返回空 records, total=0")
        void page_empty_shouldReturnEmptyPage() {
            PageResult<JobLog> empty = PageResult.of(
                    new Page<JobLog>(1, 10).setRecords(List.of()).setTotal(0L));
            when(jobLogService.page(any(PageParam.class), eq(100L))).thenReturn(empty);

            R<PageResult<JobLog>> result = controller.page(100L, 1L, 10L);

            assertThat(result.getCode()).isZero();
            assertThat(result.getData().getRecords()).isEmpty();
            assertThat(result.getData().getTotal()).isZero();
        }

        @Test
        @DisplayName("jobId 为 null → 抛 BaseException(PARAM_ERROR)")
        void page_nullJobId_shouldThrow() {
            assertThatThrownBy(() -> controller.page(null, 1L, 10L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("任务 ID 不能为空");
            verify(jobLogService, never()).page(any(), anyLong());
        }
    }

    // ==================== GET /job/log/{id} ====================

    @Nested
    @DisplayName("按 ID 查询")
    class GetByIdTests {

        @Test
        @DisplayName("日志存在 → 返回 JobLog")
        void getById_shouldReturnJobLog() {
            JobLog jobLog = createJobLog(1L, 100L, ExecStatus.SUCCESS);
            when(jobLogService.getById(1L)).thenReturn(jobLog);

            R<JobLog> result = controller.getById(1L);

            assertThat(result.getCode()).isZero();
            assertThat(result.getData().getJobId()).isEqualTo(100L);
            assertThat(result.getData().getStatus()).isEqualTo("SUCCESS");
            verify(jobLogService).getById(1L);
        }

        @Test
        @DisplayName("日志不存在 → 抛 BaseException(NOT_FOUND)")
        void getById_notFound_shouldThrow() {
            when(jobLogService.getById(999L)).thenReturn(null);

            assertThatThrownBy(() -> controller.getById(999L))
                    .isInstanceOf(BaseException.class)
                    .hasMessageContaining("不存在");
            verify(jobLogService).getById(999L);
        }
    }
}
```

**测试用例清单（5 个）**：

| # | 端点 | 场景 | 验证点 |
|---|------|------|--------|
| 1 | page | 有数据 → 返回 records + total | code=0, records.size=2, total=2 |
| 2 | page | 无数据 → 空 records | records.isEmpty(), total=0 |
| 3 | page | jobId=null → 抛异常 | BaseException, 含"任务 ID 不能为空" |
| 4 | getById | 存在 → 返回 JobLog | code=0, jobId 相等, status 相等 |
| 5 | getById | 不存在 → 抛异常 | BaseException, 含"不存在" |

### 9.4 创建 JobFacadeImplTest

路径：`sw-basic-job-biz/src/test/java/com/sw/ck/job/impl/JobFacadeImplTest.java`

覆盖 2 个方法 + Entity→DTO 转换正确性，共 5 个测试用例。

```java
package com.sw.ck.job.impl;

import com.sw.ck.job.dto.JobInfoDTO;
import com.sw.ck.job.entity.JobInfo;
import com.sw.ck.job.service.JobInfoService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * {@link JobFacadeImpl} 单元测试。
 * <p>
 * 验证 Facade 薄封装 + Entity→DTO 转换逻辑的正确性。
 * </p>
 */
@DisplayName("任务门面实现测试")
class JobFacadeImplTest {

    private final JobInfoService jobInfoService = mock(JobInfoService.class);
    private final JobFacadeImpl jobFacade = new JobFacadeImpl(jobInfoService);

    // ==================== 测试数据工厂 ====================

    private JobInfo createJobInfo(Long id, String jobName) {
        JobInfo entity = new JobInfo();
        entity.setId(id);
        entity.setJobName(jobName);
        entity.setJobGroup("DEFAULT");
        entity.setJobType("BEAN");
        entity.setCronExpression("0/30 * * * * ?");
        entity.setStatus("NORMAL");
        entity.setConcurrent(false);
        entity.setMisfirePolicy(0);
        entity.setDescription("测试任务");
        entity.setBeanName("testHandler");
        entity.setFlowDefKey(null);
        entity.setLastFireTime(LocalDateTime.now().minusMinutes(10));
        entity.setNextFireTime(LocalDateTime.now().plusMinutes(20));
        entity.setCreateTime(LocalDateTime.now().minusDays(1));
        return entity;
    }

    // ==================== getById ====================

    @Nested
    @DisplayName("getById")
    class GetByIdTests {

        @Test
        @DisplayName("任务存在 → 返回 DTO，字段逐项映射正确")
        void getById_shouldReturnDTO() {
            JobInfo entity = createJobInfo(1L, "test-job");
            when(jobInfoService.getById(1L)).thenReturn(entity);

            JobInfoDTO dto = jobFacade.getById(1L);

            assertThat(dto).isNotNull();
            assertThat(dto.getId()).isEqualTo(1L);
            assertThat(dto.getJobName()).isEqualTo("test-job");
            assertThat(dto.getJobGroup()).isEqualTo("DEFAULT");
            assertThat(dto.getJobType()).isEqualTo("BEAN");
            assertThat(dto.getCronExpression()).isEqualTo("0/30 * * * * ?");
            assertThat(dto.getStatus()).isEqualTo("NORMAL");
            assertThat(dto.getConcurrent()).isFalse();
            assertThat(dto.getMisfirePolicy()).isEqualTo(0);
            assertThat(dto.getDescription()).isEqualTo("测试任务");
            assertThat(dto.getBeanName()).isEqualTo("testHandler");
            assertThat(dto.getFlowDefKey()).isNull();
            assertThat(dto.getLastFireTime()).isNotNull();
            assertThat(dto.getNextFireTime()).isNotNull();
            assertThat(dto.getCreateTime()).isNotNull();
            verify(jobInfoService).getById(1L);
        }

        @Test
        @DisplayName("任务不存在 → 返回 null")
        void getById_notFound_shouldReturnNull() {
            when(jobInfoService.getById(999L)).thenReturn(null);

            JobInfoDTO dto = jobFacade.getById(999L);

            assertThat(dto).isNull();
            verify(jobInfoService).getById(999L);
        }
    }

    // ==================== getByJobName ====================

    @Nested
    @DisplayName("getByJobName")
    class GetByJobNameTests {

        @Test
        @DisplayName("任务存在 → 返回 DTO")
        void getByJobName_shouldReturnDTO() {
            JobInfo entity = createJobInfo(2L, "cron-cleanup");
            when(jobInfoService.getByJobName("cron-cleanup")).thenReturn(entity);

            JobInfoDTO dto = jobFacade.getByJobName("cron-cleanup");

            assertThat(dto).isNotNull();
            assertThat(dto.getId()).isEqualTo(2L);
            assertThat(dto.getJobName()).isEqualTo("cron-cleanup");
            verify(jobInfoService).getByJobName("cron-cleanup");
        }

        @Test
        @DisplayName("任务不存在 → 返回 null")
        void getByJobName_notFound_shouldReturnNull() {
            when(jobInfoService.getByJobName("ghost-job")).thenReturn(null);

            JobInfoDTO dto = jobFacade.getByJobName("ghost-job");

            assertThat(dto).isNull();
            verify(jobInfoService).getByJobName("ghost-job");
        }

        @Test
        @DisplayName("FLOW 类型任务 → DTO 含 flowDefKey")
        void getByJobName_flowType_shouldContainFlowDefKey() {
            JobInfo entity = createJobInfo(3L, "flow-trigger");
            entity.setJobType("FLOW");
            entity.setBeanName(null);
            entity.setFlowDefKey("approval_flow_v1");
            when(jobInfoService.getByJobName("flow-trigger")).thenReturn(entity);

            JobInfoDTO dto = jobFacade.getByJobName("flow-trigger");

            assertThat(dto.getJobType()).isEqualTo("FLOW");
            assertThat(dto.getBeanName()).isNull();
            assertThat(dto.getFlowDefKey()).isEqualTo("approval_flow_v1");
        }
    }
}
```

**测试用例清单（5 个）**：

| # | 方法 | 场景 | 验证点 |
|---|------|------|--------|
| 1 | getById | 存在 → 返回 DTO | 13 字段逐项映射正确（不含系统列） |
| 2 | getById | 不存在 → 返回 null | dto 为 null |
| 3 | getByJobName | 存在 → 返回 DTO | jobName/id 匹配，verify 调用 |
| 4 | getByJobName | 不存在 → 返回 null | dto 为 null |
| 5 | getByJobName | FLOW 类型 → DTO 含 flowDefKey | jobType=FLOW, beanName=null, flowDefKey 非 null |

### 9.5 编译与测试验证

```bash
# 编译验证（含测试编译）
cd Smart-WorkFlow
mvn -q compile

# 运行全部测试（含新增的 B4 测试）
mvn -q test
```

## 10. 关键实现约束

1. **纯 Mockito，不装载 Spring 上下文**：不使用 `@SpringBootTest` / `@ExtendWith(SpringExtension.class)`，参照 `StorageControllerTest` 模式
2. **所有测试使用 `@DisplayName`**：中文描述，格式如 "操作成功 → 返回预期结果"
3. **使用 AssertJ 断言**：`assertThat(...).isZero()` / `.isEqualTo()` / `.hasMessageContaining()`，不使用 JUnit 内置断言
4. **mock 对象一次性创建**：在字段初始化时 `mock(Xxx.class)`，不在 `@BeforeEach` 中重复创建
5. **Controller 手动构造**：`new JobInfoController(mock1, mock2)`，不使用 `@InjectMocks`
6. **QuartzSchedulerService 整体 mock**：不逐层 mock `Scheduler` 接口（Controller 只依赖 QuartzSchedulerService）
7. **测试数据工厂方法私有**：`private JobInfo createJobInfo(...)` 提取重复数据构造逻辑
8. **`@Nested` 分组**：按端点组织，每个 `@Nested` 内放对应端点的多个测试方法
9. **每个测试独立**：不依赖其他测试的执行顺序，每个测试独立 mock + 独立断言
10. **verify 验证调用次数**：成功路径 `verify(service).method()`，不应调用的路径 `verify(service, never()).method(any())`

## 11. 边界情况

| 场景 | 测试用例 | 处理方式 |
|------|:--------:|----------|
| 分页参数为默认值 | JobInfoControllerTest#3 | `argThat` 验证 pageNum=1, pageSize=10 |
| jobId 为 null（page） | JobLogControllerTest#3 | 抛 BaseException(PARAM_ERROR) |
| 查询不存在的 ID | 多处 | 抛 BaseException(NOT_FOUND) 或返回 null（Facade） |
| 删除不存在任务 | JobInfoControllerTest#17 | 幂等返回成功 |
| 暂停已暂停任务 | JobInfoControllerTest#20 | 幂等返回成功 |
| 恢复已恢复任务 | JobInfoControllerTest#24 | 幂等返回成功 |
| 创建时 Quartz 注册失败 | JobInfoControllerTest#10 | 不抛异常，任务已落库 |
| 创建 PAUSED 任务 | JobInfoControllerTest#7 | 不注册 Quartz |
| 更新时 Quartz 注册失败 | （见代码 update 方法 try-catch） | log.error 不抛异常 |
| 恢复未注册任务 | JobInfoControllerTest#23 | 重新 addJob |
| Facade 返回时 Entity 为 null | JobFacadeImplTest#2,4 | toDTO(null) → null |
| FLOW 类型 Entity → DTO | JobFacadeImplTest#5 | flowDefKey 正确映射，beanName 为 null |

## 12. 风险和回滚方案

### 风险

- **R1**：JobInfoController 测试中 mock `QuartzSchedulerService` 的 `exists()` / `addJob()` / `removeJob()` / `pauseJob()` / `resumeJob()` / `triggerOnce()` 方法签名需与实际一致。若方法签名变更，测试编译失败时会立即发现。
- **R2**：`PageResult.of(IPage)` 参数为 `com.baomidou.mybatisplus.extension.plugins.pagination.Page`（非 `com.baomidou.mybatisplus.core.metadata.IPage`）。测试中使用 `new Page<>(pageNum, pageSize)` + `setRecords()` + `setTotal()` 构造，与 `JobInfoServiceImpl.page()` 实现一致。
- **R3**：新增测试被 `@Nested` 分组，JUnit 5 默认会执行内部类的测试。确认 pom.xml 中 `maven-surefire-plugin` 的 `include` 规则能覆盖内部类（默认 `*Test*` 可匹配内部类）。

### 回滚步骤

1. 删除 B4 所有新建测试文件（3 个）
2. 删除空的测试目录（如无其他文件）
3. `mvn -q compile` 验证编译通过
4. `mvn -q test` 验证测试计数回到 B3 基线

## 13. 测试方案

### 13.1 静态检查

```bash
# 1. 确认 3 个测试文件存在
find sw-basic/sw-basic-job/sw-basic-job-biz/src/test -name "*Test.java" -type f | sort

# 2. 确认无 Scheduler 直接引用
grep "import org.quartz.Scheduler" sw-basic/sw-basic-job/sw-basic-job-biz/src/test/java/com/sw/ck/job/controller/JobInfoControllerTest.java || echo "PASS"

# 3. 确认无 @SpringBootTest
grep "@SpringBootTest" sw-basic/sw-basic-job/sw-basic-job-biz/src/test/java/com/sw/ck/job/**/*.java || echo "PASS: 纯 Mockito"

# 4. 确认 @DisplayName 覆盖率
grep -c "@DisplayName" sw-basic/sw-basic-job/sw-basic-job-biz/src/test/java/com/sw/ck/job/controller/JobInfoControllerTest.java
grep -c "@DisplayName" sw-basic/sw-basic-job/sw-basic-job-biz/src/test/java/com/sw/ck/job/controller/JobLogControllerTest.java
grep -c "@DisplayName" sw-basic/sw-basic-job/sw-basic-job-biz/src/test/java/com/sw/ck/job/impl/JobFacadeImplTest.java
```

### 13.2 单元测试

```bash
cd Smart-WorkFlow
mvn -q test
```

- 预期：全部测试通过，退出码 0
- 预期：B4 新增 ≥ 37 个测试用例全部通过（JobInfoControllerTest ~27 + JobLogControllerTest ~5 + JobFacadeImplTest ~5）
- 预期：已有测试不减少（23 个测试文件全部通过）

### 13.3 集成测试

本 Step 不要求集成测试。纯 Mockito 单元测试已覆盖所有端点逻辑和边界。

### 13.4 手工验证

无需手工验证。

### 13.5 回归检查

```bash
cd Smart-WorkFlow
mvn -q compile && mvn -q test
```

- 编译退出码 0
- 全量测试通过（已有测试不减少，新增测试全部通过）
- 预期基线：≥ 26 个测试文件（原 23 + 新增 3），≥ 37 个新增测试方法

## 14. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| C1 | `JobInfoControllerTest.java` 存在于 `-biz/src/test/java/.../controller/`，含 ≥ 24 个 `@Test` 方法 | 文件审查 |
| C2 | `JobLogControllerTest.java` 存在于 `-biz/src/test/java/.../controller/`，含 ≥ 5 个 `@Test` 方法 | 文件审查 |
| C3 | `JobFacadeImplTest.java` 存在于 `-biz/src/test/java/.../impl/`，含 ≥ 5 个 `@Test` 方法 | 文件审查 |
| C4 | 所有测试类不使用 `@SpringBootTest`（纯 Mockito） | grep 确认 |
| C5 | 所有测试类使用 `@DisplayName` 中文描述 | grep 确认 |
| C6 | `JobInfoControllerTest` 不 mock `org.quartz.Scheduler`（整体 mock QuartzSchedulerService） | grep 确认 |
| C7 | `JobFacadeImplTest` 验证 Entity→DTO 全部 13 个字段映射正确 | 文件审查 |
| C8 | 覆盖所有幂等操作（delete 不存在 / pause 已暂停 / resume 已恢复 → 返回成功） | 文件审查 |
| C9 | 覆盖 Quartz 注册失败的容错逻辑（创建时注册失败 → 不抛异常） | 文件审查 |
| C10 | 覆盖默认值逻辑（创建时 jobGroup/status/jobType/concurrent/misfire 默认值） | 文件审查 |
| C11 | `mvn -q compile` 退出码 0 | 命令执行 |
| C12 | `mvn -q test` 退出码 0，全量测试通过 | 命令执行 |
| C13 | 已有测试数量不减少（≥ 23 个测试文件） | 命令执行 |
| C14 | 不修改任何 `src/main/java/` 下的源代码文件 | git diff 确认 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step B4

## 1. Step 编号和名称
B4 — Controller 测试 + 全量回归

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
（编译结果、测试结果、退出码、测试计数）

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

本 Step 的"测试验证"本身就是测试代码的编写+运行，执行回执 §7 中的 `mvn -q test` 输出即为测试结果。无需独立的测试回执。

若全部通过：执行回执 §7 中注明测试总数和通过率。
若有失败：列出失败测试名称、失败原因、修复方式，重新运行直到全绿。

## 17. 明确禁止事项

- ❌ **不要修改任何 `src/main/java/` 下的源代码文件**（仅新增测试）
- ❌ **不要使用 `@SpringBootTest`** — 纯 Mockito 单元测试，不装载 Spring 上下文
- ❌ **不要使用 `@InjectMocks`** — 手动构造 Controller，传入 mock 对象
- ❌ **不要 mock `org.quartz.Scheduler`** — Controller 不直接接触 Scheduler，mock QuartzSchedulerService 整层即可
- ❌ **不要修改 POM 文件** — 测试依赖已在 parent POM 中声明
- ❌ **不要修改 Entity / Service / Controller / Facade / Config / Mapper**
- ❌ **不要修改 Flyway 迁移脚本**
- ❌ **不要修改 `application.yml` / `application-dev.yml`**
- ❌ **不要修改 `JobAutoConfiguration.java`**
- ❌ **不要触碰其他模块的测试文件**
- ❌ **不要触碰前端项目**
- ❌ **不要新增 `src/main/resources/` 下的配置、SQL 或 properties**
