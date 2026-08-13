# 探索任务：数据权限（DataScope）完整落地前置调研

> 规划层下发（2026-08-13）。目的：为 M02-F04-01「数据权限」需求方向文档提供现状依据。回执写入 `search_fallback/datascope-implementation-survey.md`，压缩目标 <5KB（可放宽至 8KB，本题横切面大）。
> 执行模型：deepseek 系列自选；允许并行 subagent 分线调查后汇总。

## 背景

2026-08-12 全量审计确认：`UserDetailsProviderImpl` L111 附近硬编码 `DataScope.ALL`，角色配置的数据范围完全不生效（known-issues 对应条目，清单 M02-F04-01 已降 ⬜）。checklist-gap-hardening 第一批（已 PASSED）明确将其排除，留本轮单独规划。规划层需要以下现状事实才能写方向文档。

## 调查问题

### A. 现有 DataScope 设计遗产
1. `DataScope` 枚举（或同等物）现有定义：几档？各档语义（全部/本部门/本部门及以下/仅本人/自定义部门）？定义在哪个模块？
2. `SysRole` 表/实体是否已有 data_scope 字段？Flyway 里是否已建？角色-自定义部门映射表（类似 sys_role_dept）是否存在？
3. `UserDetailsProviderImpl` 硬编码点的上下文：DataScope 被塞进什么载体（UserDetails/JWT claim/ThreadLocal）？下游谁在消费（还是完全无消费方）？
4. 前端角色管理页是否已有数据范围配置 UI（含自定义部门树选择）？还是零 UI？

### B. 查询拦截基建
5. 现有 MyBatis-Plus 拦截器链：租户拦截器如何实现（TenantLineInnerInterceptor？自定义？）、注册顺序、忽略机制（注解/表名单）？数据权限拦截器是否有半成品？
6. 用户-部门归属：SysUser 的 dept 字段结构？部门树表结构（是否有 ancestors/path 列支撑"本部门及以下"高效查询）？
7. 动态宽表（手写 SQL，known-issues I10）与数据权限拦截器的兼容性：裸 SQL 是否走 MyBatis-Plus 拦截器链？

### C. 纳管范围盘点
8. 哪些业务查询含 dept_id/create_by 类归属列、适合纳管：逐模块列出候选表/查询（system 用户列表？bpm 待办/流程实例？form 动态数据？job 日志？agent 执行历史？notify？storage 文件记录？）——只列"有归属列、多用户共享读取"的，注明各自归属列名。
9. 既有测试如何构造多用户/多部门数据：有无可复用的测试夹具先例？

### D. 清单与先例
10. `Smart-WorkFlow/功能清单.md` M02-F04-01 原文描述的完整验收口径。
11. 若依/RuoYi 类框架（本项目风格来源）数据权限惯例：注解式（@DataScope）还是拦截器全局式？本项目更贴近哪种（依据现有代码风格判断，给出建议倾向及依据）。

## 输出要求

- 逐问题编号作答，每问先给一行结论再给证据（文件路径:行号）。
- 明确区分"已存在可复用"/"半成品"/"完全缺失"。
- 最后给一节「执行层视角的风险清单」：落地时最可能踩的坑（如拦截器与租户拦截器叠加、宽表裸 SQL 绕过、超管旁路口径等）。
