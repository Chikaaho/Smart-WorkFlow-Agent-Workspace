# 会话交接

> 最后更新：2026-07-28

## 最新完成

**bpmn-adapter（Steps 0-3）：COMPLETED ✅**
- BPMN 查看器防腐层 + 后端 BPMN XML 端点 + ProcessDefList「查看流程图」入口
- 59f/517t 四连全绿，Step 4 SUPERSEDED（由 process-monitoring 承接）

## 进行中

**process-monitoring (M04-F06-01)：Step 1 PASSED，Step 2 READY**
- Step 1：BpmRuntimeFacade + BpmInstanceService（15 tests，241→256）
- Step 2：BpmInstanceController 方案待下发执行（方案已生成在 `product/process-monitoring/ready/`）
- Step 3：前端 ProcessInstanceList 页面待规划

## 当前基线

- 后端：项目级 256 tests
- 前端：59 files / 517 tests，四连全绿
- 已完成：10 个功能
- 已知未关闭问题：I4/I10-I18/I26/I30（详见 memory/issues.md）

## 下一动作

1. **优先**：下发 process-monitoring Step 2（BpmInstanceController）给后端执行代理
   - 推荐模型：deepseek-v4-flash（单模块 Controller，Facade+Service 已就绪）
2. **后续**：规划 Step 3 前端 ProcessInstanceList 方案（需先做 search_task 探索前端现状）

## 新会话启动提示词

```
你是 Smart-WorkFlow 根目录规划代理。请按 system.md §10 执行新会话恢复。

最新状态：
- bpmn-adapter COMPLETED ✅（BPMN 查看器闭环）
- process-monitoring IN_PROGRESS：Step 1 PASSED（256 tests），Step 2 READY
- 基线：后端 256 tests / 前端 59f/517t / 10 功能完成

下一步：下发 process-monitoring Step 2 方案给后端执行代理，
或如需更多信息，创建 search_task/ 委派 DeepSeek 探索。
```
