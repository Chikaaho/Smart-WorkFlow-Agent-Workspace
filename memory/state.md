# 当前状态

> 最后更新：2026-07-28

## 进行中功能

**process-monitoring (M04-F06-01)：IN_PROGRESS**
- Step 0 探索：PASSED（范围裁定：首批仅流程图高亮 + 流转记录）
- Step 1 后端 Facade + Service：PASSED（15 @Test，241→256 tests）
- Step 2 后端 BpmInstanceController：READY（方案在 `product/process-monitoring/ready/`）
- Step 3 前端 ProcessInstanceList 监控页面：PENDING
- 耗时分析 + 流程干预延后至后续批次

## 测试基线

- 后端：项目级 **256 tests**（REPORTED 2026-07-28，process-monitoring Step 1）
- 前端：59 spec files / **517 tests**，四连校验门全绿（CONFIRMED 2026-07-26）
- 已完成功能：10 个

## 模块完成度（简表）

**后端**：security/system/form/bpm/dev(notify/storage/job 完成，iot/agent/knowledge/openapi 骨架)
**前端**：login/shell/menu/auth/form/notify/workflow/system/storage/job 完成，iot/agent/openapi 占位
- BPMN adapter：查看器防腐层完成 + 后端 XML 端点 + 前端查看入口（59f/517t）
- Vue Flow adapter：防腐层完成（零消费方，预期状态——M07 AI 调度图业务模块未就位）

## Walking Skeleton

```
登录/认证 ✅ → 表单设计/渲染 ✅ → BPM 单节点审批 ✅ → 通知列表 ✅
```
四环全部闭合。

---
> 本文件不包含：已完成功能的完整列表和完成日期、后端/前端各模块文件计数和详细证据标记、已实现核心能力枚举（12 项后端 + 15 项前端）、测试覆盖分布详情、明确延后项清单和原因、参考文档索引
> 需要时：创建 search_task，范围 `knowledge/current-status.md`
