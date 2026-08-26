# P36 补证回执：一级收敛提示 01（R1 路由权限 + R2 最终树门禁）

> 回执对象：`planning-execution-prompt-notify-template-management-01.md`（一级提示）+ `planning-rereview-20260826.md`
> 执行终态：`EXECUTION_SUBMITTED`
> 功能状态：**VERIFYING（维持，待规划复核）**
> 权威输入：仅复验记录与一级提示；已锁定项零重验、零语义改动

---

## 1. R1 — 前端模板路由权限收敛

### 1.1 缺口与修复方案

失败事实：守卫只判断登录态，普通用户有 token 即可直达静态 `/notify/template`。

修复（最小面）：`authGuard` 在动态路由构建完成后新增路由权限校验 `hasRouteAccess`：

1. **superAdmin 短路放行**；
2. **`meta.authority`（静态路由声明）**：非超管须持有其中任一权限串；
3. **菜单可达性回退**：会话权限无命中时，若目标 path 在服务端过滤后的授权菜单树中可达 → 放行。
4. 无 authority 声明的路由不受影响；拒绝 → 重定向 `/403`；未登录语义不变（refresh 失败仍 → `/login`）。

**为何需要菜单可达性回退（真实授权模型口径）**：后端 `UserDetailsProviderImpl.loadPermissions` 对非超管只装配 **menu_type=2 按钮行**的 permission 串——页面行权限串（如 `notify:template:view`）不进会话 permissions。因此「会话权限命中」单独作为判据会把真实获权的非超管误拒；「该 path 在服务端过滤后的菜单树中」才是与服务端授权一致的判据。此口径经真实后端验证（见 1.3 身份B）。

**path 形态兼容**：mock seeds 子节点存全路径（`notify/template`），真实后端存分段（目录 `notify` + 叶子 `template`）。匹配器同时匹配原始路径与祖先组合路径，两种载荷形态均可判定。

### 1.2 修改文件清单及必要性

| 文件 | 变更 | 为何是满足 R1 的必要范围 |
|---|---|---|
| `src/router/guard.ts` | 新增 `hasRouteAccess`/`menuContainsPath`/`FORBIDDEN_PATH`，authGuard 接线权限校验 | R1 唯一生产逻辑落点 |
| `src/router/routes.d.ts` | 新增 vue-router RouteMeta 类型扩展（authority/permission/public 等） | guard 消费 meta.authority 的类型前提 |
| `src/router/index.ts` | 注释更新（P36 R1 守卫消费说明）；无结构变更 | 文档化新行为 |
| `src/router/notify-template-route-guard.evidence.spec.ts` | 新增：三身份真实导航证据 spec（§1.3） | R1 唯一可接受证据要求「真实路由运行环境」 |
| `src/router/agent-execution-access.spec.ts` | D169 组 beforeEach 补 `clearDynamicRoutes` 重置模块级构建态；403 兜底路由注册进测试 router；注释更新 | 守卫收紧后模块级状态跨 describe 泄漏导致有权身份被误拒；修的是测试隔离不是产品逻辑 |
| `src/modules/agent/views/tool-production-menu-chain-v2.spec.ts` | 身份2 用例旧断言「撤权用户直达仍渲染工具页」改为「直达被拒到 /403」 | 该用例编码的正是 R1 判定为失败的旧行为，必须随行为修正 |

未触碰任何锁定项文件：后端、迁移、Mock 业务 handler、通知发送链零改动（`git diff` 确认本轮仅上述文件变化）。

### 1.3 R1 行为证据（真实路由运行环境，非静态扫描）

测试环境：真实 vue-router（memory history）+ 真实 `authGuard`（beforeEach 接线）+ 真实 `buildRoutesFromMenu` 组件白名单解析 + 组件实际挂载。命令与原始计数：

```
NODE_OPTIONS="--max-old-space-size=2048" npx vitest run src/router/notify-template-route-guard.evidence.spec.ts --config vitest.config.ts
→ Test Files 1 passed (1) / Tests 3 passed (3)
```

逐身份导航结果（spec 内逐项断言，此处为对应关系）：

| 身份 | 输入 | 动作 | 最终路由 | 渲染结果 |
|---|---|---|---|---|
| A 普通通知用户 | 非超管；permissions 仅按钮行串；菜单树无 notify/template（V38 形态去掉 216 叶子） | 直达 push `/notify/template` | `/403`（name=forbidden） | NotifyTemplateList 组件实例不存在；页面文本不含「消息模板」 |
| B 获授非超管 | 非超管；permissions 同样无页面行串；菜单树含 template 叶子（服务端已授权） | ① 经动态路由 push（菜单入口等价物，name=NotifyInbox 到达）② 直达 push `/notify/template` | `/notify/template`（name=notify-template-list） | `.list-toolbar__title` 渲染「消息模板」+ NotifyTemplateList 组件实例存在 |
| C 未登录 | getAccessToken=null；refresh 拒绝 | 直达 push `/notify/template` | `/login?redirect=/notify/template` | 既有登录拒绝语义不变 |

**真实后端交叉验证**（live 链，证明菜单可达性回退在真后端形态下成立而非仅 mock 构造）：

```
后端启动：SW_CIPHER_KEY=MDEyMzQ1Njc4OWFiY2RlZjAxMjM0NTY3ODlhYmNkZWY= MAVEN_OPTS="-Xmx2g" mvn -q spring-boot:run -pl sw-bootstrap -Dspring-boot.run.profiles=dev
Redis 启动：redis-server --port 6379 --daemonize yes（dev profile JWT 登录缓存依赖）
tooluser 环境：POST /api/system/user（id=2092526664277381122）+ PUT /system/role/2/menus 追加 212/213（V37 不 seed sys_role_menu，普通角色由管理员配置）
GET /system/auth/me（tooluser）→ superAdmin=false, roles=["admin"], permissions=["job:create",...,"agent:tool:manage"]（纯按钮行，无 agent:tool:view 页面行）
GET /system/auth/menus（tooluser）→ 含 agent/tool（permission=agent:tool:view, menuType=1, 分段 path）

NODE_OPTIONS="--max-old-space-size=2048" pnpm vitest run --config vitest.live.config.ts src/modules/agent/views/tool-production-menu-chain-live.spec.ts
→ Test Files 1 passed / Tests 2 passed
（superadmin 链放行 + tooluser 有权直达 /agent/tool 经 authGuard 放行 → ToolList 挂载 → 真实列表请求成功）
```

即：真实后端下获权非超管（permissions 无页面行串）直达受保护页被守卫放行——回退判据与真实授权模型一致。

---

## 2. R2 — 当前最终前端树质量门（四连门禁）

门禁前互斥原始快照（18:18:47）：

```
ps -ef | grep -E '[m]vn ' | grep -v "spring-boot:run"   → MVN_COMPILE_EXIT=1（无 mvn 编译/test 进程）
java 进程仅 PID 5745（spring-boot:run 常驻服务）/ 5765（其 fork 应用进程），均为运行态非编译态
```

四连门禁（全部带 `NODE_OPTIONS="--max-old-space-size=2048"`，串行执行）：

| 门禁 | 时点 | 命令 | 结果 |
|---|---|---|---|
| typecheck | 18:19:36 | `pnpm typecheck`（vue-tsc -b --noEmit） | exit 0 |
| lint | 18:21:21 | `pnpm lint`（eslint .） | exit 0，0 errors 0 warnings（先 `pnpm lint --fix` 修正新 spec 的 prettier 格式与一处 no-explicit-any 后复跑） |
| test（全量） | 18:21:38 | `pnpm test`（vitest run） | **exit 0，Test Files 104 passed (104) / Tests 1025 passed (1025)** |
| build | 18:22:12 | `pnpm build`（vue-tsc -b && vite build） | exit 0，built in 1.13s（rolldown pure-annotation comment 提示为第三方包噪音，非错误） |

**全量计数增量来源（1025 − 997 = +28）**：

| 来源 | 数量 |
|---|---|
| 上轮补证（G2 安全链 12 + G2 前端路由 spec 9 + G1 preview 3 + G3 mock evidence 16 中计入文件的用例）等已在补证回执申报的增量 | +25 |
| 本轮 R1 三身份导航证据 spec（notify-template-route-guard.evidence.spec.ts） | +3 |
| 合计 | **+28 → 104 文件 / 1025 用例** |

期间一次 typecheck 失败（TS6196 未使用 import）与一次 lint 失败（prettier 格式 + no-explicit-any），均当场修复并复跑至 exit 0，非"只提交最后一行"。

---

## 3. 已锁定项纪律确认

- 后端模板 CRUD/租户隔离/渲染/发送/原子性/历史稳定/直接发送兼容：零修改、零重跑。
- 三身份 401/403/200 安全链、Mock 16/16、H2 14/14、PG 10/10、38 migrations、双向编译互斥快照：零重验。
- 未修改后端代码、迁移脚本、Mock 业务契约、正式基线；live 链环境搭建（后端启动 + Redis + tooluser）仅为运行既有 live 测试的环境操作，未产生业务数据变更之外的仓库改动。
- 未写 `PASSED`/`COMPLETED`，未核销 P36/P3，未移动方向文档位置。

## 4. 提交前自检矩阵（一级提示 §8）

| 自检项 | 结果 |
|---|:---:|
| 普通用户直接导航没有渲染模板管理页 | 是（最终路由 /403，组件实例不存在） |
| 授权非超管经菜单及直接导航均进入模板页 | 是（B1 name 导航到达 + B2 直达 URL 到达且挂载；另经真实后端 tooluser live 链交叉验证） |
| 未登录行为保持既有登录拒绝语义 | 是（refresh 失败 → /login?redirect=/notify/template） |
| R1 证据来自真实路由运行环境而非静态扫描 | 是（真实 router.push + beforeEach authGuard + 组件挂载 DOM 断言） |
| 当前最终树四连门禁全部通过且计数可复算 | 是（typecheck/lint/build exit 0；test 104f/1025t，增量来源逐项列出） |
| 未修改或重验任何锁定项 | 是 |
| 未写 PASSED/COMPLETED、未核销 P36/P3、未更新正式基线 | 是 |

---

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/notify-template-management/receipts/post-prompt-01-route-permission-evidence.md","evidence":["R1: guard hasRouteAccess consumes meta.authority with server-side menu-reachability fallback; three-identity real-navigation spec 3/3 (A plain user direct nav -> /403 component not mounted, B authorized non-superadmin menu-push and direct nav both land on /notify/template with NotifyTemplateList mounted, C unauthenticated -> /login redirect preserved); cross-validated on real backend: tooluser (button-row-only permissions) live chain 2/2 after role-menu bind via real API","R2: four gates on final tree with pre-gate mutex snapshot 18:18:47 (no mvn compile processes, only resident spring-boot:run service): pnpm typecheck exit0 18:19:36, pnpm lint exit0 18:21:21 (after lint --fix), pnpm test exit0 104 files / 1025 tests at 18:21:38 (+28 vs 997 documented per-source), pnpm build exit0 18:22:12"],"feature_status":"VERIFYING"}
