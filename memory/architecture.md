# 架构（高层视图）

> 最后更新：2026-07-30
> 完整架构在 `knowledge/architecture.md`。

## 系统

```
Smart-WorkFlow-Web (Vue 3+TS, :5173) --HTTP/api--> Smart-WorkFlow (Java 21+Spring Boot, :8080)
```
Mock 模式（`pnpm dev:mock`）：零后端依赖，全 MSW 拦截。

## 后端：4 层模块化单体

```
sw-dependencies (BOM)
  sw-framework: sw-common + sw-security
    sw-basic: storage, notify, job, iot, knowledge, agent
      sw-biz: system, form, bpm (api/engine/process), openapi
        sw-bootstrap (启动 + Flyway)
```
依赖自上而下、不可反向。跨模块：无返回→Spring 事件；有返回→Facade 接口。

## 前端：严格分层 SPA

```
contracts/ → foundation/ → security/ → adapters/ → modules/ + components/ + layouts/ + router/ + stores/
```
ESLint 强制：业务模块禁直引第三方库、模块间禁横向 import。

## 关键技术

- 后端：MyBatis-Plus、Flowable 7.1、Quartz、Flyway 双方言(PG+H2)、JWT+Spring Security
- 前端：Element Plus、@form-create/designer、bpmn-js 18、@vue-flow/core、Vitest、ESLint flat

---
> 本文件不包含：表命名规则（`sys_`/`sw_form_` 等全部前缀）、动态宽表存储模型细节、跨模块通信机制（Spring 事件 vs Facade 接口）、前端安全基线（CSP/eval/v-html/open-redirect）
> 需要时：创建 search_task，范围 `knowledge/architecture.md`
