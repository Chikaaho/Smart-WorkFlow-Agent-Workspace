# 跨项目共享工程约束

> 本文件只定义前后端共同遵守的工程约束。角色、授权、工作流、terminal、回执生命周期和当前状态均不在此定义，分别引用 `system.md`、`roles/`、`.codex/governance/terminal-contract.json` 与 `knowledge/current-status.md`。

## 1. 安全约束

### 1.1 Token

- Token 只存内存，禁止写入 localStorage、sessionStorage、IndexedDB 或 Cookie。
- 刷新页面后重新登录；不得为了体验绕过该边界。
- HTTP 请求只从统一安全出口注入认证信息。

### 1.2 超管判定

- `superAdmin` 是布尔语义，后端按角色 code 集合包含 `superadmin` 判定。
- `userId == 1` 是已废止历史口径，不得作为当前规则。
- 不使用 `*:*:*` 字符串替代超管语义。

### 1.3 多租户与内容安全

- 租户 ID 由后端从 JWT 解码并注入；前端不发送 `X-Tenant-Id`。
- 禁止 `eval`、`new Function` 和任意字符串代码执行。
- `v-html` 只接受经过统一 sanitize 出口产生的 SafeHtml。

## 2. 前后端接缝

- 契约形状以后端 API 文档为准；前端类型生成通过既有项目脚本完成。
- 直连模式连接真实后端；未就绪端点显示可读状态，不用假数据伪装。
- Mock 模式由 MSW 全量拦截，仅用于前端独立验收。
- 表单 REFERENCE 字段保存目标记录 id，展示值走独立 display 通道；`targetFormId` 保存 formKey，不保存 UUID form_id。

## 3. 数据一致性

- 后端负责格式、类型、范围、枚举、业务规则和数据库约束；前端校验只改善体验，不替代后端校验。
- 动态宽表每条裸 SQL 都必须显式包含 `deleted` 与 `tenant_id` 条件。
- 动态列名统一经过 ColumnValidation 白名单；所有值使用参数化绑定。
- 删除默认逻辑删除；物理删除只用于有明确生命周期授权的数据。

## 4. 功能 ID

- 正式功能与明细 ID 的结构、状态和当前数量只以 `Smart-WorkFlow/功能清单.md` 为准。
- 需求池只以 `todo/requirement-pool.md` 为准；本文件不复制 P/I 数量或状态。

## 5. 前端设计与边界

- 视觉 token、两大页型、控件密度与组件接缝的详细权威位于 `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`。
- 品牌主色为紫莓色系 `#7e306b`；业务组件只消费语义 token，不散落硬编码色值。
- 业务模块不得直接调用第三方实现；通过 adapters/foundation 暴露的接缝访问。
- 模块间禁止横向 import；ESLint 边界规则必须保持开启。

## 6. 重型命令资源约束

所有可复制重型命令必须显式携带 2G 环境变量：

- Maven：`MAVEN_OPTS="-Xmx2g"`
- pnpm/npm/node：`NODE_OPTIONS="--max-old-space-size=2048"`

前后端编译、测试、构建必须互斥。执行本端重型命令前先检测另一端进程：

```bash
# 后端准备运行 Maven 前检测前端
ps -ef | grep -E '[p]npm|[v]ite|[v]itest'

# 前端准备运行 pnpm 前检测后端
ps -ef | grep -E '[m]vn|[j]ava'
```

检测到另一端仍在运行时等待并重检；不得并行启动，也不得强杀对方进程。等待期间可继续处理不依赖编译结果的工作。

## 7. 权威导航

| 主题 | 权威文件 |
|------|----------|
| 角色、授权、根工作流 | `system.md` 与 `roles/` |
| Executor terminal | `.codex/governance/terminal-contract.json` |
| completion receipt 与补证格式 | `roles/executor.md` §8 |
| product 生命周期 | `system.md` §5.5 |
| 当前状态 | `knowledge/current-status.md` |
| 后端工程专属规则 | `Smart-WorkFlow/docs/governance/engineering-constitution.md` |
| 前端工程专属规则 | `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md` |
