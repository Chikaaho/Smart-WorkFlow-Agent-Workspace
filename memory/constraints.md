# 硬约束（规划关键）

> 最后更新：2026-08-14
> 仅保留规划角色必须遵守的红线。完整约束在 `knowledge/shared-constraints.md`。

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

- 会话开始必须声明角色（规划/执行/管理员）；**未声明 → 拒绝执行任何任务**
- 规划角色只规划，执行角色只执行；管理员可读取三仓全部非代码内容，维护架构、宪法、工程配置，并可执行与管理员任务相关的 Git 操作——不可混淆
- 规划角色只读 memory/ + search_fallback/，不读 knowledge/code
- 执行角色探索或执行，但不可同次兼任规划（不制定需求方向、不诱导规划）
- 所有探索：规划角色写 search_task → 执行角色探索 → 写 search_fallback → 规划角色读取
- 前后端 Step 严格分离（一个 Step 不跨前后端）
- 禁执行代理诱导规划、预告下一 Step
- 编译命令限内存：mvn/pnpm/npm 等每种编译工具上限 2G（`MAVEN_OPTS="-Xmx2g"` / `NODE_OPTIONS="--max-old-space-size=2048"`）
