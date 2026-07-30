# 硬约束（规划关键）

> 最后更新：2026-07-30
> 仅保留 Anthropic 规划时必须遵守的红线。完整约束在 `knowledge/shared-constraints.md`。

## 安全红线

- Token **仅内存**：全仓库无 localStorage/sessionStorage 写 token
- superAdmin = 角色 code 含 `superadmin`（非 userId==1）
- 租户列级隔离（`tenant_id`），前端**不发**租户头
- 禁 `eval`/`new Function`（前端仅 safe-eval）
- 禁 open redirect（前端同源校验）
- 禁 RCE：用户配数据，不配代码
- 禁 SQL 注入：表名/列名过白名单，值参数化绑定

## 架构红线

- 4 层模块化单体，依赖**自上而下、不可反向**
- 业务模块只依赖 `-api`，不依赖 `-biz`
- 表前缀 = 模块前缀（`sys_`/`sw_form_`/`sw_bpm_` 等），禁自创
- 动态宽表：一个表单一张物理表（`sw_form_{nanoId}`），不用 JSON 列
- 两档关系：TABLE（CASCADE）vs REFERENCE（RESTRICT）
- Flyway 双方言（PG + H2），动态宽表是唯一例外
- 前端第三方库经 `adapters/` 防腐层，业务模块禁直引

## 工作流红线

- 规划层只规划，执行层只执行——不可混淆
- Anthropic 只读 memory/ + search_fallback/，不读 knowledge/code
- DeepSeek 探索或规划，但不可同次兼任
- 所有探索：search_task → 模型切换 → search_fallback → 切回
- 前后端 Step 严格分离（一个 Step 不跨前后端）
- 禁执行代理诱导规划、预告下一 Step
