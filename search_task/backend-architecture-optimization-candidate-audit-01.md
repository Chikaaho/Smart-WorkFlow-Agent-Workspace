# 后端架构优化候选问题事实审计 01

> 本会话角色：规划（Planner）  
> 委派角色：执行（Executor）  
> 状态：COMPLETED（规划复核通过，2026-09-24）  
> 总体方向：`product/backend-architecture-optimization/ready/direction-backend-architecture-optimization.md`

## 任务目标

对 BAO-01—BAO-10 做只读代码事实审计，区分已确认、部分成立、已失效和未确认，并给出风险、影响面、依赖关系及“立项/合并/延期/不执行”建议。不得直接实施扫描建议。

## 必须回答

1. 每项给出唯一结论：`CONFIRMED` / `PARTIAL` / `NOT_CONFIRMED` / `STALE`，附当前分支、提交身份和精确文件/行号或命令输出。
2. BAO-01/02：复算 API 与实现模块的直接/传递依赖，列出重型依赖进入消费者的完整链路及真实跨模块调用面。
3. BAO-03/04/08/09/10：以 POM、effective POM、生命周期实际绑定、依赖树和 Boot Jar/生产制品内容核实版本、scope、Enforcer、版本身份和 Debug 隔离是否真实生效。
4. BAO-05：列出跨模块事件发布者、事务阶段、异步监听者、业务动作、失败/重试/幂等/持久化现状，区分普通事件与必须交付事件。
5. BAO-06：列出业务层直接使用 `JdbcTemplate`/裸动态 SQL 的入口，核实 tenant、deleted、表名/字段名校验是否由基础设施强制，以及任何绕过路径。
6. BAO-07：定位 REFERENCE 删除与新增引用的事务、锁和隔离行为，判断 TOCTOU 是否可复现或仅为文档遗留；给出最小并发验证设计，但本探索不实现测试。
7. 每项给出风险级别、影响模块、消费者、兼容/迁移风险、前置依赖、建议是否立项；方案至少保留替代选项，不预设 Owner 建议为唯一解。
8. 给出推荐的下一唯一主阶段；不得把 10 项全部打包成一个实施任务。

## 搜索范围

- `Smart-WorkFlow-aPaaS-server` 的根/聚合/BOM/模块 POM、后端工程宪法、相关 production/test 源码与资源；
- Maven effective model、dependency tree、插件生命周期和制品内容的只读检查；
- 与 10 项直接相关的既有 product/knowledge 记录，由执行角色按权限读取。

## 禁止范围

- 禁止修改源码、POM、测试、资源、数据库、版本号、分支、knowledge/memory/product 状态；
- 禁止提交、推送、合并、发布、部署或执行破坏性动作；
- 禁止把静态文件存在、建议文本或未经运行的测试名写成已验证行为。

## 产出与完成标准

总结写入 `search_fallback/backend-architecture-optimization-candidate-audit-01.md`，目标 <5KB；必要的依赖链、事件、SQL 与候选矩阵按 TSV 分拆。10 项必须逐项有事实结论、证据指针、风险与去向建议，且总数可复算。信息不足时明确 `UNRESOLVED` 与所需最小补证，不得猜测。
