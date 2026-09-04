# P45 登录态刷新断点补充探索

> 本会话角色：规划；委派角色：执行。
> 权威输入：`search_task/p45-login-security-current-seams.md`、`search_fallback/p45-login-security-current-seams.md`。

## 任务目标

只核实“登录成功后刷新浏览器回到登录页”的唯一直接断点，消除首轮回执中“已有 refresh Cookie + 冷启动 refresh 恢复链”与“access token 仅内存导致 F5 必然失败”之间的矛盾。本任务只探索，不实现、不重复首轮已通过内容。

## 已锁定事实（禁止重查）

1. 后端已有 refresh token、HttpOnly `rt` Cookie、轮换、重放撤销和 `/auth/refresh`。
2. access token 当前只存在前端内存，前端守卫在冷启动无 access token 时会调用 `refresh()`。
3. 后端尚无 RSA、验证码、机器时间、登录限流/锁定的可运行实现。
4. Redis、统一异常、前端认证门面和请求拦截器的既有接缝以首轮回执为准。

## 唯一剩余问题矩阵

| 编号 | 首轮缺口 | 不可接受结论 | 本轮必须返回的证据 |
|---|---|---|---|
| G1 | 首轮称“access 仅内存”是 F5 唯一直接断点，但同文又证明守卫会用 refresh Cookie 冷启动续登 | 仅凭 access 不在 Cookie 推定 F5 必然失败；仅列代码结构 | 从登录响应 `Set-Cookie` 到浏览器接收条件、刷新请求携带条件、`refresh()` 响应、token 回填、session/menu 恢复、守卫放行逐点核对，指出第一个不成立的条件；若静态事实无法唯一定位，必须明确“静态探索无法确定”，不得虚构根因 |
| G2 | 未说明实际请求是否满足 Cookie 发送条件 | 只写“浏览器自动带 Cookie” | 核对前端 base URL、开发代理/生产同源关系、请求库 `withCredentials`、Cookie `Path`/`Secure`/`SameSite`/Domain、后端 context path/CORS credentials，给出各环境下 Cookie 能否写入和携带的判定矩阵 |
| G3 | 未说明恢复失败后的精确控制流 | 泛称“失败回登录页” | 给出 `refresh()` 失败、refresh 成功但 session 装配失败、menu/me 失败、动态路由失败四类分支的清理与跳转行为，标出可能造成有效 Cookie 被误判无效的分支 |
| G4 | Mock 不能复现 Cookie 语义，但未给出补证方法 | 重复说明 Mock 无 Cookie | 给出执行阶段最小真实浏览器/HTTP 行为证据设计：必须观察哪些请求、响应头、Cookie 属性、状态码和路由结果，才能区分 Cookie 未写入、未携带、refresh 被拒绝、回填失败四类原因；本探索仍不运行服务或测试 |

## 搜索范围

- `Smart-WorkFlow-Web/`：环境配置、API base URL、Vite proxy、请求实例、认证门面、token 管理、路由守卫、用户/session/menu 装配、相关测试。
- `Smart-WorkFlow-Server/`：context path、CORS/credentials、安全白名单、Cookie 构造、login/refresh 响应和相关配置。
- 只读与 G1-G4 直接相关文件；不扩大到 RSA、验证码、限流、审计或其他模块。

## 禁止范围

- 禁止修改文件、运行服务、编译、测试、迁移、部署、提交或推送。
- 禁止建议把 access token 也写 Cookie，除非先证明现有 refresh 恢复模型无法满足 Owner 的刷新续登目标；方案裁决属于规划层。
- 禁止把 access token 内存存储本身等同于故障；双 Token 常规职责与当前具体缺陷必须分开。
- 禁止重复首轮已锁定矩阵或粘贴大段代码。

## 预期证据与完成标准

- 一张登录态恢复逐点判定矩阵，包含配置/代码位置、成立条件、当前事实与结论。
- 一张环境/Cookie 发送矩阵，至少区分开发代理、同源生产、跨源生产（若项目未支持跨源须明确）。
- 返回唯一直接根因；若只读静态证据不足，则返回最小候选集合及下一阶段必须采集的真实行为证据，状态如实为“静态无法唯一定位”。
- 仅 G1-G4，目标小于 4KB。

## 回执位置

探索结果写入 `search_fallback/p45-login-state-direct-cause-supplement.md`。
